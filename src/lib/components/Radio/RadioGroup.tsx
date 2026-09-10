import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import RadioGroupCore from './RadioGroupCore';

type RadioGroupProps = {
  value?: ControlOrValue<string>;
  name?: string;
  className?: string;
  children: ReactNode;
  /**
   * Forwarded to the group's focus target — the checked radio `<input>`
   * (falling back to the first), matching where a browser Tab lands —
   * so form bridges and `ref.current.focus()` reach the group.
   */
  ref?: Ref<HTMLInputElement>;
};

export default function RadioGroup({
  value: valueControl,
  name,
  className,
  children,
  ref,
}: RadioGroupProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <RadioGroupCore
      ref={ref}
      value={value}
      onChange={setValue}
      name={name}
      className={className}
    >
      {children}
    </RadioGroupCore>
  );
}

export type { RadioGroupProps };
