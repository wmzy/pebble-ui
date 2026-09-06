import { Input } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Input ─────────────────────────────────────────────────────
export default function InputDemo() {
  return (
    <>
      <h1>Input</h1>
      <p className={intro}>
        Single-line text input with controlled/uncontrolled support.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Input size='sm' placeholder='Small' />
        </div>
        <div className={fieldRow}>
          <Input size='md' placeholder='Medium' />
        </div>
        <div className={fieldRow}>
          <Input size='lg' placeholder='Large' />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Input disabled placeholder='Disabled' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='InputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;input&gt;</strong>
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong> for screen readers
            </li>
            <li>
              Focus ring via <strong>:focus</strong> pseudo-class
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='input' />
    </>
  );
}
