import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';
import { useEffect, useRef, useState } from 'react';

import { getDirection } from '../../utils/direction';
import { useStrings } from '../LocaleProvider';

import {
  addMonths,
  buildMonthCells,
  formatDate,
  getDaysInMonth,
  parseCivilDate,
} from './date';

type CalendarProps = {
  /** Selected date as "YYYY-MM-DD"; empty string means nothing selected. */
  value?: ControlOrValue<string>;
  /** Earliest selectable date ("YYYY-MM-DD"). */
  min?: string;
  /** Latest selectable date ("YYYY-MM-DD"). */
  max?: string;
  /** BCP 47 locale used for month and weekday formatting. */
  locale?: string;
  /** Explicit first day of the week: 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /**
   * Called with the picked "YYYY-MM-DD" date. Still fires alongside the
   * controllable `value` for callers that prefer event-style wiring.
   */
  onSelect?: (date: string) => void;
} & Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'>;

const calendarWrapper = css`
  padding: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--haze-space-2);
  margin-block-end: var(--haze-space-2);
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
  font-family: var(--haze-font-sans);
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

const headerTrailing = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
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
  transition: background var(--haze-duration-fast) var(--haze-ease);

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

/** Day buttons of the rendered grid in DOM order (outside months and
 * disabled days included — `focusFrom` skips the disabled ones). */
function dayButtons(grid: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(
    grid?.querySelectorAll<HTMLButtonElement>('button') ?? []
  );
}

/**
 * Move focus by `delta` slots on the 7-column grid, skipping disabled
 * days in the direction of travel and stopping at the grid's edges (the
 * month boundary is a real boundary — outside-month cells are rendered
 * on both sides of it).
 */
function focusFrom(
  buttons: HTMLButtonElement[],
  from: number,
  delta: number
): number | null {
  let index = from + delta;
  while (index >= 0 && index < buttons.length && buttons[index]!.disabled) {
    index += delta;
  }
  if (index < 0 || index >= buttons.length) return null;
  return index;
}

/**
 * Date-grid keyboard roving (WAI-ARIA grid pattern): ←/→ move one day,
 * ↑/↓ one week, Home/End jump to the row's first/last day, PageUp/
 * PageDown switch the month view keeping the same day (clamped to the
 * month's length). Under `dir="rtl"` the horizontal arrows mirror (←
 * moves to the next day), read from the DOM at event time so the keys
 * follow the mirrored grid.
 */
function useGridKeyboard(
  gridRef: RefObject<HTMLDivElement | null>,
  view: { year: number; month: number },
  setView: (next: { year: number; month: number }) => void,
  pendingFocusRef: RefObject<string | null>
) {
  return (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    const buttons = dayButtons(grid);
    if (buttons.length === 0) return;
    const current = buttons.indexOf(
      (event.target as HTMLElement).closest('button')!
    );

    const forward =
      getDirection(grid) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const move = (delta: number) => {
      const index = focusFrom(buttons, current < 0 ? 0 : current, delta);
      if (index !== null) {
        event.preventDefault();
        buttons[index]!.focus();
      }
    };

    switch (event.key) {
      case forward:
        move(1);
        return;
      case backward:
        move(-1);
        return;
      case 'ArrowDown':
        move(7);
        return;
      case 'ArrowUp':
        move(-7);
        return;
      case 'Home': {
        const rowStart = current < 0 ? 0 : current - (current % 7);
        const index = focusFrom(buttons, rowStart - 1, 1);
        if (index !== null) {
          event.preventDefault();
          buttons[index]!.focus();
        }
        return;
      }
      case 'End': {
        const rowEnd = current < 0 ? 6 : current - (current % 7) + 6;
        const index = focusFrom(buttons, rowEnd + 1, -1);
        if (index !== null) {
          event.preventDefault();
          buttons[index]!.focus();
        }
        return;
      }
      case 'PageUp':
      case 'PageDown': {
        event.preventDefault();
        const delta = event.key === 'PageDown' ? 1 : -1;
        const next = addMonths(view.year, view.month, delta);
        // Keep the focused day (clamped to the target month's length);
        // falls back to the first day when nothing was focused.
        const fromDay =
          current >= 0
            ? Number(buttons[current]!.textContent)
            : 1;
        const day = Math.min(
          Math.max(fromDay, 1),
          getDaysInMonth(next.year, next.month)
        );
        setView(next);
        pendingFocusRef.current = formatDate(next.year, next.month, day);
        return;
      }
    }
  };
}

export default function Calendar({
  value: valueControl,
  min,
  max,
  locale,
  weekStartsOn,
  onSelect,
  className,
  ...rest
}: CalendarProps) {
  const [value, setValue] = useControl(valueControl, '');
  const strings = useStrings('calendar');
  const gridRef = useRef<HTMLDivElement>(null);
  // Day ("YYYY-MM-DD") to focus once the next view renders (PageUp/Down
  // month hops — the cells do not exist until the state commits).
  const pendingFocusRef = useRef<string | null>(null);

  // Civil parse: `new Date(value)` would read the value as UTC midnight
  // and land west-of-UTC users on the previous day — showing February
  // for a '2026-03-01' value in America/New_York.
  const initial = (value && parseCivilDate(value)) || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const weekStart = resolveWeekStart(locale, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(locale, weekStart);

  const cells = buildMonthCells(viewYear, viewMonth, weekStart);

  const setView = (next: { year: number; month: number }) => {
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  // Focus handover for keyboard month hops (Cascader's pendingFocus
  // pattern): the day exists only after the view commits.
  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-haze-day="${target}"]`)
      ?.focus();
  }, [viewYear, viewMonth]);

  const handleGridKeyDown = useGridKeyboard(
    gridRef,
    { year: viewYear, month: viewMonth },
    setView,
    pendingFocusRef
  );

  const goPrevMonth = () => setView(addMonths(viewYear, viewMonth, -1));

  const goNextMonth = () => setView(addMonths(viewYear, viewMonth, 1));

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isDisabled = (dateStr: string) => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

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
    <div x-class={[calendarWrapper, className]} {...rest}>
      <div x-class={[header]}>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={goPrevMonth}
          aria-label={strings.previousMonth}
        >
          ‹
        </button>
        <span x-class={[headerTitle]}>{monthLabel}</span>
        <span x-class={[headerTrailing]}>
          <button type='button' x-class={[headerBtn]} onClick={goToday}>
            {strings.today}
          </button>
          <button
            type='button'
            x-class={[headerBtn]}
            onClick={goNextMonth}
            aria-label={strings.nextMonth}
          >
            ›
          </button>
        </span>
      </div>
      <div
        ref={gridRef}
        x-class={[grid]}
        role='grid'
        aria-label={monthLabel}
        onKeyDown={handleGridKeyDown}
      >
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
                <span
                  role='gridcell'
                  key={dateStr}
                  aria-selected={dateStr === value}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-haze-day={dateStr}
                    x-class={[
                      dayBtn,
                      dateStr === value && daySelected,
                      c.outside && dayOutside,
                    ]}
                    disabled={isDisabled(dateStr)}
                    onClick={() => {
                      setValue(dateStr);
                      onSelect?.(dateStr);
                    }}
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
