import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type MenuItemProps = {
  onSelect?: () => void;
  disabled?: boolean;
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
  className,
  children,
}: MenuItemProps) {
  return (
    <button
      type='button'
      role='menuitem'
      tabIndex={-1}
      x-class={[item, className]}
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export type { MenuItemProps };
