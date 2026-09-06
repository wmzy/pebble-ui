import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ContainerProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  className?: string;
};

const container = css`
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--haze-space-4);
  font-family: var(--haze-font-sans);
`;

const sizes: Record<string, string> = {
  sm: css`max-width: 640px;`,
  md: css`max-width: 768px;`,
  lg: css`max-width: 1024px;`,
  xl: css`max-width: 1280px;`,
  full: css`max-width: 100%;`,
};

export default function Container({ size = 'lg', children, className }: ContainerProps) {
  return (
    <div x-class={[container, sizes[size], className]}>
      {children}
    </div>
  );
}

export type { ContainerProps };
