import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { SelectVirtualizedConfig } from './SelectFloating';

import { useControl } from 'react-use-control';

import SelectCore from './SelectCore';

type SelectProps = {
  /** `string` in single mode, `string[]` when `multiple` is set. */
  value?: ControlOrValue<string | string[]>;
  /**
   * Multiple selection mode (see SelectCoreProps.multiple). The
   * uncontrolled empty value is `[]` in this mode, `''` otherwise.
   */
  multiple?: boolean;
  /**
   * Searchable single select (see SelectCoreProps.searchable): swaps
   * the native `<select>` for the floating listbox with a panel-top
   * search input — typing filters, ↑/↓ highlight, Enter picks, Escape
   * closes. In multiple mode the same search input appears in the
   * listbox panel instead.
   */
  searchable?: boolean;
  /**
   * Clear affordance (see SelectCoreProps.clearable): a pointer-only ×
   * revealed on hover/focus-within empties the value (`[]` / `''`)
   * without toggling the panel; Backspace is the keyboard parity path.
   */
  clearable?: boolean;
  /**
   * Async option state (see SelectCoreProps.loading): the floating
   * panel's options area shows a Spinner with `aria-busy="true"` and
   * suspends search filtering until it clears.
   */
  loading?: boolean;
  /**
   * Multiple mode only (see SelectCoreProps.maxTagCount): cap the
   * rendered Chips; the overflow collapses into a `+N` badge whose
   * `title` lists the hidden labels.
   */
  maxTagCount?: number;
  /**
   * Render the floating option list through VirtualList so long option
   * lists mount only the visible window (plus overscan). Default
   * (omitted/`false`) keeps the plain DOM path; single mode without
   * `searchable` ignores it — the native `<select>` handles long lists
   * natively.
   */
  virtualized?: boolean | SelectVirtualizedConfig;
  /**
   * Value callback for both modes: `string` in single mode, `string[]`
   * when `multiple` is set — fired after the value updates. The native
   * select `change` event stays available through `onChange` in single
   * mode (the historical contract); the floating paths have no native
   * event.
   */
  onValuesChange?: (value: string | string[]) => void;
  /**
   * Placeholder text for the floating triggers (falls back to the
   * `select.placeholder` locale string). A native `<select>` has no
   * placeholder attribute, so plain single mode consumes and drops it.
   */
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Forwarded to the focusable element — the native `<select>` in plain
   * and clearable single mode, the trigger `<button>` when `multiple`
   * or `searchable` render the floating engine. Form bridges and
   * `ref.current.focus()` reach whichever mode renders.
   */
  ref?: Ref<HTMLSelectElement | HTMLButtonElement>;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'select'>, 'value' | 'size' | 'multiple'>;

export default function Select({
  value: valueControl,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  maxTagCount,
  virtualized,
  size,
  className,
  children,
  onChange,
  onValuesChange,
  placeholder,
  ref,
  ...rest
}: SelectProps) {
  const [value, setValue] = useControl(valueControl, multiple ? [] : '');

  const handleValueChange = (next: string | string[]) => {
    setValue(next);
    onValuesChange?.(next);
  };

  return (
    <SelectCore
      ref={ref}
      value={value}
      onChange={handleValueChange}
      onNativeChange={multiple || searchable ? undefined : onChange}
      multiple={multiple}
      searchable={searchable}
      clearable={clearable}
      loading={loading}
      maxTagCount={maxTagCount}
      virtualized={virtualized}
      size={size}
      className={className}
      placeholder={placeholder}
      {...rest}
    >
      {children}
    </SelectCore>
  );
}

export type { SelectProps };
