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
`;

const dot2 = css`animation-delay: 0.16s;`;
const dot3 = css`animation-delay: 0.32s;`;

export default function ThinkingIndicator({ text, className }: ThinkingIndicatorProps) {
  const strings = useStrings('thinkingIndicator');
  const label = text ?? strings.text;
  return (
    <div x-class={[wrapper, className]}>
      <span>{label}</span>
      <span x-class={[dots]}>
        <span x-class={[dot]} />
        <span x-class={[dot, dot2]} />
        <span x-class={[dot, dot3]} />
      </span>
    </div>
  );
}

export type { ThinkingIndicatorProps };
