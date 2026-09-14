/**
 * Gregorian adapter — a thin shim over the calendar math Calendar already
 * uses (`src/lib/components/Calendar/date.ts`, imported here, never
 * duplicated). `fromGregorian`/`toGregorian` are identity mappings
 * between local-civil Dates and their parts; month-length and view-shift
 * semantics are date.ts's own, so a Calendar wired to this adapter
 * behaves exactly like today's hard-wired Gregorian code paths.
 */
import type { HazeDateAdapter, MonthNameStyle } from './adapter';

import {
  addMonths as shiftMonth,
  getDaysInMonth as monthLength,
} from '../components/Calendar/date';

import { eraOfDate } from './adapter';

/** Era abbreviation of a Gregorian year. Astronomical numbering is used
 * (year 0 = 1 BC, -44 = 45 BC) — Intl already renders years ≤ 0 as BC,
 * so the year passes through unchanged; `setUTCFullYear` sidesteps the
 * constructor's two-digit-year → 19xx remap for years 0–99. */
function gregorianEra(year: number, locale: string): string {
  const anchor = new Date(0);
  anchor.setUTCFullYear(year, 0, 1);
  return eraOfDate(anchor, 'gregory', locale);
}

export const gregoryAdapter: HazeDateAdapter = {
  identifier: 'gregory',

  fromGregorian(date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  },

  toGregorian(parts) {
    // Strict on the day (the classic `new Date(y, m, 30)` rollover
    // hazard date.ts's header warns about); months normalize with
    // carry, matching date.ts's own helpers.
    if (parts.day < 1 || parts.day > monthLength(parts.year, parts.month)) {
      throw new RangeError(
        `Not a gregorian date: ${parts.year}-${parts.month + 1}-${parts.day}`
      );
    }
    return new Date(parts.year, parts.month, parts.day);
  },

  getDaysInMonth: monthLength,

  addMonths(parts, delta) {
    const shifted = shiftMonth(parts.year, parts.month, delta);
    const lastDay = monthLength(shifted.year, shifted.month);
    return {
      year: shifted.year,
      month: shifted.month,
      day: Math.min(parts.day, lastDay),
    };
  },

  monthNames(locale, style: MonthNameStyle = 'long') {
    // Calendar pinned (a default-calendar locale like ar-SA would
    // otherwise return Islamic names for Gregorian dates); UTC pinned so
    // the sampled anchors format identically in every local zone.
    const fmt = new Intl.DateTimeFormat(locale ?? 'default', {
      calendar: 'gregory',
      month: style,
      timeZone: 'UTC',
    });
    return Array.from({ length: 12 }, (_, month) =>
      fmt.format(new Date(Date.UTC(2026, month, 15)))
    );
  },

  era(year, locale = 'en') {
    return gregorianEra(year, locale);
  },
};
