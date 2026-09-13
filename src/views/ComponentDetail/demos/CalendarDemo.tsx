import { useControl } from 'react-use-control';

import { Calendar } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection, noop } from './shared';

// ─── Calendar ──────────────────────────────────────────────────
export default function CalendarDemo() {
  const [, , dateCtrl] = useControl(undefined, '');
  const [date] = useControl(dateCtrl);

  return (
    <>
      <h1>Calendar</h1>
      <p className={intro}>
        Standalone month grid with controllable selection, locale formatting
        and range limits. The same calendar powers the Datepicker popup.
      </p>

      <div className={section}>
        <h2>Controlled selection</h2>
        <div className={row}>
          <Calendar value={dateCtrl} />
        </div>
        <p>
          Selected: <strong>{date || 'none'}</strong>
        </p>
      </div>

      <div className={section}>
        <h2>Month quick select</h2>
        <p>
          The header&apos;s month title is a button: click it (or focus it
          and press Enter) to swap the day grid for a year stepper plus a
          12-month grid. Picking a month returns to its day grid focused
          on day 1; Escape cancels and hands focus back to the title. The
          year title beside it drills straight into a decade grid.
        </p>
        <div className={row}>
          <Calendar onSelect={noop} />
        </div>
      </div>

      <div className={section}>
        <h2>Picker modes</h2>
        <p>
          <code>picker</code> promotes the quick-select grids to
          first-class modes. Values serialize per mode: <code>month</code>{' '}
          → <code>&apos;YYYY-MM&apos;</code>, <code>quarter</code> →{' '}
          <code>&apos;YYYY-Qn&apos;</code>, <code>year</code> →{' '}
          <code>&apos;YYYY&apos;</code>. Each grid keeps the day grid&apos;s
          roving keyboard (arrows, Home/End, PageUp/Down period hops) and
          RTL mirroring.
        </p>
        <div className={row}>
          <Calendar picker='month' />
        </div>
        <div className={row}>
          <Calendar picker='quarter' />
        </div>
        <div className={row}>
          <Calendar picker='year' />
        </div>
      </div>

      <div className={section}>
        <h2>disabledDate</h2>
        <p>
          A predicate over the representative <code>Date</code> — the day
          itself in date mode, day 1 of the period in month/quarter/year
          modes — disables cells alongside <code>min</code>/<code>max</code>.
          Disabled cells are inert to clicks and skipped by keyboard roving.
        </p>
        <div className={row}>
          <Calendar
            value={dateCtrl}
            disabledDate={(date) => date.getDay() === 0 || date.getDay() === 6}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Week numbers</h2>
        <div className={row}>
          <Calendar showWeekNumbers onSelect={noop} />
        </div>
        <div className={row}>
          <Calendar showWeekNumbers weekStartsOn={1} onSelect={noop} />
        </div>
      </div>

      <div className={section}>
        <h2>Dual month grid</h2>
        <p>
          <code>months={2}</code> renders two adjacent grids under one
          navigation — prev/next, Today and the quick select move both
          panes together.
        </p>
        <div className={row}>
          <Calendar
            months={2}
            showWeekNumbers
            rangeStart='2026-01-20'
            rangeEnd='2026-01-27'
            locale='en-GB'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Uncontrolled</h2>
        <div className={row}>
          <Calendar onSelect={noop} />
        </div>
      </div>

      <div className={section}>
        <h2>Min / max range</h2>
        <div className={row}>
          <Calendar min='2025-01-10' max='2025-01-20' />
        </div>
      </div>

      <div className={section}>
        <h2>Locale and week start</h2>
        <div className={row}>
          <Calendar locale='zh-CN' />
        </div>
        <div className={row}>
          <Calendar locale='de-DE' weekStartsOn={1} />
        </div>
      </div>

      <div className={section}>
        <h2>Week picker</h2>
        <p>
          <code>picker=&apos;week&apos;</code> selects whole ISO 8601 weeks:
          rows run Monday–Sunday, the week-number column is always shown
          and <code>weekStartsOn</code> is ignored (ISO weeks are
          Monday-first by definition). The value serializes as{' '}
          <code>&apos;YYYY-Www&apos;</code> (e.g.{' '}
          <code>&apos;2026-W37&apos;</code>); clicking any day of a row
          picks that row&apos;s week.
        </p>
        <div className={row}>
          <Calendar picker='week' onSelect={noop} />
        </div>
      </div>

      <div className={section}>
        <h2>Header drill-down</h2>
        <p>
          The date panel&apos;s header carries two clickable titles: the
          month opens a month grid, the year a decade year grid — as does
          the year title of the month/quarter modes. Picking navigates the
          view and returns to the original granularity; the value still
          commits only at the picker&apos;s own granularity. Escape steps
          back one level.
        </p>
        <div className={row}>
          <Calendar onSelect={noop} />
        </div>
        <div className={row}>
          <Calendar picker='month' onSelect={noop} />
        </div>
      </div>

      <div className={section}>
        <h2>cellRender</h2>
        <p>
          <code>cellRender</code> appends custom content inside picker
          cells — schedule dots below. It receives the cell&apos;s civil
          date and the mode the cell renders in, so one callback decorates
          the day grid and the drill-down grids differently.
        </p>
        <div className={row}>
          <Calendar
            onSelect={noop}
            cellRender={(date, mode) =>
              mode === 'date' && [3, 10, 18, 25].includes(date.day) ? (
                <span
                  key={`${date.year}-${date.month}-${date.day}`}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--haze-color-primary)',
                  }}
                />
              ) : null
            }
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CalendarProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Grid uses <strong>role=&quot;grid&quot;</strong> with rows,
              columnheaders and gridcells — the month quick select, the
              header drill-down grids and the week/month/quarter/year
              picker modes keep the same grid pattern with their own
              roving focus
            </li>
            <li>
              The selected day (or every day of the selected week) is
              exposed via <strong>aria-selected</strong> on its gridcell
              (range days included)
            </li>
            <li>
              Navigation buttons carry localized labels (previous month, next
              month, today, previous year, next year) via{' '}
              <strong>useStrings</strong>; the week-number column header is
              localized the same way
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='calendar' />
    </>
  );
}
