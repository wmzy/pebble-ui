/**
 * Built-in range presets for DateRangePicker's `presets='common'` set.
 *
 * Date arithmetic follows Calendar/date.ts semantics: every value is a
 * local civil date realized at midnight (`new Date(year, month, day)`),
 * and day shifts ride the Date constructor's day-rollover — DST never
 * moves midnight, so a shifted local midnight always round-trips its
 * civil date.
 */

import type { DateRangePickerPreset } from './DateRangePickerCore';

import { addMonths, formatDate, getDaysInMonth } from '../Calendar/date';

/** Localized labels for the built-in rows (LocaleProvider's
 * `dateRangePicker` section). */
type CommonPresetLabels = {
  today: string;
  yesterday: string;
  last7Days: string;
  last30Days: string;
  thisMonth: string;
  lastMonth: string;
};

/** Shift a local-midnight civil date by whole days. */
function shiftDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** Serialize a local-midnight civil date as "YYYY-MM-DD". */
function toValue(date: Date): string {
  return formatDate(date.getFullYear(), date.getMonth(), date.getDate());
}

/** First → last day of a month, as "YYYY-MM-DD" values. */
function monthBounds(year: number, month: number): [string, string] {
  return [
    formatDate(year, month, 1),
    formatDate(year, month, getDaysInMonth(year, month)),
  ];
}

/** The built-in shortcut rows relative to `today` (defaults to now). */
export function commonRangePresets(
  labels: CommonPresetLabels,
  today: Date = new Date()
): DateRangePickerPreset[] {
  const day = (delta: number) => toValue(shiftDays(today, delta));
  const thisMonth = monthBounds(today.getFullYear(), today.getMonth());
  const previous = addMonths(today.getFullYear(), today.getMonth(), -1);
  const lastMonth = monthBounds(previous.year, previous.month);
  return [
    { label: labels.today, range: [day(0), day(0)] },
    { label: labels.yesterday, range: [day(-1), day(-1)] },
    // Trailing windows anchored on today, inclusive of both ends.
    { label: labels.last7Days, range: [day(-6), day(0)] },
    { label: labels.last30Days, range: [day(-29), day(0)] },
    { label: labels.thisMonth, range: thisMonth },
    { label: labels.lastMonth, range: lastMonth },
  ];
}
