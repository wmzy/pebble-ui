import { css } from '@linaria/core';
import { useControl } from 'react-use-control';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  SidebarToggle,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, codeBlock } from '../styles';

// ─── Sidebar ────────────────────────────────────────────────────
const shell = css`
  display: flex;
  height: 320px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  overflow: hidden;
`;

const main = css`
  flex: 1;
  min-width: 0;
  padding: var(--haze-space-4);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

export default function SidebarDemo() {
  // Uncontrolled with an external read-back: the toggle inside the footer
  // drives the collapsed state, the output mirrors it.
  const [collapsed, , collapsedCtrl] = useControl(undefined, false);

  return (
    <>
      <h1>Sidebar</h1>
      <p className={intro}>
        App-shell side navigation with grouped links, a footer slot, and a
        collapsible icon-rail mode.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={shell}>
          <Sidebar collapsed={collapsedCtrl}>
            <SidebarGroup title="Platform">
              <SidebarItem icon={<Home size={18} />} href="#" active>
                Dashboard
              </SidebarItem>
              <SidebarItem icon={<BarChart3 size={18} />} href="#">
                Analytics
              </SidebarItem>
              <SidebarItem icon={<FileText size={18} />} href="#">
                Documents
              </SidebarItem>
            </SidebarGroup>
            <SidebarGroup title="Workspace">
              <SidebarItem icon={<Users size={18} />} href="#">
                Team
              </SidebarItem>
              <SidebarItem icon={<Settings size={18} />} href="#">
                Settings
              </SidebarItem>
            </SidebarGroup>
            <SidebarFooter>
              <SidebarItem icon={<HelpCircle size={18} />} href="#">
                Help &amp; Support
              </SidebarItem>
              <SidebarToggle />
            </SidebarFooter>
          </Sidebar>
          <div className={main}>
            Main content — collapse the sidebar with the chevron in the footer
            (labels become tooltips).
            <br />
            <br />
            <code>collapsed: {String(collapsed)}</code>
          </div>
        </div>
      </div>

      <div className={section}>
        <h2>Usage</h2>
        <pre className={codeBlock}>{`import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  SidebarToggle,
} from 'haze-ui';

<Sidebar defaultCollapsed={false}>
  <SidebarGroup title="Platform">
    <SidebarItem icon={<Home size={18} />} active>Dashboard</SidebarItem>
  </SidebarGroup>
  <SidebarFooter>
    <SidebarToggle />
  </SidebarFooter>
</Sidebar>

// Theme the two rail widths via CSS custom properties:
// :root { --haze-sidebar-width: 16rem; --haze-sidebar-width-collapsed: 3.5rem; }`}</pre>
      </div>

      <div className={section}>
        <h2>Sidebar Props</h2>
        <PropsTable of='SidebarProps' />
      </div>

      <div className={section}>
        <h2>SidebarGroup Props</h2>
        <PropsTable of='SidebarGroupProps' />
      </div>

      <div className={section}>
        <h2>SidebarItem Props</h2>
        <PropsTable of='SidebarItemProps' />
      </div>

      <div className={section}>
        <h2>SidebarFooter Props</h2>
        <PropsTable of='SidebarFooterProps' />
      </div>

      <div className={section}>
        <h2>SidebarToggle Props</h2>
        <PropsTable of='SidebarToggleProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders an <strong>&lt;aside&gt;</strong> landmark wrapping a <strong>&lt;nav&gt;</strong> landmark</li>
            <li>Collapsed items keep their accessible names: labels are visually hidden (clip), and hovering/focusing an item shows its label as a tooltip</li>
            <li>Active item carries <strong>aria-current=&quot;page&quot;</strong> (explicit <code>active</code> prop or the router-driven aria attribute)</li>
            <li>The toggle announces <strong>aria-expanded</strong> and controls the nav via <strong>aria-controls</strong>; its label comes from <code>useStrings(&apos;sidebar&apos;)</code> (<code>sidebar.expand</code> / <code>sidebar.collapse</code>, overridable via <code>LocaleProvider</code>)</li>
            <li>Layout uses logical CSS properties, so the rail flips correctly in RTL</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
