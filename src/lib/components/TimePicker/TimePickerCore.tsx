import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

type TimePickerCoreProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type' | 'placeholder'
>;

const input = css`
  width: 100%;
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
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

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

export default function TimePickerCore({
  value,
  onChange,
  placeholder,
  className,
  ...rest
}: TimePickerCoreProps) {
  return (
    <input
      type="time"
      x-class={[input, className]}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export type { TimePickerCoreProps };
