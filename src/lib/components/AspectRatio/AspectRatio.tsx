import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type AspectRatioProps = {
  ratio?: number;
  children: ReactNode;
  className?: string;
};

const wrapper = css`
  position: relative;
  width: 100%;
`;

const inner = css`
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function AspectRatio({ ratio = 16 / 9, children, className }: AspectRatioProps) {
  const paddingBottom = `${(1 / ratio) * 100}%`;

  return (
    <div data-slot='aspect-ratio' x-class={[wrapper, className]} style={{ paddingBottom }}>
      <div data-slot='content' x-class={[inner]}>
        {children}
      </div>
    </div>
  );
}

export type { AspectRatioProps };
