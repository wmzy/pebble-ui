import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import SwitchCore from './SwitchCore';

type SwitchProps = {
  checked?: ControlOrValue<boolean>;
  size?: 'sm' | 'md' | 'lg';
  /** Forwarded to the underlying switch `<button>` — form bridges and
   * `ref.current.focus()` reach. */
  ref?: Ref<HTMLButtonElement>;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'checked' | 'onChange'>;

export default function Switch({
  checked: checkedControl,
  size,
  className,
  onClick,
  ref,
  ...rest
}: SwitchProps) {
  const [checked, setChecked] = useControl(
    checkedControl,
    false
  );

  return (
    <SwitchCore
      ref={ref}
      checked={checked}
      onChange={setChecked}
      onNativeClick={onClick}
      size={size}
      className={className}
      {...rest}
    />
  );
}

export type { SwitchProps };
