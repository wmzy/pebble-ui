import type { PopoverHandle } from './Popover';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import { placeFloatingPanel } from '../../utils/floating';

import Popover from './Popover';

describe('Popover', () => {
  it('renders trigger and content', () => {
    render(<Popover content="Popover body">Trigger</Popover>);
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('toggles on trigger click', async () => {
    const user = userEvent.setup();
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('links trigger to panel via aria-controls', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();
  });

  it('applies className to panel', () => {
    render(<Popover content="Body" className="custom">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    const panelId = trigger.getAttribute('aria-controls')!;
    expect(document.getElementById(panelId)).toHaveClass('custom');
  });

  it('is Tab-focusable and exposes aria-haspopup', async () => {
    const user = userEvent.setup();
    render(<Popover content="Popover body">Trigger</Popover>);
    const trigger = screen.getByRole('button', {name: 'Trigger'});
    expect(trigger).toHaveAttribute('tabindex', '0');
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');

    await user.tab();
    expect(trigger).toHaveFocus();
  });

  it('toggles with Enter and Space keys', async () => {
    const user = userEvent.setup();
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    await user.tab();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on outside pointerdown in the fallback path', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape in the fallback path', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Popover content="Popover body">Trigger</Popover>);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Popover content="Popover body">Trigger</Popover>);
    await user.click(screen.getByText('Trigger'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('toggles on trigger clicks early in a page\'s life (performance.now ≈ 0)', () => {
    // Regression: the light-dismiss race sentinels once used 0 as
    // "never", but in a browser performance.now() counts from navigation
    // start — so every trigger click in the first CLICK_WINDOW of a page
    // load was swallowed as a supposed post-dismiss click. jsdom's clock
    // starts at process spawn and never shows it; mock the clock.
    const clock = vi.spyOn(performance, 'now').mockReturnValue(10);
    try {
      render(<Popover content="Body">Trigger</Popover>);
      const trigger = screen.getByText('Trigger');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    } finally {
      clock.mockRestore();
    }
  });
});

describe('Popover imperative handle', () => {
  it('opens and closes through the handle', () => {
    const ref = createRef<PopoverHandle>();
    render(
      <>
        <button type="button">Elsewhere</button>
        <Popover ref={ref} content="Popover body">
          Trigger
        </Popover>
      </>
    );
    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    act(() => ref.current!.open());
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    act(() => ref.current!.close());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('drives a controlled open control through the handle', () => {
    const ref = createRef<PopoverHandle>();
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open via control</button>
          <Popover ref={ref} content="Popover body" open={openCtrl}>
            Trigger
          </Popover>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByText('Trigger');

    act(() => {
      fireEvent.click(screen.getByText('Open via control'));
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // handle.close 写的是外部传入的 control，受控方能看到关闭
    act(() => ref.current!.close());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('focuses the trigger through focusTrigger()', () => {
    const ref = createRef<PopoverHandle>();
    render(
      <>
        <button type="button">Elsewhere</button>
        <Popover ref={ref} content="Popover body">
          Trigger
        </Popover>
      </>
    );
    const elsewhere = screen.getByText('Elsewhere');
    const trigger = screen.getByText('Trigger');
    elsewhere.focus();
    expect(elsewhere).toHaveFocus();

    act(() => ref.current!.focusTrigger());
    expect(trigger).toHaveFocus();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<PopoverHandle>();
    const { unmount } = render(
      <Popover ref={ref} content="Popover body">
        Trigger
      </Popover>
    );
    // React nulls ref.current on unmount — the guard under test is a
    // consumer holding the handle object itself.
    const handle = ref.current!;
    unmount();
    expect(() => {
      handle.open();
      handle.close();
      handle.focusTrigger();
    }).not.toThrow();
  });
});

// jsdom implements neither the Popover API nor ToggleEvent; polyfill the
// minimal surface the component relies on (same approach as Dialog's
// showModal/close mocks) to exercise the native path.
class ToggleEventPolyfill extends Event {
  newState: string;
  constructor(type: string, init: { newState: string }) {
    super(type);
    this.newState = init.newState;
  }
}

function installNativePopover() {
  Object.defineProperty(HTMLElement.prototype, 'popover', {
    configurable: true,
    value: 'manual',
  });
  HTMLElement.prototype.showPopover = showPopoverMock;
  HTMLElement.prototype.hidePopover = hidePopoverMock;
}

const showPopoverMock = vi.fn(function (this: HTMLElement) {
  this.setAttribute('data-popover-open', '');
  this.dispatchEvent(new ToggleEventPolyfill('toggle', { newState: 'open' }));
});

const hidePopoverMock = vi.fn(function (this: HTMLElement) {
  if (!this.hasAttribute('data-popover-open')) return;
  this.removeAttribute('data-popover-open');
  this.dispatchEvent(
    new ToggleEventPolyfill('toggle', { newState: 'closed' })
  );
});

type PopoverProtoPatch = {
  popover?: unknown;
  showPopover?: () => void;
  hidePopover?: () => void;
};

function removeNativePopover() {
  const proto = HTMLElement.prototype as PopoverProtoPatch;
  delete proto.popover;
  delete proto.showPopover;
  delete proto.hidePopover;
}

describe('Popover (native popover API)', () => {
  beforeEach(() => {
    installNativePopover();
  });

  afterEach(() => {
    removeNativePopover();
    vi.restoreAllMocks();
  });

  function getPanel() {
    const trigger = screen.getByText('Trigger');
    return document.getElementById(trigger.getAttribute('aria-controls')!)!;
  }

  it('renders the panel as a popover=auto element', () => {
    render(<Popover content="Body">Trigger</Popover>);
    expect(getPanel()).toHaveAttribute('popover', 'auto');
  });

  it('drives showPopover/hidePopover from state on trigger clicks', async () => {
    const user = userEvent.setup();
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');

    await user.click(trigger);
    expect(showPopoverMock).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    // Animated exit: hidePopover is deferred until the exit animation
    // settles — immediate in jsdom (no CSS durations), but still across
    // the double rAF of whenExitSettles, hence waitFor.
    await waitFor(() => expect(hidePopoverMock).toHaveBeenCalledTimes(1));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('drives showPopover/hidePopover through the imperative handle on the same state path', async () => {
    // The handle must go through the engine's state path (setOpen), not
    // call showPopover/hidePopover itself — otherwise the toggle-echo
    // reconciliation (hideRequestedRef) would be bypassed.
    // (vi.restoreAllMocks does not clear vi.fn history — see the
    // afterEach above — so counts are rebased manually here.)
    showPopoverMock.mockClear();
    hidePopoverMock.mockClear();
    const ref = createRef<PopoverHandle>();
    render(
      <Popover ref={ref} content="Body">
        Trigger
      </Popover>
    );
    const trigger = screen.getByText('Trigger');

    act(() => ref.current!.open());
    expect(showPopoverMock).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    act(() => ref.current!.close());
    // Animated exit: hidePopover lands after the settle, with the
    // engine's own echo bookkeeping in charge.
    await waitFor(() => expect(hidePopoverMock).toHaveBeenCalledTimes(1));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // The closed toggle echo was ours (echo reconciliation ran): no
    // state resurrection, still closed.
    expect(getPanel()).toHaveAttribute('data-state', 'closed');
  });

  it('mirrors the animated lifecycle as data-state on the panel', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    const panel = getPanel();
    expect(panel).toHaveAttribute('data-state', 'closed');
    fireEvent.click(trigger);
    expect(panel).toHaveAttribute('data-state', 'open');
    fireEvent.click(trigger);
    // 'closed' lands immediately (it drives the fade-out); the hidden
    // handover is what waits for the exit to settle.
    expect(panel).toHaveAttribute('data-state', 'closed');
  });

  it('syncs a browser-side close (Escape/light dismiss) back to state', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Browser closes the popover without React (e.g. Escape key).
    act(() => {
      getPanel().dispatchEvent(
        new ToggleEventPolyfill('toggle', { newState: 'closed' })
      );
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not reopen on the click whose pointerdown light-dismissed it', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Real sequence when clicking a non-invoker trigger while open:
    // pointerdown → browser light-dismiss → click.
    fireEvent.pointerDown(trigger);
    act(() => {
      getPanel().dispatchEvent(
        new ToggleEventPolyfill('toggle', { newState: 'closed' })
      );
    });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('reopens on click after a browser-side close without pointerdown (Escape)', () => {
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');
    fireEvent.click(trigger);

    act(() => {
      getPanel().dispatchEvent(
        new ToggleEventPolyfill('toggle', { newState: 'closed' })
      );
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('wires CSS anchor positioning when supported', () => {
    // jsdom's CSS.supports is permissive, so the anchor branch is active.
    render(<Popover content="Body">Trigger</Popover>);
    // The panel receives the trigger's anchor name through the custom
    // property the anchored styles resolve. (The trigger's own
    // `anchor-name` declaration cannot be asserted here: jsdom's CSSOM
    // silently drops unknown camelCase properties.)
    expect(getPanel().style.getPropertyValue('--haze-floating-anchor')).toMatch(
      /^--haze-floating-/
    );
  });

  it('falls back to JS positioning from the trigger rect without anchor support', () => {
    vi.spyOn(CSS, 'supports').mockReturnValue(false);
    render(<Popover content="Body">Trigger</Popover>);
    const trigger = screen.getByText('Trigger');

    fireEvent.click(trigger);
    const panel = getPanel();
    expect(panel.style.top).not.toBe('');
    expect(panel.style.left).not.toBe('');
    // anchor wiring is absent in this mode
    expect(panel.style.getPropertyValue('--haze-floating-anchor')).toBe('');
    expect(trigger.getAttribute('style')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tier-2 JS positioning: viewport flip / clamp. The anchored tier flips
// declaratively (position-try-fallbacks); the JS tier below must not let
// a panel near the viewport edge overflow it.
// ---------------------------------------------------------------------------

type MockRect = {top: number; left: number; bottom: number; right: number; width: number; height: number};

// Plain object (cast at the mock's return): spreading a DOMRect-typed
// value would drop its class prototype (no-misused-spread).
const zeroRect = () =>
  ({top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})});

/** Point panel/trigger elements at controlled rects; jsdom layout is zero. */
function mockRects(panelRect: MockRect, triggerRect: MockRect) {
  return vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      if (this.dataset.rect === 'panel' || this.hasAttribute('popover'))
        return {...zeroRect(), ...panelRect};
      if (this.dataset.rect === 'trigger' || this.getAttribute('role') === 'button')
        return {...zeroRect(), ...triggerRect};
      return zeroRect();
    });
}

describe('tier-2 placement: viewport flip (placeFloatingPanel)', () => {
  // jsdom viewport: 1024 x 768.
  const panel = {top: 0, left: 0, bottom: 200, right: 150, width: 150, height: 200};
  const trigger = {top: 300, left: 100, bottom: 330, right: 180, width: 80, height: 30};

  function mount(panelRect: MockRect, triggerRect: MockRect) {
    const panelEl = document.createElement('div');
    panelEl.dataset.rect = 'panel';
    const triggerEl = document.createElement('span');
    triggerEl.dataset.rect = 'trigger';
    document.body.append(panelEl, triggerEl);
    const spy = mockRects(panelRect, triggerRect);
    return {panelEl, triggerEl, restore: () => { spy.mockRestore(); panelEl.remove(); triggerEl.remove(); }};
  }

  it('keeps the plain position when the panel fits (default unchanged)', () => {
    const {panelEl, triggerEl, restore} = mount(panel, trigger);
    try {
      placeFloatingPanel(panelEl, triggerEl, 'bottom');
      expect(panelEl.style.top).toBe('330px');
      expect(panelEl.style.left).toBe('100px');
    } finally {
      restore();
    }
  });

  it('flips bottom→top when the trigger sits at the bottom edge', () => {
    const {panelEl, triggerEl, restore} = mount(panel, {
      ...trigger, top: 700, bottom: 730,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'bottom-span');
      // flipped above the trigger, horizontal start alignment kept
      expect(panelEl.style.top).toBe('500px');
      expect(panelEl.style.left).toBe('100px');
    } finally {
      restore();
    }
  });

  it('flips top→bottom when the trigger sits at the top edge', () => {
    const {panelEl, triggerEl, restore} = mount(panel, {
      ...trigger, top: 10, bottom: 40, left: 462, right: 562,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'top');
      // flipped below the trigger, center alignment kept
      // (centerX = 462 + 80/2 − 150/2)
      expect(panelEl.style.top).toBe('40px');
      expect(panelEl.style.left).toBe('427px');
    } finally {
      restore();
    }
  });

  it('flips right→left when the trigger sits at the right edge', () => {
    const {panelEl, triggerEl, restore} = mount(panel, {
      ...trigger, top: 100, bottom: 130, left: 980, right: 1060,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'right');
      expect(panelEl.style.left).toBe('830px');
    } finally {
      restore();
    }
  });

  it('flips left→right when the trigger sits at the left edge', () => {
    const {panelEl, triggerEl, restore} = mount(panel, {
      ...trigger, top: 100, bottom: 130, left: -40, right: 40,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'left');
      expect(panelEl.style.left).toBe('40px');
    } finally {
      restore();
    }
  });

  it('clamps into the viewport when neither side fits', () => {
    const tall = {...panel, height: 900, bottom: 900};
    const {panelEl, triggerEl, restore} = mount(tall, {
      ...trigger, top: 700, bottom: 730,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'bottom');
      // no room above (700 < 900) and none below: clamp to the top edge
      expect(panelEl.style.top).toBe('0px');
      expect(panelEl.style.left).toBe('100px');
    } finally {
      restore();
    }
  });

  it('clamps horizontally at the right edge without flipping', () => {
    const {panelEl, triggerEl, restore} = mount(panel, {
      ...trigger, left: 950, right: 1030,
    });
    try {
      placeFloatingPanel(panelEl, triggerEl, 'bottom-span');
      expect(panelEl.style.top).toBe('330px');
      expect(panelEl.style.left).toBe('874px');
    } finally {
      restore();
    }
  });

  it('flips to the other side through the Popover component path (tier 2)', () => {
    installNativePopover();
    vi.spyOn(CSS, 'supports').mockReturnValue(false);
    const rectSpy = mockRects(panel, {...trigger, top: 700, bottom: 730});
    try {
      render(<Popover content="Body">Trigger</Popover>);
      fireEvent.click(screen.getByText('Trigger'));
      const panelEl = document.querySelector<HTMLElement>('[popover]')!;
      expect(panelEl.style.top).toBe('500px');
      expect(panelEl.style.left).toBe('100px');
    } finally {
      rectSpy.mockRestore();
      removeNativePopover();
      vi.restoreAllMocks();
    }
  });

  it('shifts with collisionPadding through the Popover component path (tier 2)', () => {
    installNativePopover();
    vi.spyOn(CSS, 'supports').mockReturnValue(false);
    // Trigger at the right edge: bottom-span start alignment overflows,
    // so the cross axis shifts to the padded viewport edge.
    const rectSpy = mockRects(panel, {...trigger, left: 950, right: 1030});
    try {
      render(<Popover content="Body" collisionPadding={16}>Trigger</Popover>);
      fireEvent.click(screen.getByText('Trigger'));
      const panelEl = document.querySelector<HTMLElement>('[popover]')!;
      // viewport 1024 − padding 16 − panel 150 = 858 (874 unpadded).
      expect(panelEl.style.left).toBe('858px');
    } finally {
      rectSpy.mockRestore();
      removeNativePopover();
      vi.restoreAllMocks();
    }
  });
});
