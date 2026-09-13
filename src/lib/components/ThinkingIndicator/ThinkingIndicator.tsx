import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ThinkingIndicatorProps = {
  text?: string;
  className?: string;
};

const wrapper = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  padding: var(--haze-space-2) 0;
`;

const dots = css`
  display: inline-flex;
  gap: var(--haze-space-1);

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-0.375rem); }
  }
`;

const dot = css`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-text-muted);
  animation: bounce 1.4s ease-in-out infinite;

  /* WCAG 2.3.3: the bounce loop period is a literal on purpose (the
     motion tokens model transition durations, not multi-second cycles),
     so reduced-motion needs this explicit collapse. A single 0.01ms
     iteration settles each dot at its base transform — a static dot row
     beside the text label. The staggered animation-delay literals on
     dot2/dot3 are phase offsets of the loop, not motion: under reduce
     they merely hold the base state briefly before the instant
     iteration, so they stay as-is. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
`;

const dot2 = css`animation-delay: 0.16s;`;
const dot3 = css`animation-delay: 0.32s;`;

export default function ThinkingIndicator({ text, className }: ThinkingIndicatorProps) {
  const strings = useStrings('thinkingIndicator');
  const label = text ?? strings.text;
  return (
    <div data-slot='thinking-indicator' x-class={[wrapper, className]}>
      <span data-slot='label'>{label}</span>
      <span data-slot='dots' x-class={[dots]}>
        <span data-slot='dot' x-class={[dot]} />
        <span data-slot='dot' x-class={[dot, dot2]} />
        <span data-slot='dot' x-class={[dot, dot3]} />
      </span>
    </div>
  );
}

export type { ThinkingIndicatorProps };
