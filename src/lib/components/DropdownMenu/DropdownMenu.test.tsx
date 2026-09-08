import type { DropdownMenuHandle } from './DropdownMenu';

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import DropdownMenu from './DropdownMenu';
import DropdownMenuTrigger from './DropdownMenuTrigger';
import DropdownMenuContent from './DropdownMenuContent';
import DropdownMenuItem from './DropdownMenuItem';
import DropdownMenuSeparator from './DropdownMenuSeparator';

function renderMenu(props?: { itemDisabled?: boolean }) {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Alpha</DropdownMenuItem>
        <DropdownMenuItem disabled={props?.itemDisabled}>Beta</DropdownMenuItem>
        <DropdownMenuItem>Gamma</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  return screen.getByRole('button', { name: 'Open' });
}

function menuItems() {
  return screen.getAllByRole('menuitem');
}

describe('DropdownMenu', () => {
  it('renders trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows content when trigger clicked', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('hides content when item clicked', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Open'));
    await user.click(screen.getByText('Item 1'));
    // Animated exit: the panel unmounts once the fade-out settles —
    // immediate in jsdom (no CSS durations), but across the double rAF
    // of whenExitSettles, hence waitFor.
    await waitFor(() =>
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
    );
  });

  it('hides content on outside pointerdown', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    // Same animated-exit handover as above.
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
  });

  it('calls item onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Open'));
    await user.click(screen.getByText('Item 1'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders separator', () => {
    const { container } = render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
  });

  it('applies className to content', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent className="custom">
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Item').parentElement).toHaveClass('custom');
  });

  it('does not call onClick when item is disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick} disabled>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Item'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes menu semantics and trigger aria wiring when open', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('menu');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(menuItems()).toHaveLength(3);
    expect(menuItems()[0]).toHaveAttribute('role', 'menuitem');
  });

  it('opens with ArrowDown and focuses the first item', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(menuItems()[0]).toHaveFocus();
  });

  it('opens with ArrowUp and focuses the last item', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowUp}');
    expect(menuItems()[2]).toHaveFocus();
  });

  it('moves focus with ArrowDown/ArrowUp, wrapping and skipping disabled items', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu({ itemDisabled: true });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    // Beta is disabled: ArrowDown from Alpha skips straight to Gamma
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[2]).toHaveFocus();
    // wrap past the end back to Alpha
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[0]).toHaveFocus();
    // wrap past the start (over disabled Beta) back to Gamma
    await user.keyboard('{ArrowUp}');
    expect(menuItems()[2]).toHaveFocus();
  });

  it('jumps to first/last item with Home/End', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{End}');
    expect(menuItems()[2]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(menuItems()[0]).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[0]).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes on Tab without losing focus to body', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Tab}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('moves focus by typeahead on first character', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('g');
    expect(menuItems()[2]).toHaveFocus();
    // characters typed within the window accumulate: 'ga' matches
    // nothing, so focus stays put
    await user.keyboard('a');
    expect(menuItems()[2]).toHaveFocus();
  });

  it('returns focus to the trigger after selecting an item with the keyboard', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('keeps exactly one tab stop among items (roving tabindex)', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    const tabbables = menuItems().filter((el) => el.tabIndex === 0);
    expect(tabbables).toHaveLength(1);
    expect(tabbables[0]).toBe(menuItems()[1]);
  });

  it('mirrors the animated lifecycle as data-state on the panel', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Open' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');
    fireEvent.click(menuItems()[0]!);
    // 'closed' lands immediately (it drives the fade-out); the unmount
    // is what waits for the exit to settle.
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
  });

  it('keeps the panel mounted during the exit window, then unmounts', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(document.body);
    // Synchronously after close the panel is still mounted — fading out
    // with data-state=closed. jsdom reports no CSS durations, so the
    // settle completes across the double rAF of whenExitSettles.
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
  });

  it('renders nothing before the first open', () => {
    renderMenu();
    // `exited` starts true for a never-opened animated panel.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const trigger = renderMenu();
    await user.click(trigger);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('throws when trigger is used outside DropdownMenu', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(<DropdownMenuTrigger>Open</DropdownMenuTrigger>)
    ).toThrow('DropdownMenu components must be used within <DropdownMenu>');
    spy.mockRestore();
  });

  it('keeps focus when typeahead matches nothing', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[0]).toHaveFocus();
    await user.keyboard('z');
    expect(menuItems()[0]).toHaveFocus();
  });

  it('ignores typeahead when modifier keys are held', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[0]).toHaveFocus();
    await user.keyboard('{Control>}a{/Control}');
    expect(menuItems()[0]).toHaveFocus();
  });

  it('moves focus to the first item when ArrowDown pressed while menu is open', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    await user.click(trigger); // menu already open, focus stays on trigger
    await user.keyboard('{ArrowDown}');
    expect(menuItems()[0]).toHaveFocus();
  });

  it('moves focus to the last item when ArrowUp pressed while menu is open', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();
    await user.click(trigger);
    await user.keyboard('{ArrowUp}');
    expect(menuItems()[2]).toHaveFocus();
  });

  it('resets the typeahead buffer after the timeout window', () => {
    vi.useFakeTimers();
    try {
      const trigger = renderMenu();
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      const items = menuItems();
      expect(items[0]).toHaveFocus();
      fireEvent.keyDown(items[0]!, { key: 'g' });
      expect(items[2]).toHaveFocus(); // Gamma
      vi.advanceTimersByTime(600); // buffer resets
      fireEvent.keyDown(items[2]!, { key: 'a' });
      expect(items[0]).toHaveFocus(); // Alpha, not a wrap-continue of "ga"
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the typeahead timer on unmount without error', async () => {
    const user = userEvent.setup();
    const view = render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Alpha</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('a');
    // unmount while the reset timer is pending: the cleanup must not throw
    expect(() => view.unmount()).not.toThrow();
  });

  it('getEnabledMenuItems returns empty list for a null container', async () => {
    const { getEnabledMenuItems } = await import('../../utils/menuKeyboard');
    expect(getEnabledMenuItems(null)).toEqual([]);
  });
});

