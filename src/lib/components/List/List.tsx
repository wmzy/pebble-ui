import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ListProps = {
  variant?: 'unordered' | 'ordered' | 'none';
  className?: string;
  children: ReactNode;
};

const base = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
  margin: 0;
  padding-inline-start: var(--haze-space-5);
`;

const variantStyles = {
  unordered: css`
    list-style-type: disc;
  `,
  ordered: css`
    list-style-type: decimal;
  `,
  none: css`
    list-style-type: none;
    padding-inline-start: 0;
  `,
} as const;

export default function List({
  variant = 'unordered',
  className,
  children,
}: ListProps) {
  const Tag = variant === 'ordered' ? 'ol' : 'ul';

  return (
    <Tag x-class={[base, variantStyles[variant], className]}>{children}</Tag>
  );
}

export type { ListProps };
