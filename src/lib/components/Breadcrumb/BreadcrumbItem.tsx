import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type BreadcrumbItemProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

const link = css`
  color: var(--haze-color-primary);
  text-decoration: none;
  transition: color var(--haze-duration-fast);

  &:hover {
    color: var(--haze-color-primary-hover);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    border-radius: var(--haze-radius-sm);
  }
`;

const current = css`
  color: var(--haze-color-text);
  font-weight: var(--haze-weight-medium);
`;

export default function BreadcrumbItem({
  href,
  className,
  children,
}: BreadcrumbItemProps) {
  return href ? (
    <a href={href} x-class={[link, className]}>
      {children}
    </a>
  ) : (
    <span x-class={[current, className]}>{children}</span>
  );
}

export type { BreadcrumbItemProps };
