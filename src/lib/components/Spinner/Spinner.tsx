import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const base = css`
  display: inline-flex;
  animation: spin 0.8s linear infinite;

  /* WCAG 2.3.3: the loop period is a literal on purpose — the motion
     tokens model transition durations (120/200/300ms), not multi-second
     cycles — so reduced-motion needs this explicit collapse. A single
     0.01ms iteration parks the animation at its rest frame: the border
     circle plus primary arc stay visible, so the element still reads as
     loading alongside its role="status" + aria-label. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Forced-colors: the UA flattens both svg strokes onto CanvasText —
     the arc would merge into the full ring and the glyph would stop
     reading as loading. System colors survive the override, so the
     rest ring renders GrayText and the spinning arc CanvasText (the
     motion still distinguishes them; reduced-motion parks the arc on
     the rest frame where the two grays keep the circle visible). */
  @media (forced-colors: active) {
    & svg circle {
      stroke: GrayText;
    }

    & svg path {
      stroke: CanvasText;
    }
  }
`;

const sizes = {
  sm: css`
    width: 16px;
    height: 16px;
  `,
  md: css`
    width: 24px;
    height: 24px;
  `,
  lg: css`
    width: 32px;
    height: 32px;
  `,
} as const;

export default function Spinner({
  size = 'md',
  className,
}: SpinnerProps) {
  const strings = useStrings('spinner');
  return (
    <span data-slot='spinner' role="status" aria-label={strings.loading} x-class={[base, sizes[size], className]}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--haze-color-border)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--haze-color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export type { SpinnerProps };
