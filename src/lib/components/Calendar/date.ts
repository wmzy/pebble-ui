/**
 * Pure calendar-date math for the Calendar grid, extracted from Calendar.tsx.
 *
 * Semantics — naive local civil time:
 *
 * - Every `(year, month, day)` triple denotes a civil calendar date realized
 *   as a *local* Date at midnight via `new Date(year, month, day)`. The UTC
 *   constructor (`new Date(Date.UTC(…))`) is deliberately never used, and
 *   `new Date('YYYY-MM-DD')` — which parses as UTC midnight and therefore
 *   shifts a day in zones behind UTC — is never a source of truth here.
 * - DST transitions move wall-clock hours (typically 02:00/03:00), never
 *   midnight, so constructing a local midnight and reading back
 *   `getFullYear`/`getMonth`/`getDate` round-trips exactly even on
 *   spring-forward and fall-back days.
 * - Months are 0-based (`Date#getMonth` semantics: 0 = January, 11 =
 *   December). All functions are pure: they only read the local zone to
 *   query weekdays of civil dates they constructed themselves, and never
 *   normalize dates through out-of-range days (the classic
 *   `new Date(y, m + 1, 31)` rollover hazard).
 */

/** One cell of the Calendar grid; `outside` marks days of adjacent months. */
export type CalendarCell = {
  day: number;
  month: number;
  year: number;
  outside: boolean;
};

/**
 * Number of days in a month, via day 0 of the following month
 * (`new Date(year, month + 1, 0).getDate()`). Out-of-range months
 * normalize through the Date constructor, so `month` may be `-1` or `12`
 * and still yields the true length of the adjacent month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Shift a `(year, month)` view by `delta` months with year carry, e.g.
 * `(2026, 11) + 1 → { year: 2027, month: 0 }`. Pure integer arithmetic on
 * the month index — no Date is constructed, so navigating from a long month
 * into a short one (Jan 31 → February) can never roll a phantom day 29–31
 * over into the next month the way `new Date(y, m + 1, 31)` would.
 */
export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/**
 * Number of leading cells (previous-month days) before day 1 of the month,
 * for a grid whose first column is `weekStart` (`Date#getDay` semantics:
 * 0 = Sunday, 1 = Monday). The weekday of day 1 is read from the
 * local-midnight Date of that civil date; DST never moves midnight, so the
 * offset is stable across transitions.
 */
export function getLeadingDays(
  year: number,
  month: number,
  weekStart: number
): number {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  return (firstDayOfWeek - weekStart + 7) % 7;
}

/**
 * Flat list of grid cells for one month view: `getLeadingDays` previous-month
 * days, then every day of the month itself, then just enough next-month days
 * to complete the final week row. When the month already fills its rows
 * exactly (e.g. a Sunday-first February with 28 days), no padding row is
 * added. The result length is always a multiple of 7.
 */
export function buildMonthCells(
  year: number,
  month: number,
  weekStart: number
): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const leadingDays = getLeadingDays(year, month, weekStart);
  const prev = addMonths(year, month, -1);
  const prevMonthDays = getDaysInMonth(prev.year, prev.month);

  for (let i = leadingDays - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      month: prev.month,
      year: prev.year,
      outside: true,
    });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, month, year, outside: false });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const next = addMonths(year, month, 1);
    for (let day = 1; day <= remaining; day++) {
      cells.push({ day, month: next.month, year: next.year, outside: true });
    }
  }
  return cells;
}

/**
 * ISO 8601 week number of a civil date. ISO weeks run Monday–Sunday and
 * week 1 is the week containing the year's first Thursday, so days at the
 * year's edges borrow the neighbor year's numbering (2025-12-31 is week 1
 * of 2026; 2027-01-01 is week 53 of 2026). The weekday is read from the
 * local-midnight Date of the civil triple (a calendar date's weekday is a
 * civil property, identical in every zone); the day arithmetic then moves
 * to UTC milliseconds — whole-day multiples with no DST drift — to reach
 * the week's Thursday, whose year is the ISO year, and counts seven-day
 * spans from that ISO year's January 1.
 */
export function getISOWeekNumber(
  year: number,
  month: number,
  day: number
): number {
  const weekday = new Date(year, month, day).getDay();
  const isoWeekday = weekday === 0 ? 7 : weekday;
  const thursdayMs = Date.UTC(year, month, day + 4 - isoWeekday);
  const isoYear = new Date(thursdayMs).getUTCFullYear();
  const days = (thursdayMs - Date.UTC(isoYear, 0, 1)) / 86400000;
  return Math.floor(days / 7) + 1;
}

/**
 * Format a civil date as the `"YYYY-MM-DD"` string Calendar uses as its
 * value. Value semantics: the string denotes the **local** civil date — it
 * is a plain calendar date, not a UTC timestamp (parsing it with
 * `new Date('YYYY-MM-DD')` yields UTC midnight and shifts a day in zones
 * behind UTC). Pure string math; no Date construction.
 */
export function formatDate(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Parse a `"YYYY-MM-DD"` value string into a local-midnight Date — the
 * inverse of {@link formatDate} and the only safe way to turn a value into
 * a Date (`new Date('YYYY-MM-DD')` parses as UTC midnight and shifts a
 * day in zones behind UTC, e.g. `'2026-03-01'` lands on local Feb 28 in
 * America/New_York). Returns `null` for anything that is not a real
 * calendar date (`'2026-02-30'`, `'2026-13-01'`, malformed input),
 * leaving the caller free to fall back to today.
 */
export function parseCivilDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > getDaysInMonth(year, month)) return null;
  const date = new Date(year, month, day);
  // Belt and braces: a local midnight always round-trips its civil date
  // (DST never moves midnight), so any drift means an invalid input
  // slipped through the arithmetic checks above.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
