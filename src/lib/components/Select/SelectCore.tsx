import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from 'react';

import type { SelectVirtualizedConfig } from './SelectFloating';

import { css } from '@linaria/core';
import { useCallback, useRef } from 'react';

import { mergeRefs } from '../../utils/refs';
import { useStrings } from '../LocaleProvider';

import SelectFloating from './SelectFloating';
import { extractSelectEntries } from './select-options';

type SelectCoreProps = {
  /** `string` in single mode, `string[]` when `multiple` is set. */
  value: string | string[];
  /** Notifies the next value: `string` in single mode, `string[]` when
   * `multiple` is set. */
  onChange: (value: string | string[]) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback.
   * Single mode only; the floating paths have no native select element. */
  onNativeChange?: ComponentPropsWithoutRef<'select'>['onChange'];
  /**
   * Placeholder for the floating triggers (falls back to the
   * `select.placeholder` locale string). A native `<select>` has no
   * placeholder attribute, so the plain single mode consumes and drops
   * it — single mode with `searchable` renders it like the multiple
   * trigger does.
   */
  placeholder?: string;
  /**
   * Multiple selection mode: the native `<select>` is replaced by a
   * button trigger rendering the selected values as removable Chips,
   * opening a floating multi-select listbox. Default (`false`) keeps
   * the native single-select path untouched.
   */
  multiple?: boolean;
  /**
   * Swap the single-mode native `<select>` for the floating listbox
   * engine (the one `multiple` uses) with a search input at the top of
   * the panel: typing filters the options, ↑/↓ move the highlight,
   * Enter picks and closes, Escape closes. `multiple` ignores it — the
   * multiple listbox gains the same search input instead. Default
   * (`false`) keeps the native `<select>` untouched.
   */
  searchable?: boolean;
  /**
   * Show a pointer-only × clear affordance at the trigger's inline end
   * while a value is selected (revealed on hover/focus-within; keyboard
   * parity through Backspace on the trigger). Clicking it empties the
   * value (`[]` / `''`) without toggling the panel. Works in every
   * mode — on the plain single-select path the × overlays the select's
   * caret slot instead of the floating trigger.
   */
  clearable?: boolean;
  /**
   * Async option state for the floating paths: the options area shows a
   * Spinner with `aria-busy="true"` on the panel, and search filtering
   * is suspended until loading finishes. The plain single-mode native
   * `<select>` ignores it (a native select cannot render async state).
   */
  loading?: boolean;
  /**
   * Remote search for the floating paths (see SelectFloatingProps.onSearch):
   * while set, local query filtering is suspended — options are entirely
   * whatever arrives through `children` — and every query transition of
   * the panel's search input is reported here, empty queries included
   * (the consumer restores the full list). The plain single-mode native
   * `<select>` path has no query source and ignores it.
   */
  onSearch?: (query: string) => void;
  /**
   * Multiple mode only: render at most this many value Chips in the
   * trigger; the rest collapse into a `+N` badge whose `title` tooltip
   * lists the overflow labels. Selection semantics are unchanged.
   */
  maxTagCount?: number;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Render the floating option list through VirtualList so long option
   * lists mount only the visible window (plus overscan). Default
   * (omitted/`false`) keeps the plain DOM path; the plain single-mode
   * native `<select>` ignores it — it handles long lists natively.
   */
  virtualized?: boolean | SelectVirtualizedConfig;
  children: ReactNode;
  className?: string;
  /**
   * Forwarded to the focusable element — the native `<select>` in plain
   * and clearable single mode, the trigger `<button>` when `multiple`
   * or `searchable` render the floating engine.
   */
  ref?: Ref<HTMLSelectElement | HTMLButtonElement>;
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

/**
 * Clearable single-select host: the native `<select>` keeps its element
 * and semantics, the × floats over the caret slot. The attribute
 * selector (the `[role='option']:hover &` pattern from the option rows)
 * reaches the descendant affordance from the hovering/focused wrapper;
 * `visibility`/`pointer-events` keep the hidden affordance from eating
 * clicks aimed at the select itself. The wrapper only renders while
 * `clearable` is set, so the default path's DOM stays untouched.
 */
const nativeClearWrap = css`
  position: relative;
  display: block;
  width: 100%;
`;

/** The × over the native select — same visual contract as the floating
 * trigger's clear, with a solid background chip masking the painted
 * caret it overlays. */
const nativeClear = css`
  position: absolute;
  inset-inline-end: var(--haze-space-3);
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-secondary);
  cursor: pointer;
  line-height: 1;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--haze-duration-fast);

  [data-clearable]:hover &,
  [data-clearable]:focus-within & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  &:hover {
    color: var(--haze-color-text);
  }
`;

export default function SelectCore({
  value,
  onChange,
  onNativeChange,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  onSearch,
  maxTagCount,
  size = 'md',
  virtualized,
  className,
  placeholder,
  children,
  ref,
  ...rest
}: SelectCoreProps) {
  const strings = useStrings('select');
  const selectRef = useRef<HTMLSelectElement>(null);
  // The consumer's ref merges onto the native select in the clearable
  // branch (the internal handle restores focus after the × clear).
  const setNativeSelectRef = useCallback(
    (node: HTMLSelectElement | null) =>
      mergeRefs(selectRef, ref as Ref<HTMLSelectElement> | undefined)(node),
    [selectRef, ref]
  );

  if (multiple || searchable) {
    return (
      <SelectFloating
        ref={ref as Ref<HTMLButtonElement> | undefined}
        value={value}
        onChange={onChange}
        entries={extractSelectEntries(children)}
        multiple={multiple}
        searchable={searchable}
        clearable={clearable}
        loading={loading}
        onSearch={onSearch}
        maxTagCount={maxTagCount}
        size={size}
        virtualized={virtualized}
        className={className}
        placeholder={placeholder}
        // Select-typed passthrough re-hosted on the floating trigger's
        // button: only the element-generic event handler types differ
        // between the two attribute sets, so this one widening cast at
        // the mode boundary is sound. Omitted to the shape
        // SelectFloating reserves for its own props, so the spread
        // cannot shadow them.
        {...(rest as Omit<
          ComponentPropsWithoutRef<'button'>,
          'value' | 'onChange' | 'size' | 'type' | 'children'
        >)}
      />
    );
  }

  const selectedValue = typeof value === 'string' ? value : '';

  // Clearable single select without searchable: keep the native element
  // and overlay the affordance. The consumer's onKeyDown (still inside
  // `rest`) must run after the Backspace-clear branch, so it is pulled
  // out and chained here.
  if (clearable) {
    const { onKeyDown: consumerKeyDown, ...restWithoutKeyDown } = rest;

    return (
      <span
        x-class={nativeClearWrap}
        data-clearable={selectedValue !== '' || undefined}
      >
        <select
          ref={setNativeSelectRef}
          x-class={[base, sizes[size], className]}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onNativeChange?.(e);
          }}
          onKeyDown={(e: ReactKeyboardEvent<HTMLSelectElement>) => {
            // Keyboard parity for the pointer-only × (the same
            // rationale as the floating trigger's Backspace clear).
            if (e.key === 'Backspace' && selectedValue !== '') {
              e.preventDefault();
              onChange('');
              return;
            }
            consumerKeyDown?.(e);
          }}
          {...restWithoutKeyDown}
        >
          {children}
        </select>
        {selectedValue !== '' && (
          <span
            aria-hidden='true'
            title={strings.clear}
            x-class={nativeClear}
            onClick={(e) => {
              // The span is a sibling overlay, so the click never
              // reaches the select — no dropdown opens. Focus is
              // restored explicitly: clicking a non-focusable span
              // would otherwise drop it to body.
              e.stopPropagation();
              onChange('');
              selectRef.current?.focus();
            }}
          >
            ×
          </span>
        )}
      </span>
    );
  }

  return (
    <select
      ref={ref as Ref<HTMLSelectElement> | undefined}
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
