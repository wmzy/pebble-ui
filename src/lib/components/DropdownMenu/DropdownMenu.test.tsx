import type { DropdownMenuHandle, DropdownMenuDataItem  } from './DropdownMenu';

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import { SUBMENU_CLOSE_GRACE_MS, SUBMENU_OPEN_DELAY_MS } from '../../utils/submenu';

import DropdownMenu from './DropdownMenu';
import DropdownMenuTrigger from './DropdownMenuTrigger';
import DropdownMenuContent from './DropdownMenuContent';
import DropdownMenuItem from './DropdownMenuItem';
import DropdownMenuCheckboxItem from './DropdownMenuCheckboxItem';
import DropdownMenuRadioGroup from './DropdownMenuRadioGroup';
import DropdownMenuRadioItem from './DropdownMenuRadioItem';
import DropdownMenuGroup from './DropdownMenuGroup';
import DropdownMenuSeparator from './DropdownMenuSeparator';
import DropdownMenuSub from './DropdownMenuSub';
import DropdownMenuSubTrigger from './DropdownMenuSubTrigger';
import DropdownMenuSubContent from './DropdownMenuSubContent';
import { dropdownMenuItemDanger } from './dropdown-menu-item-styles';

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

describe('DropdownMenu submenu', () => {
  function renderSubmenu() {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Alpha</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub One</DropdownMenuItem>
              <DropdownMenuItem>Zed</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>Gamma</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    return screen.getByRole('button', { name: 'Open' });
  }

  /** Open the menu by keyboard and enter the submenu by keyboard. */
  async function openSubmenuWithKeyboard(user: ReturnType<typeof userEvent.setup>) {
    const trigger = renderSubmenu();
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // focus Alpha
    await user.keyboard('{ArrowDown}'); // focus the sub trigger
    await user.keyboard('{ArrowRight}');
    return trigger;
  }

  it('renders the sub trigger with submenu aria wiring while open', async () => {
    const user = userEvent.setup();
    const trigger = renderSubmenu();
    // Content unmounts while closed — no nested menu in the DOM yet.
    expect(screen.queryByRole('menuitem', { name: 'More' })).not.toBeInTheDocument();

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const more = screen.getByRole('menuitem', { name: 'More' });
    expect(more).toHaveAttribute('aria-haspopup', 'menu');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).not.toHaveAttribute('aria-owns');
  });

  it('opens with ArrowRight, focuses the first item and owns the nested menu', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    const more = screen.getByRole('menuitem', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const subMenu = screen.getByText('Sub One').closest('[role="menu"]')!;
    expect(more).toHaveAttribute('aria-owns', subMenu.id);
    expect(subMenu).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('Sub One')).toHaveFocus();
    expect(screen.getAllByRole('menu')).toHaveLength(2);
  });

  it('keeps ArrowDown traversal inside the submenu level, wrapping', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    await user.keyboard('{ArrowDown}'); // Sub One -> Zed
    expect(screen.getByText('Zed')).toHaveFocus();
    await user.keyboard('{ArrowDown}'); // wraps inside the submenu
    expect(screen.getByText('Sub One')).toHaveFocus();
    // never escapes into the parent level's items
    expect(screen.getByText('Alpha')).not.toHaveFocus();
  });

  it('scopes typeahead to the submenu level', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    // 'z' matches Zed inside the submenu
    await user.keyboard('z');
    expect(screen.getByText('Zed')).toHaveFocus();
  });

  it('does not leak typeahead from the submenu into the parent level', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    // 'a' would match the parent-level Alpha if the buffer leaked up;
    // within the submenu it matches nothing, so focus stays put.
    await user.keyboard('a');
    expect(screen.getByText('Sub One')).toHaveFocus();
  });

  it('Escape inside the submenu closes only that level and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = await openSubmenuWithKeyboard(user);
    const more = screen.getByRole('menuitem', { name: 'More' });
    await user.keyboard('{Escape}');
    // the submenu unmounts after its animated exit…
    await waitFor(() =>
      expect(screen.queryByText('Sub One')).not.toBeInTheDocument()
    );
    expect(more).toHaveAttribute('aria-expanded', 'false');
    // …while the root menu stays open
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(more).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('ArrowLeft inside the submenu closes it back to the trigger', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    const more = screen.getByRole('menuitem', { name: 'More' });
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.queryByText('Sub One')).not.toBeInTheDocument()
    );
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it('Escape on an open submenu trigger closes only the submenu', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByText('Sub One')).not.toBeInTheDocument()
    );
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('Tab inside the submenu closes the whole stack and focuses the root trigger', async () => {
    const user = userEvent.setup();
    const trigger = await openSubmenuWithKeyboard(user);
    await user.keyboard('{Tab}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
    expect(trigger).toHaveFocus();
  });

  it('selecting an item inside the submenu closes the whole menu', async () => {
    const user = userEvent.setup();
    const trigger = await openSubmenuWithKeyboard(user);
    await user.click(screen.getByText('Sub One'));
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
    expect(trigger).toHaveFocus();
  });

  it('toggles the submenu on trigger click while the menu stays open', async () => {
    const trigger = renderSubmenu();
    fireEvent.click(trigger);
    const more = screen.getByRole('menuitem', { name: 'More' });
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    // root menu + nested submenu both present
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    // the submenu panel unmounts once its animated exit settles; the
    // root menu itself stays open throughout
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('opens on hover after the intent delay, without stealing focus', () => {
    vi.useFakeTimers();
    try {
      const trigger = renderSubmenu();
      trigger.focus();
      fireEvent.click(trigger);
      const more = screen.getByRole('menuitem', { name: 'More' });
      fireEvent.pointerOver(more);
      expect(more).toHaveAttribute('aria-expanded', 'false');
      act(() => {
        vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS - 1);
      });
      expect(more).toHaveAttribute('aria-expanded', 'false');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      // hover never moves keyboard focus (still on the root trigger)
      expect(trigger).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes a hover-opened submenu after a grace period once the pointer settles elsewhere', () => {
    vi.useFakeTimers();
    try {
      const trigger = renderSubmenu();
      fireEvent.click(trigger);
      const more = screen.getByRole('menuitem', { name: 'More' });
      fireEvent.pointerOver(more);
      act(() => {
        vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS);
      });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      fireEvent.pointerOver(screen.getByText('Alpha'));
      act(() => {
        vi.advanceTimersByTime(SUBMENU_CLOSE_GRACE_MS - 1);
      });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(more).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports two nesting levels with per-level Escape', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Deeper</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Deep Item</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    screen.getByRole('button', { name: 'Open' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    const more = screen.getByRole('menuitem', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    const deeper = screen.getByRole('menuitem', { name: 'Deeper' });
    expect(deeper).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Deep Item')).toHaveFocus();
    await user.keyboard('{Escape}');
    // innermost level only
    await waitFor(() =>
      expect(screen.queryByText('Deep Item')).not.toBeInTheDocument()
    );
    expect(deeper).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(deeper).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByText('Deeper')).not.toBeInTheDocument()
    );
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();
  });

  it('keeps one roving tab stop per level', async () => {
    const user = userEvent.setup();
    await openSubmenuWithKeyboard(user);
    const zed = screen.getByText('Zed');
    zed.focus();
    const stops = screen
      .getAllByRole('menuitem')
      .filter((el) => el.tabIndex === 0);
    // one stop in the root level (the sub trigger), one in the submenu
    expect(stops).toHaveLength(2);
    expect(stops.map((el) => el.textContent)).toEqual(['More', 'Zed']);
  });

  it('mirrors the horizontal keys under dir=rtl: ArrowLeft opens, ArrowRight closes', async () => {
    const user = userEvent.setup();
    const container = document.createElement('div');
    container.setAttribute('dir', 'rtl');
    document.body.appendChild(container);
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Alpha</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub One</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
      { container },
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    const more = screen.getByRole('menuitem', { name: 'More' });
    await user.keyboard('{ArrowLeft}');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sub One')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(screen.queryByText('Sub One')).not.toBeInTheDocument()
    );
    expect(more).toHaveFocus();
  });

  it('hands focus into the submenu on the native popover tier (shown-gated)', async () => {
    // jsdom has no popover API: polyfill the minimal surface (same mock
    // as the collisionPadding suite below) so the sub's floating instance
    // drives visibility through showPopover/toggle like a real engine.
    // jsdom's UA sheet hides [popover] panels, so assertions use direct
    // DOM queries instead of role queries.
    installNativePopover();
    try {
      const user = userEvent.setup();
      const trigger = renderSubmenu();
      trigger.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      const more = screen.getByText('More');
      await user.keyboard('{ArrowRight}');
      // The focus handoff only runs once the popover is really shown —
      // before the toggle echo lands, focus would be dropped.
      expect(more).toHaveAttribute('aria-expanded', 'true');
      const subPanel = screen.getByText('Sub One').closest('[popover]')!;
      expect(subPanel.hasAttribute('data-popover-open')).toBe(true);
      expect(screen.getByText('Sub One')).toHaveFocus();
      await user.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.queryByText('Sub One')).not.toBeInTheDocument()
      );
      // the root menu is untouched by the inner Escape
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(more).toHaveFocus();
    } finally {
      removeNativePopover();
    }
  });

  it('has no axe violations with the submenu open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem>Alpha</DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub One</DropdownMenuItem>
              <DropdownMenuItem>Zed</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
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

describe('DropdownMenuCheckboxItem', () => {
  it('renders as menuitemcheckbox with aria-checked', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Show status bar</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show status bar' });
    expect(item).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles uncontrolled on click and keeps the menu open', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>Bookmarks</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const item = screen.getByRole('menuitemcheckbox');
    expect(item).toHaveAttribute('aria-checked', 'false');
    await user.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    // toggling an option does not close the menu
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(item);
    expect(item).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('drives a controlled checked control in both directions', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [checked, setChecked, checkedCtrl] = useControl(undefined, false);
      return (
        <div>
          <DropdownMenu open>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem checked={checkedCtrl}>Bookmarks</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => setChecked((v) => !v)}>flip</button>
          <output data-testid="checked">{String(checked)}</output>
        </div>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('menuitemcheckbox'));
    expect(screen.getByTestId('checked')).toHaveTextContent('true');
    await user.click(screen.getByText('flip'));
    expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('activates with Enter; Space passes through to the native activation', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem>Bookmarks</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitemcheckbox');
    item.focus();
    await user.keyboard('{Enter}');
    expect(item).toHaveAttribute('aria-checked', 'true');
    // Space must reach the browser's native button activation: the menu
    // keyboard layer lets the keydown through (jsdom/user-event do not
    // perform the space→click step, so the UA click is dispatched by
    // hand and the toggle must follow).
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    item.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'false');
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem disabled>Bookmarks</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitemcheckbox');
    await user.click(item);
    expect(item).toHaveAttribute('aria-checked', 'false');
    expect(item).toBeDisabled();
  });
});

