import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type TableBodyProps = {
  className?: string;
  children: ReactNode;
};

const body = css`
  & td {
    padding: var(--haze-space-2) var(--haze-space-3);
    border-bottom: 1px solid var(--haze-color-border);
    color: var(--haze-color-text-secondary);
  }
`;

export default function TableBody({ className, children }: TableBodyProps) {
  return <tbody data-slot="body" x-class={[body, className]}>{children}</tbody>;
}

export type { TableBodyProps };
