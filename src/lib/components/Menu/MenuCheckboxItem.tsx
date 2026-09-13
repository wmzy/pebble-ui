import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { menuItemDanger, menuItemIcon, menuItemIndicator, menuItemKbd } from './menu-item-styles';

type MenuCheckboxItemProps = {
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

// MenuItem's skin; the leading slot is the fixed-size check indicator.
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

  /* Forced-colors: the inset focus ring is a box-shadow — dropped by
     the UA — and the subtle background flattens onto Canvas, so the
     keyboard-focused item would vanish. An inset Highlight outline
     restores the focus indication (the check glyph itself draws in
     CanvasText through currentColor). */
  @media (forced-colors: active) {
    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * A toggleable menu option (`role="menuitemcheckbox"`): click, Enter or
 * Space flips `checked`; the state is controllable through the standard
 * `ControlOrValue` prop. Unlike a plain item, toggling does not close
 * the menu — several options are typically flipped in one visit.
 */
export default function MenuCheckboxItem({
  checked: checkedControl,
  onCheckedChange,
  disabled = false,
  danger = false,
  icon,
  kbdLabel,
  className,
  children,
}: MenuCheckboxItemProps) {
  const [checked, setChecked] = useControl(checkedControl, false);

  return (
    <button
      type='button'
      role='menuitemcheckbox'
      data-slot='menu-checkbox-item'
      aria-checked={checked}
      tabIndex={-1}
      x-class={[item, danger && menuItemDanger, className]}
      disabled={disabled}
      onClick={() => {
        const next = !checked;
        setChecked(next);
        onCheckedChange?.(next);
      }}
    >
      <span data-slot='indicator' x-class={menuItemIndicator} aria-hidden='true'>
        {checked && (
          <svg width='1em' height='1em' viewBox='0 0 16 16' fill='none'>
            <path
              d='M3.5 8.5 6.5 11.5 12.5 4.5'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        )}
      </span>
      {icon !== undefined && <span data-slot='icon' x-class={menuItemIcon}>{icon}</span>}
      {children}
      {kbdLabel !== undefined && (
        <span data-slot='kbd' x-class={menuItemKbd} aria-hidden='true'>{kbdLabel}</span>
      )}
    </button>
  );
}

export type { MenuCheckboxItemProps };
