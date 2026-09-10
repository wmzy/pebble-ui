import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { SegmentedOption } from './SegmentedCore';

import { useControl } from 'react-use-control';

import SegmentedCore from './SegmentedCore';

type SegmentedProps = {
  options: SegmentedOption[];
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /**
   * Forwarded to the group's focus target — the selected option's
   * `<button>` (falling back to the first) — so form bridges and
   * `ref.current.focus()` reach the group.
   */
  ref?: Ref<HTMLButtonElement>;
};

export default function Segmented({
  options,
  value: valueControl,
  onChange,
  size,
  className,
  ref,
}: SegmentedProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <SegmentedCore
      ref={ref}
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      size={size}
      className={className}
    />
  );
}

export type { SegmentedProps, SegmentedOption };
