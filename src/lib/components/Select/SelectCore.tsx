import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type { SelectVirtualizedConfig } from './SelectMultiple';

import { css } from '@linaria/core';

import SelectMultiple from './SelectMultiple';
import { extractSelectOptions } from './select-options';

type SelectCoreProps = {
  /** `string` in single mode, `string[]` when `multiple` is set. */
  value: string | string[];
  /** Notifies the next value: `string` in single mode, `string[]` when
   * `multiple` is set. */
  onChange: (value: string | string[]) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback.
   * Single mode only; the multiple path has no native select element. */
  onNativeChange?: ComponentPropsWithoutRef<'select'>['onChange'];
  /**
   * Placeholder for the multiple trigger (falls back to the
   * `select.placeholder` locale string). A native `<select>` has no
   * placeholder attribute, so single mode consumes and drops it.
   */
  placeholder?: string;
  /**
   * Multiple selection mode: the native `<select>` is replaced by a
   * button trigger rendering the selected values as removable Chips,
   * opening a floating multi-select listbox. Default (`false`) keeps
   * the native single-select path untouched.
   */
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Render the multiple-mode listbox through VirtualList so long option
   * lists mount only the visible window (plus overscan). Default
   * (omitted/`false`) keeps the plain DOM path; single mode ignores it —
   * the native `<select>` handles long lists natively.
   */
  virtualized?: boolean | SelectVirtualizedConfig;
  children: ReactNode;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'select'>,
  'value' | 'onChange' | 'size' | 'multiple'
>;

const base = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  line-height: var(--haze-leading-normal);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2.22 4.47a.75.75 0 0 1 1.06 0L6 7.19l2.72-2.72a.75.75 0 1 1 1.06 1.06L6.53 8.78a.75.75 0 0 1-1.06 0L2.22 5.53a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  /* physical: CSS has no logical background-position keywords — the
     [dir='rtl'] rule below mirrors the caret to the inline end. */
  background-position: right var(--haze-space-3) center;
  padding-inline-end: var(--haze-space-8);

  [dir='rtl'] & {
    background-position: left var(--haze-space-3) center;
  }

  cursor: pointer;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

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

export default function SelectCore({
  value,
  onChange,
  onNativeChange,
  multiple = false,
  size = 'md',
  virtualized,
  className,
  placeholder,
  children,
  ...rest
}: SelectCoreProps) {
  if (multiple) {
    return (
      <SelectMultiple
        value={value}
        onChange={onChange}
        options={extractSelectOptions(children)}
        size={size}
        virtualized={virtualized}
        className={className}
        placeholder={placeholder}
        // Select-typed passthrough re-hosted on the multiple trigger's
        // button: only the element-generic event handler types differ
        // between the two attribute sets, so this one widening cast at
        // the mode boundary is sound. Omitted to the shape SelectMultiple
        // reserves for its own props, so the spread cannot shadow them.
        {...(rest as Omit<
          ComponentPropsWithoutRef<'button'>,
          'value' | 'onChange' | 'size' | 'type' | 'children'
        >)}
      />
    );
  }

  return (
    <select
      x-class={[base, sizes[size], className]}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        onNativeChange?.(e);
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export type { SelectCoreProps };
