import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import InputCore from './InputCore';

type InputProps = {
  value?: ControlOrValue<string>;
  size?: 'sm' | 'md' | 'lg';
  /** Forwarded to the underlying `<input>` — the element form bridges
   * (react-f0rm `focusRef`), tests and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
} & Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'size'>;

export default function Input({
  value: valueControl,
  size,
  className,
  onChange,
  ref,
  ...rest
}: InputProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <InputCore
      ref={ref}
      value={value}
      onChange={setValue}
      onNativeChange={onChange}
      size={size}
      className={className}
      {...rest}
    />
  );
}

export type { InputProps };
