import { useControl } from 'react-use-control';

import { NumberInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── NumberInput ───────────────────────────────────────────────
export default function NumberInputDemo() {
  const [, , valueCtrl] = useControl(undefined, 5);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>NumberInput</h1>
      <p className={intro}>Numeric input with increment/decrement buttons.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <NumberInput value={valueCtrl} min={0} max={100} step={1} />
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Value: {value}
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <NumberInput size='sm' min={0} max={10} />
          <NumberInput size='md' min={0} max={10} />
          <NumberInput size='lg' min={0} max={10} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='NumberInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>&lt;input type=&quot;number&quot;&gt;</strong>
            </li>
            <li>
              Stepper buttons have <strong>aria-label</strong>{' '}
              (&quot;Decrease&quot;/&quot;Increase&quot;)
            </li>
            <li>Buttons are disabled at min/max boundaries</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='numberinput' />
    </>
  );
}
