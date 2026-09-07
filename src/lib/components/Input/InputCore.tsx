import type {ComponentPropsWithoutRef} from 'react';

import {css} from '@linaria/core';

type InputCoreProps = {
  value: string;
  onChange: (value: string) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`. Kept out of `rest` on purpose so the controlled `onChange`
   * callback above can never be overridden by a spread. */
  onNativeChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'size'>;

const base = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  line-height: var(--haze-leading-normal);
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &::placeholder {
    color: var(--haze-color-text-muted);
  }

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const sizes = {
  sm: css`
    padding: var(--haze-space-1) var(--haze-space-2);
    font-size: var(--haze-text-sm);
  `,
  md: css`
    padding: var(--haze-space-2) var(--haze-space-3);
    font-size: var(--haze-text-sm);
  `,
  lg: css`
    padding: var(--haze-space-3) var(--haze-space-4);
    font-size: var(--haze-text-base);
  `,
} as const;

export default function InputCore({
  value,
  onChange,
  onNativeChange,
  size = 'md',
  className,
  ...rest
}: InputCoreProps) {
  return (
    <input
      x-class={[base, sizes[size], className]}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        onNativeChange?.(e);
      }}
      {...rest}
    />
  );
}

export type {InputCoreProps};