describe('DropdownMenuRadioGroup', () => {
  it('selects exactly one item in the group and keeps the menu open', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, , valueCtrl] = useControl(undefined, 'light');
      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={valueCtrl}>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <output data-testid="value">{value}</output>
        </div>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const light = screen.getByRole('menuitemradio', { name: 'Light' });
    const dark = screen.getByRole('menuitemradio', { name: 'Dark' });
    expect(light).toHaveAttribute('aria-checked', 'true');
    await user.click(dark);
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(light).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('value')).toHaveTextContent('dark');
    // selecting an option does not close the menu
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('fires onValueChange once; re-selecting the current item is a no-op', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const dark = screen.getByRole('menuitemradio', { name: 'Dark' });
    await user.click(dark);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('dark');
    await user.click(dark);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('supports selection with Enter while focused', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="light">
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const dark = screen.getByRole('menuitemradio', { name: 'Dark' });
    dark.focus();
    await user.keyboard('{Enter}');
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
  });

  it('throws when a radio item is used outside a radio group', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<DropdownMenuRadioItem value="x">X</DropdownMenuRadioItem>)).toThrow(
      'MenuRadioItem / DropdownMenuRadioItem must be used within a radio group'
    );
    spy.mockRestore();
  });
});

describe('DropdownMenuGroup', () => {
  it('renders a labeled group with aria-labelledby wiring', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuGroup label="Actions">
            <DropdownMenuItem>Rename</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const group = screen.getByRole('group', { name: 'Actions' });
    expect(group).toContainElement(screen.getByRole('menuitem', { name: 'Rename' }));
  });

  it('keeps the label outside the item set and the tab order', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup label="Actions">
            <DropdownMenuItem>One</DropdownMenuItem>
            <DropdownMenuItem>Two</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    // focus lands on the first ITEM — the label is skipped
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus();
    const label = screen.getByText('Actions');
    expect(label.tabIndex).toBe(-1);
    expect(label.closest('[role^="menuitem"]')).toBeNull();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus();
  });
});

