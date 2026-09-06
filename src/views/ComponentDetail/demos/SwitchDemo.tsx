import { Switch } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Switch ────────────────────────────────────────────────────
export default function SwitchDemo() {
  return (
    <>
      <h1>Switch</h1>
      <p className={intro}>
        Toggle between on/off states with a sliding control.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Switch size='sm' />
          <Switch size='md' />
          <Switch size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <Switch disabled />
          <Switch checked disabled />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SwitchProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;switch&quot;</strong> with{' '}
              <strong>aria-checked</strong>
            </li>
            <li>
              <strong>Space</strong> toggles the state
            </li>
            <li>
              Provide <strong>aria-label</strong> when no visible label is
              present
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='switch' />
    </>
  );
}
