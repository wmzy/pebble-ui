import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useMenuRadioItem } from '../../utils/menuRadio';

import { menuItemDanger, menuItemIcon, menuItemIndicator, menuItemKbd } from './menu-item-styles';

type MenuRadioItemProps = {
  /** Value this option selects in its MenuRadioGroup when activated. */
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

// MenuItem's skin; the leading slot is the fixed-size selection dot.
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

/**
 * One option of a MenuRadioGroup (`role="menuitemradio"`): activating
 * it (click, Enter, Space) selects its `value` in the group — the
 * previously selected sibling deselects. Must live inside a
 * `MenuRadioGroup`.
 */
export default function MenuRadioItem({
  value,
  disabled = false,
  danger = false,
  icon,
  kbdLabel,
  className,
  children,
}: MenuRadioItemProps) {
  const { checked, select } = useMenuRadioItem(value);

  return (
    <button
      type='button'
      role='menuitemradio'
      aria-checked={checked}
      tabIndex={-1}
      x-class={[item, danger && menuItemDanger, className]}
      disabled={disabled}
      onClick={select}
    >
      <span x-class={menuItemIndicator} aria-hidden='true'>
        {checked && (
          <svg width='1em' height='1em' viewBox='0 0 16 16' fill='none'>
            <circle cx='8' cy='8' r='3.5' fill='currentColor' />
          </svg>
        )}
      </span>
      {icon !== undefined && <span x-class={menuItemIcon}>{icon}</span>}
      {children}
      {kbdLabel !== undefined && (
        <span x-class={menuItemKbd} aria-hidden='true'>{kbdLabel}</span>
      )}
    </button>
  );
}

export type { MenuRadioItemProps };
