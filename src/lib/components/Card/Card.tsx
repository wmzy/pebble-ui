import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type CardProps = {
  variant?: 'elevated' | 'outlined' | 'filled';
  className?: string;
  children: ReactNode;
};

const base = css`
  border-radius: var(--haze-radius-lg);
  padding: var(--haze-space-5);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
`;

const variants = {
  elevated: css`
    background: var(--haze-color-bg);
    box-shadow: var(--haze-shadow-md);
  `,
  outlined: css`
    background: var(--haze-color-bg);
    border: 1px solid var(--haze-color-border);
  `,
  filled: css`
    background: var(--haze-color-bg-subtle);
  `,
} as const;

export default function Card({
  variant = 'elevated',
  className,
  children,
}: CardProps) {
  return <div data-slot="card" x-class={[base, variants[variant], className]}>{children}</div>;
}

export type { CardProps };
