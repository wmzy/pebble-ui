import { expect } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import { SUBMENU_CLOSE_GRACE_MS, SUBMENU_OPEN_DELAY_MS } from '../../utils/submenu';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuDivider from './MenuDivider';
import MenuSub from './MenuSub';
import MenuSubTrigger from './MenuSubTrigger';
import MenuSubContent from './MenuSubContent';

describe('Menu', () => {
  it('renders trigger and menu', () => {
    render(
      <Menu trigger={<button>Open</button>}>
        <MenuItem>Action 1</MenuItem>
      </Menu>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens menu on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Menu trigger={<button>Open</button>}>
        <MenuItem>Action 1</MenuItem>
      </Menu>
    );
    await user.click(screen.getByText('Open'));
  });

  it('closes menu on outside click', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, , openCtrl] = useControl(undefined, false);
      return (
        <div>
          <Menu open={openCtrl} trigger={<button>Open</button>}>
            <MenuItem>Action</MenuItem>
          </Menu>
          <button>outside</button>
          <output data-testid="open-state">{String(open)}</output>
        </div>
      );
    }
    render(<Harness />);
    await user.click(screen.getByText('Open'));
    expect(screen.getByTestId('open-state')).toHaveTextContent('true');
    await user.click(screen.getByText('outside'));
    expect(screen.getByTestId('open-state')).toHaveTextContent('false');
  });

  it('moves focus with ArrowDown and closes on Escape', () => {
    function Harness() {
      const [open, , openCtrl] = useControl(undefined, false);
      return (
        <div>
          <Menu open={openCtrl} trigger="T">
            <MenuItem>Action 1</MenuItem>
            <MenuItem>Action 2</MenuItem>
          </Menu>
          <output data-testid="open-state">{String(open)}</output>
        </div>
      );
    }
    render(<Harness />);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByText('Action 1')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Action 1'), { key: 'ArrowDown' });
    expect(screen.getByText('Action 2')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Action 2'), { key: 'Escape' });
    expect(screen.getByTestId('open-state')).toHaveTextContent('false');
  });

  it('focuses the first item on open and returns focus to the trigger on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Menu trigger={<button>Open</button>}>
        <MenuItem>Action 1</MenuItem>
        <MenuItem>Action 2</MenuItem>
      </Menu>
    );
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    // Opening moves focus into the menu (useFocusScope autoFocus).
    expect(screen.getByText('Action 1')).toHaveFocus();
    // Escape: focus used to drop to <body> once the hidden panel took
    // the focused item out of the tab order — the scope returns it.
    fireEvent.keyDown(screen.getByText('Action 1'), { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('mirrors the animated lifecycle as data-state without unmounting the panel', async () => {
    const user = userEvent.setup();
    render(
      <Menu trigger={<button>Open</button>}>
        <MenuItem>Action</MenuItem>
      </Menu>
    );
    const menu = screen.getByRole('menu');
    // Resident panel: mounted while closed, data-state drives the fade.
    expect(menu).toHaveAttribute('data-state', 'closed');
    await user.click(screen.getByText('Open'));
    expect(menu).toHaveAttribute('data-state', 'open');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
  });

  it('applies className to menu panel', () => {
    render(
      <Menu className="custom" trigger={<button>Open</button>}>
        <MenuItem>Action</MenuItem>
      </Menu>
    );
    expect(screen.getByRole('menu')).toHaveClass('custom');
  });

  it('has no axe violations while open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Menu trigger={<button>Open</button>}>
        <MenuItem>Action 1</MenuItem>
        <MenuDivider />
        <MenuItem>Action 2</MenuItem>
      </Menu>
    );
    await user.click(screen.getByText('Open'));
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('MenuItem', () => {
  it('renders as a button with menuitem role', () => {
    render(
      <Menu open trigger="T">
        <MenuItem>Action</MenuItem>
      </Menu>
    );
    expect(screen.getByRole('menuitem', { name: 'Action' })).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu open trigger="T">
        <MenuItem onSelect={onSelect}>Action</MenuItem>
      </Menu>
    );
    await user.click(screen.getByRole('menuitem'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    render(
      <Menu open trigger="T">
        <MenuItem disabled>Action</MenuItem>
      </Menu>
    );
    expect(screen.getByRole('menuitem')).toBeDisabled();
  });

  it('applies className', () => {
    render(
      <Menu open trigger="T">
        <MenuItem className="custom">Action</MenuItem>
      </Menu>
    );
    expect(screen.getByRole('menuitem')).toHaveClass('custom');
  });
});

describe('MenuDivider', () => {
  it('renders a separator', () => {
    render(
      <Menu open trigger="T">
        <MenuItem>A</MenuItem>
        <MenuDivider />
        <MenuItem>B</MenuItem>
      </Menu>
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});

describe('Menu submenu', () => {
  /** Root menu + one submenu, both levels controlled. */
  function Harness() {
    const [rootOpen, , rootCtrl] = useControl(undefined, false);
    const [subOpen, , subCtrl] = useControl(undefined, false);
    return (
      <div>
        <Menu open={rootCtrl} trigger={<button>Open</button>}>
          <MenuItem>Plain</MenuItem>
          <MenuSub open={subCtrl}>
            <MenuSubTrigger>More</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Sub One</MenuItem>
              <MenuItem>Zed</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </Menu>
        <output data-testid="root-open">{String(rootOpen)}</output>
        <output data-testid="sub-open">{String(subOpen)}</output>
      </div>
    );
  }

  function renderOpenRoot() {
    render(
      <Menu open trigger="T">
        <MenuItem>Plain</MenuItem>
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
            <MenuItem>Zed</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </Menu>
    );
    return screen.getByRole('menuitem', { name: 'More' });
  }

  function renderOpenSubmenu() {
    render(
      <Menu open trigger="T">
        <MenuItem>Plain</MenuItem>
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
            <MenuItem>Zed</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </Menu>
    );
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    return more;
  }

  it('renders the sub trigger as a menuitem with submenu aria wiring', () => {
    render(
      <Menu open trigger="T">
        <MenuItem>Plain</MenuItem>
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </Menu>
    );
    const more = screen.getByRole('menuitem', { name: 'More' });
    expect(more).toBeInTheDocument();
    expect(more).toHaveAttribute('aria-haspopup', 'menu');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    // The nested menu is only referenced while open.
    expect(more).not.toHaveAttribute('aria-owns');
  });

  it('opens with ArrowRight, focuses the first item and owns the nested menu', () => {
    const more = renderOpenSubmenu();
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const subMenu = screen.getByText('Sub One').closest('[role="menu"]')!;
    expect(subMenu).toBeInTheDocument();
    expect(more).toHaveAttribute('aria-owns', subMenu.id);
    expect(screen.getByText('Sub One')).toHaveFocus();
    // Root-level items stay outside the nested menu's traversal.
    expect(screen.getAllByRole('menu')).toHaveLength(2);
  });

  it('keeps ArrowDown traversal inside the submenu level, wrapping', () => {
    renderOpenSubmenu();
    const zed = screen.getByText('Zed');
    zed.focus();
    fireEvent.keyDown(zed, { key: 'ArrowDown' });
    // wraps to the first sub item, never escapes to the root level
    expect(screen.getByText('Sub One')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'ArrowDown' });
    expect(zed).toHaveFocus();
  });

  it('scopes typeahead to the submenu level', () => {
    renderOpenSubmenu();
    const subOne = screen.getByText('Sub One');
    subOne.focus();
    // 'z' matches Zed in the submenu
    fireEvent.keyDown(subOne, { key: 'z' });
    expect(screen.getByText('Zed')).toHaveFocus();
  });

  it('does not leak typeahead from the submenu into the parent level', () => {
    renderOpenSubmenu();
    const subOne = screen.getByText('Sub One');
    subOne.focus();
    // 'p' would match the root-level 'Plain' if the buffer leaked up;
    // within the submenu it matches nothing, so focus stays put.
    fireEvent.keyDown(subOne, { key: 'p' });
    expect(subOne).toHaveFocus();
  });

  it('Escape inside the submenu closes only that level and returns focus to the trigger', () => {
    render(<Harness />);
    const open = screen.getByText('Open');
    open.focus();
    fireEvent.click(open);
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    expect(screen.getByTestId('sub-open')).toHaveTextContent('true');
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'Escape' });
    expect(screen.getByTestId('sub-open')).toHaveTextContent('false');
    expect(screen.getByTestId('root-open')).toHaveTextContent('true');
    expect(more).toHaveFocus();
  });

  it('ArrowLeft inside the submenu closes it back to the trigger', () => {
    render(<Harness />);
    const open = screen.getByText('Open');
    open.focus();
    fireEvent.click(open);
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('sub-open')).toHaveTextContent('false');
    expect(screen.getByTestId('root-open')).toHaveTextContent('true');
    expect(more).toHaveFocus();
  });

  it('Escape on an open submenu trigger closes only the submenu', () => {
    const more = renderOpenSubmenu();
    more.focus();
    fireEvent.keyDown(more, { key: 'Escape' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    // the root menu itself stays open (its panel is resident)
    expect(screen.getByRole('menuitem', { name: 'Plain' })).toBeInTheDocument();
  });

  it('Escape with the submenu closed bubbles up and closes the root menu', () => {
    render(<Harness />);
    const open = screen.getByText('Open');
    open.focus();
    fireEvent.click(open);
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'Escape' });
    expect(screen.getByTestId('root-open')).toHaveTextContent('false');
    expect(open).toHaveFocus();
  });

  it('Tab inside the submenu closes the whole stack and focuses the root trigger', () => {
    render(<Harness />);
    const open = screen.getByText('Open');
    open.focus();
    fireEvent.click(open);
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'Tab' });
    expect(screen.getByTestId('sub-open')).toHaveTextContent('false');
    expect(screen.getByTestId('root-open')).toHaveTextContent('false');
    expect(open).toHaveFocus();
  });

  it('opens on hover after the intent delay, without stealing focus', () => {
    vi.useFakeTimers();
    try {
      renderOpenRoot();
      const more = screen.getByRole('menuitem', { name: 'More' });
      const plain = screen.getByRole('menuitem', { name: 'Plain' });
      plain.focus();
      // pointerover drives both React's pointerenter and the region check
      fireEvent.pointerOver(more);
      expect(more).toHaveAttribute('aria-expanded', 'false');
      act(() => { vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS - 1); });
      expect(more).toHaveAttribute('aria-expanded', 'false');
      act(() => { vi.advanceTimersByTime(1); });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      // hover never moves keyboard focus
      expect(plain).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the pending hover open when the pointer leaves early', () => {
    vi.useFakeTimers();
    try {
      renderOpenRoot();
      const more = screen.getByRole('menuitem', { name: 'More' });
      fireEvent.pointerOver(more);
      act(() => { vi.advanceTimersByTime(60); });
      fireEvent.pointerOver(screen.getByRole('menuitem', { name: 'Plain' }));
      act(() => { vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS + SUBMENU_CLOSE_GRACE_MS); });
      expect(more).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes a hover-opened submenu after a grace period once the pointer settles elsewhere', () => {
    vi.useFakeTimers();
    try {
      renderOpenRoot();
      const more = screen.getByRole('menuitem', { name: 'More' });
      fireEvent.pointerOver(more);
      act(() => { vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS); });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      fireEvent.pointerOver(screen.getByRole('menuitem', { name: 'Plain' }));
      act(() => { vi.advanceTimersByTime(SUBMENU_CLOSE_GRACE_MS - 1); });
      expect(more).toHaveAttribute('aria-expanded', 'true');
      act(() => { vi.advanceTimersByTime(1); });
      expect(more).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-entering the submenu region cancels a pending grace close', () => {
    vi.useFakeTimers();
    try {
      renderOpenRoot();
      const more = screen.getByRole('menuitem', { name: 'More' });
      fireEvent.pointerOver(more);
      act(() => { vi.advanceTimersByTime(SUBMENU_OPEN_DELAY_MS); });
      fireEvent.pointerOver(screen.getByRole('menuitem', { name: 'Plain' }));
      act(() => { vi.advanceTimersByTime(SUBMENU_CLOSE_GRACE_MS / 2); });
      fireEvent.pointerOver(screen.getByText('Sub One'));
      act(() => { vi.advanceTimersByTime(SUBMENU_CLOSE_GRACE_MS); });
      expect(more).toHaveAttribute('aria-expanded', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('toggles the submenu on trigger click', () => {
    renderOpenRoot();
    const more = screen.getByRole('menuitem', { name: 'More' });
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports two nesting levels with per-level Escape', () => {
    render(
      <Menu open trigger="T">
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Deeper</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem>Deep Item</MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuSubContent>
        </MenuSub>
      </Menu>
    );
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    expect(screen.getByText('Sub One')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'ArrowDown' });
    const deeper = screen.getByRole('menuitem', { name: 'Deeper' });
    expect(deeper).toHaveFocus();
    fireEvent.keyDown(deeper, { key: 'ArrowRight' });
    expect(deeper).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Deep Item')).toHaveFocus();
    // Escape peels exactly the innermost level
    fireEvent.keyDown(screen.getByText('Deep Item'), { key: 'Escape' });
    expect(deeper).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(deeper).toHaveFocus();
    fireEvent.keyDown(deeper, { key: 'Escape' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();
  });

  it('keeps one roving tab stop per level', () => {
    renderOpenSubmenu();
    screen.getByText('Zed').focus();
    const stops = screen
      .getAllByRole('menuitem')
      .filter((el) => el.tabIndex === 0);
    // one stop in the root level (the sub trigger), one in the submenu
    expect(stops).toHaveLength(2);
    expect(stops.map((el) => el.textContent)).toEqual(['More', 'Zed']);
  });

  it('mirrors the horizontal keys under dir=rtl: ArrowLeft opens, ArrowRight closes', () => {
    const container = document.createElement('div');
    container.setAttribute('dir', 'rtl');
    document.body.appendChild(container);
    render(
      <Menu open trigger="T">
        <MenuItem>Plain</MenuItem>
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </Menu>,
      { container }
    );
    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowLeft' });
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sub One')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Sub One'), { key: 'ArrowRight' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();
  });

  it('has no axe violations with the submenu open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Menu open trigger={<button>Open</button>}>
        <MenuItem>Plain</MenuItem>
        <MenuSub open>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Sub One</MenuItem>
            <MenuItem>Zed</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </Menu>
    );
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
