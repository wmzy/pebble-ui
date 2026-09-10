import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import SliderCore from './SliderCore';

type SliderProps = {
  /** `number` in single mode, `[low, high]` when `range` is set. */
  value?: ControlOrValue<number | [number, number]>;
  /**
   * Range mode (two thumbs; see SliderCoreProps.range). The uncontrolled
   * default is `[min ?? 0, max ?? 100]` in this mode, `50` otherwise.
   */
  range?: boolean;
  /**
   * Value callback for both modes: `number` in single mode,
   * `[low, high]` when `range` is set — fired after the value updates.
   * The native input `change` event stays available through `onChange`
   * (the historical contract; in range mode it fires for the input
   * currently changing).
   */
  onValuesChange?: (value: number | [number, number]) => void;
  /**
   * Forwarded to the input. In range mode a `[lowLabel, highLabel]`
   * tuple labels each thumb; a bare string labels both thumbs (two
   * identically named sliders are ambiguous — prefer the tuple).
   */
  'aria-label'?: string | [string, string];
  /**
   * Forwarded to the `<input type='range'>` — the only input in single
   * mode, the low thumb (first tab stop) in range mode.
   */
  ref?: Ref<HTMLInputElement>;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'aria-label'>;

/** A min/max attribute as a finite number, else the native default. */
function numberOr(raw: string | number | undefined, fallback: number): number {
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function Slider({
  value: valueControl,
  range = false,
  className,
  onChange,
  onValuesChange,
  ref,
  ...rest
}: SliderProps) {
  const rangeDefault: [number, number] = [
    numberOr(rest.min, 0),
    numberOr(rest.max, 100),
  ];
  const [value, setValue] = useControl<number | [number, number]>(
    valueControl,
    range ? rangeDefault : 50
  );

  const handleValueChange = (next: number | [number, number]) => {
    setValue(next);
    onValuesChange?.(next);
  };

  return (
    <SliderCore
      ref={ref}
      value={value}
      onChange={handleValueChange}
      onNativeChange={onChange}
      range={range}
      className={className}
      {...rest}
    />
  );
}

export type { SliderProps };
