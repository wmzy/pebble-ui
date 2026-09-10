import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { CalendarPickerMode } from '../Calendar/Calendar';

import type { DatepickerPreset } from './DatepickerCore';

import { useControl } from 'react-use-control';

import DatepickerCore from './DatepickerCore';

type DatepickerProps = {
  value?: ControlOrValue<string>;
  open?: ControlOrValue<boolean>;
  /** Calendar granularity — 'date' (default), 'month', 'quarter' or
   * 'year'. `value` serializes per mode: "YYYY-MM-DD", "YYYY-MM",
   * "YYYY-Qn" or "YYYY". */
  picker?: CalendarPickerMode;
  min?: string;
  max?: string;
  /** Disables individual dates on the calendar panel (see Calendar's
   * `disabledDate`). */
  disabledDate?: (date: Date) => boolean;
  /** Shortcut rows at the top of the panel; clicking applies the
   * preset's value and closes the panel. */
  presets?: DatepickerPreset[];
  locale?: string;
  weekStartsOn?: 0 | 1;
  placeholder?: string;
  className?: string;
  /** Forwarded to the trigger `<input>` (not the wrapper div) — the
   * element form bridges and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
};

export default function Datepicker({
  value: valueControl,
  open: openControl,
  picker,
  min,
  max,
  disabledDate,
  presets,
  locale,
  weekStartsOn,
  placeholder,
  className,
  ref,
}: DatepickerProps) {
  const [value, setValue] = useControl(valueControl, '');
  const [open, setOpen] = useControl(openControl, false);

  return (
    <DatepickerCore
      ref={ref}
      value={value}
      onChange={setValue}
      open={open}
      onOpenChange={setOpen}
      picker={picker}
      min={min}
      max={max}
      disabledDate={disabledDate}
      presets={presets}
      locale={locale}
      weekStartsOn={weekStartsOn}
      placeholder={placeholder}
      className={className}
    />
  );
}

export type { DatepickerProps };
