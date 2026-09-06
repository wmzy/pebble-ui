import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const base = css`
  display: inline-flex;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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
    <span role="status" aria-label={strings.loading} x-class={[base, sizes[size], className]}>
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
