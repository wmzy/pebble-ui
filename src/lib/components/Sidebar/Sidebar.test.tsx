import type { MouseEvent } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import LocaleProvider from '../LocaleProvider';

import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  SidebarToggle,
} from './index';

function SidebarFixture({ defaultCollapsed }: { defaultCollapsed?: boolean } = {}) {
  return (
    <Sidebar defaultCollapsed={defaultCollapsed}>
      <SidebarGroup title="Platform">
        <SidebarItem href="/" active>
          Dashboard
        </SidebarItem>
        <SidebarItem href="/settings">Settings</SidebarItem>
      </SidebarGroup>
      <SidebarFooter>
        <SidebarToggle />
      </SidebarFooter>
    </Sidebar>
  );
}

/** Controlled harness exposing the internal collapsed state. */
function ControlledFixture() {
  const [collapsed, setCollapsed, collapsedCtrl] = useControl(undefined, false);
  return (
    <>
      <Sidebar collapsed={collapsedCtrl}>
        <SidebarGroup title="Platform">
          <SidebarItem>Dashboard</SidebarItem>
        </SidebarGroup>
        <SidebarFooter>
          <SidebarToggle />
        </SidebarFooter>
      </Sidebar>
      <output data-testid="collapsed-state">{String(collapsed)}</output>
      <button type="button" onClick={() => setCollapsed((prev) => !prev)}>
        External flip
      </button>
    </>
  );
}

function rootAside() {
  return screen.getByRole('complementary');
}

