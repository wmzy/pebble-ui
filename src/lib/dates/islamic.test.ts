import { islamicUmalquraAdapter } from './islamic';

/**
 * Authoritative Gregorian → Umm al-Qura pairs. Values verified against
 * Node 22 full-ICU `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')
 * .formatToParts` (UTC civil timeline) and stable across ICU versions —
 * the Umm al-Qura tabulation is frozen observational data. 2022-07-30
 * being 1444-01-01 (a Hijri new year) is an extra structural anchor.
 */
const FIXED_PAIRS: readonly {
  gregorian: { year: number; month: number; day: number };
  hijri: { year: number; month: number; day: number };
}[] = [
  { gregorian: { year: 2020, month: 0, day: 1 }, hijri: { year: 1441, month: 4, day: 6 } },
  { gregorian: { year: 2022, month: 6, day: 30 }, hijri: { year: 1444, month: 0, day: 1 } },
  { gregorian: { year: 2024, month: 1, day: 29 }, hijri: { year: 1445, month: 7, day: 19 } },
  { gregorian: { year: 2024, month: 11, day: 31 }, hijri: { year: 1446, month: 5, day: 30 } },
  { gregorian: { year: 2025, month: 5, day: 15 }, hijri: { year: 1446, month: 11, day: 19 } },
  { gregorian: { year: 2026, month: 0, day: 1 }, hijri: { year: 1447, month: 6, day: 12 } },
  { gregorian: { year: 2027, month: 11, day: 31 }, hijri: { year: 1449, month: 7, day: 3 } },
  { gregorian: { year: 2030, month: 5, day: 15 }, hijri: { year: 1452, month: 1, day: 13 } },
];

