import { useState } from 'react';

import { Calendar } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection, noop } from './shared';

// ─── Calendar ──────────────────────────────────────────────────
export default function CalendarDemo() {
  const [date, setDate] = useState('');

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
          <Calendar value={date} onSelect={setDate} />
        </div>
        <p>
          Selected: <strong>{date || 'none'}</strong>
        </p>
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
        <h2>Props</h2>
        <PropsTable of='CalendarProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Grid uses <strong>role=&quot;grid&quot;</strong> with rows,
              columnheaders and gridcells
            </li>
            <li>
              The selected day is exposed via{' '}
              <strong>aria-selected</strong> on its gridcell
            </li>
            <li>
              Navigation buttons carry localized labels (previous month, next
              month, today) via <strong>useStrings</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='calendar' />
    </>
  );
}
