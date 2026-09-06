import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useRef, useEffect, Children } from 'react';
import { useControl } from 'react-use-control';

type CarouselProps = {
  value?: ControlOrValue<number>;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  children: ReactNode;
};

const wrapper = css`
  position: relative;
  overflow: hidden;
  border-radius: var(--haze-radius-lg);
`;

const track = css`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const navBtn = css`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  appearance: none;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--haze-shadow-md);
  transition: background 0.15s;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      var(--haze-shadow-md),
      0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const prevBtn = css`
  inset-inline-start: var(--haze-space-2);

  /* 位置随行进侧镜像；‹/› 字形靠元素镜像翻转（scale 与 navBtn 的
     transform 独立组合，不覆盖 translateY）。 */
  [dir='rtl'] & {
    scale: -1 1;
  }
`;

const nextBtn = css`
  inset-inline-end: var(--haze-space-2);

  [dir='rtl'] & {
    scale: -1 1;
  }
`;

const indicators = css`
  display: flex;
  justify-content: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) 0;
`;

const dot = css`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: var(--haze-radius-full);
  border: none;
  background: var(--haze-color-bg-muted);
  cursor: pointer;
  padding: 0.375rem;
  transition: background 0.15s;
`;

const dotActive = css`
  background: var(--haze-color-primary);
`;

export default function Carousel({
  value: valueControl,
  autoPlay = false,
  interval = 5000,
  className,
  children,
}: CarouselProps) {
  const [current, setCurrent] = useControl(valueControl, 0);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = Children.count(children);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[current] as HTMLElement | undefined;
    if (child)
      child.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
  }, [current]);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, count, setCurrent]);

  const goPrev = () => setCurrent((prev) => (prev - 1 + count) % count);
  const goNext = () => setCurrent((prev) => (prev + 1) % count);

  return (
    <div
      x-class={[wrapper, className]}
      role='region'
      aria-roledescription='carousel'
      aria-label='Carousel'
    >
      <div ref={trackRef} className={track}>
        {children}
      </div>
      {count > 1 && (
        <>
          <button
            type='button'
            x-class={[navBtn, prevBtn]}
            onClick={goPrev}
            aria-label='Previous slide'
          >
            ‹
          </button>
          <button
            type='button'
            x-class={[navBtn, nextBtn]}
            onClick={goNext}
            aria-label='Next slide'
          >
            ›
          </button>
          <div className={indicators}>
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type='button'
                x-class={[dot, i === current && dotActive]}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export type { CarouselProps };
