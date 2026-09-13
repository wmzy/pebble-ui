import type { ReactNode, CSSProperties } from 'react';

import { css } from '@linaria/core';

type AffixProps = {
  position?: 'top' | 'bottom';
  offset?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const affix = css`
  position: fixed;
  z-index: 100;
`;

const posTop = css`
  top: 0;
  inset-inline: 0;
`;

const posBottom = css`
  bottom: 0;
  inset-inline: 0;
`;

export default function Affix({
  position = 'top',
  offset = 0,
  children,
  className,
  style,
}: AffixProps) {
  const posClass = position === 'top' ? posTop : posBottom;
  const offsetStyle: CSSProperties =
    position === 'top' ? { top: offset } : { bottom: offset };

  return (
    <div data-slot='affix' x-class={[affix, posClass, className]} style={{ ...offsetStyle, ...style }}>
      {children}
    </div>
  );
}

export type { AffixProps };
