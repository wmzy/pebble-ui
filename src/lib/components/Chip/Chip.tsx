import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ChipProps = {
  variant?: 'solid' | 'outline';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
};

const base = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  border-radius: var(--haze-radius-full);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  white-space: nowrap;
  line-height: 1;
  padding: var(--haze-space-1) var(--haze-space-3);
`;

const solidColors = {
  default: css`background: var(--haze-color-bg-muted); color: var(--haze-color-text-secondary);`,
  primary: css`background: var(--haze-color-primary-subtle); color: var(--haze-color-primary);`,
  success: css`background: var(--haze-color-success-subtle); color: var(--haze-color-success);`,
  warning: css`background: var(--haze-color-warning-subtle); color: var(--haze-color-warning);`,
  danger: css`background: var(--haze-color-danger-subtle); color: var(--haze-color-danger);`,
} as const;

const outlineColors = {
  default: css`border: 1px solid var(--haze-color-border); color: var(--haze-color-text-secondary);`,
  primary: css`border: 1px solid var(--haze-color-primary); color: var(--haze-color-primary);`,
  success: css`border: 1px solid var(--haze-color-success); color: var(--haze-color-success);`,
  warning: css`border: 1px solid var(--haze-color-warning); color: var(--haze-color-warning);`,
  danger: css`border: 1px solid var(--haze-color-danger); color: var(--haze-color-danger);`,
} as const;

const iconStyle = css`
  display: inline-flex;
  align-items: center;
`;

const closeBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: var(--haze-radius-full);
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: opacity var(--haze-duration-fast);
  margin-inline-start: var(--haze-space-1);

  &:hover {
    opacity: 1;
  }
`;

export default function Chip({
  variant = 'solid',
  color = 'default',
  icon,
  onClose,
  className,
  children,
}: ChipProps) {
  const strings = useStrings('chip');
  const colorClass = variant === 'outline' ? outlineColors[color] : solidColors[color];

  return (
    <span x-class={[base, colorClass, className]}>
      {icon && <span x-class={[iconStyle]}>{icon}</span>}
      {children}
      {onClose && (
        <button type="button" x-class={[closeBtn]} onClick={onClose} aria-label={strings.remove}>
          ×
        </button>
      )}
    </span>
  );
}

export type { ChipProps };
