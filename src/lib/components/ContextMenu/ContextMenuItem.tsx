import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useContextMenuContext } from './ContextMenuContext';

type ContextMenuItemProps = {
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

export default function ContextMenuItem({ children, onClick, disabled, className }: ContextMenuItemProps) {
  const { setOpen } = useContextMenuContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
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

export type { ContextMenuItemProps };
