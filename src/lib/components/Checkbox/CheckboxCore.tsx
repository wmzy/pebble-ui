import type { ComponentPropsWithoutRef, Ref, ReactNode } from 'react';

import { css } from '@linaria/core';

type CheckboxCoreProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback. */
  onNativeChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  label?: ReactNode;
  className?: string;
  /** Forwarded to the checkbox `<input>` element. */
  ref?: Ref<HTMLInputElement>;
} & Omit<ComponentPropsWithoutRef<'input'>, 'checked' | 'onChange' | 'type'>;

const base = css`
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
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
    background: var(--haze-color-primary);
    border-color: var(--haze-color-primary);
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 2px;
    /* physical: the checkmark is drawn from physical borders + rotate(45)
       and stays unmirrored under RTL by industry convention. */
    left: 5px;
    width: 5px;
    height: 9px;
    border: solid var(--haze-color-text-inverse);
    /* physical: drawing primitive of the same unmirrored checkmark. */
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Forced-colors: the UA flattens the checked fill onto Canvas, so
     the on/off signal would vanish. The box keeps a CanvasText
     boundary and goes Highlight + HighlightText checkmark when
     checked (the Windows-native checkbox rendering); disabled boxes
     drop the dim and render GrayText instead. The box-shadow focus
     ring is dropped by the UA — a Highlight outline replaces it. */
  @media (forced-colors: active) {
    border-color: CanvasText;

    &:checked {
      background: Highlight;
      border-color: Highlight;

      &::after {
        border-color: HighlightText;
      }
    }

    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 1;
      border-color: GrayText;
    }

    &:disabled:checked {
      background: GrayText;
      border-color: GrayText;
    }
  }
`;

const labelText = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  cursor: pointer;
  user-select: none;
`;

export default function CheckboxCore({
  checked,
  onChange,
  onNativeChange,
  className,
  label,
  ref,
  ...rest
}: CheckboxCoreProps) {
  const input = (
    <input
      ref={ref}
      type='checkbox'
      data-slot='checkbox'
      x-class={[base, className]}
      checked={checked}
      onChange={(e) => {
        onChange(e.target.checked);
        onNativeChange?.(e);
      }}
      {...rest}
    />
  );

  if (label === undefined) {
    return input;
  }

  return (
    <label data-slot='label' x-class={labelText}>
      {input}
      {label}
    </label>
  );
}

export type { CheckboxCoreProps };
