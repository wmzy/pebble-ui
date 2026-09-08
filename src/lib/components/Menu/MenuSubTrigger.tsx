import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useSubmenuContext } from '../../utils/submenu';

type MenuSubTriggerProps = {
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

// MenuItem's skin plus the submenu affordances: an inline-end chevron
// and a persistent highlight while the submenu is open.
const trigger = css`
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
 * The menuitem that opens a MenuSub submenu: hover opens it after a
 * short intent delay, click toggles, and the inline-end arrow (ArrowRight
 * in LTR, ArrowLeft under `dir="rtl"`) opens it with focus on its first
 * item.
 */
export default function MenuSubTrigger({
  disabled = false,
  className,
  children,
}: MenuSubTriggerProps) {
  const sub = useSubmenuContext();
  return (
    <button
      ref={sub.triggerRef}
      type='button'
      role='menuitem'
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

export type { MenuSubTriggerProps };
