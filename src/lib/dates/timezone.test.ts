import { formatInTimeZone, getZonedParts } from './timezone';

describe('formatInTimeZone', () => {
  it('formats an instant in the named zone', () => {
    // 2026-06-01T16:30Z is 12:30 in New York (EDT, UTC-4).
    const text = formatInTimeZone(
      new Date(Date.UTC(2026, 5, 1, 16, 30)),
      'America/New_York',
      { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    );
    // Numeric-only parts keep the string locale-stable; the hour is the
    // zone-sensitive piece.
    expect(text).toContain('12');
    expect(text).toContain('30');
    expect(text).toContain('2026');
  });

  it('lets the explicit zone parameter win over options.timeZone', () => {
    const instant = new Date(Date.UTC(2026, 0, 1, 0, 0));
    expect(
      formatInTimeZone(instant, 'Asia/Shanghai', {
        timeZone: 'UTC',
        timeZoneName: 'shortOffset',
      })
    ).toBe(
      new Intl.DateTimeFormat(undefined, {
        timeZone: 'Asia/Shanghai',
        timeZoneName: 'shortOffset',
      }).format(instant)
    );
  });

  it('propagates Intl RangeError for unknown zones', () => {
    expect(() =>
      formatInTimeZone(new Date(), 'Mars/Olympus_Mons', {})
    ).toThrow(RangeError);
  });
});

describe('getZonedParts', () => {
  it('reads fixed-offset zones without DST (Asia/Shanghai)', () => {
    // UTC+8 all year, no transitions since 1991.
    expect(getZonedParts(new Date(Date.UTC(2026, 0, 1, 0, 0)), 'Asia/Shanghai')).toEqual({
      year: 2026,
      month: 0,
      day: 1,
      hour: 8,
      minute: 0,
    });
    expect(getZonedParts(new Date(Date.UTC(2026, 6, 1, 0, 0)), 'Asia/Shanghai')).toEqual({
      year: 2026,
      month: 6,
      day: 1,
      hour: 8,
      minute: 0,
    });
    // Crossing midnight in the zone: 16:30Z is 00:30 next day.
    expect(getZonedParts(new Date(Date.UTC(2026, 11, 15, 16, 30)), 'Asia/Shanghai')).toEqual({
      year: 2026,
      month: 11,
      day: 16,
      hour: 0,
      minute: 30,
    });
  });

  it('reads America/New_York across the 2026 spring-forward day', () => {
    // DST starts Sunday 2026-03-08 (second Sunday of March) at 02:00
    // local: 01:59 EST is followed by 03:00 EDT.
    expect(getZonedParts(new Date(Date.UTC(2026, 2, 8, 6, 59)), 'America/New_York')).toEqual({
      year: 2026,
      month: 2,
      day: 8,
      hour: 1,
      minute: 59,
    });
    expect(getZonedParts(new Date(Date.UTC(2026, 2, 8, 7, 0)), 'America/New_York')).toEqual({
      year: 2026,
      month: 2,
      day: 8,
      hour: 3,
      minute: 0,
    });
    // Either side of the day as a whole stays on the same civil date.
    expect(getZonedParts(new Date(Date.UTC(2026, 2, 8, 3, 59)), 'America/New_York')).toEqual({
      year: 2026,
      month: 2,
      day: 7,
      hour: 22,
      minute: 59,
    });
  });

  it('reads America/New_York across the 2026 fall-back day', () => {
    // DST ends Sunday 2026-11-01 (first Sunday of November) at 02:00
    // local: 01:59 EDT is followed by 01:00 EST — the repeated hour.
    expect(getZonedParts(new Date(Date.UTC(2026, 10, 1, 5, 59)), 'America/New_York')).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      hour: 1,
      minute: 59,
    });
    expect(getZonedParts(new Date(Date.UTC(2026, 10, 1, 6, 0)), 'America/New_York')).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      hour: 1,
      minute: 0,
    });
  });

  it('reports midnight as hour 0 (h23 cycle)', () => {
    expect(getZonedParts(new Date(Date.UTC(2026, 0, 1, 12, 0)), 'UTC').hour).toBe(12);
    expect(getZonedParts(new Date(Date.UTC(2026, 0, 1, 0, 0)), 'UTC').hour).toBe(0);
  });

  it('propagates Intl RangeError for unknown zones', () => {
    expect(() => getZonedParts(new Date(), 'Not/AZone')).toThrow(RangeError);
  });
});
