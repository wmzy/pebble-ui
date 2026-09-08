//
// RTL contract suite (default jsdom environment), two layers:
//
// 1. Rendering smoke: each fixture renders inside a dir='rtl' subtree
//    and is asserted to (a) render at all — jsdom + Linaria handle the
//    logical properties (margin-inline-*, padding-inline-*,
//    inset-inline-*, text-align: start/end) without throwing — (b) keep
//    its key aria contract under direction, (c) cost no axe violations.
//
// 2. Direction contracts — the parts of RTL behavior jsdom CAN prove
//    without layout:
//      - keyboard mirroring: under dir='rtl' the horizontal arrows
//        reverse their meaning (← advances) in Slider, Rating, Tabs,
//        Carousel, Calendar, Toolbar/Cascader (the horizontal menu
//        family) — read from the DOM at event time, matching the
//        painted layout;
//      - vertical-axis invariance: a vertical Menu's ↑/↓ semantics do
//        not change with direction;
//      - floating placement mirroring: computeFloatingPosition /
//        placeFloatingPanel / the placement class pick all resolve the
//        logical placement against the trigger's direction;
//      - the CSS logical-properties codemod guard: no flow-axis
//        physical margins/paddings/text-align (and no physical borders
//        beyond the documented drawing primitives) sneak back in.
//
// jsdom still does no layout — visual mirroring of fills/arrows/tails
// stays the browser's job (e2e/rtl.spec.ts covers it on real engines).
import type { ReactElement } from 'react';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';
import { useRef } from 'react';

import { computeFloatingPosition, mirrorPlacement } from './utils/collision';
import { floatingPlacementClasses, placeFloatingPanel } from './utils/floating';
import { useMenuKeyboard } from './utils/menuKeyboard';

// Direct component-file imports, mirroring ssr-render.node.test.tsx (the
// ./index barrel drags in tokens/colors.ts, whose Linaria interpolation is
// irrelevant here and slows node-env runs; see that file's note).
import Alert from './components/Alert/Alert';
import Badge from './components/Badge/Badge';
import Calendar from './components/Calendar/Calendar';
import Carousel from './components/Carousel/Carousel';
import CarouselSlide from './components/Carousel/CarouselSlide';
import Cascader from './components/Cascader/Cascader';
import Dialog from './components/Dialog/Dialog';
import Menu from './components/Menu/Menu';
import MenuItem from './components/Menu/MenuItem';
import Progress from './components/Progress/Progress';
import Rating from './components/Rating/Rating';
import Slider from './components/Slider/Slider';
import Tab from './components/Tabs/Tab';
import TabList from './components/Tabs/TabList';
import TabPanel from './components/Tabs/TabPanel';
import Tabs from './components/Tabs/Tabs';
import Tag from './components/Tag/Tag';
import Toolbar from './components/Toolbar/Toolbar';
import ToolbarButton from './components/Toolbar/ToolbarButton';

/** Render inside a dir='rtl' subtree, mirroring an RTL host document.
 * Custom containers are not auto-appended to body — axe(document.body)
 * needs the tree attached to scan it. */
function renderRtl(ui: ReactElement) {
  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  document.body.appendChild(container);
  return render(ui, { container });
}

// 'region' fires for content outside a landmark — an artifact of the bare
// test document, not the component (same exemption as component tests).
const axeOptions = { rules: { region: { enabled: false } } };

// ---------------------------------------------------------------------------
// Layer 1: rendering smoke
// ---------------------------------------------------------------------------

describe('RTL rendering smoke (dir=rtl)', () => {
  it('renders Progress with the progressbar aria contract intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(<Progress value={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders Alert with the alert role and close button intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Alert variant='warning' closable>
        Storage almost full
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Storage almost full');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders Badge content', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(<Badge variant='success'>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders closable Tag with the remove button intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Tag variant='primary' closable>
        design
      </Tag>
    );
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders a closed Dialog staying closed and labelled', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Dialog title='Confirm removal'>Dialog body</Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('data-state', 'closed');
    expect(dialog).not.toHaveAttribute('open');
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });
});

// ---------------------------------------------------------------------------
// Layer 2a: keyboard mirroring
// ---------------------------------------------------------------------------

/** Focusable control harnesses keeping their controllable state readable. */
function CarouselHarness() {
  const [current, , control] = useControl(undefined, 0);
  return (
    <>
      <Carousel value={control}>
        <CarouselSlide>slide one</CarouselSlide>
        <CarouselSlide>slide two</CarouselSlide>
        <CarouselSlide>slide three</CarouselSlide>
      </Carousel>
      <output data-testid='slide'>{current}</output>
    </>
  );
}

