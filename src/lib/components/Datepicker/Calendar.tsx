import { css } from '@linaria/core';
import { useState } from 'react';

type CalendarProps = {
  value: string;
  min?: string;
  max?: string;
  /** BCP 47 locale used for month and weekday formatting. */
  locale?: string;
  /** Explicit first day of the week: 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  onSelect: (date: string) => void;
};

const calendarWrapper = css`
  padding: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--haze-space-2);
`;

const headerBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  color: var(--haze-color-text);
  cursor: pointer;
  padding: var(--haze-space-1);
  border-radius: var(--haze-radius-sm);
  font-size: var(--haze-text-sm);
  line-height: 1;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const headerTitle = css`
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
`;

const grid = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
`;

/* Rows and cells participate in the parent grid through `display: contents`
   so the 7-column layout stays driven by the grid container while the ARIA
   tree gets the row → columnheader/gridcell structure `role="grid"`
   requires (axe aria-required-children). */
const rowContents = css`
  display: contents;
`;

const cellContents = css`
  display: contents;
`;

const weekday = css`
  padding: var(--haze-space-1);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
`;

const dayBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  color: var(--haze-color-text);
  cursor: pointer;
  padding: var(--haze-space-2);
  border-radius: var(--haze-radius-sm);
  font-size: var(--haze-text-sm);
  line-height: 1.5;
  transition: background 0.1s;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const daySelected = css`
  background: var(--haze-color-primary);
  color: var(--haze-color-text-inverse);

  &:hover {
    background: var(--haze-color-primary-hover);
  }
`;

const dayOutside = css`
  color: var(--haze-color-text-muted);
`;

/* Legacy weekday headers, indexed 0 = Sunday … 6 = Saturday. Kept for the
   no-locale default: Intl "short" weekday names differ ("Sun" vs "Su") and
   the default rendering must stay unchanged. */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* getWeekInfo is a recent Intl addition — treat it as optional so engines
   without it fall back to the legacy Sunday-first grid. */
type WeekInfoSource = { getWeekInfo?: () => { firstDay: number } };

function resolveWeekStart(locale: string | undefined, weekStartsOn: 0 | 1 | undefined) {
  if (weekStartsOn !== undefined) return weekStartsOn;
  // Without an explicit locale keep the legacy Sunday-first grid: Intl
  // resolves the pseudo-tag 'default' to Monday-first, which would silently
  // change the existing layout.
  if (locale === undefined) return 0;
  try {
    const firstDay = (new Intl.Locale(locale) as WeekInfoSource).getWeekInfo?.()
      .firstDay;
    // Intl reports 7 for a Sunday start; the grid works on Date#getDay()
    // semantics where 0 = Sunday.
    return firstDay === undefined || firstDay === 7 ? 0 : firstDay;
  } catch {
    // Unknown locale tag — fall back to the legacy grid.
    return 0;
  }
}

function getWeekdayLabels(locale: string | undefined, weekStart: number) {
  if (locale === undefined) {
    return Array.from({ length: 7 }, (_, i) => WEEKDAYS[(weekStart + i) % 7]!);
  }
  // 2024-01-07 is a Sunday; index 0…6 map to Sunday…Saturday.
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const byDay = Array.from({ length: 7 }, (_, day) =>
    fmt.format(new Date(2024, 0, 7 + day))
  );
  return Array.from({ length: 7 }, (_, i) => byDay[(weekStart + i) % 7]!);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Calendar({
  value,
  min,
  max,
  locale,
  weekStartsOn,
  onSelect,
}: CalendarProps) {
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const weekStart = resolveWeekStart(locale, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(locale, weekStart);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  const leadingDays = (firstDayOfWeek - weekStart + 7) % 7;

  const goPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const isDisabled = (dateStr: string) => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const cells: {
    day: number;
    month: number;
    year: number;
    outside: boolean;
  }[] = [];

  for (let i = leadingDays - 1; i >= 0; i--) {
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: prevMonthDays - i, month: m, year: y, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, outside: false });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, month: m, year: y, outside: true });
    }
  }

  // Equivalent to the previous toLocaleString('default', …) call —
  // Date#toLocaleString delegates to Intl.DateTimeFormat — but also serves
  // explicit locale tags.
  const monthLabel = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewYear, viewMonth));

  // Chunk the flat 7-aligned cell list into week rows (display: contents,
  // so layout is unchanged) — `role="grid"` requires row → columnheader /
  // gridcell structure (ARIA 1.2, axe aria-required-children).
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div x-class={[calendarWrapper]}>
      <div x-class={[header]}>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={goPrevMonth}
          aria-label='Previous month'
        >
          ‹
        </button>
        <span x-class={[headerTitle]}>{monthLabel}</span>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={goNextMonth}
          aria-label='Next month'
        >
          ›
        </button>
      </div>
      <div x-class={[grid]} role='grid' aria-label={monthLabel}>
        <div role='row' x-class={[rowContents]}>
          {weekdayLabels.map((label, i) => (
            <span key={i} role='columnheader' x-class={[weekday]}>
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div role='row' key={weekIndex} x-class={[rowContents]}>
            {week.map((c) => {
              const dateStr = formatDate(c.year, c.month, c.day);
              return (
                <span role='gridcell' key={dateStr} x-class={[cellContents]}>
                  <button
                    type='button'
                    x-class={[
                      dayBtn,
                      dateStr === value && daySelected,
                      c.outside && dayOutside,
                    ]}
                    disabled={isDisabled(dateStr)}
                    onClick={() => onSelect(dateStr)}
                  >
                    {c.day}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { CalendarProps };
