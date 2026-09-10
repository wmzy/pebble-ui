import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import CheckboxCore from './CheckboxCore';

type CheckboxProps = {
  checked?: ControlOrValue<boolean>;
  label?: ReactNode;
  /** Forwarded to the underlying checkbox `<input>` (or through the
   * label wrapper to it) — form bridges and `ref.current.focus()`
   * reach. */
  ref?: Ref<HTMLInputElement>;
} & Omit<ComponentPropsWithoutRef<'input'>, 'checked' | 'type'>;

export default function Checkbox({
  checked: checkedControl,
  className,
  label,
  onChange,
  ref,
  ...rest
}: CheckboxProps) {
  const [checked, setChecked] = useControl(
    checkedControl,
    false
  );

  return (
    <CheckboxCore
      ref={ref}
      checked={checked}
      onChange={setChecked}
      onNativeChange={onChange}
      className={className}
      label={label}
      {...rest}
    />
  );
}

export type { CheckboxProps };