function TabsRtlFixture() {
  return (
    <Tabs value='one'>
      <TabList>
        <Tab value='one'>Tab 1</Tab>
        <Tab value='two'>Tab 2</Tab>
      </TabList>
      <TabPanel value='one'>Panel 1</TabPanel>
      <TabPanel value='two'>Panel 2</TabPanel>
    </Tabs>
  );
}

/** Minimal horizontal menu on useMenuKeyboard(orientation='horizontal') —
 * the primitive Toolbar-style menus compose when they are menu-shaped. */
function HorizontalMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useMenuKeyboard({
    menuRef,
    onClose: vi.fn(),
    orientation: 'horizontal',
  });
  return (
    <div ref={menuRef} role='menu' aria-label='Actions' onKeyDown={handleKeyDown}>
      {['Cut', 'Copy', 'Paste'].map((label) => (
        <button key={label} type='button' role='menuitem' tabIndex={-1}>
          {label}
        </button>
      ))}
    </div>
  );
}

const CASCADER_OPTIONS = [
  {
    label: '广东',
    value: 'gd',
    children: [
      { label: '深圳', value: 'sz' },
      { label: '广州', value: 'gz' },
    ],
  },
  {
    label: '浙江',
    value: 'zj',
    children: [{ label: '杭州', value: 'hz' }],
  },
];

