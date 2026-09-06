import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useDropdownMenuContext } from './DropdownMenuContext';

type DropdownMenuItemProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
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
  transition: background 0.15s;

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

export default function DropdownMenuItem({ children, onClick, disabled, className }: DropdownMenuItemProps) {
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
      x-class={[item, className]}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export type { DropdownMenuItemProps };
