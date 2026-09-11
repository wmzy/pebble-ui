/**
 * Serialization helpers for Datepicker's `showTime` mode.
 *
 * The combined value is the day-grid `"YYYY-MM-DD"` value (see
 * Calendar/date.ts — a local civil date, never a UTC timestamp) plus a
 * space and a 24-hour `"HH:mm"` time: `"2026-03-01 09:30"`. Without
 * `showTime` the value keeps the plain date format, and a plain date
 * stays a valid input with `showTime` on (the time then reads as
 * unset, defaulting to `00:00` on the next pick).
 */

import { parseCivilDate } from '../Calendar/date';

/** `"YYYY-MM-DD HH:mm"` — one to 23 hours, two-digit padded. */
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2}) (2[0-3]|[01]\d):([0-5]\d)$/;

/**
 * Split a value into its date and time parts. Accepts the combined
 * `"YYYY-MM-DD HH:mm"` form (returning both parts) and the bare
 * `"YYYY-MM-DD"` form (returning `time: null` — the backward-compatible
 * pure-date value). Returns `null` for anything that is not a real
 * calendar date, leaving the caller free to fall back to empty.
 */
export function splitDateTimeValue(
  value: string
): { date: string; time: string | null } | null {
  const withTime = DATE_TIME_PATTERN.exec(value);
  if (withTime) {
    const date = withTime[1]!;
    // Reject impossible days (`"2026-02-30 10:00"`) the same way the
    // pure-date parse does.
    if (!parseCivilDate(date)) return null;
    return { date, time: `${withTime[2]}:${withTime[3]}` };
  }
  return parseCivilDate(value) ? { date: value, time: null } : null;
}

/**
 * Combine a `"YYYY-MM-DD"` date and an `"HH:mm"` time into the
 * `"YYYY-MM-DD HH:mm"` value. Pure string join — both inputs are
 * expected in their already-serialized forms.
 */
export function formatDateTimeValue(date: string, time: string): string {
  return `${date} ${time}`;
}
