import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import NumberInputCore from './NumberInputCore';

type NumberInputProps = {
  value?: ControlOrValue<number>;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Forwarded to the inner number `<input>` (not the wrapper div) —
   * the element form bridges and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'size'>;

export default function NumberInput({
  value: valueControl,
  min,
  max,
  step,
  size,
  className,
  onChange,
  ref,
  ...rest
}: NumberInputProps) {
  const [value, setValue] = useControl(valueControl, 0);

  return (
    <NumberInputCore
      ref={ref}
      value={value}
      onChange={setValue}
      onNativeChange={onChange}
      min={min}
      max={max}
      step={step}
      size={size}
      className={className}
      {...rest}
    />
  );
}

export type { NumberInputProps };