describe('Sidebar', () => {
  it('renders a complementary landmark containing a navigation landmark', () => {
    render(<SidebarFixture />);
    const aside = rootAside();
    const nav = screen.getByRole('navigation');
    expect(aside).toContainElement(nav);
  });

  it('starts expanded and collapses via the toggle', async () => {
    const user = userEvent.setup();
    render(<SidebarFixture />);
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(rootAside()).toHaveAttribute('data-state', 'collapsed');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('expands again on a second toggle click', async () => {
    const user = userEvent.setup();
    render(<SidebarFixture />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('respects defaultCollapsed', () => {
    render(<SidebarFixture defaultCollapsed />);
    expect(rootAside()).toHaveAttribute('data-state', 'collapsed');
  });

  it('supports controlled collapsed state', async () => {
    const user = userEvent.setup();
    render(<ControlledFixture />);
    expect(screen.getByTestId('collapsed-state').textContent).toBe('false');

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByTestId('collapsed-state').textContent).toBe('true');
    expect(rootAside()).toHaveAttribute('data-state', 'collapsed');

    // An external write through the same control drives the sidebar back,
    // and re-reads the shared state.
    await user.click(screen.getByRole('button', { name: 'External flip' }));
    expect(screen.getByTestId('collapsed-state').textContent).toBe('false');
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');
  });

  it('shows item labels as tooltips when collapsed', async () => {
    const user = userEvent.setup();
    render(<SidebarFixture />);
    // Expanded: no tooltip wiring at all.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips.map((bubble) => bubble.textContent)).toEqual([
      'Dashboard',
      'Settings',
    ]);
    // Each tooltip describes its collapsed item's trigger wrapper.
    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboard.parentElement).toHaveAttribute('aria-describedby', tooltips[0]!.id);
  });

  it('marks the active item with aria-current and active styling', () => {
    render(<SidebarFixture />);
    const active = screen.getByRole('link', { name: 'Dashboard' });
    const inactive = screen.getByRole('link', { name: 'Settings' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(inactive).not.toHaveAttribute('aria-current');
    // Same className set minus the active variant class proves the active
    // style is applied without hardcoding Linaria hashes.
    expect(inactive.className).not.toBe(active.className);
  });

  it('treats aria-current="page" as active when no active prop is given', () => {
    render(
      <Sidebar>
        <SidebarGroup>
          <SidebarItem active>Explicit</SidebarItem>
          <SidebarItem aria-current="page">AriaDriven</SidebarItem>
          <SidebarItem aria-current="step">Step</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const anchorOf = (text: string) => screen.getByText(text).closest('a')!;
    expect(anchorOf('AriaDriven').className).toBe(anchorOf('Explicit').className);
    expect(anchorOf('Step').className).not.toBe(anchorOf('Explicit').className);
    expect(anchorOf('Step')).toHaveAttribute('aria-current', 'step');
  });

  it('renders the group title when expanded and hides it when collapsed', async () => {
    const user = userEvent.setup();
    render(<SidebarFixture />);
    expect(screen.getByText('Platform')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
  });

  it('renders the footer with the toggle controlling the nav landmark', () => {
    render(<SidebarFixture />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    const nav = screen.getByRole('navigation');
    expect(toggle).toHaveAttribute('aria-controls', nav.id);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps tab order: items first, then the footer toggle', async () => {
    const user = userEvent.setup();
    render(<SidebarFixture />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
  });

  it('passes native props through to the aside and items', () => {
    render(
      <Sidebar aria-label="Main navigation" data-testid="shell-sidebar">
        <SidebarGroup>
          <SidebarItem href="https://example.com" target="_blank" rel="noopener">
            External
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(
      screen.getByRole('complementary', { name: 'Main navigation' }),
    ).toHaveAttribute('data-testid', 'shell-sidebar');
    const anchor = screen.getByRole('link', { name: 'External' });
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener');
  });

  it('calls item onClick and keeps button semantics for placeholder hrefs', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<(_event: MouseEvent<HTMLAnchorElement>) => void>();
    render(
      <Sidebar>
        <SidebarGroup>
          <SidebarItem onClick={onClick}>Logout</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    await user.click(screen.getByRole('link', { name: 'Logout' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]![0].defaultPrevented).toBe(true);
  });

  it('does not intercept clicks on a real href', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    render(
      <Sidebar>
        <SidebarGroup>
          <SidebarItem
            href="/about"
            onClick={(event) => seen.push(event.defaultPrevented)}
          >
            About
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    await user.click(screen.getByRole('link', { name: 'About' }));
    // The event arrives un-prevented: the caller decides whether to
    // prevent the navigation (an SPA router Link does).
    expect(seen).toEqual([false]);
  });

  it('applies className to every compound part', () => {
    render(
      <Sidebar className="root-custom">
        <SidebarGroup title="Platform" className="group-custom">
          <SidebarItem className="item-custom">Dashboard</SidebarItem>
        </SidebarGroup>
        <SidebarFooter className="footer-custom">
          <SidebarToggle className="toggle-custom" />
        </SidebarFooter>
      </Sidebar>,
    );
    expect(rootAside()).toHaveClass('root-custom');
    expect(screen.getByText('Platform').parentElement).toHaveClass('group-custom');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('item-custom');
    expect(screen.getByRole('button', { name: 'Collapse sidebar' }).parentElement).toHaveClass(
      'footer-custom',
    );
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveClass(
      'toggle-custom',
    );
  });

  it('lets LocaleProvider override the toggle labels', () => {
    render(
      <LocaleProvider strings={{ sidebar: { expand: '展開', collapse: '收起' } }}>
        <SidebarFixture />
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: '收起' })).toBeInTheDocument();
  });

  it('throws when context-consuming parts are used outside Sidebar', () => {
    expect(() => render(<SidebarGroup title="Platform">Item</SidebarGroup>)).toThrow(
      'Sidebar compound components must be used within <Sidebar>',
    );
    expect(() => render(<SidebarItem>Item</SidebarItem>)).toThrow(
      'Sidebar compound components must be used within <Sidebar>',
    );
    expect(() => render(<SidebarToggle />)).toThrow(
      'Sidebar compound components must be used within <Sidebar>',
    );
    // SidebarFooter is pure layout: no sidebar context, renders standalone.
    expect(() => render(<SidebarFooter>Footer</SidebarFooter>)).not.toThrow();
  });

  it('has no axe violations while expanded', async () => {
    const { axe } = await import('jest-axe');
    render(<SidebarFixture />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations while collapsed', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<SidebarFixture defaultCollapsed />);
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
