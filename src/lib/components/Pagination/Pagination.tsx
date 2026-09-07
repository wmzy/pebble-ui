import type { ComponentPropsWithoutRef } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';

type PaginationProps = {
  page?: ControlOrValue<number>;
  total: number;
  pageSize?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'nav'>, 'onChange'>;

const nav = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  font-family: var(--haze-font-sans);
`;

const btn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  cursor: pointer;
  transition: background var(--haze-duration-fast), border-color var(--haze-duration-fast);

  &:hover:not(:disabled) {
    background: var(--haze-color-bg-subtle);
    border-color: var(--haze-color-border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const activeBtn = css`
  background: var(--haze-color-primary);
  border-color: var(--haze-color-primary);
  color: var(--haze-color-text-inverse);

  &:hover:not(:disabled) {
    background: var(--haze-color-primary-hover);
    border-color: var(--haze-color-primary-hover);
  }
`;

const ellipsis = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

const sizes = {
  sm: css`
    & button { min-width: 2rem; height: 2rem; font-size: var(--haze-text-xs); }
  `,
  md: css``,
  lg: css`
    & button { min-width: 40px; height: 40px; font-size: var(--haze-text-base); }
  `,
} as const;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export default function Pagination({
  page: pageControl,
  total,
  pageSize = 10,
  size = 'md',
  className,
  ...rest
}: PaginationProps) {
  const [page, setPage] = useControl(pageControl, 1);
  const strings = useStrings('pagination');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = getPageNumbers(page, totalPages);

  return (
    <nav x-class={[nav, sizes[size], className]} {...rest}>
      <button
        type="button"
        x-class={[btn]}
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        aria-label={strings.previous}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} x-class={[ellipsis]}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            x-class={[btn, p === page && activeBtn]}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        x-class={[btn]}
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        aria-label={strings.next}
      >
        ›
      </button>
    </nav>
  );
}

export type { PaginationProps };
