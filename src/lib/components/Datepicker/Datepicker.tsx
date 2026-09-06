import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import DatepickerCore from './DatepickerCore';

type DatepickerProps = {
  value?: ControlOrValue<string>;
  open?: ControlOrValue<boolean>;
  min?: string;
  max?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
  placeholder?: string;
  className?: string;
};

export default function Datepicker({
  value: valueControl,
  open: openControl,
  min,
  max,
  locale,
  weekStartsOn,
  placeholder,
  className,
}: DatepickerProps) {
  const [value, setValue] = useControl(valueControl, '');
  const [open, setOpen] = useControl(openControl, false);

  return (
    <DatepickerCore
      value={value}
      onChange={setValue}
      open={open}
      onOpenChange={setOpen}
      min={min}
      max={max}
      locale={locale}
      weekStartsOn={weekStartsOn}
      placeholder={placeholder}
      className={className}
    />
  );
}

export type { DatepickerProps };
