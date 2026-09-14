/**
 * Calendar-agnostic date adapter contract.
 *
 * `src/lib/components/Calendar/date.ts` owns the complete Gregorian math
 * (month lengths, view shifts, ISO weeks, value parsing); this module is
 * the adapter layer above it that lets consumers reason about *any*
 * calendar's civil dates. The contract is deliberately shaped after the
 * operations Calendar actually performs on dates — month lengths for grid
 * building, month shifts for view navigation, name lists for headers —
 * nothing more.
 *
 * Semantics (inherited from date.ts): every `(year, month, day)` triple is
 * a civil calendar date realized as a *local* Date at midnight. DST
 * transitions never move midnight, so `toGregorian` output always
 * round-trips through `fromGregorian` exactly, and internal conversion
 * arithmetic rides the UTC civil timeline (whole-day millisecond spans
 * with no DST drift) before materializing the local-midnight result.
 */

/** Civil date parts in a specific calendar. `month` is 0-based — the
 * same `Date#getMonth` convention every date.ts function uses (0 = the
 * calendar's first month, 11 = its last) — while `day` is 1-based. */
export type CivilDateParts = {
  year: number;
  month: number;
  day: number;
};

/** Calendars with a built-in adapter. `islamic-umalqura` is the
 * Umm al-Qura tabulation Node and browsers ship in full ICU; valid there
 * roughly 1300–1600 AH (Gregorian ~1882–2174), beyond which ICU falls
 * back to computed approximations (still self-consistent through this
 * adapter, which routes every conversion through Intl). */
export type HazeCalendarIdentifier = 'gregory' | 'islamic-umalqura';

/** Month-name width, mirroring Intl's `month` option values. */
export type MonthNameStyle = 'long' | 'short' | 'narrow';

/**
 * Operations on a calendar's civil dates. All members are pure: no
 * internal state, no mutation of arguments.
 */
export type HazeDateAdapter = {
  /** Which calendar this adapter speaks; matches the `calendar` string
   * Intl accepts. */
  readonly identifier: HazeCalendarIdentifier;

  /** Hijri/lunar-equivalent parts of a Date's **local civil date** (the
   * date.ts midnight semantics — never the UTC reading of the
   * instant). */
  fromGregorian(date: Date): CivilDateParts;

  /** Local-midnight Date of a civil date in this calendar. Out-of-range
   * month indices normalize with carry (month 12 → next January,
   * mirroring date.ts); a `day` that exists in no month of the calendar
   * throws `RangeError` — never the silent `new Date` rollover. */
  toGregorian(parts: CivilDateParts): Date;

  /** Number of days in a month. Out-of-range months normalize with
   * carry, like date.ts's Gregorian helper. */
  getDaysInMonth(year: number, month: number): number;

  /** Shift by whole calendar months with year carry, truncating the day
   * to the target month's length (1430-12-30 + 1 → next year's month 1
   * day 29 when that month has 29 days). Pure integer arithmetic on the
   * month index — no Date rollover hazards. */
  addMonths(parts: CivilDateParts, delta: number): CivilDateParts;

  /** Twelve month names, index 0 = first month of the calendar year.
   * `locale` defaults to the adapter's base presentation locale ('en'
   * for the built-ins, matching Intl's calendar-extended locales). */
  monthNames(locale?: string, style?: MonthNameStyle): string[];

  /** Era abbreviation for a year ("AH" for Hijri, "AD"/"BC" for
   * Gregorian), via Intl. Optional: consumers that render no era skip
   * it. */
  era?(year: number, locale?: string): string;
};

/**
 * Era part of a UTC-civil date in `calendar` via Intl's `era` piece —
 * the shared implementation behind both built-in adapters' `era` members
 * (internal helper; not part of the public dates surface).
 */
export function eraOfDate(
  date: Date,
  calendar: HazeCalendarIdentifier,
  locale: string
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    calendar,
    era: 'short',
    timeZone: 'UTC',
  }).formatToParts(date);
  for (const part of parts) {
    if (part.type === 'era') return part.value;
  }
  return '';
}