describe('islamicUmalquraAdapter', () => {
  it('matches the fixed authoritative pairs (Gregorian → Hijri)', () => {
    for (const pair of FIXED_PAIRS) {
      expect(
        islamicUmalquraAdapter.fromGregorian(
          new Date(pair.gregorian.year, pair.gregorian.month, pair.gregorian.day)
        )
      ).toEqual(pair.hijri);
    }
  });

  it('matches the fixed authoritative pairs (Hijri → Gregorian)', () => {
    for (const pair of FIXED_PAIRS) {
      const date = islamicUmalquraAdapter.toGregorian(pair.hijri);
      expect(date.getFullYear()).toBe(pair.gregorian.year);
      expect(date.getMonth()).toBe(pair.gregorian.month);
      expect(date.getDate()).toBe(pair.gregorian.day);
    }
  });

  it('round-trips every day of 2020–2030', () => {
    // Dense sweep across year boundaries, month ends, leap days — every
    // conversion must land back on the exact local civil date it
    // started from (both directions agree with Intl everywhere).
    for (let t = Date.UTC(2020, 0, 1); t <= Date.UTC(2030, 11, 31); t += 86400000) {
      const utc = new Date(t);
      const local = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
      const back = islamicUmalquraAdapter.toGregorian(
        islamicUmalquraAdapter.fromGregorian(local)
      );
      expect(back.getFullYear()).toBe(local.getFullYear());
      expect(back.getMonth()).toBe(local.getMonth());
      expect(back.getDate()).toBe(local.getDate());
    }
  });

  it('materializes parts as local midnight', () => {
    const date = islamicUmalquraAdapter.toGregorian({ year: 1447, month: 6, day: 12 });
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getFullYear()).toBe(2026);
  });

  it('reads the local civil date, not the UTC instant', () => {
    // 2026-01-01 local is 1447-07-12 in every zone: parts follow the
    // wall clock because the conversion reads local fields first.
    expect(islamicUmalquraAdapter.fromGregorian(new Date(2026, 0, 1, 23, 59))).toEqual({
      year: 1447,
      month: 6,
      day: 12,
    });
  });

  it('reports 29/30-day months and 354/355-day years (Umm al-Qura tables)', () => {
    // Month lengths of 1446–1450 AH from ICU's tabulation:
    //   1446: 29,30,30,30,29,30,30,29,29,30,29,29  (354)
    //   1447: 30,29,30,30,30,29,30,29,30,29,30,29  (355)
    //   1448: 29,30,29,30,30,29,30,30,29,30,29,30  (355)
    //   1449: 29,29,30,29,30,29,30,30,29,30,30,29  (354)
    //   1450: 30,29,30,29,29,30,29,30,29,30,30,29  (354)
    for (const year of [1446, 1447, 1448, 1449, 1450]) {
      let yearLength = 0;
      for (let month = 0; month < 12; month++) {
        const length = islamicUmalquraAdapter.getDaysInMonth(year, month);
        expect(length === 29 || length === 30).toBe(true);
        yearLength += length;
      }
      expect(yearLength === 354 || yearLength === 355).toBe(true);
    }
    expect(islamicUmalquraAdapter.getDaysInMonth(1447, 6)).toBe(30);
    expect(islamicUmalquraAdapter.getDaysInMonth(1447, 7)).toBe(29);
  });

  it('keeps month starts contiguous (probe method is exact)', () => {
    // Day 1 of month m+1 must be exactly `daysInMonth(m)` days after
    // day 1 of month m — the day-1 anchor probe cannot be off.
    for (let year = 1446; year <= 1450; year++) {
      for (let month = 0; month < 12; month++) {
        const next = islamicUmalquraAdapter.addMonths({ year, month, day: 1 }, 1);
        const startMs = islamicUmalquraAdapter.toGregorian({ year, month, day: 1 }).getTime();
        const endMs = islamicUmalquraAdapter.toGregorian(next).getTime();
        expect(
          (endMs - startMs) / 86400000
        ).toBe(islamicUmalquraAdapter.getDaysInMonth(year, month));
      }
    }
  });

  it('normalizes out-of-range months with carry', () => {
    expect(islamicUmalquraAdapter.toGregorian({ year: 1447, month: 12, day: 1 })).toEqual(
      islamicUmalquraAdapter.toGregorian({ year: 1448, month: 0, day: 1 })
    );
    expect(islamicUmalquraAdapter.getDaysInMonth(1447, -1)).toBe(
      islamicUmalquraAdapter.getDaysInMonth(1446, 11)
    );
  });

  it('rejects days that exist in no Hijri month', () => {
    expect(() =>
      islamicUmalquraAdapter.toGregorian({ year: 1447, month: 6, day: 31 })
    ).toThrow(RangeError);
  });

  it('shifts months with year carry and truncates the day', () => {
    // 1447-07 has 29 days, so 1447-07-30 + 1 clamps to 1447-08-29.
    expect(islamicUmalquraAdapter.addMonths({ year: 1447, month: 6, day: 30 }, 1)).toEqual({
      year: 1447,
      month: 7,
      day: 29,
    });
    // Year carry into a 29-day month: day survives intact.
    expect(islamicUmalquraAdapter.addMonths({ year: 1447, month: 11, day: 29 }, 1)).toEqual({
      year: 1448,
      month: 0,
      day: 29,
    });
    // Day 30 into a 30-day month two months away.
    expect(islamicUmalquraAdapter.addMonths({ year: 1447, month: 6, day: 30 }, 2)).toEqual({
      year: 1447,
      month: 8,
      day: 30,
    });
    // Backwards: 1447-03 has 30 days, 1447-02 has 29.
    expect(islamicUmalquraAdapter.addMonths({ year: 1447, month: 2, day: 30 }, -1)).toEqual({
      year: 1447,
      month: 1,
      day: 29,
    });
    expect(islamicUmalquraAdapter.addMonths({ year: 1447, month: 6, day: 12 }, 0)).toEqual({
      year: 1447,
      month: 6,
      day: 12,
    });
  });

  it('lands addMonths targets on real Hijri dates', () => {
    for (const pair of FIXED_PAIRS) {
      const shifted = islamicUmalquraAdapter.addMonths(pair.hijri, 3);
      const back = islamicUmalquraAdapter.fromGregorian(
        islamicUmalquraAdapter.toGregorian(shifted)
      );
      expect(back).toEqual(shifted);
    }
  });

  it('lists month names per locale and style', () => {
    const en = islamicUmalquraAdapter.monthNames();
    expect(en).toHaveLength(12);
    // 2026-01-01 is mid-Rajab 1447 (month index 6), pinning the mapping.
    expect(en[0]).toBe('Muharram');
    expect(en[6]).toBe('Rajab');
    expect(en[11]).toBe('Dhuʻl-Hijjah');
    expect(islamicUmalquraAdapter.monthNames('en', 'short')[6]).toBe('Raj.');
    expect(islamicUmalquraAdapter.monthNames('ar')[0]).toBe('محرم');
  });

  it('labels every year AH', () => {
    expect(islamicUmalquraAdapter.era?.(1447)).toBe('AH');
    expect(islamicUmalquraAdapter.era?.(1441)).toBe('AH');
  });

  it('identifies itself as islamic-umalqura', () => {
    expect(islamicUmalquraAdapter.identifier).toBe('islamic-umalqura');
  });
});
