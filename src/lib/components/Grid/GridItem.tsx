import type { ReactNode } from 'react';

import { lgSpans, mdSpans, smSpans, spanClasses } from './grid-item-styles';

type GridItemProps = {
  /** Number of columns to span */
  span?: number;
  /**
   * Grid column start line. Preserved across breakpoints when combined with
   * `sm`/`md`/`lg` — the container queries override only the span.
   */
  start?: number;
  /**
   * Columns to span (1-12) once the grid container is at least 384px wide.
   * Only takes effect inside a `responsive` Grid; without one the container
   * query never matches and the item degrades to `span`.
   */
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /**
   * Columns to span (1-12) once the grid container is at least 576px wide.
   * Only takes effect inside a `responsive` Grid; without one the container
   * query never matches and the item degrades to `span`.
   */
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /**
   * Columns to span (1-12) once the grid container is at least 768px wide.
   * Only takes effect inside a `responsive` Grid; without one the container
   * query never matches and the item degrades to `span`.
   */
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
  children: ReactNode;
};

export default function GridItem({
  span = 1,
  start,
  sm,
  md,
  lg,
  className,
  children,
}: GridItemProps) {
  const responsive = sm !== undefined || md !== undefined || lg !== undefined;
  // Below every breakpoint the item falls back to the `span` prop via a
  // static class, so the @container overrides can win by source order. Spans
  // outside the pre-generated 1-12 matrix keep the legacy inline style (the
  // breakpoint classes then cannot override an inline grid-column).
  const spanClass = responsive
    ? spanClasses[span as keyof typeof spanClasses]
    : undefined;
  const style = spanClass
    ? // Inline longhand beats the classes' shorthand `auto` start line, so
      // `start` keeps working at every breakpoint while classes own the span.
      start !== undefined
      ? { gridColumnStart: `${start}` }
      : undefined
    : { gridColumn: start ? `${start} / span ${span}` : `span ${span}` };

  return (
    <div
      data-slot='grid-item'
      x-class={[
        spanClass,
        sm !== undefined && smSpans[sm],
        md !== undefined && mdSpans[md],
        lg !== undefined && lgSpans[lg],
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}

export type { GridItemProps };
