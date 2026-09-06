import { OTPInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── OTPInput ───────────────────────────────────────────────────
export default function OTPInputDemo() {
  return (
    <>
      <h1>OTPInput</h1>
      <p className={intro}>One-time password input with individual character cells.</p>

      <div className={section}>
        <h2>Demo</h2>
        <OTPInput length={6} />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='OTPInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Each cell is an <strong>&lt;input&gt;</strong> with <strong>inputMode=&quot;numeric&quot;</strong></li>
            <li>Auto-advances focus on input</li>
            <li>Backspace moves focus to previous cell</li>
            <li>Paste support fills all cells</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
