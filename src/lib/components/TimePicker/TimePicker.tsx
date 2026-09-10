import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import TimePickerCore from './TimePickerCore';

type TimePickerProps = {
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Forwarded to the underlying `<input>` — the element form bridges
   * and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type' | 'placeholder'
>;

export default function TimePicker({
  value: valueControl,
  onChange,
  placeholder,
  className,
  ref,
  ...rest
}: TimePickerProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <TimePickerCore
      ref={ref}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}

export type { TimePickerProps };
