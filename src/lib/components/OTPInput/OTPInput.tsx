import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import OTPInputCore from './OTPInputCore';

type OTPInputProps = {
  length?: number;
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  className?: string;
  /** Forwarded to the first cell's `<input>` — the element form bridges
   * and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
};

export default function OTPInput({
  length,
  value: valueControl,
  onChange,
  className,
  ref,
}: OTPInputProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <OTPInputCore
      ref={ref}
      length={length}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      className={className}
    />
  );
}

export type { OTPInputProps };
