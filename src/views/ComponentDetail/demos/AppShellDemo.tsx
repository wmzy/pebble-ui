import { useControl } from 'react-use-control';

import { AppShell } from '@/lib/components/AppShell';
import { Button } from '@/lib/components/Button';
import { Sidebar, SidebarGroup, SidebarItem } from '@/lib/components/Sidebar';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, codeBlock } from '../styles';

const navItems = ['Dashboard', 'Orders', 'Customers', 'Settings'];

function DemoSidebar() {
  return (
    <Sidebar>
      <SidebarGroup title='Workspace'>
        {navItems.map((item, index) => (
          <SidebarItem key={item} active={index === 0}>
            {item}
          </SidebarItem>
        ))}
      </SidebarGroup>
    </Sidebar>
  );
}

// ─── AppShell ──────────────────────────────────────────────────
export default function AppShellDemo() {
  // Uncontrolled with an external read-back — the header button flips the
  // control, AppShell consumes the same control (the ControlOrValue idiom).
  const [collapsed, setCollapsed, collapsedCtrl] = useControl(undefined, false);

  return (
    <>
      <h1>AppShell</h1>
      <p className={intro}>
        The application frame: sticky header, collapsible sidebar, scrolling
        content and footer, laid out with CSS Grid and animated with motion
        tokens. Below 768px the sidebar becomes an overlay panel — pure CSS,
        no JavaScript breakpoint.
      </p>

      <div className={section}>
        <h2>Complete shell</h2>
        <p className={row}>
          Collapse the sidebar with the button (or pass{' '}
          <code>sidebarCollapsed</code> as a Control — the usual{' '}
          <code>ControlOrValue</code> protocol).
        </p>
        <div
          className={row}
          style={{ height: 420, border: '1px solid var(--haze-color-border)' }}
        >
          <AppShell
            sidebarCollapsed={collapsedCtrl}
            header={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--haze-space-2)',
                  padding: '0 var(--haze-space-3)',
                }}
              >
                <strong>Haze Console</strong>
                <span style={{ flex: 1 }} />
                <Button size='sm' variant='outline' onClick={() => setCollapsed((v) => !v)}>
                  {collapsed ? 'Expand' : 'Collapse'}
                </Button>
              </div>
            }
            sidebar={<DemoSidebar />}
            footer={
              <div style={{ padding: 'var(--haze-space-2) var(--haze-space-3)' }}>
                © 2026 — footer slot
              </div>
            }
          >
            <div style={{ padding: 'var(--haze-space-3)' }}>
              <p>
                Content lives in a <code>&lt;main&gt;</code> landmark and takes
                the remaining grid cell. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Resize the browser below 768px —
                the sidebar turns into an overlay that slides away when
                collapsed.
              </p>
              <p>
                More content to make the area scroll. Lorem ipsum dolor sit
                amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </AppShell>
        </div>
        <pre className={codeBlock}>
          {`<AppShell
  sidebarCollapsed={collapsed}
  header={<HeaderBar />}
  sidebar={<NavSidebar />}
  footer={<FooterBar />}
>
  {content}
</AppShell>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Slots are optional</h2>
        <p className={row}>
          Without a sidebar the shell collapses to header / content / footer
          rows; omit any slot and its landmark (header / aside / footer) is not
          rendered.
        </p>
        <pre className={codeBlock}>
          {`<AppShell header={<HeaderBar />}>{content}</AppShell>`}
        </pre>
      </div>

      <div className={section}>
        <h2>AppShell Props</h2>
        <PropsTable of='AppShellProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Slots render into landmarks: header → <strong>&lt;header&gt;</strong>
              , sidebar → <strong>&lt;aside&gt;</strong>, content →{' '}
              <strong>&lt;main&gt;</strong>, footer →{' '}
              <strong>&lt;footer&gt;</strong>
            </li>
            <li>
              <code>sidebarCollapsed</code> accepts the full{' '}
              <code>ControlOrValue&lt;boolean&gt;</code> protocol
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
