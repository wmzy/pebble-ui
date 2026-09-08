import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

import { css } from '@linaria/core';
import { useRef, useState } from 'react';

import { getDirection } from '../../utils/direction';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

type RatingCoreProps = {
  value: number;
  onChange: (value: number) => void;
  count?: number;
  allowHalf?: boolean;
  className?: string;
};

const container = css`
  display: inline-flex;
  gap: var(--haze-space-1);
  font-family: var(--haze-font-sans);
`;

const star = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
  color: var(--haze-color-border);
  transition: color var(--haze-duration-fast), transform var(--haze-duration-fast);
  position: relative;

  &:hover {
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const starActive = css`
  color: var(--haze-color-warning);
`;

export default function RatingCore({
  value,
  onChange,
  count = 5,
  allowHalf = false,
  className,
}: RatingCoreProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const strings = useStrings('rating');

  const handleClick = (index: number) => {
    onChange(index + 1);
  };

  const displayValue = hoverValue ?? value;

  /**
   * Radiogroup keyboard contract (WAI-ARIA): the inline-axis arrows and
   * ↑/↓ step the selection (half steps with `allowHalf`), Home/End jump
   * to the extremes, Space/Enter confirm the focused star, and focus
   * follows the selection. Under `dir="rtl"` the inline arrows mirror
   * (← increases), read from the DOM at event time so the keys follow
   * the mirrored star order.
   */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = allowHalf ? 0.5 : 1;
    const radios = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []
    );
    if (radios.length === 0) return;

    const commit = (next: number, focusIndex: number) => {
      event.preventDefault();
      onChange(next);
      radios[focusIndex]?.focus();
    };
    // Selection delta per key; 0 = no rating key.
    const inlineNext =
      getDirection(containerRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const inlinePrev = inlineNext === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const deltas: Record<string, number> = {
      [inlineNext]: step,
      [inlinePrev]: -step,
      ArrowUp: step,
      ArrowDown: -step,
    };
    if (event.key in deltas) {
      const next = Math.min(Math.max(value + deltas[event.key]!, 0), count);
      commit(next, next > 0 ? Math.ceil(next) - 1 : 0);
      return;
    }
    if (event.key === 'Home') {
      commit(0, 0);
      return;
    }
    if (event.key === 'End') {
      commit(count, count - 1);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      // Spans synthesize no click — complete the radio activation here.
      const index = radios.indexOf(
        (event.target as HTMLElement).closest('[role="radio"]')!
      );
      if (index >= 0) commit(index + 1, index);
    }
  };

  return (
    <div
      ref={containerRef}
      x-class={[container, className]}
      role="radiogroup"
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: count }, (_, i) => {
        const filled = displayValue >= i + 1;
        const halfFilled =
          allowHalf && displayValue >= i + 0.5 && displayValue < i + 1;
        // Roving tabindex: the star matching the current value is the
        // tab stop (the first one when nothing is rated yet).
        const isStop = value > 0 ? Math.ceil(value) - 1 === i : i === 0;

        return (
          <span
            key={i}
            x-class={[star, (filled || halfFilled) && starActive]}
            role="radio"
            aria-checked={value >= i + 1 ? 'true' : 'false'}
            aria-label={formatString(i > 0 ? strings.stars : strings.star, { count: i + 1 })}
            tabIndex={isStop ? 0 : -1}
            onClick={() => handleClick(i)}
            onMouseEnter={() => setHoverValue(i + 1)}
            onMouseLeave={() => setHoverValue(null)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : halfFilled ? 'url(#half)' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              {halfFilled && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              )}
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

export type { RatingCoreProps };
