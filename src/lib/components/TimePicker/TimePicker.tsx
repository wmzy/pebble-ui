import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { TimeParts, TimePickerFormat } from './time';

import { useControl } from 'react-use-control';

import TimePickerCore from './TimePickerCore';
import TimePickerPanel from './TimePickerPanel';

type TimePickerProps = {
  value?: ControlOrValue<string>;
  /** Panel visibility; defaults to the trigger's own toggle state. */
  open?: ControlOrValue<boolean>;
  onChange?: (value: string) => void;
  /**
   * Column granularity and the value's serialization shape. The panel
   * shows hour/minute columns for `'HH:mm'` (default) and adds a second
   * column for `'HH:mm:ss'`; `value` always serializes to match.
   */
  format?: TimePickerFormat;
  /** Hour column step — only multiples of it are offered. Default 1. */
  hourStep?: number;
  /** Minute column step — only multiples of it are offered. Default 1. */
  minuteStep?: number;
  /** Second column step — only multiples of it are offered. Default 1. */
  secondStep?: number;
  /**
   * Presents a 12-hour clock column plus an AM/PM column. The value
   * stays 24-hour `"HH:mm[:ss]"` either way (12:34 AM is `00:34`).
   */
  use12Hours?: boolean;
  /**
   * Disables candidate times on the panel's columns: return `true` to
   * make that cell unselectable (muted + not clickable). Each candidate
   * is judged against the currently selected parts of the other
   * fields, so a disabled hour re-evaluates as minutes change.
   */
  disabledTime?: (parts: TimeParts) => boolean;
  /**
   * Falls back to the bare native `<input type="time">` form
   * (TimePickerCore) — the panel props above do not apply to it.
   */
  native?: boolean;
  placeholder?: string;
  className?: string;
  /** Forwarded to the trigger `<input>` — the element form bridges and
   * `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type' | 'placeholder' | 'defaultValue'
>;

export default function TimePicker({
  value: valueControl,
  open: openControl,
  onChange,
  format = 'HH:mm',
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  use12Hours = false,
  disabledTime,
  native = false,
  placeholder,
  className,
  ref,
  ...rest
}: TimePickerProps) {
  const [value, setValue] = useControl(valueControl, '');
  const [open, setOpen] = useControl(openControl, false);

  const commit = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  if (native) {
    return (
      <TimePickerCore
        ref={ref}
        value={value}
        onChange={commit}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <TimePickerPanel
      ref={ref}
      value={value}
      onChange={commit}
      open={open}
      onOpenChange={setOpen}
      format={format}
      hourStep={hourStep}
      minuteStep={minuteStep}
      secondStep={secondStep}
      use12Hours={use12Hours}
      disabledTime={disabledTime}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}

export type { TimePickerProps };
