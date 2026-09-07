import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';
import { useRef } from 'react';

import { useStrings } from '../LocaleProvider';

type FileInputProps = {
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type'>;

const hiddenInput = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const trigger = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) var(--haze-space-4);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  transition:
    background var(--haze-duration-fast),
    border-color var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-border-hover);
    background: var(--haze-color-bg-subtle);
  }

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export default function FileInput({
  children,
  className,
  ...rest
}: FileInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const strings = useStrings('fileInput');

  return (
    <label x-class={[trigger, className]}>
      <input ref={ref} type='file' className={hiddenInput} {...rest} />
      {children ?? strings.label}
    </label>
  );
}

export type { FileInputProps };
