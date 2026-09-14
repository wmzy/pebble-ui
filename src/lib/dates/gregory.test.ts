import { getDaysInMonth } from '../components/Calendar/date';

import { gregoryAdapter } from './gregory';

describe('gregoryAdapter', () => {
  it('reads the local civil date (not the UTC instant)', () => {
    // Local midnight of Jan 1 is Dec 31 in UTC in zones ahead of UTC —
    // the parts must follow the local wall clock either way.
    expect(gregoryAdapter.fromGregorian(new Date(2026, 0, 1))).toEqual({
      year: 2026,
      month: 0,
      day: 1,
    });
  });

  it('round-trips every day of 2023–2027 through parts and back', () => {
    // Year edges, month ends, the 2024 leap day and both adjacent years
    // are all covered by the sweep.
    for (let t = Date.UTC(2023, 0, 1); t <= Date.UTC(2027, 11, 31); t += 86400000) {
      const utc = new Date(t);
      const local = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
      const back = gregoryAdapter.toGregorian(gregoryAdapter.fromGregorian(local));
      expect(back.getFullYear()).toBe(local.getFullYear());
      expect(back.getMonth()).toBe(local.getMonth());
      expect(back.getDate()).toBe(local.getDate());
    }
  });

  it('materializes parts as local midnight', () => {
    const date = gregoryAdapter.toGregorian({ year: 2026, month: 5, day: 15 });
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it('normalizes out-of-range months but never rolls an impossible day', () => {
    expect(gregoryAdapter.toGregorian({ year: 2026, month: 12, day: 1 })).toEqual(
      gregoryAdapter.toGregorian({ year: 2027, month: 0, day: 1 })
    );
    // Feb 30 must throw, not roll into March 2 — the classic
    // `new Date(y, m, 30)` hazard.
    expect(() => gregoryAdapter.toGregorian({ year: 2026, month: 1, day: 30 })).toThrow(
      RangeError
    );
    expect(() => gregoryAdapter.toGregorian({ year: 2026, month: 0, day: 0 })).toThrow(
      RangeError
    );
  });

  it('delegates month lengths to date.ts (leap rules included)', () => {
    expect(gregoryAdapter.getDaysInMonth(2024, 1)).toBe(29);
    expect(gregoryAdapter.getDaysInMonth(2026, 1)).toBe(28);
    // Century rules: 2000 leaps, 2100 does not.
    expect(gregoryAdapter.getDaysInMonth(2000, 1)).toBe(29);
    expect(gregoryAdapter.getDaysInMonth(2100, 1)).toBe(28);
    // Same function object Calendar consumes — the adapter is a shim,
    // not a reimplementation. (Identity reference only; never called
    // detached, hence the unbound-method exemption.)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const monthLength = gregoryAdapter.getDaysInMonth;
    expect(monthLength).toBe(getDaysInMonth);
  });

  it('normalizes out-of-range months with carry', () => {
    expect(gregoryAdapter.getDaysInMonth(2026, 12)).toBe(
      gregoryAdapter.getDaysInMonth(2027, 0)
    );
    expect(gregoryAdapter.getDaysInMonth(2026, -1)).toBe(
      gregoryAdapter.getDaysInMonth(2025, 11)
    );
  });

  it('shifts months with year carry', () => {
    expect(gregoryAdapter.addMonths({ year: 2026, month: 11, day: 15 }, 1)).toEqual({
      year: 2027,
      month: 0,
      day: 15,
    });
    expect(gregoryAdapter.addMonths({ year: 2026, month: 0, day: 15 }, -1)).toEqual({
      year: 2025,
      month: 11,
      day: 15,
    });
    expect(gregoryAdapter.addMonths({ year: 2026, month: 5, day: 10 }, 0)).toEqual({
      year: 2026,
      month: 5,
      day: 10,
    });
  });

  it('truncates the day to the target month length', () => {
    // Jan 31 into leap/non-leap February.
    expect(gregoryAdapter.addMonths({ year: 2024, month: 0, day: 31 }, 1)).toEqual({
      year: 2024,
      month: 1,
      day: 29,
    });
    expect(gregoryAdapter.addMonths({ year: 2026, month: 0, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 1,
      day: 28,
    });
    // Backwards into a 31-day month keeps the day.
    expect(gregoryAdapter.addMonths({ year: 2026, month: 0, day: 31 }, -1)).toEqual({
      year: 2025,
      month: 11,
      day: 31,
    });
    // Mar 31 into 30-day April.
    expect(gregoryAdapter.addMonths({ year: 2026, month: 2, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 3,
      day: 30,
    });
  });

  it('lists month names per locale and style', () => {
    const en = gregoryAdapter.monthNames('en');
    expect(en).toHaveLength(12);
    expect(en[0]).toBe('January');
    expect(en[11]).toBe('December');
    expect(gregoryAdapter.monthNames('en', 'short')[0]).toBe('Jan');
    expect(gregoryAdapter.monthNames('en', 'narrow')[0]).toBe('J');
    expect(gregoryAdapter.monthNames('zh')[0]).toBe('一月');
  });

  it('pins the gregory calendar so default-calendar locales stay gregory', () => {
    // ar-SA's default calendar is islamic; the adapter must still name
    // Gregorian months.
    expect(gregoryAdapter.monthNames('ar-SA')[0]).toBe('يناير');
  });

  it('labels eras via Intl', () => {
    expect(gregoryAdapter.era?.(2026)).toBe('AD');
    // Astronomical year 0 = 1 BC, -44 = 45 BC.
    expect(gregoryAdapter.era?.(0)).toBe('BC');
    expect(gregoryAdapter.era?.(-44)).toBe('BC');
    expect(gregoryAdapter.era?.(2026, 'de')).toBe('n. Chr.');
  });

  it('identifies itself as gregory', () => {
    expect(gregoryAdapter.identifier).toBe('gregory');
  });
});
