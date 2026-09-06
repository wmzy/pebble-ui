import { PasswordInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

// ─── PasswordInput ──────────────────────────────────────────────
export default function PasswordInputDemo() {
  return (
    <>
      <h1>PasswordInput</h1>
      <p className={intro}>Password field with show/hide toggle.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <PasswordInput placeholder='Enter password' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PasswordInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Toggle button has <strong>aria-label</strong> (&quot;Show password&quot; / &quot;Hide password&quot;)</li>
            <li>Toggle button uses <strong>tabIndex={'{'}-1{'}'}</strong> to skip tab order</li>
            <li>Type switches between &quot;password&quot; and &quot;text&quot;</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
