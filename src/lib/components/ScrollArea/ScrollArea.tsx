import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ScrollAreaProps = {
  maxHeight?: number | string;
  className?: string;
  children: ReactNode;
};

const base = css`
  overflow: auto;
  font-family: var(--haze-font-sans);

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--haze-color-border);
    border-radius: var(--haze-radius-full);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--haze-color-border-hover);
  }

  scrollbar-width: thin;
  scrollbar-color: var(--haze-color-border) transparent;
`;

export default function ScrollArea({
  maxHeight,
  className,
  children,
}: ScrollAreaProps) {
  const style = maxHeight !== undefined
    ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
    : undefined;

  return (
    <div data-slot='scroll-area' x-class={[base, className]} style={style}>
      {children}
    </div>
  );
}

export type { ScrollAreaProps };
