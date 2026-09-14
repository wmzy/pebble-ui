import type { HazeCalendarIdentifier, HazeDateAdapter } from './adapter';

import { gregoryAdapter } from './gregory';
import { islamicUmalquraAdapter } from './islamic';
import { getAdapter } from './registry';

const ADAPTERS: readonly HazeDateAdapter[] = [
  gregoryAdapter,
  islamicUmalquraAdapter,
];

describe('getAdapter', () => {
  it('resolves each identifier to its shared singleton', () => {
    expect(getAdapter('gregory')).toBe(gregoryAdapter);
    expect(getAdapter('islamic-umalqura')).toBe(islamicUmalquraAdapter);
  });

  it('returns adapters whose identifier matches the lookup key', () => {
    for (const adapter of ADAPTERS) {
      expect(getAdapter(adapter.identifier)).toBe(adapter);
    }
  });

  it('throws RangeError for identifiers without a built-in adapter', () => {
    // Runtime callers are not bound by the compile-time union.
    const unknownCalendar = 'hebrew' as unknown as HazeCalendarIdentifier;
    expect(() => getAdapter(unknownCalendar)).toThrow(RangeError);
  });
});

describe('adapter contract (shared invariants)', () => {
  it('fromGregorian/toGregorian round-trip identically across a shared sample', () => {
    // Year starts, month ends, a leap day and mid-month dates across
    // 2020–2030 — inside the tabulated range of both calendars.
    const samples = [
      new Date(2020, 0, 1),
      new Date(2022, 6, 30),
      new Date(2024, 1, 29),
      new Date(2024, 11, 31),
      new Date(2025, 5, 15),
      new Date(2026, 0, 1),
      new Date(2027, 11, 31),
      new Date(2030, 5, 15),
    ];
    for (const adapter of ADAPTERS) {
      for (const sample of samples) {
        const back = adapter.toGregorian(adapter.fromGregorian(sample));
        expect(back.getFullYear()).toBe(sample.getFullYear());
        expect(back.getMonth()).toBe(sample.getMonth());
        expect(back.getDate()).toBe(sample.getDate());
        expect(back.getHours()).toBe(0);
      }
    }
  });

  it('produces parts whose day always fits the month it lands in', () => {
    for (const adapter of ADAPTERS) {
      for (let year = 2024; year <= 2027; year++) {
        for (let month = 0; month < 12; month++) {
          const parts = adapter.fromGregorian(new Date(year, month, 15));
          expect(parts.day).toBeGreaterThanOrEqual(1);
          expect(parts.day).toBeLessThanOrEqual(
            adapter.getDaysInMonth(parts.year, parts.month)
          );
        }
      }
    }
  });

  it('keeps addMonths results on real dates of the target month', () => {
    for (const adapter of ADAPTERS) {
      const parts = adapter.fromGregorian(new Date(2026, 0, 31));
      for (let delta = -13; delta <= 13; delta++) {
        const shifted = adapter.addMonths(parts, delta);
        expect(shifted.day).toBeLessThanOrEqual(
          adapter.getDaysInMonth(shifted.year, shifted.month)
        );
        // The shifted parts must be a real date: converting back to a
        // Date and reading its parts again returns them unchanged.
        expect(adapter.fromGregorian(adapter.toGregorian(shifted))).toEqual(
          shifted
        );
      }
    }
  });

  it('exposes twelve month names and an era label in every adapter', () => {
    for (const adapter of ADAPTERS) {
      expect(adapter.monthNames('en')).toHaveLength(12);
      expect(adapter.era?.(1447)).toMatch(/./);
    }
  });
});
