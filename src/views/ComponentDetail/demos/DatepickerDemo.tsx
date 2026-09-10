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
          <code>picker</code> swaps the panel for a month, quarter or year
          grid; the value serializes as <code>&apos;YYYY-MM&apos;</code>,{' '}
          <code>&apos;YYYY-Qn&apos;</code> or <code>&apos;YYYY&apos;</code>{' '}
          respectively.
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
          <Datepicker picker='quarter' placeholder='Pick a quarter' />
        </div>
        <div className={fieldRow}>
          <Datepicker picker='year' placeholder='Pick a year' />
        </div>
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
