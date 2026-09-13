/**
 * Serialization helpers for Datepicker's `showTime` mode.
 *
 * The combined value is the day-grid `"YYYY-MM-DD"` value (see
 * Calendar/date.ts — a local civil date, never a UTC timestamp) plus a
 * space and a 24-hour time: `"YYYY-MM-DD HH:mm"`, or
 * `"YYYY-MM-DD HH:mm:ss"` when `showTime` asks for seconds
 * (`{ seconds: true }`). Without `showTime` the value keeps the plain
 * date format, and a plain date stays a valid input with `showTime` on
 * (the time then reads as unset, defaulting to midnight on the next
 * pick).
 */

import { parseCivilDate } from '../Calendar/date';

/** `"YYYY-MM-DD HH:mm"` / `"YYYY-MM-DD HH:mm:ss"` — one to 23 hours and
 * two-digit padded minutes, seconds only when the pattern carries them. */
const DATE_TIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2}) (2[0-3]|[01]\d):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * Split a value into its date and time parts. Accepts the combined
 * `"YYYY-MM-DD HH:mm"` and `"YYYY-MM-DD HH:mm:ss"` forms (returning
 * `time` in the same shape — with seconds only when the input had them)
 * and the bare `"YYYY-MM-DD"` form (returning `time: null` — the
 * backward-compatible pure-date value). Returns `null` for anything that
 * is not a real calendar date, leaving the caller free to fall back to
 * empty.
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
    const time =
      withTime[4] !== undefined
        ? `${withTime[2]}:${withTime[3]}:${withTime[4]}`
        : `${withTime[2]}:${withTime[3]}`;
    return { date, time };
  }
  return parseCivilDate(value) ? { date: value, time: null } : null;
}

/**
 * Combine a `"YYYY-MM-DD"` date and an `"HH:mm"` / `"HH:mm:ss"` time
 * into the combined value. Pure string join — both inputs are expected
 * in their already-serialized forms.
 */
export function formatDateTimeValue(date: string, time: string): string {
  return `${date} ${time}`;
}

/**
 * Match a parsed time to the active precision: seconds mode pads a
 * minute-only value with `:00`, minute mode drops stray seconds. Pure
 * string math over the `"HH:mm"` / `"HH:mm:ss"` shapes.
 */
export function normalizeTime(time: string, seconds: boolean): string {
  if (seconds) return time.length === 5 ? `${time}:00` : time;
  return time.slice(0, 5);
}

/**
 * Serialize a Date's wall-clock time as the `"HH:mm"` (or
 * `"HH:mm:ss"` with `seconds`) string the combined value and the time
 * input use. Inverse of {@link applyTimeToCivilDate} for the time part.
 */
export function timeOf(date: Date, seconds: boolean): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return seconds ? `${base}:${pad(date.getSeconds())}` : base;
}

/**
 * Apply an `"HH:mm"` / `"HH:mm:ss"` string to a civil date's local
 * wall clock, returning a new Date (the input is untouched). Feeds the
 * consumer `format` hook, which serializes whole Date objects.
 */
export function applyTimeToCivilDate(date: Date, time: string): Date {
  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
}
