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
  // Control triple: the range slider takes the control, the readout
  // mirrors the [low, high] tuple.
  const [span, , spanCtrl] = useControl<[number, number]>(undefined, [
    20, 80,
  ]);

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
        <h2>Range — two thumbs</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>range</code> renders two thumbs tracking a{' '}
          <code>[low, high]</code> tuple: <code>value</code> /{' '}
          <code>onValuesChange</code> carry the pair (the native{' '}
          <code>onChange</code> still fires per-thumb), and{' '}
          <code>aria-label</code> accepts a <code>[lowLabel, highLabel]</code>{' '}
          tuple so each thumb is announced separately.
        </p>
        <div className={fieldRow}>
          <Slider
            range
            value={spanCtrl}
            min={0}
            max={100}
            step={5}
            aria-label={['Minimum price', 'Maximum price']}
            onValuesChange={(value) =>
              console.log('onValuesChange:', value)
            }
          />
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Value: [{span[0]}, {span[1]}]
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
            <li>
              Range mode labels each thumb via the{' '}
              <strong>aria-label tuple</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='slider' />
    </>
  );
}
