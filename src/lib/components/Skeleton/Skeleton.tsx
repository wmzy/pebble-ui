import { css } from '@linaria/core';

type SkeletonProps = {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
};

const base = css`
  display: block;
  background: var(--haze-color-bg-muted);
  animation: shimmer 1.5s ease-in-out infinite;

  /* WCAG 2.3.3: the shimmer loop period is a literal on purpose (the
     motion tokens model transition durations, not multi-second cycles),
     so reduced-motion needs this explicit collapse. A single 0.01ms
     iteration settles the block at its base opacity: a static muted
     placeholder, still unmistakably a skeleton. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  @keyframes shimmer {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }

  /* Forced-colors: the muted block flattens onto Canvas — the
     placeholder would vanish. System colors survive the override, so
     the skeleton renders as a GrayText block; the opacity shimmer
     keeps running (opacity is not squashed). */
  @media (forced-colors: active) {
    background: GrayText;
  }
`;

const variantStyles = {
  text: css`
    border-radius: var(--haze-radius-sm);
    height: 1em;
  `,
  circular: css`
    border-radius: var(--haze-radius-full);
  `,
  rectangular: css`
    border-radius: var(--haze-radius-md);
  `,
} as const;

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <span data-slot='skeleton' x-class={[base, variantStyles[variant], className]} style={style} />
  );
}

export type { SkeletonProps };
