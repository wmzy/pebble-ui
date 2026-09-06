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
