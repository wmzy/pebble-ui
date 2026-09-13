import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ListItemProps = {
  className?: string;
  children: ReactNode;
};

const item = css`
  padding: var(--haze-space-1) 0;
`;

export default function ListItem({ className, children }: ListItemProps) {
  return <li data-slot="item" x-class={[item, className]}>{children}</li>;
}

export type { ListItemProps };
