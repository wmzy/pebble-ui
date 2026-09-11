import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { isValidElement, Children, useMemo } from 'react';
import { css } from '@linaria/core';

import { distributeIndices } from './masonry-distribute';

/**
 * Masonry ("Pinterest-style") column layout: children flow into N
 * equal-width columns and stack independently, so a tall card never
 * stretches a row of short ones.
 *
 * Unlike `Grid` — a uniform two-dimensional grid where cells share row
 * alignment and each item occupies a rect of equal-height rows —
 * Masonry aligns items to the *column* only. Nothing is row-aligned:
 * each column is an independent flex stack.
 *
 * Column assignment happens in JS, not CSS multicolumn, for one reason:
 * CSS `columns` fill vertically (column 1 top-to-bottom, then column 2),
 * scrambling the reading order of a list. The JS pass distributes
 * children greedily to the currently-shortest column **in source
 * order**, so `items[0], items[1], items[2]` read left-to-right as
 * expected. It is estimation-based (all children assumed equally tall,
 * which degenerates to round-robin) and never measures the DOM; see
 * ./masonry-distribute for the height-oracle upgrade path
 * (`ResizeObserver` per item) — the distribution function already
 * accepts per-item heights, only the measurement wiring is future work.
 */
type MasonryProps = {
  /** Number of equal-width columns (≥ 1). Responsive breakpoints are a
   * follow-up; wrap in a container query or render a different
   * `columns` per breakpoint for now. */
  columns?: number;
  /** Vertical and horizontal gutter, as a `--haze-space-*` scale index
   * (Grid's `gap` convention; default `4` = `--haze-space-4`). */
  gap?: number;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const base = css`
  display: flex;
  align-items: flex-start;
  width: 100%;
`;

const column = css`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  /* the wrapper owns the horizontal gutter via its flex gap; columns
   * repeat it vertically by inheriting the same computed value */
  gap: inherit;
`;

const item = css`
  /* no-op under the flex-column implementation (nothing can split),
   * kept for the CSS-multicol fallback consumers may layer on top and
   * harmless otherwise */
  break-inside: avoid;
`;

export default function Masonry({
  columns = 3,
  gap = 4,
  children,
  className,
  ...rest
}: MasonryProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const columnCount = Math.max(1, Math.floor(columns));
  const distribution = useMemo(
    () => distributeIndices(items.length, columnCount),
    [items.length, columnCount]
  );

  return (
    <div
      x-class={[base, className]}
      style={{ gap: `var(--haze-space-${gap})` }}
      {...rest}
    >
      {distribution.map((indices, columnIndex) => (
        <div key={columnIndex} x-class={[column]}>
          {indices.map((index) => {
            const child = items[index];
            if (child == null) return null;
            return (
              <div
                key={isValidElement(child) ? child.key : index}
                x-class={[item]}
              >
                {child}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export type { MasonryProps };
