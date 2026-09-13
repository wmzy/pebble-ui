import { useControl } from 'react-use-control';

import { Datepicker } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Datepicker ────────────────────────────────────────────────
export default function DatepickerDemo() {
  const [, , valueCtrl] = useControl(undefined, '');
  const [value] = useControl(valueCtrl);
  const [, , monthCtrl] = useControl(undefined, '2026-03');
  const [month] = useControl(monthCtrl);
  const [, , weekCtrl] = useControl(undefined, '');
  const [week] = useControl(weekCtrl);
  const [, , dateTimeCtrl] = useControl(undefined, '');
  const [dateTime] = useControl(dateTimeCtrl);
  const [, , secondsCtrl] = useControl(undefined, '');
  const [seconds] = useControl(secondsCtrl);
  const [, , customCtrl] = useControl(undefined, '2026/3/9');
  const [custom] = useControl(customCtrl);

  return (
    <>
      <h1>Datepicker</h1>
      <p className={intro}>Date selection with a calendar dropdown panel.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Datepicker value={valueCtrl} placeholder='Pick a date' />
        </div>
        {value && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {value}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Picker modes</h2>
        <p>
          <code>picker</code> swaps the panel for a week, month, quarter
          or year grid; the value serializes as{' '}
          <code>&apos;YYYY-Www&apos;</code> (ISO week),{' '}
          <code>&apos;YYYY-MM&apos;</code>, <code>&apos;YYYY-Qn&apos;</code>{' '}
          or <code>&apos;YYYY&apos;</code> respectively.
        </p>
        <div className={fieldRow}>
          <Datepicker picker='month' value={monthCtrl} placeholder='Pick a month' />
        </div>
        {month && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {month}
          </p>
        )}
        <div className={fieldRow}>
          <Datepicker picker='week' value={weekCtrl} placeholder='Pick a week' />
        </div>
        {week && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {week}
          </p>
        )}
        <div className={fieldRow}>
          <Datepicker picker='quarter' placeholder='Pick a quarter' />
        </div>
        <div className={fieldRow}>
          <Datepicker picker='year' placeholder='Pick a year' />
        </div>
      </div>

      <div className={section}>
        <h2>Panel header drill-down</h2>
        <p>
          The date panel&apos;s header carries two clickable titles: the
          month opens a month grid, the year a decade year grid (the
          month/quarter modes drill the same way from their year title).
          Picking navigates and returns to the original granularity —
          the value commits only at the picker&apos;s own granularity,
          and <code>disabledDate</code> applies in the drilled grids
          too.
        </p>
        <div className={fieldRow}>
          <Datepicker value={valueCtrl} placeholder='Pick a date' />
        </div>
      </div>

      <div className={section}>
        <h2>Date and time</h2>
        <p>
          <code>showTime</code> adds an hour/minute input below the
          calendar; the value serializes as{' '}
          <code>&apos;YYYY-MM-DD HH:mm&apos;</code>.{' '}
          <code>showTime=&#123;&#123; seconds: true &#125;&#125;</code>{' '}
          adds second precision (<code>step=1</code> on the time input)
          and serializes as{' '}
          <code>&apos;YYYY-MM-DD HH:mm:ss&apos;</code>. Picking a date
          keeps the panel open so the time can be adjusted — outside
          click or Escape closes it. Without <code>showTime</code> the
          value keeps the plain <code>&apos;YYYY-MM-DD&apos;</code>{' '}
          format, and a plain-date value stays accepted.
        </p>
        <div className={fieldRow}>
          <Datepicker
            showTime
            value={dateTimeCtrl}
            placeholder='Pick a date and time'
          />
        </div>
        {dateTime && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {dateTime}
          </p>
        )}
        <div className={fieldRow}>
          <Datepicker
            showTime={{ seconds: true }}
            value={secondsCtrl}
            placeholder='Pick a date and time (seconds)'
          />
        </div>
        {seconds && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {seconds}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Custom format / parse</h2>
        <p>
          A <code>format</code>/<code>parse</code> pair replaces the
          built-in value serialization: picks serialize through{' '}
          <code>format</code>, the trigger displays the resulting string
          verbatim, and <code>parse</code> reads the controlled value
          back into the calendar (month anchor, day highlight, time
          input). The trigger stays readOnly — the hooks serve
          controlled display, not typing.
        </p>
        <div className={fieldRow}>
          <Datepicker
            value={customCtrl}
            placeholder='Pick a date'
            format={(date) =>
              `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
            }
            parse={(text) => {
              const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text);
              return match
                ? new Date(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3])
                  )
                : null;
            }}
          />
        </div>
        {custom && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {custom}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Presets</h2>
        <p>
          <code>presets</code> renders shortcut rows above the calendar —
          clicking one applies its value and closes the panel.
        </p>
        <div className={fieldRow}>
          <Datepicker
            placeholder='Pick a date'
            presets={[
              { label: 'Start of May', value: '2026-05-01' },
              { label: 'Mid May', value: '2026-05-15' },
              { label: 'End of May', value: '2026-05-31' },
            ]}
          />
        </div>
      </div>

      <div className={section}>
        <h2>disabledDate</h2>
        <p>
          A predicate over each day&apos;s <code>Date</code> disables cells
          alongside <code>min</code>/<code>max</code> — weekends below.
        </p>
        <div className={fieldRow}>
          <Datepicker
            placeholder='Weekdays only'
            disabledDate={(date) => date.getDay() === 0 || date.getDay() === 6}
          />
        </div>
      </div>

      <div className={section}>
        <h2>cellRender</h2>
        <p>
          <code>cellRender</code> passes through to the panel&apos;s
          calendar and appends custom content inside picker cells —
          schedule dots below.
        </p>
        <div className={fieldRow}>
          <Datepicker
            placeholder='Pick a date'
            cellRender={(date) =>
              [5, 12, 19, 26].includes(date.day) ? (
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
        <PropsTable of='DatepickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Input has <strong>aria-haspopup=&quot;dialog&quot;</strong> and{' '}
              <strong>aria-expanded</strong>
            </li>
            <li>
              Calendar grid uses <strong>role=&quot;grid&quot;</strong> with{' '}
              <strong>aria-label</strong>
            </li>
            <li>
              Header drill titles carry <strong>aria-haspopup</strong> and{' '}
              <strong>aria-expanded</strong>; drilled grids keep the grid
              pattern with their own roving focus
            </li>
            <li>
              Navigation buttons have <strong>aria-label</strong>
            </li>
            <li>Click outside closes the calendar</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='datepicker' />
    </>
  );
}
