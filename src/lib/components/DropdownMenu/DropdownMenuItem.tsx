import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useDropdownMenuContext } from './DropdownMenuContext';

import {
  dropdownMenuItemDanger,
  dropdownMenuItemIcon,
  dropdownMenuItemKbd,
} from './dropdown-menu-item-styles';

type DropdownMenuItemProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Danger skin for destructive actions: danger-colored text and interaction states. */
  danger?: boolean;
  /** Inline-start icon slot; bare `svg` children are sized to 1em by the slot. */
  icon?: ReactNode;
  /** Inline-end shortcut hint (e.g. '⌘C'), muted and pushed to the item's end. */
  kbdLabel?: ReactNode;
  className?: string;
};

const item = css`
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--haze-space-2) var(--haze-space-3);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  border-radius: var(--haze-radius-sm);
  text-align: start;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-muted);
  }

  &:active {
    background: var(--haze-color-bg-subtle);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function DropdownMenuItem({
  children,
  onClick,
  disabled,
  danger = false,
  icon,
  kbdLabel,
  className,
}: DropdownMenuItemProps) {
  const { setOpen, triggerRef } = useDropdownMenuContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
    // The menu unmounts on close; without this, keyboard focus (which is
    // on this item) would drop to <body>.
    triggerRef.current?.focus();
  };

  return (
    <button
      data-slot='menu-item'
      x-class={[item, danger && dropdownMenuItemDanger, className]}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon !== undefined && <span data-slot='icon' x-class={dropdownMenuItemIcon}>{icon}</span>}
      {children}
      {kbdLabel !== undefined && (
        <span data-slot='kbd' x-class={dropdownMenuItemKbd} aria-hidden="true">{kbdLabel}</span>
      )}
    </button>
  );
}

export type { DropdownMenuItemProps };
