import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import AppShell from './AppShell';

function ShellFixture() {
  return (
    <AppShell
      header={<a href="/">Home</a>}
      sidebar={<ul><li><a href="/dashboard">Dashboard</a></li></ul>}
      footer={<p>Footer text</p>}
    >
      <h1>Page content</h1>
    </AppShell>
  );
}

/** Controlled harness exposing the collapsed state, like a hamburger button would. */
function ControlledFixture() {
  const [collapsed, setCollapsed, collapsedCtrl] = useControl(undefined, false);
  return (
    <>
      <AppShell sidebar={<a href="/settings">Settings</a>} sidebarCollapsed={collapsedCtrl}>
        Content
      </AppShell>
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

function rootMain() {
  return screen.getByRole('main');
}

describe('AppShell', () => {
  it('renders every slot in its landmark region', () => {
    render(<ShellFixture />);
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('link', { name: 'Home' })
    );
    expect(rootAside()).toContainElement(
      screen.getByRole('link', { name: 'Dashboard' })
    );
    expect(screen.getByRole('contentinfo')).toContainElement(
      screen.getByText('Footer text')
    );
    expect(rootMain()).toContainElement(screen.getByRole('heading', { name: 'Page content' }));
  });

  it('omits the landmark entirely when a slot is not provided', () => {
    render(<AppShell>Content</AppShell>);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Content');
  });

  it('defaults the sidebar to expanded', () => {
    render(<ShellFixture />);
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');
  });

  it('accepts a plain boolean as the uncontrolled initial collapsed value', () => {
    render(
      <AppShell sidebar={<a href="/x">X</a>} sidebarCollapsed>
        Content
      </AppShell>
    );
    expect(rootAside()).toHaveAttribute('data-state', 'collapsed');
  });

  it('applies a custom sidebarWidth as the width custom property', () => {
    render(
      <AppShell sidebar={<a href="/x">X</a>} sidebarWidth="var(--haze-space-12)">
        Content
      </AppShell>
    );
    const root = screen.getByRole('main').parentElement!;
    expect(root.style.getPropertyValue('--haze-appshell-sidebar-width')).toBe(
      'var(--haze-space-12)'
    );
  });

  it('supports controlled collapsed state', async () => {
    const user = userEvent.setup();
    render(<ControlledFixture />);
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');

    await user.click(screen.getByRole('button', { name: 'External flip' }));
    expect(screen.getByTestId('collapsed-state').textContent).toBe('true');
    expect(rootAside()).toHaveAttribute('data-state', 'collapsed');

    await user.click(screen.getByRole('button', { name: 'External flip' }));
    expect(screen.getByTestId('collapsed-state').textContent).toBe('false');
    expect(rootAside()).toHaveAttribute('data-state', 'expanded');
  });

  it('merges className onto the shell root', () => {
    render(
      <AppShell className="custom-shell" data-testid="shell">
        Content
      </AppShell>
    );
    expect(screen.getByTestId('shell')).toHaveClass('custom-shell');
  });

  it('merges a consumer style prop with the internal width variable', () => {
    render(
      <AppShell sidebar={<a href="/x">X</a>} style={{ minHeight: '50vh' }} data-testid="shell">
        Content
      </AppShell>
    );
    const root = screen.getByTestId('shell');
    expect(root.style.minHeight).toBe('50vh');
    expect(root.style.getPropertyValue('--haze-appshell-sidebar-width')).toBe(
      'calc(var(--haze-space-16) * 4)'
    );
  });

  it('forwards native div props to the shell root', () => {
    render(<AppShell data-testid="shell" id="app">Content</AppShell>);
    expect(screen.getByTestId('shell')).toHaveAttribute('id', 'app');
  });

  it('has no axe violations with all slots', async () => {
    const { axe } = await import('jest-axe');
    render(<ShellFixture />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations while collapsed', async () => {
    const { axe } = await import('jest-axe');
    render(
      <AppShell
        header={<a href="/">Home</a>}
        sidebar={<ul><li><a href="/dashboard">Dashboard</a></li></ul>}
        footer={<p>Footer text</p>}
        sidebarCollapsed
      >
        <h1>Page content</h1>
      </AppShell>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
