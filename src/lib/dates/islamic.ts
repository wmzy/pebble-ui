/**
 * Islamic (Hijri) adapter for the Umm al-Qura tabulation — the calendar
 * Node 20+ and every modern browser ship in full ICU
 * (`islamic-umalqura`). There is no `new HijriDate()`, so both
 * conversion directions route through Intl: forward via
 * `formatToParts` on the UTC civil timeline, backward via a seeded
 * linear search that refines against the forward conversion until the
 * round-trip matches exactly. All arithmetic is whole-day UTC
 * milliseconds (no DST drift); results materialize as local-midnight
 * Dates per the date.ts civil semantics.
 *
 * ICU's Umm al-Qura data covers roughly 1300–1600 AH; outside that span
 * ICU falls back to computed months, which this adapter stays
 * self-consistent with (every conversion still passes through Intl).
 */
import type {
  CivilDateParts,
  HazeDateAdapter,
  MonthNameStyle,
} from './adapter';

import { addMonths as shiftMonth } from '../components/Calendar/date';

import { eraOfDate } from './adapter';

/** Mean synodic month in days — the linear estimate that seeds the
 * inverse-conversion search. */
const SYNODIC_MONTH = 29.530588853;
const DAY_MS = 86400000;

const partsFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** Hijri parts of a UTC-civil instant. `formatToParts` months are
 * 1-based, normalized here to the 0-based date.ts convention. */
function partsFromMs(ms: number): CivilDateParts {
  const parts: CivilDateParts = { year: 0, month: 0, day: 0 };
  for (const part of partsFormatter.formatToParts(new Date(ms))) {
    if (part.type === 'year') parts.year = Number(part.value);
    else if (part.type === 'month') parts.month = Number(part.value) - 1;
    else if (part.type === 'day') parts.day = Number(part.value);
  }
  return parts;
}

/** Search anchor: 2026-01-01 = 1447-07-12 AH (verified against Intl,
 * see islamic.test.ts's fixed pairs). Any anchor works — the search
 * converges from wherever it starts — this one sits mid-range of the
 * tabulated data. */
const PROBE_MS = Date.UTC(2026, 0, 1);
const PROBE_PARTS = partsFromMs(PROBE_MS);

/**
 * UTC-civil milliseconds of day 1 in a Hijri month (month assumed
 * normalized to 0–11). Seeds from the synodic-month estimate off the
 * probe anchor, then refines with a correction anchored at day 1 — the
 * candidate's own day-of-month is subtracted out, so a candidate sitting
 * on the last day of the previous month steps forward one day instead of
 * oscillating around the boundary. Converges in at most a couple of
 * iterations across the whole 1300–1600 AH tabulation (16 as a guard);
 * throws `RangeError` if it ever does not.
 */
function monthStartMs(year: number, month: number): number {
  const monthDelta =
    (year - PROBE_PARTS.year) * 12 + (month - PROBE_PARTS.month);
  let ms = PROBE_MS + Math.round(monthDelta * SYNODIC_MONTH) * DAY_MS;
  for (let attempt = 0; attempt < 16; attempt++) {
    const candidate = partsFromMs(ms);
    if (
      candidate.year === year &&
      candidate.month === month &&
      candidate.day === 1
    ) {
      return ms;
    }
    const errorMonths =
      (candidate.year - year) * 12 + (candidate.month - month);
    ms -=
      Math.round((candidate.day - 1) + errorMonths * SYNODIC_MONTH) * DAY_MS;
  }
  throw new RangeError(
    `Not an islamic-umalqura date: ${year}-${month + 1}-1`
  );
}

/**
 * UTC-civil milliseconds of a Hijri date. Out-of-range month indices
 * normalize with carry first (date.ts constructor semantics: month 12 →
 * next January), the day offset rides whole days from the month start,
 * and a final forward conversion verifies the landed date — a day that
 * exists in no Hijri month (31, or 30 in a 29-day month) throws
 * `RangeError` instead of silently rolling over.
 */
function msFromParts(rawParts: CivilDateParts): number {
  const total = rawParts.year * 12 + rawParts.month;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const ms = monthStartMs(year, month) + (rawParts.day - 1) * DAY_MS;
  const landed = partsFromMs(ms);
  if (landed.year !== year || landed.month !== month || landed.day !== rawParts.day) {
    throw new RangeError(
      `Not an islamic-umalqura date: ${year}-${month + 1}-${rawParts.day}`
    );
  }
  return ms;
}

export const islamicUmalquraAdapter: HazeDateAdapter = {
  identifier: 'islamic-umalqura',

  fromGregorian(date) {
    // Read the local civil date first (date.ts midnight semantics), then
    // convert on the UTC civil timeline — zone-independent by
    // construction, even for zones far from UTC.
    return partsFromMs(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
  },

  toGregorian(parts) {
    const utc = new Date(msFromParts(parts));
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  },

  getDaysInMonth(year, month) {
    // Probe: day-1 anchors of this month and the next; Hijri months are
    // whole days, so the UTC-millisecond span is an exact multiple of
    // one day.
    const next = shiftMonth(year, month, 1);
    const start = msFromParts({ year, month, day: 1 });
    const end = msFromParts({ year: next.year, month: next.month, day: 1 });
    return (end - start) / DAY_MS;
  },

  addMonths(parts, delta) {
    const shifted = shiftMonth(parts.year, parts.month, delta);
    const lastDay = islamicUmalquraAdapter.getDaysInMonth(
      shifted.year,
      shifted.month
    );
    return {
      year: shifted.year,
      month: shifted.month,
      day: Math.min(parts.day, lastDay),
    };
  },

  monthNames(locale = 'en', style: MonthNameStyle = 'long') {
    // Sample day 15 of every month of the anchor year (day 15 exists in
    // every 29/30-day lunar month), converted back to Gregorian instants
    // and formatted in the target locale.
    const fmt = new Intl.DateTimeFormat(locale, {
      calendar: 'islamic-umalqura',
      month: style,
      timeZone: 'UTC',
    });
    return Array.from({ length: 12 }, (_, month) =>
      fmt.format(new Date(msFromParts({ year: PROBE_PARTS.year, month, day: 15 })))
    );
  },

  era(year, locale = 'en') {
    const anchor = new Date(msFromParts({ year, month: 0, day: 1 }));
    return eraOfDate(anchor, 'islamic-umalqura', locale);
  },
};
