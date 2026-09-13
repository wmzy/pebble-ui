/**
 * Time-of-day value helpers for the TimePicker panel form.
 *
 * The value is a 24-hour `"HH:mm"` / `"HH:mm:ss"` string (per `format`,
 * always zero-padded). With `use12Hours` the columns present a 12-hour
 * clock plus an AM/PM column, but serialization stays 24-hour — `12:34`
 * is midday, `00:34` (12:34 AM) is half past midnight.
 */

/** 24-hour time-of-day, the serialization coordinate of every form. */
export type TimeParts = { hour: number; minute: number; second: number };

/** Column granularity and the value's serialization shape. */
export type TimePickerFormat = 'HH:mm' | 'HH:mm:ss';

/** `"HH:mm"` or `"HH:mm:ss"`, one or two digits per field. */
const TIME_PATTERN = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;

/**
 * Parse a `"HH:mm"`/`"HH:mm:ss"` value into 24-hour parts. A missing
 * second field reads as `0`. Returns `null` for empty or impossible
 * times (`"25:00"`, `"12:61"`) so the caller can treat it as "unset".
 */
export function parseTimeValue(value: string): TimeParts | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

/** Serialize 24-hour parts per `format`, zero-padded. */
export function formatTimeValue(
  parts: TimeParts,
  format: TimePickerFormat
): string {
  const h = String(parts.hour).padStart(2, '0');
  const m = String(parts.minute).padStart(2, '0');
  if (format === 'HH:mm:ss') {
    return `${h}:${m}:${String(parts.second).padStart(2, '0')}`;
  }
  return `${h}:${m}`;
}

/** 24-hour hour → 12-hour clock hour: 0→12, 13→1, 12→12. */
export function to12Hour(hour: number): number {
  const remainder = hour % 12;
  return remainder === 0 ? 12 : remainder;
}

/** 12-hour clock hour + period → 24-hour hour: (12, AM)→0, (12, PM)→12. */
export function from12Hour(hour12: number, pm: boolean): number {
  const h = hour12 % 12;
  return pm ? h + 12 : h;
}

/**
 * The values of one step grid: multiples of `step` from 0 through `max`
 * inclusive (`max` itself lands on the grid only when divisible).
 */
export function stepValues(max: number, step: number): number[] {
  const stride = Math.max(1, Math.trunc(step));
  const values: number[] = [];
  for (let v = 0; v <= max; v += stride) values.push(v);
  return values;
}

/**
 * The 12-hour column's display order — 12 first, then 1 through 11
 * (AntD's order) — filtered to the `step` grid. `12` sits on the grid
 * whenever `step` divides 12 or 0, matching the 24-hour grid's 0/12.
 */
export function hour12Values(step: number): number[] {
  const stride = Math.max(1, Math.trunc(step));
  const values: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    const hour12 = i === 0 ? 12 : i;
    if (hour12 % stride === 0) values.push(hour12);
  }
  return values;
}

/**
 * Next enabled value walking from `from` by `±step` around the
 * `0..max` ring (negative `step` walks down). Skips candidates
 * rejected by `isEnabled`; after a full lap without a hit returns
 * `null` (every grid value is disabled — caller keeps the current
 * value). A `step` of 0 is treated as 1.
 */
export function stepValue(
  from: number,
  step: number,
  max: number,
  isEnabled: (value: number) => boolean
): number | null {
  const span = max + 1;
  const stride = Math.abs(step) || 1;
  const dir = step >= 0 ? 1 : -1;
  for (let i = 1; i <= span; i += 1) {
    const candidate = (((from + dir * stride * i) % span) + span) % span;
    if (isEnabled(candidate)) return candidate;
  }
  return null;
}

/** Two-digit, zero-padded column label (`0` → `"00"`). */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
