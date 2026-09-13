import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from 'react';
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
  formatWeekValue,
  formatYearValue,
  getDaysInMonth,
  getISOWeek,
  getISOWeekStartDate,
  parseCivilDate,
  parseMonthValue,
  parseQuarterValue,
  parseWeekValue,
  parseYearValue,
} from './date';

/** Granularity Calendar picks at. Each mode serializes its `value` and
 * `onSelect` payload to a plain string: `"YYYY-MM-DD"` (date), an ISO
 * 8601 week `"YYYY-Www"` (week), `"YYYY-MM"` (month), `"YYYY-Qn"` with
 * n 1–4 (quarter) or `"YYYY"` (year). */
type CalendarPickerMode = 'date' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Extra render position appended inside picker cells (day numbers, month
 * / quarter / year labels) — schedule dots, badges, custom chrome. Called
 * with the cell's representative civil date (`day` 1 for the
 * month/quarter/year cells) and the picker mode the cell renders in, so
 * one callback can decorate a date grid and the header drill-down grids
 * differently.
 */
type CalendarCellRender = (
  date: { year: number; month: number; day: number },
  mode: CalendarPickerMode
) => ReactNode;

/** Which grid the date-mode panel currently shows: the day grid itself,
 * the quick-select month grid, or the decade year grid drilled from the
 * header's year title or the quick-select toolbar. */
type HeaderPanelView = 'days' | 'months' | 'years';

