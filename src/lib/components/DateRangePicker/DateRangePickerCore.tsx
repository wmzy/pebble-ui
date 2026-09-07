import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type DateRangePickerCoreProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  separator?: ReactNode;
  className?: string;
};

const container = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;

const input = css`
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const sep = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

export default function DateRangePickerCore({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  separator = '–',
  className,
}: DateRangePickerCoreProps) {
  const strings = useStrings('dateRangePicker');
  return (
    <div x-class={[container, className]}>
      <input
        type="date"
        x-class={[input]}
        aria-label={strings.startDate}
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span x-class={[sep]}>{separator}</span>
      <input
        type="date"
        x-class={[input]}
        aria-label={strings.endDate}
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
      />
    </div>
  );
}

export type { DateRangePickerCoreProps };
