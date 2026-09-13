import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

type KbdProps = {
  size?: 'sm' | 'md';
} & Omit<ComponentPropsWithoutRef<'kbd'>, 'size'>;

const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  /* Thicker bottom edge reads as a raised key cap. */
  border-bottom-width: 2px;
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text);
  font-family: var(--haze-font-mono);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  white-space: nowrap;
  box-shadow: var(--haze-shadow-sm);
`;

const sizes = {
  sm: css`
    font-size: var(--haze-text-xs);
  `,
  md: css`
    font-size: var(--haze-text-sm);
  `,
} as const;

export default function Kbd({ size = 'md', className, ...rest }: KbdProps) {
  return <kbd data-slot="kbd" x-class={[base, sizes[size], className]} {...rest} />;
}

export type { KbdProps };
