import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useSubmenuContext } from '../../utils/submenu';

type DropdownMenuSubTriggerProps = {
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

// DropdownMenuItem's skin plus the submenu affordances: an inline-end
// chevron and a persistent highlight while the submenu is open.
const trigger = css`
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

  &::after {
    content: '›';
    margin-inline-start: auto;
    color: var(--haze-color-text-muted);
  }

  [dir='rtl'] &::after {
    content: '‹';
  }

  &:hover,
  &[aria-expanded='true'] {
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
 * The menuitem that opens a DropdownMenuSub submenu: hover opens it after
 * a short intent delay, click toggles, and the inline-end arrow
 * (ArrowRight in LTR, ArrowLeft under `dir="rtl"`) opens it with focus on
 * its first item.
 */
export default function DropdownMenuSubTrigger({
  disabled = false,
  className,
  children,
}: DropdownMenuSubTriggerProps) {
  const sub = useSubmenuContext();
  return (
    <button
      ref={sub.triggerRef}
      type='button'
      role='menuitem'
      data-slot='menu-sub-trigger'
      tabIndex={-1}
      aria-haspopup='menu'
      aria-expanded={sub.open}
      aria-owns={sub.open ? sub.contentId : undefined}
      disabled={disabled}
      x-class={[trigger, className]}
      style={sub.floating.triggerStyle}
      onPointerDown={sub.floating.onTriggerPointerDown}
      onPointerEnter={sub.onTriggerPointerEnter}
      onClick={sub.floating.onTriggerClick}
      onKeyDown={sub.handleTriggerKeyDown}
    >
      {children}
    </button>
  );
}

export type { DropdownMenuSubTriggerProps };
