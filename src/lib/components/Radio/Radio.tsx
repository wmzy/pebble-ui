import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

import { useRadioContext } from './RadioContext';

type RadioProps = {
  value: string;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'name' | 'checked' | 'onChange'
>;

const radioInput = css`
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  cursor: pointer;
  margin: 0.4375rem;
  transition:
    background var(--haze-duration-fast),
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);
  flex-shrink: 0;
  position: relative;

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:checked {
    border-color: var(--haze-color-primary);
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 3px;
    inset-inline-start: 3px;
    width: 10px;
    height: 10px;
    border-radius: var(--haze-radius-full);
    background: var(--haze-color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const labelStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;
`;

export default function Radio({
  value,
  className,
  children,
  ...rest
}: RadioProps & { children?: React.ReactNode }) {
  const ctx = useRadioContext();

  return (
    <label x-class={[labelStyle, className]}>
      <input
        type='radio'
        className={radioInput}
        name={ctx?.name}
        value={value}
        checked={ctx ? ctx.value === value : undefined}
        onChange={() => ctx?.setValue(value)}
        {...rest}
      />
      {children}
    </label>
  );
}

export type { RadioProps };
