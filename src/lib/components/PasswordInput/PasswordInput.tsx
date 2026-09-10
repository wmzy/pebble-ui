import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import PasswordInputCore from './PasswordInputCore';

type PasswordInputProps = {
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Forwarded to the inner password `<input>` (not the wrapper div) —
   * the element form bridges and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
};

export default function PasswordInput({
  value: valueControl,
  onChange,
  placeholder,
  disabled,
  className,
  ref,
}: PasswordInputProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <PasswordInputCore
      ref={ref}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}

export type { PasswordInputProps };
