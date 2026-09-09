import type { CalendarCell } from './date';

import { addMonths, buildMonthCells, formatDate, getDaysInMonth, getISOWeekNumber, getLeadingDays, parseCivilDate } from './date';

/* Time-zone control: Node on POSIX/glibc re-reads process.env.TZ before the
   next Date operation (verified experimentally on Node 24 / Fedora: setting
   TZ mid-process immediately changes Date#toString and getTimezoneOffset
   results), so each zone-scoped describe switches the worker's zone in
   beforeAll and afterAll restores the runner's original value. Vitest's
   default per-file worker isolation keeps the mutation from leaking into
   sibling test files.

   The offset assertions inside each zone describe double as a guard against
   a silently non-switching TZ: were the host zone (UTC+8, no DST) still in
   effect, every one of them would fail loudly instead of the suite passing
   for the wrong reason. */
const ORIGINAL_TZ = process.env.TZ;

function setTZ(tz: string) {
  process.env.TZ = tz;
}

function restoreTZ() {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function weekdayName(year: number, month: number, day: number) {
  return WEEKDAY_NAMES[new Date(year, month, day).getDay()]!;
}

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function datesOf(cells: CalendarCell[]) {
  return cells.map((c) => formatDate(c.year, c.month, c.day));
}

/* Full structural contract of a month grid: in-month cells are exactly days
   1..daysInMonth in order, leading cells are the contiguous tail of the
   previous month, trailing cells complete the final week row, the total is
   a multiple of 7, and every cell sits in the weekday column implied by its
   index — the last check re-derives weekdays from the local-midnight Date
   of each civil triple, so it is exactly where a DST or rollover bug would
   surface. */
function expectMonthGrid(year: number, month: number, weekStart: 0 | 1) {
  const cells = buildMonthCells(year, month, weekStart);
  const daysInMonth = getDaysInMonth(year, month);
  const leading = getLeadingDays(year, month, weekStart);
  const prev = addMonths(year, month, -1);
  const prevDays = getDaysInMonth(prev.year, prev.month);
  const next = addMonths(year, month, 1);

  expect(cells.length % 7).toBe(0);
  expect(cells.length).toBe(Math.ceil((leading + daysInMonth) / 7) * 7);

  const inside = cells.filter((c) => !c.outside);
  expect(inside.map((c) => c.day)).toEqual(range(1, daysInMonth));
  expect(
    inside.every((c) => c.year === year && c.month === month)
  ).toBe(true);

  const leadingCells = cells.slice(0, leading);
  expect(leadingCells.map((c) => c.day)).toEqual(range(prevDays - leading + 1, prevDays));
  expect(
    leadingCells.every(
      (c) => c.year === prev.year && c.month === prev.month && c.outside
    )
  ).toBe(true);

  const trailing = cells.length - leading - daysInMonth;
  const trailingCells = cells.slice(leading + daysInMonth);
  expect(trailingCells.map((c) => c.day)).toEqual(
    trailing > 0 ? range(1, trailing) : []
  );
  expect(
    trailingCells.every(
      (c) => c.year === next.year && c.month === next.month && c.outside
    )
  ).toBe(true);

  const misaligned = cells
    .map((cell, i) => {
      const dt = new Date(cell.year, cell.month, cell.day);
      const roundTrip =
        dt.getFullYear() === cell.year &&
        dt.getMonth() === cell.month &&
        dt.getDate() === cell.day;
      const inColumn = dt.getDay() === (weekStart + i) % 7;
      return roundTrip && inColumn ? null : { i, cell, dt: dt.toString() };
    })
    .filter((v) => v !== null);
  expect(misaligned).toEqual([]);

  return cells;
}

describe('Calendar date math', () => {
  describe('in UTC (baseline)', () => {
    beforeAll(() => setTZ('UTC'));
    afterAll(restoreTZ);

    it('formats civil dates as zero-padded YYYY-MM-DD', () => {
      expect(formatDate(2026, 0, 5)).toBe('2026-01-05');
      expect(formatDate(2026, 11, 31)).toBe('2026-12-31');
      expect(formatDate(2028, 1, 29)).toBe('2028-02-29');
    });

    it('returns the true length of each month', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31);
      expect(getDaysInMonth(2026, 1)).toBe(28);
      expect(getDaysInMonth(2026, 3)).toBe(30);
      expect(getDaysInMonth(2028, 1)).toBe(29);
      expect(getDaysInMonth(2027, 1)).toBe(28);
      // Century leap-year rules.
      expect(getDaysInMonth(2000, 1)).toBe(29);
      expect(getDaysInMonth(1900, 1)).toBe(28);
      expect(getDaysInMonth(2100, 1)).toBe(28);
    });

    it('normalizes out-of-range months to the adjacent month', () => {
      // Calendar historically called getDaysInMonth(year, month - 1) with
      // month = 0; day 0 of the following month rolls through Date.
      expect(getDaysInMonth(2027, -1)).toBe(31); // December 2026
      expect(getDaysInMonth(2026, 12)).toBe(31); // January 2027
    });

    it('shifts views by months with year carry and no day rollover', () => {
      expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
      expect(addMonths(2027, 0, -1)).toEqual({ year: 2026, month: 11 });
      expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
      expect(addMonths(2026, 0, 12)).toEqual({ year: 2027, month: 0 });
      expect(addMonths(2026, 0, 13)).toEqual({ year: 2027, month: 1 });
      expect(addMonths(2026, 5, 0)).toEqual({ year: 2026, month: 5 });
    });

    it('navigating from January 31 lands on a February grid ending at 02-28', () => {
      // Month-end arithmetic: the view shift is pure (year, month) math, and
      // the February 2026 grid must not fabricate a Feb 29–31 nor roll any
      // January day over into March.
      expect(addMonths(2026, 0, 1)).toEqual({ year: 2026, month: 1 });
      const cells = buildMonthCells(2026, 1, 0);
      const inside = cells.filter((c) => !c.outside);
      expect(inside).toHaveLength(28);
      expect(formatDate(2026, 1, Math.max(...inside.map((c) => c.day)))).toBe('2026-02-28');
      expect(datesOf(cells)).not.toContain('2026-02-29');
      expect(datesOf(cells)).not.toContain('2026-03-01');
    });

    it('navigating from March 31 lands on an April grid ending at 04-30', () => {
      expect(addMonths(2026, 2, 1)).toEqual({ year: 2026, month: 3 });
      const cells = buildMonthCells(2026, 3, 0);
      const inside = cells.filter((c) => !c.outside);
      expect(inside).toHaveLength(30);
      expect(formatDate(2026, 3, Math.max(...inside.map((c) => c.day)))).toBe('2026-04-30');
      expect(datesOf(cells)).not.toContain('2026-04-31');
    });

    it('renders the leap day 2028-02-29 (a Tuesday) in the grid', () => {
      expect(weekdayName(2028, 1, 29)).toBe('Tue');
      const cells = expectMonthGrid(2028, 1, 0);
      expect(cells).toContainEqual({ day: 29, month: 1, year: 2028, outside: false });
      // Leading cells are Jan 30–31; the leap day sits in the row that
      // crosses into March.
      expect(datesOf(cells.slice(0, 2))).toEqual(['2028-01-30', '2028-01-31']);
      expect(datesOf(cells.slice(28, 35))).toEqual([
        '2028-02-27',
        '2028-02-28',
        '2028-02-29',
        '2028-03-01',
        '2028-03-02',
        '2028-03-03',
        '2028-03-04',
      ]);
    });

    it('computes leading days for weekStart 0 and 1 across first-day weekdays', () => {
      // [year, 0-based month, lead0, lead1]; 2026 first days: Jan Thu,
      // Feb Sun, Mar Sun, Apr Wed, May Fri, Aug Sat, Oct Thu, Nov Sun,
      // Dec Tue (verified civil weekdays).
      const expected: [number, number, number, number][] = [
        [2026, 0, 4, 3], // January
        [2026, 1, 0, 6], // February
        [2026, 2, 0, 6], // March
        [2026, 3, 3, 2], // April
        [2026, 4, 5, 4], // May
        [2026, 7, 6, 5], // August
        [2026, 9, 4, 3], // October
        [2026, 10, 0, 6], // November
        [2026, 11, 2, 1], // December
      ];
      for (const [y, m, lead0, lead1] of expected) {
        expect(getLeadingDays(y, m, 0)).toBe(lead0);
        expect(getLeadingDays(y, m, 1)).toBe(lead1);
      }
    });

    it('renders March 2026 Monday-first with February 23–28 leading', () => {
      const cells = expectMonthGrid(2026, 2, 1);
      expect(cells).toHaveLength(42);
      expect(datesOf(cells.slice(0, 6))).toEqual([
        '2026-02-23',
        '2026-02-24',
        '2026-02-25',
        '2026-02-26',
        '2026-02-27',
        '2026-02-28',
      ]);
      // 6 leading + 31 in-month = 37 → 5 trailing April days.
      expect(datesOf(cells.slice(37))).toEqual([
        '2026-04-01',
        '2026-04-02',
        '2026-04-03',
        '2026-04-04',
        '2026-04-05',
      ]);
    });

    it('does not pad a February that fills its rows exactly', () => {
      // Sunday-first February 2026: 0 leading + 28 days = 4 exact rows.
      const cells = expectMonthGrid(2026, 1, 0);
      expect(cells).toHaveLength(28);
      expect(datesOf(cells.slice(-1))).toEqual(['2026-02-28']);
    });

    it('carries the year across the December → January boundary in the grid', () => {
      const dec = expectMonthGrid(2026, 11, 0);
      // 2 leading + 31 days = 33 → 2 trailing January 2027 days.
      expect(datesOf(dec.slice(-2))).toEqual(['2027-01-01', '2027-01-02']);
      const jan = expectMonthGrid(2027, 0, 0);
      expect(datesOf(jan.slice(0, 5))).toEqual([
        '2026-12-27',
        '2026-12-28',
        '2026-12-29',
        '2026-12-30',
        '2026-12-31',
      ]);
    });

    it('aligns every cell to its weekday column across 2026–2028', () => {
      // Exhaustive sweep: every month of three consecutive years under both
      // week starts, checked for grid structure, civil round-trip, and
      // column alignment (see expectMonthGrid).
      for (const weekStart of [0, 1] as const) {
        for (const year of [2026, 2027, 2028]) {
          for (let month = 0; month < 12; month++) {
            expectMonthGrid(year, month, weekStart);
          }
        }
      }
    });
  });

  describe('in America/New_York', () => {
    beforeAll(() => setTZ('America/New_York'));
    afterAll(restoreTZ);

    it('is actually running in the switched zone (spring forward 2026-03-08, fall back 2026-11-01)', () => {
      expect(new Date(2026, 2, 8).getTimezoneOffset()).toBe(300); // EST — midnight precedes the 02:00 jump
      expect(new Date(2026, 2, 9).getTimezoneOffset()).toBe(240); // EDT
      expect(new Date(2026, 10, 1).getTimezoneOffset()).toBe(240); // EDT — jump happens at 02:00
      expect(new Date(2026, 10, 2).getTimezoneOffset()).toBe(300); // EST
    });

    it('renders March 2026 with the spring-forward Sunday in place', () => {
      // 2026-03-08 is the Sunday DST starts; a naive local-midnight grid
      // must still place it as an ordinary Sunday in week 2.
      expect(weekdayName(2026, 2, 8)).toBe('Sun');
      expect(getDaysInMonth(2026, 2)).toBe(31); // the skipped hour changes nothing
      const cells = expectMonthGrid(2026, 2, 0);
      expect(datesOf(cells.slice(7, 14))).toEqual([
        '2026-03-08',
        '2026-03-09',
        '2026-03-10',
        '2026-03-11',
        '2026-03-12',
        '2026-03-13',
        '2026-03-14',
      ]);
    });

    it('renders November 2026 with the fall-back Sunday in place', () => {
      // 2026-11-01 is the Sunday DST ends; it is day 1 of the grid.
      expect(weekdayName(2026, 10, 1)).toBe('Sun');
      expect(getDaysInMonth(2026, 10)).toBe(30); // the repeated hour changes nothing
      const cells = expectMonthGrid(2026, 10, 0);
      expect(datesOf(cells.slice(0, 7))).toEqual([
        '2026-11-01',
        '2026-11-02',
        '2026-11-03',
        '2026-11-04',
        '2026-11-05',
        '2026-11-06',
        '2026-11-07',
      ]);
    });

    it('keeps weekday alignment across every US transition of 2026–2028', () => {
      for (const weekStart of [0, 1] as const) {
        for (const year of [2026, 2027, 2028]) {
          for (let month = 0; month < 12; month++) {
            expectMonthGrid(year, month, weekStart);
          }
        }
      }
    });

    it('parses value strings as local civil dates (UTC-midnight shift)', () => {
      // The bug this locks out: `new Date('2026-03-01')` is UTC midnight,
      // which in EST is local Feb 28 — the initial view showed February.
      const parsed = parseCivilDate('2026-03-01')!;
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(2);
      expect(parsed.getDate()).toBe(1);
      // Round-trips with formatDate.
      expect(formatDate(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toBe(
        '2026-03-01'
      );
    });
  });

  describe('parseCivilDate validation (zone-independent)', () => {
    beforeAll(() => setTZ('UTC'));
    afterAll(restoreTZ);

    it('accepts real calendar dates including leap days', () => {
      const leap = parseCivilDate('2028-02-29')!;
      expect([leap.getFullYear(), leap.getMonth(), leap.getDate()]).toEqual([
        2028, 1, 29,
      ]);
      expect(parseCivilDate('2027-02-28')).not.toBeNull();
    });

    it('rejects impossible dates, malformed input, and out-of-range parts', () => {
      expect(parseCivilDate('2026-02-30')).toBeNull();
      expect(parseCivilDate('2027-02-29')).toBeNull(); // non-leap year
      expect(parseCivilDate('2026-13-01')).toBeNull();
      expect(parseCivilDate('2026-00-10')).toBeNull();
      expect(parseCivilDate('2026-04-31')).toBeNull();
      expect(parseCivilDate('2026-4-05')).toBeNull(); // unpadded
      expect(parseCivilDate('')).toBeNull();
      expect(parseCivilDate('not a date')).toBeNull();
      expect(parseCivilDate('2026/03/01')).toBeNull();
    });
  });

  describe('in Europe/Berlin', () => {
    beforeAll(() => setTZ('Europe/Berlin'));
    afterAll(restoreTZ);

    it('is actually running in the switched zone (2026-03-29 and 2026-10-25 transitions)', () => {
      expect(new Date(2026, 2, 29).getTimezoneOffset()).toBe(-60); // CET at midnight
      expect(new Date(2026, 2, 30).getTimezoneOffset()).toBe(-120); // CEST
      expect(new Date(2026, 9, 25).getTimezoneOffset()).toBe(-120); // CEST at midnight
      expect(new Date(2026, 9, 26).getTimezoneOffset()).toBe(-60); // CET
    });

    it('renders March 2026 with the spring-forward row crossing into April', () => {
      expect(weekdayName(2026, 2, 29)).toBe('Sun');
      const cells = expectMonthGrid(2026, 2, 0);
      // The transition Sunday leads the final week row: Mar 29–31 + Apr 1–4.
      expect(datesOf(cells.slice(28, 35))).toEqual([
        '2026-03-29',
        '2026-03-30',
        '2026-03-31',
        '2026-04-01',
        '2026-04-02',
        '2026-04-03',
        '2026-04-04',
      ]);
    });

    it('renders October 2026 with the fall-back Sunday mid-month', () => {
      expect(weekdayName(2026, 9, 25)).toBe('Sun');
      const cells = expectMonthGrid(2026, 9, 0);
      // October starts on a Thursday: 4 leading September days, and the
      // 31-day month exactly fills 5 rows (no trailing).
      expect(cells).toHaveLength(35);
      expect(datesOf(cells.slice(28, 35))).toEqual([
        '2026-10-25',
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
        '2026-10-30',
        '2026-10-31',
      ]);
    });

    it('keeps weekday alignment across every EU transition of 2026–2028', () => {
      for (const weekStart of [0, 1] as const) {
        for (const year of [2026, 2027, 2028]) {
          for (let month = 0; month < 12; month++) {
            expectMonthGrid(year, month, weekStart);
          }
        }
      }
    });
  });

  describe('in Australia/Sydney', () => {
    beforeAll(() => setTZ('Australia/Sydney'));
    afterAll(restoreTZ);

    it('is actually running in the switched zone (southern transitions 2026-04-05 and 2026-10-04)', () => {
      expect(new Date(2026, 3, 5).getTimezoneOffset()).toBe(-660); // AEDT at midnight
      expect(new Date(2026, 3, 6).getTimezoneOffset()).toBe(-600); // AEST — fall back
      expect(new Date(2026, 9, 4).getTimezoneOffset()).toBe(-600); // AEST at midnight
      expect(new Date(2026, 9, 5).getTimezoneOffset()).toBe(-660); // AEDT — spring forward
    });

    it('renders April 2026 with the fall-back Sunday leading week 2', () => {
      expect(weekdayName(2026, 3, 5)).toBe('Sun');
      expect(getDaysInMonth(2026, 3)).toBe(30);
      const cells = expectMonthGrid(2026, 3, 0);
      // April starts on a Wednesday (3 leading March days); AEDT→AEST
      // happens Sunday the 5th at 03:00, well after local midnight.
      expect(datesOf(cells.slice(0, 3))).toEqual([
        '2026-03-29',
        '2026-03-30',
        '2026-03-31',
      ]);
      expect(datesOf(cells.slice(7, 14))).toEqual([
        '2026-04-05',
        '2026-04-06',
        '2026-04-07',
        '2026-04-08',
        '2026-04-09',
        '2026-04-10',
        '2026-04-11',
      ]);
    });

    it('renders October 2026 with the spring-forward Sunday leading week 2', () => {
      expect(weekdayName(2026, 9, 4)).toBe('Sun');
      const cells = expectMonthGrid(2026, 9, 0);
      // October starts on a Thursday (4 leading September days), so the
      // AEST→AEDT Sunday the 4th leads the second row.
      expect(datesOf(cells.slice(0, 7))).toEqual([
        '2026-09-27',
        '2026-09-28',
        '2026-09-29',
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
      ]);
      expect(datesOf(cells.slice(7, 14))).toEqual([
        '2026-10-04',
        '2026-10-05',
        '2026-10-06',
        '2026-10-07',
        '2026-10-08',
        '2026-10-09',
        '2026-10-10',
      ]);
    });

    it('keeps weekday alignment across every Australian transition of 2026–2028', () => {
      for (const weekStart of [0, 1] as const) {
        for (const year of [2026, 2027, 2028]) {
          for (let month = 0; month < 12; month++) {
            expectMonthGrid(year, month, weekStart);
          }
        }
      }
    });
  });

  describe('ISO week numbers', () => {
    // Boundary fixtures verified against the ISO 8601 rule (week 1 = the
    // week containing the year's first Thursday; weeks run Mon–Sun):
    // - 2026-01-01 is a Thursday → week 1 of 2026.
    // - 2025-12-31 is a Wednesday → week 1 of 2026 (borrows forward).
    // - 2021-01-01/02/03 are Fri/Sat/Sun → week 53 of 2020 (borrows back).
    // - 2027-01-01 is a Friday → week 53 of 2026 (2026 is a 53-week year).
    // - 2024-12-29 is a Sunday → week 52 of 2024.
    const EXPECTED: [number, number, number, number][] = [
      [2026, 0, 1, 1],
      [2026, 0, 4, 1],
      [2025, 11, 31, 1],
      [2021, 0, 1, 53],
      [2021, 0, 2, 53],
      [2021, 0, 3, 53],
      [2021, 0, 4, 1],
      [2027, 0, 1, 53],
      [2026, 11, 28, 53],
      [2026, 11, 31, 53],
      [2024, 11, 29, 52],
      [2025, 5, 15, 24],
      [2024, 6, 4, 27],
    ];

    describe('in UTC (baseline)', () => {
      beforeAll(() => setTZ('UTC'));
      afterAll(restoreTZ);

      it('matches the ISO 8601 boundary fixtures', () => {
        for (const [year, month, day, week] of EXPECTED) {
          expect(getISOWeekNumber(year, month, day)).toBe(week);
        }
      });

      it('counts 52/53 whole weeks across a full ISO year', () => {
        // 2026 starts on a Thursday → long (53-week) ISO year; 2025 starts
        // on a Wednesday → 52 weeks.
        expect(getISOWeekNumber(2026, 11, 31)).toBe(53);
        expect(getISOWeekNumber(2025, 11, 28)).toBe(52);
      });
    });

    describe('in America/New_York', () => {
      beforeAll(() => setTZ('America/New_York'));
      afterAll(restoreTZ);

      it('is actually running in the switched zone (2026-03-08 transition)', () => {
        expect(new Date(2026, 2, 8).getTimezoneOffset()).toBe(300);
      });

      it('keeps the boundary fixtures stable west of UTC', () => {
        for (const [year, month, day, week] of EXPECTED) {
          expect(getISOWeekNumber(year, month, day)).toBe(week);
        }
      });
    });

    describe('in Asia/Shanghai', () => {
      beforeAll(() => setTZ('Asia/Shanghai'));
      afterAll(restoreTZ);

      it('is actually running in the switched zone (UTC+8, no DST)', () => {
        expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-480);
      });

      it('keeps the boundary fixtures stable east of UTC', () => {
        for (const [year, month, day, week] of EXPECTED) {
          expect(getISOWeekNumber(year, month, day)).toBe(week);
        }
      });
    });
  });
});
