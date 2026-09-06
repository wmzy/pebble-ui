import { TimePicker } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

// ─── TimePicker ─────────────────────────────────────────────────
export default function TimePickerDemo() {
  return (
    <>
      <h1>TimePicker</h1>
      <p className={intro}>Time input using native time picker with controlled state.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <TimePicker placeholder='Select time' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TimePickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as native <strong>&lt;input type=&quot;time&quot;&gt;</strong></li>
            <li>Full keyboard support via browser native picker</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
