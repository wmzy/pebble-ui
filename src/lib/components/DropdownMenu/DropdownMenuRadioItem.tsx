import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useMenuRadioItem } from '../../utils/menuRadio';

import {
  dropdownMenuItemDanger,
  dropdownMenuItemIcon,
  dropdownMenuItemIndicator,
  dropdownMenuItemKbd,
} from './dropdown-menu-item-styles';

type DropdownMenuRadioItemProps = {
  /** Value this option selects in its DropdownMenuRadioGroup when activated. */
  value: string;
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

// DropdownMenuItem's skin; the leading slot is the fixed-size selection dot.
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

/**
 * One option of a DropdownMenuRadioGroup (`role="menuitemradio"`):
 * activating it (click, Enter, Space) selects its `value` in the
 * group — the previously selected sibling deselects. Selecting keeps
 * the menu open. Must live inside a `DropdownMenuRadioGroup`.
 */
export default function DropdownMenuRadioItem({
  value,
  disabled = false,
  danger = false,
  icon,
  kbdLabel,
  className,
  children,
}: DropdownMenuRadioItemProps) {
  const { checked, select } = useMenuRadioItem(value);

  return (
    <button
      x-class={[item, danger && dropdownMenuItemDanger, className]}
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      disabled={disabled}
      onClick={select}
    >
      <span x-class={dropdownMenuItemIndicator} aria-hidden="true">
        {checked && (
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3.5" fill="currentColor" />
          </svg>
        )}
      </span>
      {icon !== undefined && <span x-class={dropdownMenuItemIcon}>{icon}</span>}
      {children}
      {kbdLabel !== undefined && (
        <span x-class={dropdownMenuItemKbd} aria-hidden="true">{kbdLabel}</span>
      )}
    </button>
  );
}

export type { DropdownMenuRadioItemProps };