describe('DropdownMenu imperative handle', () => {
  it('opens and closes through the handle, firing onOpenChange on each transition', async () => {
    const onOpenChange = vi.fn();
    const ref = createRef<DropdownMenuHandle>();
    render(
      <DropdownMenu ref={ref} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => ref.current!.open());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    act(() => ref.current!.close());
    // handle.close 走与触发器/菜单项相同的 handleSetOpen：动画退场后
    // 卸载，onOpenChange(false) 恰好一次——不双发。
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('drives a controlled open control through the handle', async () => {
    const ref = createRef<DropdownMenuHandle>();
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open via control</button>
          <DropdownMenu ref={ref} open={openCtrl}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }
    render(<Harness />);

    act(() => {
      fireEvent.click(screen.getByText('Open via control'));
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // handle.close 写的是外部传入的 control，受控方能看到关闭
    act(() => ref.current!.close());
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
  });

  it('focuses the trigger through focusTrigger()', () => {
    const ref = createRef<DropdownMenuHandle>();
    render(
      <>
        <button type="button">Elsewhere</button>
        <DropdownMenu ref={ref}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      </>,
    );
    const elsewhere = screen.getByText('Elsewhere');
    const trigger = screen.getByRole('button', { name: 'Open' });
    elsewhere.focus();
    expect(elsewhere).toHaveFocus();

    act(() => ref.current!.focusTrigger());
    expect(trigger).toHaveFocus();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<DropdownMenuHandle>();
    const { unmount } = render(
      <DropdownMenu ref={ref}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>,
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
// minimal surface the component relies on (same approach as Popover's
// tests) to exercise the native tier-2 path for collisionPadding.
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
  HTMLElement.prototype.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', '');
    this.dispatchEvent(new ToggleEventPolyfill('toggle', { newState: 'open' }));
  };
  HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
    if (!this.hasAttribute('data-popover-open')) return;
    this.removeAttribute('data-popover-open');
    this.dispatchEvent(
      new ToggleEventPolyfill('toggle', { newState: 'closed' })
    );
  };
}

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

type MockRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

// Plain object (cast at the mock's return): spreading a DOMRect-typed
// value would drop its class prototype.
const zeroRect = () =>
  ({top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})});

/**
 * Point the panel (popover element) and the trigger (a BUTTON — here the
 * menu's own trigger and items share the shape; only the trigger's rect
 * feeds placement) at controlled rects; jsdom layout is zero.
 */
function mockRects(panelRect: MockRect, triggerRect: MockRect) {
  return vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute('popover')) return {...zeroRect(), ...panelRect};
      if (this.tagName === 'BUTTON') return {...zeroRect(), ...triggerRect};
      return zeroRect();
    });
}

describe('DropdownMenu collisionPadding (tier 2)', () => {
  // jsdom viewport: 1024 x 768.
  const panel = {top: 0, left: 0, bottom: 200, right: 150, width: 150, height: 200};
  const trigger = {top: 300, left: 100, bottom: 330, right: 180, width: 80, height: 30};

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shifts the panel into the padded viewport on open', () => {
    installNativePopover();
    vi.spyOn(CSS, 'supports').mockReturnValue(false);
    // Trigger at the right edge: bottom start alignment overflows the
    // cross axis, so the panel shifts to the padded viewport edge.
    const rectSpy = mockRects(panel, {...trigger, left: 950, right: 1030});
    try {
      render(
        <DropdownMenu collisionPadding={16}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Alpha</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      const panelEl = document.querySelector<HTMLElement>('[popover]')!;
      // viewport 1024 − padding 16 − panel 150 = 858 (874 unpadded).
      expect(panelEl.style.left).toBe('858px');
      expect(panelEl.style.top).toBe('330px');
    } finally {
      rectSpy.mockRestore();
      removeNativePopover();
    }
  });

  it('keeps the unpadded default placement (collisionPadding unset)', () => {
    installNativePopover();
    vi.spyOn(CSS, 'supports').mockReturnValue(false);
    const rectSpy = mockRects(panel, {...trigger, left: 950, right: 1030});
    try {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Alpha</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      const panelEl = document.querySelector<HTMLElement>('[popover]')!;
      // No padding: shift clamps to the raw viewport edge (1024 − 150).
      expect(panelEl.style.left).toBe('874px');
    } finally {
      rectSpy.mockRestore();
      removeNativePopover();
    }
  });
});
