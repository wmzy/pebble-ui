import { Radio, RadioGroup } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Radio ─────────────────────────────────────────────────────
export default function RadioDemo() {
  return (
    <>
      <h1>Radio</h1>
      <p className={intro}>
        Single selection from a group of options using RadioGroup context.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <RadioGroup>
          <Radio value='apple'>Apple</Radio>
          <Radio value='banana'>Banana</Radio>
          <Radio value='cherry'>Cherry</Radio>
        </RadioGroup>
      </div>

      <div className={section}>
        <h2>RadioGroup Props</h2>
        <PropsTable of='RadioGroupProps' />
      </div>

      <div className={section}>
        <h2>Radio Props</h2>
        <PropsTable of='RadioProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;input type=&quot;radio&quot;&gt;</strong>{' '}
              inside <strong>&lt;fieldset&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between options
            </li>
            <li>
              <strong>Space</strong> selects the focused option
            </li>
            <li>
              Add a <strong>&lt;legend&gt;</strong> inside RadioGroup for group
              labeling
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='radio' />
    </>
  );
}
