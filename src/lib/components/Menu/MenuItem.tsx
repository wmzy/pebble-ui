import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { menuItemDanger, menuItemIcon, menuItemKbd } from './menu-item-styles';

type MenuItemProps = {
  onSelect?: () => void;
  disabled?: boolean;
  /** Danger skin for destructive actions: danger-colored text and interaction states. */
  danger?: boolean;
  /** Inline-start icon slot; bare `svg` children are sized to 1em by the slot. */
  icon?: ReactNode;
  /** Inline-end shortcut hint (e.g. '⌘C'), muted and pushed to the item's end. */
  kbdLabel?: ReactNode;
  className?: string;
  children: ReactNode;
};

const item = css`
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--haze-space-2) var(--haze-space-3);
  border: none;
  background: transparent;
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  text-align: start;
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    background: var(--haze-color-bg-subtle);
    box-shadow: inset 0 0 0 2px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function MenuItem({
  onSelect,
  disabled = false,
  danger = false,
  icon,
  kbdLabel,
  className,
  children,
}: MenuItemProps) {
  return (
    <button
      type='button'
      role='menuitem'
      tabIndex={-1}
      x-class={[item, danger && menuItemDanger, className]}
      disabled={disabled}
      onClick={onSelect}
    >
      {icon !== undefined && <span x-class={menuItemIcon}>{icon}</span>}
      {children}
      {kbdLabel !== undefined && (
        <span x-class={menuItemKbd} aria-hidden='true'>{kbdLabel}</span>
      )}
    </button>
  );
}

export type { MenuItemProps };
