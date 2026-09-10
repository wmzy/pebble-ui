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
  formatMonthValue,
  formatQuarterValue,
  formatYearValue,
  getDaysInMonth,
  getISOWeekNumber,
  parseCivilDate,
  parseMonthValue,
  parseQuarterValue,
  parseYearValue,
} from './date';

/** Granularity Calendar picks at. Each mode serializes its `value` and
 * `onSelect` payload to a plain string: `"YYYY-MM-DD"` (date),
 * `"YYYY-MM"` (month), `"YYYY-Qn"` with n 1–4 (quarter) or `"YYYY"`
 * (year). */
type CalendarPickerMode = 'date' | 'month' | 'quarter' | 'year';

type CalendarProps = {
  /**
   * Granularity the calendar picks at. `"date"` (default) renders the
   * day grid; `"month"` a 3×4 month grid over one year; `"quarter"`
   * a 4-quarter grid over one year; `"year"` a 12-year grid stepped a
   * decade at a time. Values follow each mode's serialization (see
   * {@link CalendarPickerMode}); `months`, `showWeekNumbers`,
   * `weekStartsOn` and the range props apply to the day grid only.
   * @default 'date'
   */
  picker?: CalendarPickerMode;
  /**
   * Selected value as a plain string whose format follows `picker`:
   * "YYYY-MM-DD" (date, the default), "YYYY-MM" (month), "YYYY-Qn"
   * (quarter) or "YYYY" (year). Empty string means nothing selected.
   */
  value?: ControlOrValue<string>;
  /**
   * Earliest selectable date ("YYYY-MM-DD"). In the month/quarter/year
   * modes a cell is disabled only when its whole period lies before
   * `min` (the period's last day < `min`).
   */
  min?: string;
  /**
   * Latest selectable date ("YYYY-MM-DD"). In the month/quarter/year
   * modes a cell is disabled only when its whole period lies after
   * `max` (the period's first day > `max`).
   */
  max?: string;
  /**
   * Disables individual cells by predicate, alongside `min`/`max` (a
   * cell is disabled when either hits). Called with the cell's
   * representative date as a local-midnight `Date`: the day itself in
   * the date mode, day 1 of the month in the month mode, day 1 of the
   * quarter's first month in the quarter mode, January 1 in the year
   * mode. Disabled cells render natively disabled (inert to clicks,
   * skipped by keyboard roving).
   */
  disabledDate?: (date: Date) => boolean;
  /** BCP 47 locale used for month and weekday formatting. */
  locale?: string;
  /** Explicit first day of the week: 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /**
   * Render a leading ISO 8601 week-number column on every month grid
   * (labeled "Wk" / localized via the `calendar.weekNumber` string).
   * @default false
   */
  showWeekNumbers?: boolean;
  /**
   * Number of adjacent month grids rendered side by side. Both grids
   * share one navigation state: prev/next, the Today button and the
   * month quick-select move every grid together, and each grid keeps
   * its own keyboard roving.
   * @default 1
   */
  months?: 1 | 2;
  /**
   * Start of a highlighted date range ("YYYY-MM-DD"), drawn as a filled
   * endpoint on its day. Purely presentational — range picking logic
   * stays with the caller (see DateRangePicker's dual-month panel).
   */
  rangeStart?: string;
  /**
   * End of a highlighted date range ("YYYY-MM-DD"); together with
   * `rangeStart` fills every day in between with a subtle background.
   */
  rangeEnd?: string;
  /**
   * Called with the picked value — "YYYY-MM-DD" (date), "YYYY-MM"
   * (month), "YYYY-Qn" (quarter) or "YYYY" (year), matching `picker`.
   * Still fires alongside the controllable `value` for callers that
   * prefer event-style wiring.
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

/* The month title doubles as the quick-select trigger. Inheriting the
   font longhands and zeroing padding keeps the button's box identical to
   the plain span it replaced, so the default rendering is visually
   unchanged; headerTitle keeps owning weight and color. */
const titleBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  margin: 0;
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
  border-radius: var(--haze-radius-sm);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
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

const weekNumber = css`
  padding: var(--haze-space-2);
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

const dayInRange = css`
  background: var(--haze-color-primary-subtle);
`;

const dayOutside = css`
  color: var(--haze-color-text-muted);
`;

/* Two-grid layout (months={2}): panes sit side by side, each keeping the
   header + grid column structure of the single-month calendar. */
const monthPanels = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-4);
`;

const monthPanel = css`
  display: flex;
  flex-direction: column;
`;

/* Static label above the second pane — centered like pane 1's title
   sits between its nav buttons. */
const paneHeader = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  margin-block-end: var(--haze-space-2);
`;

/* Quick-select view: shared year toolbar above a 3×4 month grid. */
const quickSelect = css`
  display: flex;
  flex-direction: column;
`;

const quickToolbar = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  margin-block-end: var(--haze-space-2);
`;

const quickGrid = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  text-align: center;
`;

/* Quarter picker grid: one row of four quarter cells (same cell
   chrome as the month grid, one column per quarter). */
const quarterGrid = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  text-align: center;
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

/**
 * Selector-grid keyboard roving (WAI-ARIA grid pattern over a
 * `columns`-column cell grid — the quick-select month view and the
 * month/quarter/year picker modes): ←/→ move one cell, ↑/↓ one row,
 * Home/End jump to the row's first/last cell skipping disabled cells
 * (the day grid's `focusFrom`), PageUp/PageDown step the period (year
 * or decade) keeping the focused cell — `pendingCellIndexRef` hands the
 * index to the effect that re-focuses after the view commits.
 * Enter/Space pick via the button's native activation. Mirrors the day
 * grid's `dir="rtl"` arrow mirroring.
 */
function useSelectorGridKeyboard(
  gridRef: RefObject<HTMLDivElement | null>,
  columns: number,
  step: (delta: number) => void,
  pendingCellIndexRef: RefObject<number | null>
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
        move(columns);
        return;
      case 'ArrowUp':
        move(-columns);
        return;
      case 'Home': {
        const rowStart = current < 0 ? 0 : current - (current % columns);
        const index = focusFrom(buttons, rowStart - 1, 1);
        if (index !== null) {
          event.preventDefault();
          buttons[index]!.focus();
        }
        return;
      }
      case 'End': {
        const rowEnd =
          current < 0
            ? columns - 1
            : Math.min(
                current - (current % columns) + columns - 1,
                buttons.length - 1
              );
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
        pendingCellIndexRef.current = current < 0 ? 0 : current;
        step(event.key === 'PageDown' ? 1 : -1);
        return;
      }
    }
  };
}

export default function Calendar({
  picker = 'date',
  value: valueControl,
  min,
  max,
  disabledDate,
  locale,
  weekStartsOn,
  showWeekNumbers = false,
  months = 1,
  rangeStart,
  rangeEnd,
  onSelect,
  className,
  ...rest
}: CalendarProps) {
  const [value, setValue] = useControl(valueControl, '');
  const strings = useStrings('calendar');
  const gridRef = useRef<HTMLDivElement>(null);
  const secondGridRef = useRef<HTMLDivElement>(null);
  // Wrapper-scoped ref: pending-focus dates may land in either month pane.
  const rootRef = useRef<HTMLDivElement>(null);
  // Day ("YYYY-MM-DD") to focus once the next view renders (PageUp/Down
  // month hops and quick-select month picks — the cells do not exist
  // until the state commits).
  const pendingFocusRef = useRef<string | null>(null);
  // Quick-select view: month button index (0 = January … 11 = December,
  // DOM order) to focus once the selector renders (open handover and
  // year hops).
  const pendingQuickCellRef = useRef<number | null>(null);
  // Month/quarter/year modes: cell index to focus once the stepped
  // view (year or decade hop) commits.
  const pendingModeCellRef = useRef<number | null>(null);
  const modeGridRef = useRef<HTMLDivElement>(null);
  const titleBtnRef = useRef<HTMLButtonElement>(null);
  const quickGridRef = useRef<HTMLDivElement>(null);
  // Pure internal UI state: the quick-select view swap never surfaces as
  // a prop, so useState (not useControl) is the right tool here.
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickYear, setQuickYear] = useState(0);

  // Civil parse: `new Date(value)` would read the value as UTC midnight
  // and land west-of-UTC users on the previous day — showing February
  // for a '2026-03-01' value in America/New_York. Picker modes parse
  // their own serialization; only the year steers their view, so a
  // January anchor normalizes `initial` across modes.
  const modeValue =
    picker === 'month'
      ? parseMonthValue(value)
      : picker === 'quarter'
        ? parseQuarterValue(value)
        : picker === 'year'
          ? parseYearValue(value)
          : null;
  const initial =
    picker === 'date'
      ? (value && parseCivilDate(value)) ||
        (rangeStart && parseCivilDate(rangeStart)) ||
        new Date()
      : modeValue
        ? new Date(modeValue.year, 0, 1)
        : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const weekStart = resolveWeekStart(locale, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(locale, weekStart);

  const titleFormatter = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'long',
    year: 'numeric',
  });
  const monthNameFormatter = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'short',
  });
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    monthNameFormatter.format(new Date(2026, month, 15))
  );

  const setView = (next: { year: number; month: number }) => {
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  // Focus handover for keyboard month hops (Cascader's pendingFocus
  // pattern): the day exists only after the view commits. Also runs on
  // quick-select close so picking the already-viewed month (view state
  // unchanged, React bails out) still hands focus to day 1.
  useEffect(() => {
    if (quickOpen) return;
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-haze-day="${target}"]`)
      ?.focus();
  }, [viewYear, viewMonth, quickOpen]);

  // Focus handover for the quick-select grid: the month buttons exist
  // only after the selector mounts (open) or the year stepper commits
  // (PageUp/Down year hop keeping the focused month).
  useEffect(() => {
    if (!quickOpen) return;
    const index = pendingQuickCellRef.current;
    pendingQuickCellRef.current = null;
    const buttons = dayButtons(quickGridRef.current);
    if (buttons.length === 0) return;
    (buttons[index ?? 0] ?? buttons[0])!.focus();
  }, [quickOpen, quickYear]);

  // Focus handover for the picker-mode grids: PageUp/Down period hops
  // replace every cell (year or decade shift), so the pending index is
  // re-resolved against the freshly committed grid.
  useEffect(() => {
    if (picker === 'date') return;
    const index = pendingModeCellRef.current;
    pendingModeCellRef.current = null;
    if (index === null) return;
    const buttons = dayButtons(modeGridRef.current);
    (buttons[index] ?? buttons[0])?.focus();
  }, [picker, viewYear]);

  const openQuickSelect = () => {
    pendingQuickCellRef.current = viewMonth;
    setQuickYear(viewYear);
    setQuickOpen(true);
  };

  const closeQuickSelect = () => {
    setQuickOpen(false);
    titleBtnRef.current?.focus();
  };

  const chooseMonth = (month: number) => {
    setQuickOpen(false);
    setView({ year: quickYear, month });
    pendingFocusRef.current = formatDate(quickYear, month, 1);
  };

  const secondPane = addMonths(viewYear, viewMonth, months - 1);
  const handleGridKeyDown = useGridKeyboard(
    gridRef,
    { year: viewYear, month: viewMonth },
    setView,
    pendingFocusRef
  );
  const handleSecondGridKeyDown = useGridKeyboard(
    secondGridRef,
    secondPane,
    setView,
    pendingFocusRef
  );

  const handleQuickGridKeyDown = useSelectorGridKeyboard(
    quickGridRef,
    3,
    (delta) => setQuickYear((year) => year + delta),
    pendingQuickCellRef
  );

  // Picker modes: prev/next and PageUp/Down step one year (month and
  // quarter modes) or one decade (year mode), keeping the focused cell.
  const modeColumns = picker === 'quarter' ? 4 : 3;
  const stepModePeriod = (delta: number) =>
    setViewYear((year) => year + delta * (picker === 'year' ? 10 : 1));
  const handleModeGridKeyDown = useSelectorGridKeyboard(
    modeGridRef,
    modeColumns,
    stepModePeriod,
    pendingModeCellRef
  );

  const goPrevMonth = () => setView(addMonths(viewYear, viewMonth, -1));

  const goNextMonth = () => setView(addMonths(viewYear, viewMonth, 1));

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isCellDisabled = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return disabledDate?.(new Date(year, month, day)) ?? false;
  };

  // A month cell is disabled when its whole period is out of range (any
  // day could still be pickable inside) or its representative day —
  // day 1 — is rejected by `disabledDate`.
  const isMonthCellDisabled = (year: number, month: number) => {
    if (min && formatDate(year, month, getDaysInMonth(year, month)) < min)
      return true;
    if (max && formatDate(year, month, 1) > max) return true;
    return disabledDate?.(new Date(year, month, 1)) ?? false;
  };

  const isQuarterCellDisabled = (year: number, quarter: number) => {
    const firstMonth = quarter * 3 - 3;
    const lastMonth = quarter * 3 - 1;
    if (min && formatDate(year, lastMonth, getDaysInMonth(year, lastMonth)) < min)
      return true;
    if (max && formatDate(year, firstMonth, 1) > max) return true;
    return disabledDate?.(new Date(year, firstMonth, 1)) ?? false;
  };

  const isYearCellDisabled = (year: number) => {
    if (min && formatDate(year, 11, 31) < min) return true;
    if (max && formatDate(year, 0, 1) > max) return true;
    return disabledDate?.(new Date(year, 0, 1)) ?? false;
  };

  const pickModeValue = (next: string) => {
    setValue(next);
    onSelect?.(next);
  };

  const rangeStartSet = rangeStart !== undefined && rangeStart !== '';
  const rangeEndSet = rangeEnd !== undefined && rangeEnd !== '';
  const isRangeEndpoint = (dateStr: string) =>
    (rangeStartSet && dateStr === rangeStart) ||
    (rangeEndSet && dateStr === rangeEnd);
  const isInRange = (dateStr: string) =>
    rangeStartSet &&
    rangeEndSet &&
    dateStr > rangeStart &&
    dateStr < rangeEnd;

  const monthLabel = titleFormatter.format(new Date(viewYear, viewMonth));

  /** One month pane: weekday header row + chunked week rows. Shared by
   * the single- and dual-month layouts; `pane` is the pane's own view so
   * keyboard month hops anchor on the focused grid. */
  const renderMonthPane = (
    pane: { year: number; month: number },
    paneRef: RefObject<HTMLDivElement | null>,
    handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
  ) => {
    const cells = buildMonthCells(pane.year, pane.month, weekStart);
    // Chunk the flat 7-aligned cell list into week rows (display:
    // contents, so layout is unchanged) — `role="grid"` requires row →
    // columnheader / gridcell structure (ARIA 1.2, axe
    // aria-required-children).
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    const paneLabel = titleFormatter.format(new Date(pane.year, pane.month));

    return (
      <div
        ref={paneRef}
        x-class={[grid]}
        style={showWeekNumbers ? { gridTemplateColumns: 'repeat(8, 1fr)' } : undefined}
        role='grid'
        aria-label={paneLabel}
        onKeyDown={handleKeyDown}
      >
        <div role='row' x-class={[rowContents]}>
          {showWeekNumbers && (
            <span role='columnheader' x-class={[weekday]}>
              {strings.weekNumber}
            </span>
          )}
          {weekdayLabels.map((label, i) => (
            <span key={i} role='columnheader' x-class={[weekday]}>
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div role='row' key={weekIndex} x-class={[rowContents]}>
            {showWeekNumbers && (
              <span role='gridcell' x-class={[weekNumber]}>
                {getISOWeekNumber(week[0]!.year, week[0]!.month, week[0]!.day)}
              </span>
            )}
            {week.map((c) => {
              const dateStr = formatDate(c.year, c.month, c.day);
              const endpoint = isRangeEndpoint(dateStr);
              const selected = dateStr === value || endpoint;
              return (
                <span
                  role='gridcell'
                  key={dateStr}
                  aria-selected={selected || isInRange(dateStr)}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-haze-day={dateStr}
                    x-class={[
                      dayBtn,
                      selected && daySelected,
                      !selected && isInRange(dateStr) && dayInRange,
                      c.outside && dayOutside,
                    ]}
                    disabled={isCellDisabled(c.year, c.month, c.day)}
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
    );
  };

  const quickSelectView = (
    <div x-class={[quickSelect]} onKeyDown={onQuickKeyDown}>
      <div x-class={[quickToolbar]}>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={() => setQuickYear((year) => year - 1)}
          aria-label={strings.previousYear}
        >
          ‹
        </button>
        <span x-class={[headerTitle]}>{quickYear}</span>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={() => setQuickYear((year) => year + 1)}
          aria-label={strings.nextYear}
        >
          ›
        </button>
      </div>
      <div
        ref={quickGridRef}
        x-class={[quickGrid]}
        role='grid'
        aria-label={strings.selectMonth}
        onKeyDown={handleQuickGridKeyDown}
      >
        {[0, 1, 2, 3].map((rowIndex) => (
          <div role='row' key={rowIndex} x-class={[rowContents]}>
            {[0, 1, 2].map((column) => {
              const month = rowIndex * 3 + column;
              const current = quickYear === viewYear && month === viewMonth;
              return (
                <span
                  role='gridcell'
                  key={month}
                  aria-selected={current}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-haze-month={month}
                    x-class={[dayBtn, current && daySelected]}
                    onClick={() => chooseMonth(month)}
                  >
                    {monthNames[month]}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  /** Esc anywhere inside the quick-select view (grid focus or the year
   *  toolbar) cancels and returns focus to the header title button. */
  function onQuickKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeQuickSelect();
    }
  }

  /* ── Picker modes ── First-class month/quarter/year grids: a period
   *  stepper header (year, or decade in the year mode) above a cell
   *  grid whose cells select directly. Same grid/gridcell semantics
   *  and roving keyboard as the day grid; the date mode's quick-select
   *  is the in-place cousin of the month mode. */
  if (picker !== 'date') {
    const decadeStart = Math.floor(viewYear / 10) * 10;
    const previousLabel =
      picker === 'year' ? strings.previousDecade : strings.previousYear;
    const nextLabel =
      picker === 'year' ? strings.nextDecade : strings.nextYear;
    const title =
      picker === 'year'
        ? `${decadeStart} – ${decadeStart + 11}`
        : String(viewYear);

    const modeGrid =
      picker === 'month' ? (
        <div
          ref={modeGridRef}
          x-class={[quickGrid]}
          role='grid'
          aria-label={strings.selectMonth}
          onKeyDown={handleModeGridKeyDown}
        >
          {[0, 1, 2, 3].map((rowIndex) => (
            <div role='row' key={rowIndex} x-class={[rowContents]}>
              {[0, 1, 2].map((column) => {
                const month = rowIndex * 3 + column;
                const selected =
                  value === formatMonthValue(viewYear, month);
                return (
                  <span
                    role='gridcell'
                    key={month}
                    aria-selected={selected}
                    x-class={[cellContents]}
                  >
                    <button
                      type='button'
                      data-haze-month={month}
                      x-class={[dayBtn, selected && daySelected]}
                      disabled={isMonthCellDisabled(viewYear, month)}
                      onClick={() =>
                        pickModeValue(formatMonthValue(viewYear, month))
                      }
                    >
                      {monthNames[month]}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ) : picker === 'quarter' ? (
        <div
          ref={modeGridRef}
          x-class={[quarterGrid]}
          role='grid'
          aria-label={strings.selectQuarter}
          onKeyDown={handleModeGridKeyDown}
        >
          <div role='row' x-class={[rowContents]}>
            {[1, 2, 3, 4].map((quarter) => {
              const selected =
                value === formatQuarterValue(viewYear, quarter);
              return (
                <span
                  role='gridcell'
                  key={quarter}
                  aria-selected={selected}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-haze-quarter={quarter}
                    x-class={[dayBtn, selected && daySelected]}
                    disabled={isQuarterCellDisabled(viewYear, quarter)}
                    onClick={() =>
                      pickModeValue(formatQuarterValue(viewYear, quarter))
                    }
                  >
                    Q{quarter}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          ref={modeGridRef}
          x-class={[quickGrid]}
          role='grid'
          aria-label={strings.selectYear}
          onKeyDown={handleModeGridKeyDown}
        >
          {[0, 1, 2, 3].map((rowIndex) => (
            <div role='row' key={rowIndex} x-class={[rowContents]}>
              {[0, 1, 2].map((column) => {
                const year = decadeStart + rowIndex * 3 + column;
                const selected = value === formatYearValue(year);
                return (
                  <span
                    role='gridcell'
                    key={year}
                    aria-selected={selected}
                    x-class={[cellContents]}
                  >
                    <button
                      type='button'
                      data-haze-year={year}
                      x-class={[dayBtn, selected && daySelected]}
                      disabled={isYearCellDisabled(year)}
                      onClick={() => pickModeValue(formatYearValue(year))}
                    >
                      {year}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      );

    return (
      <div ref={rootRef} x-class={[calendarWrapper, className]} {...rest}>
        <div x-class={[header]}>
          <button
            type='button'
            x-class={[headerBtn]}
            onClick={() => stepModePeriod(-1)}
            aria-label={previousLabel}
          >
            ‹
          </button>
          <span x-class={[headerTitle]}>{title}</span>
          <span x-class={[headerTrailing]}>
            <button type='button' x-class={[headerBtn]} onClick={goToday}>
              {strings.today}
            </button>
            <button
              type='button'
              x-class={[headerBtn]}
              onClick={() => stepModePeriod(1)}
              aria-label={nextLabel}
            >
              ›
            </button>
          </span>
        </div>
        {modeGrid}
      </div>
    );
  }

  return (
    <div ref={rootRef} x-class={[calendarWrapper, className]} {...rest}>
      <div x-class={[header]}>
        <button
          type='button'
          x-class={[headerBtn]}
          onClick={goPrevMonth}
          aria-label={strings.previousMonth}
        >
          ‹
        </button>
        <button
          ref={titleBtnRef}
          type='button'
          x-class={[titleBtn, headerTitle]}
          aria-expanded={quickOpen}
          onClick={quickOpen ? closeQuickSelect : openQuickSelect}
        >
          {monthLabel}
        </button>
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
      {quickOpen
        ? quickSelectView
        : months === 2
          ? (
              <div x-class={[monthPanels]}>
                <div x-class={[monthPanel]}>
                  {renderMonthPane(
                    { year: viewYear, month: viewMonth },
                    gridRef,
                    handleGridKeyDown
                  )}
                </div>
                <div x-class={[monthPanel]}>
                  <div x-class={[paneHeader]}>
                    <span x-class={[headerTitle]}>
                      {titleFormatter.format(
                        new Date(secondPane.year, secondPane.month)
                      )}
                    </span>
                  </div>
                  {renderMonthPane(
                    secondPane,
                    secondGridRef,
                    handleSecondGridKeyDown
                  )}
                </div>
              </div>
            )
          : renderMonthPane(
              { year: viewYear, month: viewMonth },
              gridRef,
              handleGridKeyDown
            )}
    </div>
  );
}

export type { CalendarProps, CalendarPickerMode };
