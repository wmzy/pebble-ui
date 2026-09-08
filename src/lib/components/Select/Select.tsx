import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

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
   * Value callback for both modes: `string` in single mode, `string[]`
   * when `multiple` is set — fired after the value updates. The native
   * select `change` event stays available through `onChange` in single
   * mode (the historical contract); multiple mode has no native event.
   */
  onValuesChange?: (value: string | string[]) => void;
  /**
   * Placeholder text for the multiple trigger (falls back to the
   * `select.placeholder` locale string). A native `<select>` has no
   * placeholder attribute, so single mode consumes and drops it.
   */
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'select'>, 'value' | 'size' | 'multiple'>;

export default function Select({
  value: valueControl,
  multiple = false,
  size,
  className,
  children,
  onChange,
  onValuesChange,
  placeholder,
  ...rest
}: SelectProps) {
  const [value, setValue] = useControl(valueControl, multiple ? [] : '');

  const handleValueChange = (next: string | string[]) => {
    setValue(next);
    onValuesChange?.(next);
  };

  return (
    <SelectCore
      value={value}
      onChange={handleValueChange}
      onNativeChange={multiple ? undefined : onChange}
      multiple={multiple}
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
