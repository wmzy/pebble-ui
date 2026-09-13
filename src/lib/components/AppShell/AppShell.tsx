import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

type AppShellProps = {
  /** Top region, rendered inside a sticky <header> spanning the full width. */
  header?: ReactNode;
  /** Side region, rendered inside an <aside> column left of the content. */
  sidebar?: ReactNode;
  /** Bottom region, rendered inside a <footer> spanning the full width. */
  footer?: ReactNode;
  /** Collapsed state of the sidebar column; a Control drives it live, a plain boolean is the uncontrolled initial value. */
  sidebarCollapsed?: ControlOrValue<boolean>;
  /** Expanded sidebar width, any CSS width. Consumers theme it by overriding --haze-appshell-sidebar-width instead of hardcoding. */
  sidebarWidth?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/* Breakpoint matches the docs site's MOBILE_QUERY; the media queries
 * below handle the sidebar overlay in pure CSS, no JS involved. */

const shell = css`
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'header'
    'content'
    'footer';
  min-height: 100vh;
  min-height: 100dvh;
`;

/* Only applied when a sidebar slot exists, so an empty sidebar column
 * never steals width from the content. */
const withSidebar = css`
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    'header header'
    'sidebar content'
    'footer footer';

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'header'
      'content'
      'footer';
  }
`;

const header = css`
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-3) var(--haze-space-4);
  background: var(--haze-color-bg);
  border-block-end: 1px solid var(--haze-color-border);
`;

const sidebar = css`
  grid-area: sidebar;
  width: var(--haze-appshell-sidebar-width, calc(var(--haze-space-16) * 4));
  min-height: 0;
  overflow: hidden;
  background: var(--haze-color-bg-subtle);

  /* Collapse narrows the rail (never display:none) so the width
   * transition below can animate both ways. */
  &[data-state='collapsed'] {
    width: var(--haze-appshell-sidebar-width-collapsed, var(--haze-space-16));
  }

  transition:
    width var(--haze-duration-normal) var(--haze-ease),
    transform var(--haze-duration-normal) var(--haze-ease);

  @media (max-width: 768px) {
    /* Small screens: the sidebar leaves the grid and overlays the content.
     * Collapsing keeps the overlay width and slides off-canvas, so the
     * transition is a pure transform. */
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 2;
    box-shadow: var(--haze-shadow-lg);

    &[data-state='collapsed'] {
      width: var(--haze-appshell-sidebar-width, calc(var(--haze-space-16) * 4));
      transform: translateX(-100%);
    }
  }
`;

const content = css`
  grid-area: content;
  /* Grid items refuse to shrink below their content by default; without
   * this a wide child stretches the shell wider than the viewport. */
  min-width: 0;
`;

const footer = css`
  grid-area: footer;
  padding: var(--haze-space-3) var(--haze-space-4);
  background: var(--haze-color-bg);
  border-block-start: 1px solid var(--haze-color-border);
`;

export default function AppShell({
  header: headerSlot,
  sidebar: sidebarSlot,
  footer: footerSlot,
  sidebarCollapsed: collapsedControl,
  sidebarWidth = 'calc(var(--haze-space-16) * 4)',
  className,
  style,
  children,
  ...rest
}: AppShellProps) {
  const [collapsed] = useControl(collapsedControl, false);

  return (
    <div
      data-slot="app-shell"
      x-class={[shell, sidebarSlot != null && withSidebar, className]}
      style={{ '--haze-appshell-sidebar-width': sidebarWidth, ...style } as CSSProperties}
      {...rest}
    >
      {headerSlot != null && <header data-slot="header" x-class={header}>{headerSlot}</header>}
      {sidebarSlot != null && (
        <aside
          data-slot="aside"
          x-class={sidebar}
          data-state={collapsed ? 'collapsed' : 'expanded'}
        >
          {sidebarSlot}
        </aside>
      )}
      <main data-slot="main" x-class={content}>{children}</main>
      {footerSlot != null && <footer data-slot="footer" x-class={footer}>{footerSlot}</footer>}
    </div>
  );
}

export type { AppShellProps };
