import { DateRangePicker } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── DateRangePicker ────────────────────────────────────────────
export default function DateRangePickerDemo() {
  return (
    <>
      <h1>DateRangePicker</h1>
      <p className={intro}>Date range selection with start and end date inputs.</p>

      <div className={section}>
        <h2>Demo</h2>
        <DateRangePicker />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DateRangePickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses native <strong>&lt;input type=&quot;date&quot;&gt;</strong> elements</li>
            <li>Full keyboard and screen reader support</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