describe('DropdownMenu keyboard across item types', () => {
  async function renderMixed(user: ReturnType<typeof userEvent.setup>) {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Alpha</DropdownMenuItem>
          <DropdownMenuCheckboxItem>Cut</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="b">Bold</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuItem>Omega</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    return trigger;
  }

  it('traverses checkbox and radio items with the arrows, Home and End', async () => {
    const user = userEvent.setup();
    await renderMixed(user);
    const expected = [
      screen.getByRole('menuitem', { name: 'Alpha' }),
      screen.getByRole('menuitemcheckbox', { name: 'Cut' }),
      screen.getByRole('menuitemradio', { name: 'Bold' }),
      screen.getByRole('menuitem', { name: 'Omega' }),
    ];
    expect(expected[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(expected[1]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(expected[2]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(expected[3]).toHaveFocus();
    // wraps back to the first item (a plain menuitem)
    await user.keyboard('{ArrowDown}');
    expect(expected[0]).toHaveFocus();
    await user.keyboard('{End}');
    expect(expected[3]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(expected[0]).toHaveFocus();
  });

  it('matches checkbox and radio labels through typeahead', async () => {
    const user = userEvent.setup();
    await renderMixed(user);
    expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('c');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Cut' })).toHaveFocus();
    // 'cu' still matches Cut within the typeahead window
    await user.keyboard('u');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Cut' })).toHaveFocus();
  });

  it('keeps exactly one tab stop across the mixed item set', async () => {
    const user = userEvent.setup();
    await renderMixed(user);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    const stops = screen
      .getByRole('menu')
      .querySelectorAll('[role^="menuitem"][tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(screen.getByRole('menuitemradio', { name: 'Bold' }));
  });
});

describe('DropdownMenu items data API', () => {
  it('renders items, dividers, groups, checkboxes, radios and submenus recursively behind a default trigger', async () => {
    const user = userEvent.setup();
    const items: DropdownMenuDataItem[] = [
      { type: 'item', label: 'Rename', kbdLabel: 'F2' },
      { type: 'divider' },
      {
        type: 'group',
        label: 'View',
        children: [{ type: 'checkbox', label: 'Status bar' }],
      },
      {
        type: 'group',
        label: 'Theme',
        value: 'light',
        children: [
          { type: 'radio', value: 'light', label: 'Light' },
          { type: 'radio', value: 'dark', label: 'Dark' },
        ],
      },
      {
        type: 'sub',
        label: 'Share',
        children: [{ type: 'item', label: 'Copy link' }],
      },
    ];
    render(<DropdownMenu items={items} />);

    // data-driven root renders a default ⋯ trigger
    const trigger = screen.getByRole('button', { name: '⋯' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(trigger);

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Status bar' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true'
    );

    // submenu recursion: keyboard into Share
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{End}');
    const share = screen.getByRole('menuitem', { name: 'Share' });
    expect(share).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
  });

  it('binds checkbox and radio state through the data API', async () => {
    const user = userEvent.setup();
    const items: DropdownMenuDataItem[] = [
      { type: 'checkbox', label: 'Status bar', onCheckedChange: vi.fn() },
      {
        type: 'group',
        value: 'light',
        onValueChange: vi.fn(),
        children: [
          { type: 'radio', value: 'light', label: 'Light' },
          { type: 'radio', value: 'dark', label: 'Dark' },
        ],
      },
    ];
    render(<DropdownMenu items={items} />);
    await user.click(screen.getByRole('button', { name: '⋯' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    // toggles keep the menu open in the data-driven shape too
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('prefers items over children when both are passed', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu items={[{ type: 'item', label: 'From data' }]}>
        <span>ignored</span>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: '⋯' }));
    expect(screen.getByRole('menuitem', { name: 'From data' })).toBeInTheDocument();
    expect(screen.queryByText('ignored')).not.toBeInTheDocument();
  });
});

describe('DropdownMenu danger variant', () => {
  it('applies the danger skin class to items and checkable items', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem danger>Delete</DropdownMenuItem>
          <DropdownMenuCheckboxItem danger>Wipe cache</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="nuke" danger>Nuke</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass(dropdownMenuItemDanger);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Wipe cache' })).toHaveClass(dropdownMenuItemDanger);
    expect(screen.getByRole('menuitemradio', { name: 'Nuke' })).toHaveClass(dropdownMenuItemDanger);
  });

  it('omits the danger class by default', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).not.toHaveClass(dropdownMenuItemDanger);
  });
});

describe('DropdownMenu axe with selection items', () => {
  it('has no axe violations with checkbox, radio and group items open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuGroup label="View">
            <DropdownMenuCheckboxItem checked>Status bar</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="light">
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuItem danger>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
