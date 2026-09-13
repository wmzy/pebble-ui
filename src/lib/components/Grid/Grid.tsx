import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type GridProps = {
  columns?: number;
  gap?: number;
  /**
   * Enables a container-query context (`container-type: inline-size`) so
   * GridItem `sm`/`md`/`lg` breakpoints respond to the grid's own width
   * instead of the viewport. Defaults to false, which keeps the DOM exactly
   * that of a plain grid.
   */
  responsive?: boolean;
  className?: string;
  children: ReactNode;
};

const base = css`
  display: grid;
`;

const responsiveContainer = css`
  container-type: inline-size;
`;

export default function Grid({
  columns = 12,
  gap = 4,
  responsive = false,
  className,
  children,
}: GridProps) {
  return (
    <div
      data-slot='grid'
      x-class={[base, responsive && responsiveContainer, className]}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `var(--haze-space-${gap})`,
      }}
    >
      {children}
    </div>
  );
}

export type { GridProps };
