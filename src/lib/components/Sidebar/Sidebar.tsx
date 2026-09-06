import type {
  ComponentPropsWithoutRef,
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { createContext, forwardRef, useContext, useId } from 'react';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';
import { Tooltip } from '../Tooltip';

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  /** id of the inner nav landmark — the toggle's aria-controls target. */
  navId: string;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('Sidebar compound components must be used within <Sidebar>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Sidebar (root)
// ---------------------------------------------------------------------------

type SidebarProps = {
  /** Collapsed state: a plain boolean for controlled usage, a Control for uncontrolled, or omitted. */
  collapsed?: ControlOrValue<boolean>;
  /** Initial collapsed state in uncontrolled mode. */
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'aside'>, 'children'>;

const sidebar = css`
  display: flex;
  flex-direction: column;
  /* Two-step width, token-ized: consumers theme the rail by overriding
   * these custom properties on the root (or a theme class). */
  width: var(--haze-sidebar-width, 16rem);
  height: 100%;
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  border-inline-end: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
  overflow: hidden;
  transition: width var(--haze-duration-normal) var(--haze-ease);

  &[data-state='collapsed'] {
    width: var(--haze-sidebar-width-collapsed, 3.5rem);
  }
`;

const nav = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-4);
  padding: var(--haze-space-3);
  overflow-y: auto;
  overflow-x: hidden;
`;

export default function Sidebar({
  collapsed: collapsedControl,
  defaultCollapsed = false,
  className,
  children,
  ...rest
}: SidebarProps) {
  const [collapsed, setCollapsed] = useControl(collapsedControl, defaultCollapsed);
  const navId = useId();

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, navId }}>
      <aside
        x-class={[sidebar, className]}
        data-state={collapsed ? 'collapsed' : 'expanded'}
        {...rest}
      >
        <nav id={navId} x-class={nav}>
          {children}
        </nav>
      </aside>
    </SidebarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SidebarGroup
// ---------------------------------------------------------------------------

type SidebarGroupProps = {
  /** Muted group heading, hidden entirely while collapsed. */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'>;

const group = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
`;

const groupTitle = css`
  padding: var(--haze-space-2);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export function SidebarGroup({ title, className, children, ...rest }: SidebarGroupProps) {
  const { collapsed } = useSidebarContext();

  return (
    <div x-class={[group, className]} {...rest}>
      {title && !collapsed && <div x-class={groupTitle}>{title}</div>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarItem
// ---------------------------------------------------------------------------

type SidebarItemProps = {
  /** Leading icon; rendered inside a fixed-size, aria-hidden slot. */
  icon?: ReactNode;
  /**
   * Explicit active state. Falls back to `aria-current="page"` when
   * omitted, letting routers drive highlighting through the aria attribute.
   */
  active?: boolean;
  children: ReactNode;
  /**
   * Native click handler: receives the underlying mouse event. Whether to
   * call `event.preventDefault()` is up to the caller, except for
   * placeholder hrefs where SidebarItem keeps button semantics.
   */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'a'>, 'children' | 'onClick' | 'className'>;

const item = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  min-width: 0;
  padding: var(--haze-space-2);
  border-radius: var(--haze-radius-md);
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--haze-duration-fast) var(--haze-ease),
    background var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  /* Icon mode: the Tooltip wrapper span blockifies into a row flex item;
   * fill it and center the icon instead of stacking icon + hidden label. */
  [data-state='collapsed'] & {
    flex: 1;
    justify-content: center;
    padding-inline: 0;
  }
`;

const itemActive = css`
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
  background: var(--haze-color-primary-subtle);

  &:hover {
    color: var(--haze-color-primary);
    background: var(--haze-color-primary-subtle);
  }
`;

const itemIcon = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;

  & > svg {
    width: 100%;
    height: 100%;
  }
`;

const itemLabel = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  /* Collapsed: visually hidden but kept in the accessibility tree so the
   * anchor never loses its accessible name — the Tooltip covers sighted
   * pointer/keyboard users, the clipped span covers screen readers. The
   * clip recipe is direction-agnostic (RTL-safe). */
  [data-state='collapsed'] & {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  function SidebarItem(
    {
      icon,
      active,
      href = '#',
      onClick,
      className,
      children,
      'aria-current': ariaCurrent,
      ...rest
    },
    ref,
  ) {
    const { collapsed } = useSidebarContext();
    const isActive = active ?? ariaCurrent === 'page';

    const anchor = (
      <a
        ref={ref}
        x-class={[item, isActive && itemActive, className]}
        href={href}
        aria-current={isActive ? 'page' : ariaCurrent}
        onClick={(event) => {
          // A missing or '#' href means button semantics: keep the
          // default suppressed so the page does not jump to '#'.
          if (href === '#') {
            event.preventDefault();
          }
          onClick?.(event);
        }}
        {...rest}
      >
        {icon && (
          <span x-class={itemIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span x-class={itemLabel}>{children}</span>
      </a>
    );

    if (!collapsed) return anchor;

    /* Physical placement follows the repo floating convention (RTL apps
     * mirror the rail and would pass the mirrored side themselves when
     * composing Tooltip directly). */
    return (
      <Tooltip content={children} position="right">
        {anchor}
      </Tooltip>
    );
  },
);

// ---------------------------------------------------------------------------
// SidebarFooter
// ---------------------------------------------------------------------------

type SidebarFooterProps = {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const footer = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  padding: var(--haze-space-3);
  border-block-start: 1px solid var(--haze-color-border);
`;

export function SidebarFooter({ className, children, ...rest }: SidebarFooterProps) {
  return (
    <div x-class={[footer, className]} {...rest}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarToggle
// ---------------------------------------------------------------------------

type SidebarToggleProps = {
  /** Native click handler, invoked after the built-in collapse flip. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'onClick' | 'className'>;

const toggle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  width: var(--haze-space-8);
  height: var(--haze-space-8);
  border: none;
  border-radius: var(--haze-radius-md);
  background: transparent;
  color: var(--haze-color-text-muted);
  cursor: pointer;
  transition:
    color var(--haze-duration-fast) var(--haze-ease),
    background var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const toggleIcon = css`
  width: 16px;
  height: 16px;
  transition: transform var(--haze-duration-fast) var(--haze-ease);

  [data-state='collapsed'] & {
    transform: rotate(180deg);
  }
`;

const ChevronTowardsStart = () => (
  <svg
    x-class={toggleIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export function SidebarToggle({ onClick, className, ...rest }: SidebarToggleProps) {
  const { collapsed, setCollapsed, navId } = useSidebarContext();
  const strings = useStrings('sidebar');

  return (
    <button
      type="button"
      x-class={[toggle, className]}
      aria-label={collapsed ? strings.expand : strings.collapse}
      aria-expanded={!collapsed}
      aria-controls={navId}
      onClick={(event) => {
        setCollapsed((prev) => !prev);
        onClick?.(event);
      }}
      {...rest}
    >
      <ChevronTowardsStart />
    </button>
  );
}

export type {
  SidebarProps,
  SidebarGroupProps,
  SidebarItemProps,
  SidebarFooterProps,
  SidebarToggleProps,
};
