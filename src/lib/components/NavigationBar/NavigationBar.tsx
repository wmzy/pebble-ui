import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type NavigationBarProps = {
  brand?: ReactNode;
  children?: ReactNode;
  end?: ReactNode;
  className?: string;
};

const nav = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-4);
  padding: var(--haze-space-3) var(--haze-space-4);
  background: var(--haze-color-bg);
  border-bottom: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
`;

const brand = css`
  font-size: var(--haze-text-lg);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-text);
  text-decoration: none;
  white-space: nowrap;
`;

const links = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex: 1;
`;

const endSlot = css`
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
`;

export default function NavigationBar({ brand: brandNode, children, end, className }: NavigationBarProps) {
  return (
    <nav data-slot='navigation-bar' x-class={[nav, className]}>
      {brandNode && <div data-slot='brand' x-class={[brand]}>{brandNode}</div>}
      <div data-slot='links' x-class={[links]}>{children}</div>
      {end && <div data-slot='end' x-class={[endSlot]}>{end}</div>}
    </nav>
  );
}

export type { NavigationBarProps };
