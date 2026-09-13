import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type TokenCounterProps = {
  used: number;
  max: number;
  label?: string;
  className?: string;
};

const wrapper = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const bar = css`
  height: 0.25rem;
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-full);
  overflow: hidden;
  margin-top: var(--haze-space-1);
`;

const fill = css`
  height: 100%;
  border-radius: var(--haze-radius-full);
  transition: width var(--haze-duration-slow) ease;
`;

const fillNormal = css`background: var(--haze-color-primary);`;
const fillWarning = css`background: var(--haze-color-warning);`;
const fillDanger = css`background: var(--haze-color-danger);`;

const info = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const count = css`
  font-variant-numeric: tabular-nums;
`;

export default function TokenCounter({ used, max, label, className }: TokenCounterProps) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const fillClass = pct > 90 ? fillDanger : pct > 70 ? fillWarning : fillNormal;
  const strings = useStrings('tokenCounter');

  return (
    <div data-slot='token-counter' x-class={[wrapper, className]}>
      <div x-class={[info]}>
        <span data-slot='label'>{label || strings.label}</span>
        <span data-slot='value' x-class={[count]}>{used.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div data-slot='track' x-class={[bar]}>
        <div data-slot='fill' x-class={[fill, fillClass]} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type { TokenCounterProps };
