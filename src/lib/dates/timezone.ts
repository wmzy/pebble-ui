/**
 * Time-zone formatting utilities on top of `Intl.DateTimeFormat`.
 *
 * Both functions construct their formatter per call — correct and
 * dependency-free; callers on hot paths should hoist their own
 * `Intl.DateTimeFormat` instead.
 */

/** Wall-clock parts of an instant inside a time zone. `month` is 0-based
 * (the same `Date#getMonth` convention as the dates adapters and
 * Calendar's date.ts), `hour` runs 0–23 (`h23` cycle). */
export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/**
 * Format an instant in a named IANA time zone.
 *
 * `options` are passed through to `Intl.DateTimeFormat` (any locale or
 * calendar preferences come from the runtime's default locale), with one
 * override: an explicit `timeZone` inside `options` loses to the
 * `timeZone` parameter. Throws the `RangeError` Intl emits for an
 * unknown zone (or an invalid Date) — callers validate zones they do
 * not control.
 */
export function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(
    date
  );
}

/**
 * Zoned wall-clock parts (`year`/`month`/`day`/`hour`/`minute`) of an
 * instant — the pieces a zoned date picker or scheduler compares. The
 * formatter pins `en-US` (gregorian digits) and `h23` so the numbers are
 * deterministic; localization is `formatInTimeZone`'s job. Throws the
 * `RangeError` Intl emits for an unknown zone.
 */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const zoned: ZonedParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
  for (const part of parts) {
    if (part.type === 'year') zoned.year = Number(part.value);
    else if (part.type === 'month') zoned.month = Number(part.value) - 1;
    else if (part.type === 'day') zoned.day = Number(part.value);
    else if (part.type === 'hour') zoned.hour = Number(part.value);
    else if (part.type === 'minute') zoned.minute = Number(part.value);
  }
  return zoned;
}
