import { TagInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

// ─── TagInput ───────────────────────────────────────────────────
export default function TagInputDemo() {
  return (
    <>
      <h1>TagInput</h1>
      <p className={intro}>Input field for adding and removing tags.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <TagInput placeholder='Type and press Enter' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TagInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Enter or comma adds a tag</li>
            <li>Backspace on empty input removes last tag</li>
            <li>Remove buttons are keyboard accessible</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
