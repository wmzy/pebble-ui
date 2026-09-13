import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type TagProps = {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
};

const base = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  white-space: nowrap;
`;

const variants = {
  default: css`
    background: var(--haze-color-bg-muted);
    color: var(--haze-color-text-secondary);
  `,
  primary: css`
    background: var(--haze-color-primary-subtle);
    color: var(--haze-color-primary);
  `,
  success: css`
    background: var(--haze-color-success-subtle);
    color: var(--haze-color-success);
  `,
  warning: css`
    background: var(--haze-color-warning-subtle);
    color: var(--haze-color-warning);
  `,
  danger: css`
    background: var(--haze-color-danger-subtle);
    color: var(--haze-color-danger);
  `,
} as const;

const tagSizes = {
  sm: css`
    padding: var(--haze-space-0) var(--haze-space-2);
    font-size: var(--haze-text-xs);
  `,
  md: css`
    padding: var(--haze-space-1) var(--haze-space-3);
    font-size: var(--haze-text-sm);
  `,
} as const;

const closeBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  line-height: 1;
  opacity: 0.6;
  transition: opacity var(--haze-duration-fast);
  display: inline-flex;
  align-items: center;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    border-radius: var(--haze-radius-sm);
  }
`;

export default function Tag({
  variant = 'default',
  size = 'md',
  closable = false,
  onClose,
  className,
  children,
}: TagProps) {
  const strings = useStrings('tag');
  return (
    <span data-slot="tag" x-class={[base, variants[variant], tagSizes[size], className]}>
      {children}
      {closable && (
        <button
          data-slot="remove-button"
          type='button'
          className={closeBtn}
          aria-label={strings.remove}
          onClick={onClose}
        >
          ×
        </button>
      )}
    </span>
  );
}

export type { TagProps };
