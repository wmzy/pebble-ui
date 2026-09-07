import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

type SliderCoreProps = {
  value: number;
  onChange: (value: number) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback. */
  onNativeChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'onChange'>;

const base = css`
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  outline: none;
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &::-webkit-slider-thumb {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--haze-radius-full);
    background: var(--haze-color-primary);
    border: 2px solid var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
    cursor: pointer;
    transition:
      background var(--haze-duration-fast),
      box-shadow var(--haze-duration-fast);
  }

  &::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--haze-radius-full);
    background: var(--haze-color-primary);
    border: 2px solid var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
    cursor: pointer;
  }

  &:focus-visible {
    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    }
    &::-moz-range-thumb {
      box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function SliderCore({
  value,
  onChange,
  onNativeChange,
  className,
  ...rest
}: SliderCoreProps) {
  return (
    <input
      type='range'
      x-class={[base, className]}
      value={value}
      onChange={(e) => {
        onChange(Number(e.target.value));
        onNativeChange?.(e);
      }}
      {...rest}
    />
  );
}

export type { SliderCoreProps };
