import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import RatingCore from './RatingCore';

type RatingProps = {
  value?: ControlOrValue<number>;
  count?: number;
  allowHalf?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  /**
   * Forwarded to the group's focus target — the star that is the roving
   * tab stop (the current rating, or the first star) — so form bridges
   * and `ref.current.focus()` reach the group.
   */
  ref?: Ref<HTMLSpanElement>;
};

export default function Rating({
  value: valueControl,
  count,
  allowHalf,
  onChange,
  className,
  ref,
}: RatingProps) {
  const [value, setValue] = useControl(valueControl, 0);

  return (
    <RatingCore
      ref={ref}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      count={count}
      allowHalf={allowHalf}
      className={className}
    />
  );
}

export type { RatingProps };