describe('RTL keyboard mirroring (dir=rtl)', () => {
  it('mirrors Slider arrows: ArrowLeft increases, ArrowRight decreases', async () => {
    const user = userEvent.setup();
    renderRtl(<Slider />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveValue('51');
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveValue('52');
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveValue('51');
  });

  it('mirrors Rating arrows: ArrowLeft steps the selection up, focus follows', async () => {
    const user = userEvent.setup();
    renderRtl(<Rating />);
    const stars = screen.getAllByRole('radio');
    stars[0]!.focus();
    // Value 0 → 1: the first star becomes checked and keeps focus.
    await user.keyboard('{ArrowLeft}');
    expect(stars[0]).toHaveAttribute('aria-checked', 'true');
    expect(stars[0]).toHaveFocus();
    // Value 1 → 2: focus follows to the newly checked star.
    await user.keyboard('{ArrowLeft}');
    expect(stars[1]).toHaveAttribute('aria-checked', 'true');
    expect(stars[1]).toHaveFocus();
    // Mirrored decrease: value 2 → 1.
    await user.keyboard('{ArrowRight}');
    expect(stars[1]).toHaveAttribute('aria-checked', 'false');
    expect(stars[0]).toHaveFocus();
  });

  it('mirrors TabList arrows: ArrowLeft activates the next tab', async () => {
    const user = userEvent.setup();
    renderRtl(<TabsRtlFixture />);
    const [tab1, tab2] = screen.getAllByRole('tab');
    tab1!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(tab2).toHaveFocus();
    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel 2')).toBeVisible();
    await user.keyboard('{ArrowRight}');
    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel 1')).toBeVisible();
  });

  it('mirrors Carousel arrows: ArrowLeft advances the slide', async () => {
    // jsdom does not implement scrollIntoView (same mock as
    // Carousel.test.tsx); restored afterwards — it is undefined in jsdom.
    const proto = Element.prototype as {scrollIntoView?: (() => void) | undefined};
    const scrollIntoView = proto.scrollIntoView;
    proto.scrollIntoView = vi.fn();
    const user = userEvent.setup();
    try {
      renderRtl(<CarouselHarness />);
      const region = screen.getByRole('region', { name: 'Carousel' });
      region.focus();
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('slide')).toHaveTextContent('1');
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('slide')).toHaveTextContent('0');
    } finally {
      proto.scrollIntoView = scrollIntoView;
    }
  });

  it('mirrors Toolbar arrows: ArrowLeft moves forward with wrapping', async () => {
    const user = userEvent.setup();
    renderRtl(
      <Toolbar aria-label='Formatting'>
        <ToolbarButton>Bold</ToolbarButton>
        <ToolbarButton>Italic</ToolbarButton>
        <ToolbarButton>Underline</ToolbarButton>
      </Toolbar>
    );
    const [bold, italic, underline] = screen.getAllByRole('button');
    bold!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(italic).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(underline).toHaveFocus();
    // Wraps back to the first item under the mirrored forward key.
    await user.keyboard('{ArrowLeft}');
    expect(bold!).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(underline).toHaveFocus();
  });

  it('mirrors the horizontal menuKeyboard orientation: ArrowLeft advances', async () => {
    const user = userEvent.setup();
    renderRtl(<HorizontalMenu />);
    const [cut, copy, paste] = screen.getAllByRole('menuitem');
    cut!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(copy).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(paste).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(copy).toHaveFocus();
  });

  it('keeps the vertical Menu axis direction-invariant (ArrowDown still advances)', () => {
    renderRtl(
      <Menu open trigger='Open'>
        <MenuItem>Action 1</MenuItem>
        <MenuItem>Action 2</MenuItem>
      </Menu>
    );
    const menu = screen.getByRole('menu');
    screen.getByText('Action 1').focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByText('Action 2')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Action 2'), { key: 'ArrowUp' });
    expect(screen.getByText('Action 1')).toHaveFocus();
  });

  it('mirrors Cascader drill arrows: ArrowLeft drills in, ArrowRight backs out', async () => {
    const user = userEvent.setup();
    renderRtl(<Cascader options={CASCADER_OPTIONS} placeholder='Pick' />);
    const trigger = screen.getByRole('button', { name: 'Pick' });
    await user.click(trigger);
    const columns = () => document.querySelectorAll('[data-haze-cascader-column]');
    // Just the root column initially.
    expect(columns()).toHaveLength(1);
    screen.getByRole('menuitem', { name: /广东/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(columns()).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: /深圳/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(columns()).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: /广东/ })).toHaveFocus();
  });

  it('mirrors the Calendar date grid: ArrowLeft moves to the next day', async () => {
    const user = userEvent.setup();
    const { container } = renderRtl(<Calendar value='2026-01-15' />);
    const day = (date: string) =>
      container.querySelector<HTMLButtonElement>(`[data-haze-day="${date}"]`);
    day('2026-01-15')!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(day('2026-01-16')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(day('2026-01-15')).toHaveFocus();
    // The block axis never mirrors.
    await user.keyboard('{ArrowDown}');
    expect(day('2026-01-22')).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// Layer 2b: floating placement mirroring
// ---------------------------------------------------------------------------

describe('RTL floating placement mirroring', () => {
  const trigger = {top: 300, left: 100, bottom: 330, right: 180, width: 80, height: 30};
  const panel = {width: 150, height: 200};
  const viewport = {width: 1024, height: 768};
  const gap = {below: 4, above: 4, before: 4, after: 4};
  const strategy = {
    flip: false,
    shift: false,
    padding: {top: 0, right: 0, bottom: 0, left: 0},
  };

  it('maps every placement to its inline-axis mirror', () => {
    expect(mirrorPlacement('bottom', 'rtl')).toBe('bottom-end');
    expect(mirrorPlacement('bottom-span', 'rtl')).toBe('bottom-end');
    expect(mirrorPlacement('bottom-end', 'rtl')).toBe('bottom');
    expect(mirrorPlacement('bottom-center', 'rtl')).toBe('bottom-center');
    expect(mirrorPlacement('top', 'rtl')).toBe('top');
    expect(mirrorPlacement('left', 'rtl')).toBe('right');
    expect(mirrorPlacement('right', 'rtl')).toBe('left');
    // LTR is the identity — the historical physical behavior.
    expect(mirrorPlacement('left')).toBe('left');
    expect(mirrorPlacement('bottom-end', 'ltr')).toBe('bottom-end');
  });

  it('mirrors the start alignment of bottom placements (start = right edges)', () => {
    // LTR: panel's left edge at the trigger's left edge.
    expect(
      computeFloatingPosition({trigger, panel, viewport, placement: 'bottom', gap, strategy})
    ).toEqual({top: 334, left: 100, placement: 'bottom'});
    // RTL: start alignment hugs the trigger's right edge: 180 − 150.
    expect(
      computeFloatingPosition({
        trigger,
        panel,
        viewport,
        placement: 'bottom',
        gap,
        strategy,
        dir: 'rtl',
      })
    ).toEqual({top: 334, left: 30, placement: 'bottom'});
  });

  it('mirrors horizontal placements to the opposite physical side', () => {
    const centered = {...trigger, left: 400, right: 480};
    // Vertical center: 300 + 30/2 − 200/2 = 215.
    // LTR: 'right' renders beside the trigger's physical right.
    expect(
      computeFloatingPosition({
        trigger: centered,
        panel,
        viewport,
        placement: 'right',
        gap,
        strategy,
      })
    ).toEqual({top: 215, left: 484, placement: 'right'});
    // RTL: 'right' means inline-end → physical left of the trigger, and
    // the reported landing side flips with it.
    expect(
      computeFloatingPosition({
        trigger: centered,
        panel,
        viewport,
        placement: 'right',
        gap,
        strategy,
        dir: 'rtl',
      })
    ).toEqual({top: 215, left: 246, placement: 'left'});
  });

  it('placeFloatingPanel resolves direction from the trigger subtree', () => {
    const host = document.createElement('div');
    host.setAttribute('dir', 'rtl');
    const panelEl = document.createElement('div');
    const triggerEl = document.createElement('span');
    host.append(triggerEl, panelEl);
    document.body.appendChild(host);
    const panelRect = {top: 0, left: 0, bottom: 200, right: 150, width: 150, height: 200};
    const triggerRect = {top: 300, left: 100, bottom: 330, right: 180, width: 80, height: 30};
    // Direct instance stubs (not vi.spyOn — instance method references
    // trip @typescript-eslint/unbound-method); the elements are removed
    // with the host, nothing to restore.
    panelEl.getBoundingClientRect = () => panelRect as DOMRect;
    triggerEl.getBoundingClientRect = () => triggerRect as DOMRect;
    try {
      // 'bottom' under RTL = start-aligned to the trigger's right edge.
      placeFloatingPanel(panelEl, triggerEl, 'bottom');
      expect(panelEl.style.left).toBe('30px');
      // 'left' under RTL = the trigger's physical right side.
      placeFloatingPanel(panelEl, triggerEl, 'left');
      expect(panelEl.style.left).toBe('180px');
    } finally {
      host.remove();
    }
  });

  it('picks the mirrored placement class on the JS-positioned tiers', () => {
    const fallbackOnly = {native: false, anchored: false} as const;
    const classes = (placement: Parameters<typeof floatingPlacementClasses>[1], dir?: 'rtl') =>
      floatingPlacementClasses(fallbackOnly, placement, dir);
    // Horizontal placements swap classes; start/end alignment swaps too.
    expect(classes('left', 'rtl')).toEqual(classes('right'));
    expect(classes('right', 'rtl')).toEqual(classes('left'));
    expect(classes('bottom', 'rtl')).toEqual(classes('bottom-end'));
    expect(classes('bottom-end', 'rtl')).toEqual(classes('bottom'));
    // Centers and the block axis are direction-invariant.
    expect(classes('bottom-center', 'rtl')).toEqual(classes('bottom-center'));
    expect(classes('top', 'rtl')).toEqual(classes('top'));
  });
});

// ---------------------------------------------------------------------------
// Layer 2c: CSS logical-properties codemod guard
// ---------------------------------------------------------------------------

describe('CSS logical-properties codemod guard', () => {
  /** Every non-test component source under src/lib/components. */
  function componentSources(): string[] {
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) out.push(full);
      }
    };
    walk(join(__dirname, 'components'));
    return out;
  }

  /**
   * Flow-axis physical properties are banned outright. Justified
   * exceptions (each carries a `physical:` comment in source):
   *   - Drawer: margin-left edge pinning pairs with its physical
   *     left/right placement prop.
   */
  const FLOW_ALLOWLIST = new Set(['Drawer.tsx']);
  /**
   * Physical borders survive only as unmirrored drawing primitives
   * (rotated chevron/checkmark glyphs — logical borders would corrupt
   * the shape).
   */
  const BORDER_ALLOWLIST = new Set([
    'AccordionItem.tsx',
    'CheckboxCore.tsx',
    'Disclosure.tsx',
  ]);

  it('uses no flow-axis physical margins, paddings or text-align', () => {
    const banned = /text-align:\s*(?:left|right)|(?<![-\w])(?:margin|padding)-(?:left|right):/;
    const offenders = componentSources()
      .filter((file) => !FLOW_ALLOWLIST.has(file.split('/').pop()!))
      .filter((file) => banned.test(readFileSync(file, 'utf8')))
      .map((file) => file.split('src/lib/').pop());
    // A failure prints the offending file paths in the diff.
    expect(offenders).toEqual([]);
  });

  it('uses physical borders only for unmirrored drawing primitives', () => {
    const banned = /border(?:-[a-z]+)?-(?:left|right):/;
    const offenders = componentSources()
      .filter((file) => !BORDER_ALLOWLIST.has(file.split('/').pop()!))
      .filter((file) => banned.test(readFileSync(file, 'utf8')))
      .map((file) => file.split('src/lib/').pop());
    expect(offenders).toEqual([]);
  });

  it('keeps logical properties in the flow-axis hot spots (sampling)', () => {
    const samples: Record<string, RegExp> = {
      'components/Carousel/Carousel.tsx': /inset-inline-start:/,
      'components/Menu/MenuItem.tsx': /text-align:\s*start/,
      'components/Cascader/Cascader.tsx': /text-align:\s*start/,
    };
    for (const [file, pattern] of Object.entries(samples)) {
      expect(readFileSync(join(__dirname, file), 'utf8')).toMatch(pattern);
    }
  });
});
