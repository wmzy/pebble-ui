import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';

type CarouselSlideProps = {
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

const slide = css`
  flex: 0 0 100%;
  scroll-snap-align: start;
  min-width: 0;
`;

export default function CarouselSlide({className, children, ...rest}: CarouselSlideProps) {
  return (
    <div
      data-slot='slide'
      x-class={[slide, className]}
      role='group'
      aria-roledescription='slide'
      {...rest}
    >
      {children}
    </div>
  );
}

export type { CarouselSlideProps };
