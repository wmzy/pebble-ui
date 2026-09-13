import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ProgressProps = {
  value?: number;
  variant?: 'bar' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
};

const barBase = css`
  width: 100%;
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-full);
  overflow: hidden;

  /* Forced-colors: every fill color flattens onto Canvas — the
     progress would vanish. Targeting the fill by its data-slot (not
     the colorMap classes) keeps one rule ahead of them in the
     cascade; the fill renders Highlight, the Windows-native
     determinate-progress color. */
  @media (forced-colors: active) {
    & > [data-slot='fill'] {
      background: Highlight;
    }
  }
`;

const barSizes = {
  sm: css`height: 4px;`,
  md: css`height: 8px;`,
  lg: css`height: 12px;`,
} as const;

const barFill = css`
  height: 100%;
  border-radius: var(--haze-radius-full);
  transition: width var(--haze-duration-slow) ease;
`;

const colorMap = {
  primary: css`background: var(--haze-color-primary);`,
  success: css`background: var(--haze-color-success);`,
  warning: css`background: var(--haze-color-warning);`,
  danger: css`background: var(--haze-color-danger);`,
} as const;

const circleBase = css`
  transform: rotate(-90deg);

  /* Forced-colors: both strokes flatten onto Canvas — the ring would
     vanish. The track renders GrayText and the arc Highlight,
     targeted by data-slot so one rule outranks the colorMap classes
     in the cascade. */
  @media (forced-colors: active) {
    & [data-slot='track'] {
      stroke: GrayText;
    }

    & [data-slot='fill'] {
      stroke: Highlight;
    }
  }
`;

const circleSizes = {
  sm: css`width: 32px; height: 32px;`,
  md: css`width: 48px; height: 48px;`,
  lg: css`width: 64px; height: 64px;`,
} as const;

const circleBg = css`
  fill: none;
  stroke: var(--haze-color-bg-muted);
`;

const circleFill = css`
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--haze-duration-slow) ease;
`;

const circleColorMap = {
  primary: css`stroke: var(--haze-color-primary);`,
  success: css`stroke: var(--haze-color-success);`,
  warning: css`stroke: var(--haze-color-warning);`,
  danger: css`stroke: var(--haze-color-danger);`,
} as const;

const strokeWidths = { sm: 3, md: 4, lg: 5 };
const circleRadius = { sm: 13, md: 20, lg: 27 };

export default function Progress({
  value = 0,
  variant = 'bar',
  size = 'md',
  color = 'primary',
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const strings = useStrings('progress');

  if (variant === 'circle') {
    const r = circleRadius[size];
    const sw = strokeWidths[size];
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (clamped / 100) * circumference;

    return (
      <div
        role="progressbar"
        data-slot="progress"
        aria-label={strings.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        x-class={[circleBase, circleSizes[size], className]}
      >
        <svg viewBox={`0 0 ${(r + sw) * 2} ${(r + sw) * 2}`}>
          <circle
            data-slot="track"
            cx={r + sw}
            cy={r + sw}
            r={r}
            strokeWidth={sw}
            x-class={[circleBg]}
          />
          <circle
            data-slot="fill"
            cx={r + sw}
            cy={r + sw}
            r={r}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            x-class={[circleFill, circleColorMap[color]]}
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      data-slot="progress"
      aria-label={strings.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      x-class={[barBase, barSizes[size], className]}
    >
      <div
        data-slot="fill"
        x-class={[barFill, colorMap[color]]}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export type { ProgressProps };
