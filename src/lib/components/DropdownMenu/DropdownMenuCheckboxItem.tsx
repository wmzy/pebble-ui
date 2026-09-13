import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import {
  dropdownMenuItemDanger,
  dropdownMenuItemIcon,
  dropdownMenuItemIndicator,
  dropdownMenuItemKbd,
} from './dropdown-menu-item-styles';

type DropdownMenuCheckboxItemProps = {
  /** Whether the option is checked — controlled control or uncontrolled initial value. */
  checked?: ControlOrValue<boolean>;
  /** Fires on every toggle, whatever drove it (click, Enter, Space). */
  onCheckedChange?: (checked: boolean) => void;
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

// DropdownMenuItem's skin; the leading slot is the fixed-size check indicator.
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
 * A toggleable menu option (`role="menuitemcheckbox"`): click, Enter or
 * Space flips `checked`; the state is controllable through the standard
 * `ControlOrValue` prop. Toggling keeps the menu open — several options
 * are typically flipped in one visit (unlike a plain item, which
 * closes the menu on activation).
 */
export default function DropdownMenuCheckboxItem({
  checked: checkedControl,
  onCheckedChange,
  disabled = false,
  danger = false,
  icon,
  kbdLabel,
  className,
  children,
}: DropdownMenuCheckboxItemProps) {
  const [checked, setChecked] = useControl(checkedControl, false);

  return (
    <button
      x-class={[item, danger && dropdownMenuItemDanger, className]}
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={-1}
      disabled={disabled}
      onClick={() => {
        const next = !checked;
        setChecked(next);
        onCheckedChange?.(next);
      }}
    >
      <span x-class={dropdownMenuItemIndicator} aria-hidden="true">
        {checked && (
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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

export type { DropdownMenuCheckboxItemProps };
