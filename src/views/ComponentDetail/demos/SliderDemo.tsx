import { useControl } from 'react-use-control';

import { Slider } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Slider ────────────────────────────────────────────────────
export default function SliderDemo() {
  const [, , valueCtrl] = useControl(undefined, 50);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>Slider</h1>
      <p className={intro}>
        Range input for selecting a numeric value within a range.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Slider value={valueCtrl} min={0} max={100} step={1} />
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
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Slider disabled />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SliderProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native{' '}
              <strong>&lt;input type=&quot;range&quot;&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> adjust the value by step
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='slider' />
    </>
  );
}
