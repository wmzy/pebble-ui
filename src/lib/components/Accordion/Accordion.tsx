import type {ReactNode} from 'react';

import {css} from '@linaria/core';

type AccordionProps = {
  exclusive?: boolean;
  className?: string;
  children: ReactNode;
};

const base = css`
  width: 100%;
`;

export default function Accordion({
  className,
  children,
}: AccordionProps) {
  return (
    <div data-slot='accordion' x-class={[base, className]}>
      {children}
    </div>
  );
}

export type {AccordionProps};
