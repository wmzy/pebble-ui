import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { CalendarCellRender, CalendarPickerMode } from '../Calendar/Calendar';

import type { DatepickerPreset } from './DatepickerCore';

import { useControl } from 'react-use-control';

import DatepickerCore from './DatepickerCore';

type DatepickerProps = {
  value?: ControlOrValue<string>;
  open?: ControlOrValue<boolean>;
  /** Calendar granularity — 'date' (default), an ISO week 'week',
   * 'month', 'quarter' or 'year'. `value` serializes per mode:
   * "YYYY-MM-DD", "YYYY-Www", "YYYY-MM", "YYYY-Qn" or "YYYY". */
  picker?: CalendarPickerMode;
  min?: string;
  max?: string;
  /** Disables individual dates on the calendar panel (see Calendar's
   * `disabledDate`) — day grid and header drill-down grids alike. */
  disabledDate?: (date: Date) => boolean;
  /** Shortcut rows at the top of the panel; clicking applies the
   * preset's value and closes the panel. */
  presets?: DatepickerPreset[];
  /** Adds a time input (hour/minute, or seconds with
   * `{ seconds: true }`) below the calendar; `value` serializes as
   * `"YYYY-MM-DD HH:mm"` / `"YYYY-MM-DD HH:mm:ss"` instead of
   * `"YYYY-MM-DD"` (plain-date values stay accepted). Date granularity
   * only. */
  showTime?: boolean | { seconds?: boolean };
  /** Custom serialization for picks, replacing the built-in value
   * format (see DatepickerCore's `format`). */
  format?: (date: Date) => string;
  /** Reads a custom-formatted value back into the calendar (see
   * DatepickerCore's `parse`). */
  parse?: (text: string) => Date | null;
  /** Appends custom content inside the panel's picker cells (see
   * Calendar's `cellRender`). */
  cellRender?: CalendarCellRender;
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
  showTime,
  format,
  parse,
  locale,
  weekStartsOn,
  cellRender,
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
      showTime={showTime}
      format={format}
      parse={parse}
      locale={locale}
      weekStartsOn={weekStartsOn}
      cellRender={cellRender}
      placeholder={placeholder}
      className={className}
    />
  );
}

export type { DatepickerProps };
