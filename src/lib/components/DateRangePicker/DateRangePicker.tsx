import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import DateRangePickerCore from './DateRangePickerCore';

type DateRangePickerProps = {
  startDate?: ControlOrValue<string>;
  endDate?: ControlOrValue<string>;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
  separator?: ReactNode;
  /**
   * Number of month grids in the range panel. `2` renders an inline
   * dual-month calendar below the inputs for visual range picking
   * (first pick sets the start, second completes the range).
   * @default 1
   */
  months?: 1 | 2;
  className?: string;
};

export default function DateRangePicker({
  startDate: startDateControl,
  endDate: endDateControl,
  onStartChange,
  onEndChange,
  separator,
  months,
  className,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useControl(
    startDateControl,
    ''
  );
  const [endDate, setEndDate] = useControl(
    endDateControl,
    ''
  );

  return (
    <DateRangePickerCore
      startDate={startDate}
      endDate={endDate}
      onStartChange={(next) => {
        setStartDate(next);
        onStartChange?.(next);
      }}
      onEndChange={(next) => {
        setEndDate(next);
        onEndChange?.(next);
      }}
      separator={separator}
      months={months}
      className={className}
    />
  );
}

export type { DateRangePickerProps };