type CalendarProps = {
  /**
   * Granularity the calendar picks at. `"date"` (default) renders the
   * day grid; `"week"` the same day grid with whole-ISO-week row
   * selection (rows run Monday–Sunday, the week-number column is always
   * shown and `weekStartsOn` is ignored — ISO weeks are Monday-first by
   * definition); `"month"` a 3×4 month grid over one year; `"quarter"`
   * a 4-quarter grid over one year; `"year"` a 12-year grid stepped a
   * decade at a time. Values follow each mode's serialization (see
   * {@link CalendarPickerMode}); `months`, `showWeekNumbers`,
   * `weekStartsOn` and the range props apply to the day grid only.
   * @default 'date'
   */
  picker?: CalendarPickerMode;
  /**
   * Selected value as a plain string whose format follows `picker`:
   * "YYYY-MM-DD" (date, the default), an ISO week "YYYY-Www" (week),
   * "YYYY-MM" (month), "YYYY-Qn" (quarter) or "YYYY" (year). Empty
   * string means nothing selected.
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
   * Called with the picked value — "YYYY-MM-DD" (date), an ISO week
   * "YYYY-Www" (week), "YYYY-MM" (month), "YYYY-Qn" (quarter) or "YYYY"
   * (year), matching `picker`. Still fires alongside the controllable
   * `value` for callers that prefer event-style wiring.
   */
  onSelect?: (date: string) => void;
  /**
   * Appends a custom render inside every picker cell — day numbers,
   * month/quarter/year labels and the header drill-down grids alike
   * (schedule dots, badges). Receives the cell's representative civil
   * date (`day` 1 for month/quarter/year cells) and the mode the cell
   * renders in. Opt-in: without it the cells render exactly as before.
   */
  cellRender?: CalendarCellRender;
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

/* The date-mode header carries two drill-down titles (month and year);
   they sit inline in the header's center slot, ordered per the locale's
   own month/year part order. */
const headerTitles = css`
  display: inline-flex;
  align-items: baseline;
  gap: var(--haze-space-1);
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

/* Week mode: the row label of the selected week picks up the primary
   color to match the filled day cells beside it. */
const weekNumberSelected = css`
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
`;

/* cellRender slot: stacks the custom content under the day number.
   Only mounted when a cellRender is provided, so default cells keep
   their plain text-only content. */
const dayContent = css`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--haze-space-1);
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
  cellRender,
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
  const monthTitleRef = useRef<HTMLButtonElement>(null);
  const yearTitleRef = useRef<HTMLButtonElement>(null);
  const quickGridRef = useRef<HTMLDivElement>(null);
  // Header drill-down: which grid the panel currently shows over the
  // day view — the day grid itself, the quick-select month grid or a
  // decade year grid. Internal view state (never a prop): drilling is
  // navigation, not a value change, so it stays fully decoupled from
  // the `picker` granularity the value serializes at. useControl keeps
  // the door open for a future control prop with zero wiring cost.
  const [panelView, setPanelView] = useControl<HeaderPanelView>(
    undefined,
    'days'
  );
  // Year the quick-select month grid (and its toolbar) is anchored at.
  const [quickYear, setQuickYear] = useState(0);
  // Anchor year of the decade year grid while it is open, and where a
  // year pick returns to ('days' when opened straight from the date
  // header's year title, 'months' when drilled from the quick-select
  // toolbar — antd parity).
  const [yearsAnchor, setYearsAnchor] = useState(0);
  const yearsReturnRef = useRef<'days' | 'months'>('days');
  // Month/quarter picker modes: the year title drills into the same
  // decade grid; picking a year returns to the mode grid anchored at it.
  const [modeYearsOpen, setModeYearsOpen] = useControl<boolean>(
    undefined,
    false
  );
  // Anchor year of the mode drill-down grid (stepping a decade moves
  // this, not the mode view's own year).
  const [modeYearsAnchor, setModeYearsAnchor] = useState(0);

  // Week mode: whole-ISO-week rows. Values are "YYYY-Www", so the
  // anchor is the week's Monday (see getISOWeekStartDate) — not a
  // January 1 normalization like the coarser modes.
  const weekMode = picker === 'week';
  const weekValue = weekMode ? parseWeekValue(value) : null;
  const weekAnchor = weekValue
    ? getISOWeekStartDate(weekValue.year, weekValue.week)
    : null;

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
      : weekAnchor
        ? new Date(weekAnchor.year, weekAnchor.month, weekAnchor.day)
        : modeValue
          ? new Date(modeValue.year, 0, 1)
          : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // ISO weeks run Monday–Sunday by definition, so the week grid is
  // always Monday-first — a Sunday-first row would straddle two ISO
  // weeks and make "the row's week" ambiguous.
  const weekStart = weekMode ? 1 : resolveWeekStart(locale, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(locale, weekStart);
  const showWeekColumn = showWeekNumbers || weekMode;

  const titleFormatter = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'long',
    year: 'numeric',
  });
  const monthTitleFormatter = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'long',
  });
  const monthNameFormatter = new Intl.DateTimeFormat(locale ?? 'default', {
    month: 'short',
  });
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    monthNameFormatter.format(new Date(2026, month, 15))
  );
  // Locale part order of the combined "Month Year" title decides the
  // header's title order (zh-CN renders the year first; en-US the
  // month), so the two drill-down titles read in the locale's own order.
  const titleParts = titleFormatter.formatToParts(
    new Date(viewYear, viewMonth, 15)
  );
  const yearTitleFirst =
    titleParts.findIndex((part) => part.type === 'year') <
    titleParts.findIndex((part) => part.type === 'month');

  const setView = (next: { year: number; month: number }) => {
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  // Focus handover for keyboard month hops (Cascader's pendingFocus
  // pattern): the day exists only after the view commits. Also runs on
  // quick-select close so picking the already-viewed month (view state
  // unchanged, React bails out) still hands focus to day 1.
  useEffect(() => {
    if (panelView !== 'days') return;
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-haze-day="${target}"]`)
      ?.focus();
  }, [viewYear, viewMonth, panelView]);

  // Focus handover for the header drill-down grids: the month or year
  // buttons exist only after the selector mounts (open), the year
  // stepper commits (PageUp/Down year hop keeping the focused month) or
  // the drill-down level swaps (year grid opened / closed). The
  // month/quarter mode drill rides the same ref and pending handover.
  useEffect(() => {
    if (panelView === 'days' && !modeYearsOpen) return;
    const index = pendingQuickCellRef.current;
    pendingQuickCellRef.current = null;
    const buttons = dayButtons(quickGridRef.current);
    if (buttons.length === 0) return;
    (buttons[index ?? 0] ?? buttons[0])!.focus();
  }, [panelView, quickYear, yearsAnchor, modeYearsOpen, modeYearsAnchor]);

  // Focus handover for the picker-mode grids: PageUp/Down period hops
  // replace every cell (year or decade shift), so the pending index is
  // re-resolved against the freshly committed grid. Closing the mode
  // drill-down re-focuses the value's cell the same way (the year pick
  // commits a new viewYear; a plain Esc does not change it, so
  // modeYearsOpen joins the deps).
  useEffect(() => {
    if (picker === 'date' || picker === 'week') return;
    if (modeYearsOpen) return;
    const index = pendingModeCellRef.current;
    pendingModeCellRef.current = null;
    if (index === null) return;
    const buttons = dayButtons(modeGridRef.current);
    (buttons[index] ?? buttons[0])?.focus();
  }, [picker, viewYear, modeYearsOpen]);

  const openMonthsView = () => {
    pendingQuickCellRef.current = viewMonth;
    setQuickYear(viewYear);
    setPanelView('months');
  };

  const closeMonthsView = () => {
    setPanelView('days');
    monthTitleRef.current?.focus();
  };

  const chooseMonth = (month: number) => {
    setPanelView('days');
    setView({ year: quickYear, month });
    pendingFocusRef.current = formatDate(quickYear, month, 1);
  };

  /* Year drill-down (the picker="year" grid's decade layout): opened
   * either straight from the date header's year title (picking a year
   * lands back on the day grid anchored at it) or from the quick-select
   * toolbar (picking returns to the month grid, the picker="year"
   * grid's cousin). Opening hands focus to the anchor year's cell. */
  const yearsDecadeStart = Math.floor(yearsAnchor / 10) * 10;

  const openYearsFromHeader = () => {
    yearsReturnRef.current = 'days';
    // Decade of the NEW anchor (viewYear), not the previous state.
    pendingQuickCellRef.current = viewYear - Math.floor(viewYear / 10) * 10;
    setYearsAnchor(viewYear);
    setPanelView('years');
  };

  const openYearsFromMonths = () => {
    yearsReturnRef.current = 'months';
    pendingQuickCellRef.current = quickYear - Math.floor(quickYear / 10) * 10;
    setYearsAnchor(quickYear);
    setPanelView('years');
  };

  const closeYearsView = () => {
    if (yearsReturnRef.current === 'months') {
      setPanelView('months');
      pendingQuickCellRef.current = viewMonth;
    } else {
      setPanelView('days');
      yearTitleRef.current?.focus();
    }
  };

  const chooseYear = (year: number) => {
    if (yearsReturnRef.current === 'months') {
      setQuickYear(year);
      setPanelView('months');
      pendingQuickCellRef.current = viewMonth;
    } else {
      setPanelView('days');
      setViewYear(year);
      pendingFocusRef.current = formatDate(year, viewMonth, 1);
    }
  };

  /* Month/quarter mode drill-down: the year title opens the decade
   * grid anchored at the viewed year; picking (or Esc) returns to the
   * mode grid with focus on the value's cell. */
  const modeYearsDecadeStart = Math.floor(modeYearsAnchor / 10) * 10;

  const modeValueCellIndex = () =>
    picker === 'month'
      ? (parseMonthValue(value)?.month ?? 0)
      : (parseQuarterValue(value)?.quarter ?? 1) - 1;

  const openModeYears = () => {
    pendingQuickCellRef.current = viewYear - Math.floor(viewYear / 10) * 10;
    setModeYearsAnchor(viewYear);
    setModeYearsOpen(true);
  };

  const closeModeYears = () => {
    pendingModeCellRef.current = modeValueCellIndex();
    setModeYearsOpen(false);
  };

  const chooseModeYear = (year: number) => {
    pendingModeCellRef.current = modeValueCellIndex();
    setViewYear(year);
    setModeYearsOpen(false);
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

  // Year drill-down grid: 3 columns like the month grid, PageUp/Down
  // step a decade (matching the picker="year" mode's stepper).
  const handleYearsGridKeyDown = useSelectorGridKeyboard(
    quickGridRef,
    3,
    (delta) => setYearsAnchor((year) => year + delta * 10),
    pendingQuickCellRef
  );

  // Month/quarter mode drill-down grid: PageUp/Down step the drill's
  // own anchor by a decade (the mode view's year stays untouched while
  // drilling; the pick commits it).
  const handleModeYearsGridKeyDown = useSelectorGridKeyboard(
    quickGridRef,
    3,
    (delta) => setModeYearsAnchor((year) => year + delta * 10),
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

  /* The two date-header drill titles. Both keep the plain-text box of
   * the span they replaced (titleBtn inherits font longhands and zeros
   * padding), so the header stays visually unchanged apart from being
   * two focuses. */
  const monthTitle = (
    <button
      ref={monthTitleRef}
      data-slot='title'
      type='button'
      x-class={[titleBtn, headerTitle]}
      aria-haspopup='grid'
      aria-expanded={panelView === 'months'}
      onClick={panelView === 'months' ? closeMonthsView : openMonthsView}
    >
      {monthTitleFormatter.format(new Date(viewYear, viewMonth))}
    </button>
  );
  const yearTitle = (
    <button
      ref={yearTitleRef}
      data-slot='title'
      type='button'
      x-class={[titleBtn, headerTitle]}
      aria-haspopup='grid'
      aria-expanded={panelView === 'years'}
      onClick={panelView === 'years' ? closeYearsView : openYearsFromHeader}
    >
      {viewYear}
    </button>
  );

  /** One month pane: weekday header row + chunked week rows. Shared by
   * the single- and dual-month layouts; `pane` is the pane's own view so
   * keyboard month hops anchor on the focused grid. In the week mode
   * every row of the (Monday-first) grid is one ISO week: the week
   * column is always shown, a day pick commits the row's
   * `"YYYY-Www"` value and the whole selected week renders selected. */
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
        data-slot='month'
        x-class={[grid]}
        style={showWeekColumn ? { gridTemplateColumns: 'repeat(8, 1fr)' } : undefined}
        role='grid'
        aria-label={paneLabel}
        onKeyDown={handleKeyDown}
      >
        <div role='row' data-slot='weekday-row' x-class={[rowContents]}>
          {showWeekColumn && (
            <span role='columnheader' data-slot='week-number' x-class={[weekday]}>
              {strings.weekNumber}
            </span>
          )}
          {weekdayLabels.map((label, i) => (
            <span key={i} role='columnheader' data-slot='weekday' x-class={[weekday]}>
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => {
          // The row's ISO week: with the week mode's Monday-first grid
          // the first cell is the week's Monday, so the whole row shares
          // one identity.
          const rowWeek = getISOWeek(
            week[0]!.year,
            week[0]!.month,
            week[0]!.day
          );
          const rowSelected =
            weekMode &&
            weekValue !== null &&
            weekValue.year === rowWeek.year &&
            weekValue.week === rowWeek.week;
          return (
            <div role='row' key={weekIndex} x-class={[rowContents]}>
              {showWeekColumn && (
                <span
                  role='gridcell'
                  data-slot='week-number'
                  x-class={[weekNumber, rowSelected && weekNumberSelected]}
                >
                  {rowWeek.week}
                </span>
              )}
              {week.map((c) => {
                const dateStr = formatDate(c.year, c.month, c.day);
                const endpoint = isRangeEndpoint(dateStr);
                const selected = weekMode
                  ? rowSelected
                  : dateStr === value || endpoint;
                const extra = cellRender?.(
                  { year: c.year, month: c.month, day: c.day },
                  picker
                );
                return (
                  <span
                    role='gridcell'
                    key={dateStr}
                    aria-selected={selected || isInRange(dateStr)}
                    x-class={[cellContents]}
                  >
                    <button
                      type='button'
                      data-slot='day'
                      data-haze-day={dateStr}
                      x-class={[
                        dayBtn,
                        selected && daySelected,
                        !selected && isInRange(dateStr) && dayInRange,
                        c.outside && dayOutside,
                      ]}
                      disabled={isCellDisabled(c.year, c.month, c.day)}
                      onClick={() => {
                        if (weekMode) {
                          pickModeValue(
                            formatWeekValue(rowWeek.year, rowWeek.week)
                          );
                        } else {
                          setValue(dateStr);
                          onSelect?.(dateStr);
                        }
                      }}
                    >
                      {extra === undefined ? (
                        c.day
                      ) : (
                        <span x-class={[dayContent]}>
                          {c.day}
                          {extra}
                        </span>
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  /* Decade year grid shared by every drill-down path — the date header's
   * year title, the quick-select toolbar's year button and the
   * month/quarter modes' year title. `highlightedYear` marks the
   * currently viewed year; cells disable through the same
   * min/max/disabledDate gate as the picker="year" mode. */
  const renderYearsGrid = (
    decadeStart: number,
    highlightedYear: number,
    onPick: (year: number) => void,
    handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
  ) => (
    <div
      ref={quickGridRef}
      data-slot='year-grid'
      x-class={[quickGrid]}
      role='grid'
      aria-label={strings.selectYear}
      onKeyDown={handleKeyDown}
    >
      {[0, 1, 2, 3].map((rowIndex) => (
        <div role='row' key={rowIndex} x-class={[rowContents]}>
          {[0, 1, 2].map((column) => {
            const year = decadeStart + rowIndex * 3 + column;
            const current = year === highlightedYear;
            const extra = cellRender?.({ year, month: 0, day: 1 }, 'year');
            return (
              <span
                role='gridcell'
                key={year}
                aria-selected={current}
                x-class={[cellContents]}
              >
                <button
                  type='button'
                  data-slot='year-cell'
                  data-haze-year={year}
                  x-class={[dayBtn, current && daySelected]}
                  disabled={isYearCellDisabled(year)}
                  onClick={() => onPick(year)}
                >
                  {extra === undefined ? (
                    year
                  ) : (
                    <span x-class={[dayContent]}>
                      {year}
                      {extra}
                    </span>
                  )}
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  /* Built lazily: when the day grid is showing, neither drill grid is
   * constructed — cellRender must not fire for cells that are not
   * mounted. */
  const yearsDrillView =
    panelView === 'years' ? (
      <div x-class={[quickSelect]} onKeyDown={onQuickKeyDown}>
        <div data-slot='toolbar' x-class={[quickToolbar]}>
          <button
            data-slot='prev'
            type='button'
            x-class={[headerBtn]}
            onClick={() => setYearsAnchor((year) => year - 10)}
            aria-label={strings.previousDecade}
          >
            ‹
          </button>
          <span data-slot='title' x-class={[headerTitle]}>
            {yearsDecadeStart} – {yearsDecadeStart + 11}
          </span>
          <button
            data-slot='next'
            type='button'
            x-class={[headerBtn]}
            onClick={() => setYearsAnchor((year) => year + 10)}
            aria-label={strings.nextDecade}
          >
            ›
          </button>
        </div>
        {renderYearsGrid(
          yearsDecadeStart,
          viewYear,
          chooseYear,
          handleYearsGridKeyDown
        )}
      </div>
    ) : null;

  const monthsDrillView =
    panelView === 'months' ? (
      <div x-class={[quickSelect]} onKeyDown={onQuickKeyDown}>
        <div data-slot='toolbar' x-class={[quickToolbar]}>
          <button
            data-slot='prev'
            type='button'
            x-class={[headerBtn]}
            onClick={() => setQuickYear((year) => year - 1)}
            aria-label={strings.previousYear}
          >
            ‹
          </button>
          {/* The year drills into a decade grid (the picker="year"
              layout); picking a year lands back on this month grid. */}
          <button
            data-slot='title'
            type='button'
            x-class={[titleBtn, headerTitle]}
            aria-haspopup='grid'
            onClick={openYearsFromMonths}
          >
            {quickYear}
          </button>
          <button
            data-slot='next'
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
          data-slot='month-grid'
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
                const extra = cellRender?.(
                  { year: quickYear, month, day: 1 },
                  'month'
                );
                return (
                  <span
                    role='gridcell'
                    key={month}
                    aria-selected={current}
                    x-class={[cellContents]}
                  >
                    <button
                      type='button'
                      data-slot='month-cell'
                      data-haze-month={month}
                      x-class={[dayBtn, current && daySelected]}
                      onClick={() => chooseMonth(month)}
                    >
                      {extra === undefined ? (
                        monthNames[month]
                      ) : (
                        <span x-class={[dayContent]}>
                          {monthNames[month]}
                          {extra}
                        </span>
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  /** Esc inside a drill-down view: from the year grid it steps back one
   *  level (the month grid when drilled from the toolbar, the day grid
   *  when opened from the header's year title); from the month grid it
   *  cancels the quick select and returns focus to the month title. */
  function onQuickKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (panelView === 'years') {
        closeYearsView();
      } else {
        closeMonthsView();
      }
    }
  }

  /* ── Picker modes ── First-class month/quarter/year grids: a period
   *  stepper header (year, or decade in the year mode) above a cell
   *  grid whose cells select directly. Same grid/gridcell semantics
   *  and roving keyboard as the day grid; the date mode's quick-select
   *  is the in-place cousin of the month mode. The month/quarter year
   *  title drills into the decade year grid; picking a year returns to
   *  the mode grid anchored at it. */
  if (picker !== 'date' && picker !== 'week') {
    const decadeStart = Math.floor(viewYear / 10) * 10;
    const drilled = modeYearsOpen && picker !== 'year';
    const previousLabel =
      drilled || picker === 'year'
        ? strings.previousDecade
        : strings.previousYear;
    const nextLabel =
      drilled || picker === 'year'
        ? strings.nextDecade
        : strings.nextYear;

    const modeGrid = drilled ? (
      /* No inner toolbar: while drilled, the mode header itself shows
       * the decade title and steps decades (see the header below); the
       * wrapper only adds the Escape step-back. */
      <div
        x-class={[quickSelect]}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeModeYears();
          }
        }}
      >
        {renderYearsGrid(
          modeYearsDecadeStart,
          viewYear,
          chooseModeYear,
          handleModeYearsGridKeyDown
        )}
      </div>
    ) : picker === 'month' ? (
      <div
        ref={modeGridRef}
        data-slot='month-grid'
        x-class={[quickGrid]}
        role='grid'
        aria-label={strings.selectMonth}
        onKeyDown={handleModeGridKeyDown}
      >
        {[0, 1, 2, 3].map((rowIndex) => (
          <div role='row' key={rowIndex} x-class={[rowContents]}>
            {[0, 1, 2].map((column) => {
              const month = rowIndex * 3 + column;
              const selected = value === formatMonthValue(viewYear, month);
              const extra = cellRender?.(
                { year: viewYear, month, day: 1 },
                'month'
              );
              return (
                <span
                  role='gridcell'
                  key={month}
                  aria-selected={selected}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-slot='month-cell'
                    data-haze-month={month}
                    x-class={[dayBtn, selected && daySelected]}
                    disabled={isMonthCellDisabled(viewYear, month)}
                    onClick={() =>
                      pickModeValue(formatMonthValue(viewYear, month))
                    }
                  >
                    {extra === undefined ? (
                      monthNames[month]
                    ) : (
                      <span x-class={[dayContent]}>
                        {monthNames[month]}
                        {extra}
                      </span>
                    )}
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
        data-slot='quarter-grid'
        x-class={[quarterGrid]}
        role='grid'
        aria-label={strings.selectQuarter}
        onKeyDown={handleModeGridKeyDown}
      >
        <div role='row' x-class={[rowContents]}>
          {[1, 2, 3, 4].map((quarter) => {
            const selected = value === formatQuarterValue(viewYear, quarter);
            const extra = cellRender?.(
              { year: viewYear, month: quarter * 3 - 3, day: 1 },
              'quarter'
            );
            return (
              <span
                role='gridcell'
                key={quarter}
                aria-selected={selected}
                x-class={[cellContents]}
              >
                <button
                  type='button'
                  data-slot='quarter-cell'
                  data-haze-quarter={quarter}
                  x-class={[dayBtn, selected && daySelected]}
                  disabled={isQuarterCellDisabled(viewYear, quarter)}
                  onClick={() =>
                    pickModeValue(formatQuarterValue(viewYear, quarter))
                  }
                >
                  {extra === undefined ? (
                    `Q${quarter}`
                  ) : (
                    <span x-class={[dayContent]}>
                      Q{quarter}
                      {extra}
                    </span>
                  )}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    ) : (
      <div
        ref={modeGridRef}
        data-slot='year-grid'
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
              const extra = cellRender?.({ year, month: 0, day: 1 }, 'year');
              return (
                <span
                  role='gridcell'
                  key={year}
                  aria-selected={selected}
                  x-class={[cellContents]}
                >
                  <button
                    type='button'
                    data-slot='year-cell'
                    data-haze-year={year}
                    x-class={[dayBtn, selected && daySelected]}
                    disabled={isYearCellDisabled(year)}
                    onClick={() => pickModeValue(formatYearValue(year))}
                  >
                    {extra === undefined ? (
                      year
                    ) : (
                      <span x-class={[dayContent]}>
                        {year}
                        {extra}
                      </span>
                    )}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );

    return (
      <div ref={rootRef} data-slot='calendar' x-class={[calendarWrapper, className]} {...rest}>
        <div data-slot='header' x-class={[header]}>
          <button
            data-slot='prev'
            type='button'
            x-class={[headerBtn]}
            onClick={() =>
              drilled
                ? setModeYearsAnchor((year) => year - 10)
                : stepModePeriod(-1)
            }
            aria-label={previousLabel}
          >
            ‹
          </button>
          {drilled ? (
            <span data-slot='title' x-class={[headerTitle]}>
              {modeYearsDecadeStart} – {modeYearsDecadeStart + 11}
            </span>
          ) : picker === 'year' ? (
            <span data-slot='title' x-class={[headerTitle]}>
              {decadeStart} – {decadeStart + 11}
            </span>
          ) : (
            /* The year title drills into the decade grid (the
                date mode's year title does the same from its header). */
            <button
              ref={yearTitleRef}
              data-slot='title'
              type='button'
              x-class={[titleBtn, headerTitle]}
              aria-haspopup='grid'
              aria-expanded={modeYearsOpen}
              onClick={modeYearsOpen ? closeModeYears : openModeYears}
            >
              {viewYear}
            </button>
          )}
          <span data-slot='actions' x-class={[headerTrailing]}>
            <button
              data-slot='today-button'
              type='button'
              x-class={[headerBtn]}
              onClick={() => {
                if (drilled) setModeYearsOpen(false);
                goToday();
              }}
            >
              {strings.today}
            </button>
            <button
              data-slot='next'
              type='button'
              x-class={[headerBtn]}
              onClick={() =>
                drilled
                  ? setModeYearsAnchor((year) => year + 10)
                  : stepModePeriod(1)
              }
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
    <div ref={rootRef} data-slot='calendar' x-class={[calendarWrapper, className]} {...rest}>
      <div data-slot='header' x-class={[header]}>
        <button
          data-slot='prev'
          type='button'
          x-class={[headerBtn]}
          onClick={goPrevMonth}
          aria-label={strings.previousMonth}
        >
          ‹
        </button>
        {/* Two drill-down titles in the locale's own month/year order:
            the month title opens the quick-select month grid, the year
            title the decade year grid — picking navigates the day view
            (the value still commits only at the picker's granularity). */}
        <span x-class={[headerTitles]}>
          {yearTitleFirst ? (
            <>
              {yearTitle}
              {monthTitle}
            </>
          ) : (
            <>
              {monthTitle}
              {yearTitle}
            </>
          )}
        </span>
        <span data-slot='actions' x-class={[headerTrailing]}>
          <button data-slot='today-button' type='button' x-class={[headerBtn]} onClick={goToday}>
            {strings.today}
          </button>
          <button
            data-slot='next'
            type='button'
            x-class={[headerBtn]}
            onClick={goNextMonth}
            aria-label={strings.nextMonth}
          >
            ›
          </button>
        </span>
      </div>
      {panelView !== 'days'
        ? (yearsDrillView ?? monthsDrillView)
        : months === 2
          ? (
              <div data-slot='months' x-class={[monthPanels]}>
                <div data-slot='month-panel' x-class={[monthPanel]}>
                  {renderMonthPane(
                    { year: viewYear, month: viewMonth },
                    gridRef,
                    handleGridKeyDown
                  )}
                </div>
                <div data-slot='month-panel' x-class={[monthPanel]}>
                  <div data-slot='header' x-class={[paneHeader]}>
                    <span data-slot='title' x-class={[headerTitle]}>
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

export type { CalendarProps, CalendarPickerMode, CalendarCellRender };
