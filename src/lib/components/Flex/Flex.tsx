import type {CSSProperties, ReactNode} from 'react';

import {css} from '@linaria/core';

type FlexProps = {
  direction?: 'row' | 'column';
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  gap?: string | number;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const base = css`
  display: flex;
`;

export default function Flex({
  direction = 'row',
  align,
  justify,
  gap,
  wrap = false,
  className,
  style: styleProp,
  children,
}: FlexProps) {
  const style: CSSProperties = {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    flexWrap: wrap ? 'wrap' : undefined,
    ...styleProp,
  };

  return (
    <div data-slot='flex' x-class={[base, className]} style={style}>
      {children}
    </div>
  );
}

export type {FlexProps};
