import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type TableHeadProps = {
  className?: string;
  children: ReactNode;
};

const head = css`
  border-bottom: 2px solid var(--haze-color-border);

  & th {
    text-align: start;
    padding: var(--haze-space-2) var(--haze-space-3);
    font-weight: var(--haze-weight-semibold);
    color: var(--haze-color-text);
  }
`;

export default function TableHead({ className, children }: TableHeadProps) {
  return <thead x-class={[head, className]}>{children}</thead>;
}

export type { TableHeadProps };
