import { Checkbox } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, labelStyle } from '../styles';

import { CssVarsSection } from './shared';

// ─── Checkbox ──────────────────────────────────────────────────
export default function CheckboxDemo() {
  return (
    <>
      <h1>Checkbox</h1>
      <p className={intro}>Toggle a boolean value on or off.</p>

      <div className={section}>
        <h2>Default</h2>
        <div className={row}>
          <label className={labelStyle}>
            <Checkbox /> Unchecked
          </label>
          <label className={labelStyle}>
            <Checkbox checked /> Checked
          </label>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <label className={labelStyle}>
            <Checkbox disabled /> Disabled
          </label>
          <label className={labelStyle}>
            <Checkbox checked disabled /> Checked Disabled
          </label>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CheckboxProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native{' '}
              <strong>&lt;input type=&quot;checkbox&quot;&gt;</strong>
            </li>
            <li>
              <strong>Space</strong> toggles the checked state
            </li>
            <li>
              Wrap with <strong>&lt;label&gt;</strong> for accessible labeling
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='checkbox' />
    </>
  );
}
