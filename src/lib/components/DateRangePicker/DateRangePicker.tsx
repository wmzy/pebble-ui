import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { DateRangePickerPreset } from './DateRangePickerCore';

import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';

import DateRangePickerCore from './DateRangePickerCore';

import { commonRangePresets } from './presets';

/**
 * Shortcut rows for the range panel: `'common'` selects the built-in
 * set (today / yesterday / last 7 days / last 30 days / this month /
 * last month, localized by the LocaleProvider), plain objects are
 * custom rows, and an array may mix both — `'common'` inside an array
 * splices the built-ins in at that position, so customs append after
 * them as `['common', { label, range }]`.
 */
type DateRangePickerPresets =
  | 'common'
  | readonly ('common' | DateRangePickerPreset)[];

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
  /** Disables individual dates on the panel's Calendar (see Calendar's
   * `disabledDate`). */
  disabledDate?: (date: Date) => boolean;
  /** Shortcut rows at the top of the panel; clicking applies the
   * preset's range to the start/end pair. `'common'` enables the
   * built-in set; a custom array lists its own rows and may include
   * `'common'` to prepend the built-ins (see
   * {@link DateRangePickerPresets}). */
  presets?: DateRangePickerPresets;
  className?: string;
};

/** Localized built-in labels pulled from the `dateRangePicker` strings
 * section, reshaped for {@link commonRangePresets}. */
type CommonPresetLabelsView = {
  today: string;
  yesterday: string;
  last7Days: string;
  last30Days: string;
  thisMonth: string;
  lastMonth: string;
};

/** Expand the `presets` prop into the concrete row list the Core
 * renders — built-ins resolved from the localized labels, custom rows
 * kept as given. */
function resolvePresets(
  presets: DateRangePickerPresets | undefined,
  labels: CommonPresetLabelsView
): DateRangePickerPreset[] | undefined {
  if (presets === undefined) return undefined;
  const specs: readonly ('common' | DateRangePickerPreset)[] =
    presets === 'common' ? ['common'] : presets;
  const rows: DateRangePickerPreset[] = [];
  for (const spec of specs) {
    if (spec === 'common') {
      rows.push(...commonRangePresets(labels));
    } else {
      rows.push(spec);
    }
  }
  return rows;
}

export default function DateRangePicker({
  startDate: startDateControl,
  endDate: endDateControl,
  onStartChange,
  onEndChange,
  separator,
  months,
  disabledDate,
  presets,
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
  const strings = useStrings('dateRangePicker');

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
      disabledDate={disabledDate}
      presets={resolvePresets(presets, {
        today: strings.presetToday,
        yesterday: strings.presetYesterday,
        last7Days: strings.presetLast7Days,
        last30Days: strings.presetLast30Days,
        thisMonth: strings.presetThisMonth,
        lastMonth: strings.presetLastMonth,
      })}
      className={className}
    />
  );
}

export type { DateRangePickerProps, DateRangePickerPresets };
