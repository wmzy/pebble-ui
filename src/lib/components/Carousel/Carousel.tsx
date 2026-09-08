import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useRef, useEffect, Children } from 'react';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import { getDirection } from '../../utils/direction';

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
  transition: background var(--haze-duration-fast);

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
  transition: background var(--haze-duration-fast);
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const count = Children.count(children);
  const strings = useStrings('carousel');

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

  /**
   * Keyboard contract (WAI-ARIA carousel): the region is a tab stop and
   * its arrows step the slides (Home/End jump to the ends). Under
   * `dir="rtl"` the arrows mirror (← advances), read from the DOM at
   * event time so the keys follow the mirrored slide order.
   */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    const nextKey =
      getDirection(wrapperRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = nextKey === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
      case nextKey:
        event.preventDefault();
        goNext();
        return;
      case prevKey:
        event.preventDefault();
        goPrev();
        return;
      case 'Home':
        event.preventDefault();
        setCurrent(0);
        return;
      case 'End':
        event.preventDefault();
        setCurrent(count - 1);
        return;
    }
  };

  return (
    <div
      ref={wrapperRef}
      x-class={[wrapper, className]}
      role='region'
      aria-roledescription='carousel'
      aria-label={strings.label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
            aria-label={strings.previousSlide}
          >
            ‹
          </button>
          <button
            type='button'
            x-class={[navBtn, nextBtn]}
            onClick={goNext}
            aria-label={strings.nextSlide}
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
                aria-label={formatString(strings.goToSlide, { index: i + 1 })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export type { CarouselProps };
