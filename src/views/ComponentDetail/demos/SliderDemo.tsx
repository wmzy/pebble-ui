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
  // Tooltip demo: bubble follows the thumb while dragging/focused.
  const [tipValue, , tipValueCtrl] = useControl(undefined, 40);
  const [tipSpan, , tipSpanCtrl] = useControl<[number, number]>(undefined, [
    30, 70,
  ]);
  // Marks demo: step={null} locks the values onto the mark keys.
  const [markValue, , markValueCtrl] = useControl(undefined, 25);
  const [markSpan, , markSpanCtrl] = useControl<[number, number]>(undefined, [
    25, 75,
  ]);
  // Vertical demo readouts.
  const [verticalValue, , verticalValueCtrl] = useControl(undefined, 60);
  const readout = {
    fontSize: 'var(--haze-text-sm)',
    color: 'var(--haze-color-text-secondary)',
  } as const;

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
        <h2>Tooltip — value bubble on the active thumb</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>tooltip</code> shows a value bubble over the thumb being
          dragged or focused (in range mode each thumb carries its own).
          <code> tooltipFormatter</code> customizes the content. The bubble
          is visual only — the native input keeps announcing the value.
        </p>
        <div className={fieldRow}>
          <Slider
            tooltip
            value={tipValueCtrl}
            min={0}
            max={100}
            tooltipFormatter={(v) => `${v} dB`}
            aria-label="Volume with tooltip"
          />
          <span style={readout}>Value: {tipValue} dB</span>
        </div>
        <div className={fieldRow}>
          <Slider
            range
            tooltip
            value={tipSpanCtrl}
            min={0}
            max={100}
            aria-label={['Tooltip low thumb', 'Tooltip high thumb']}
            onValuesChange={(value) =>
              console.log('tooltip onValuesChange:', value)
            }
          />
          <span style={readout}>
            Value: [{tipSpan[0]}, {tipSpan[1]}]
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Marks — tick labels, snap with step=null</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>marks</code> renders tick labels under the track; clicking
          one moves the nearest thumb onto it. With{' '}
          <code>step={'{'}null{'}'}</code> the marks become the only
          selectable values — every drag or key press snaps to the nearest
          mark.
        </p>
        <div className={fieldRow}>
          <Slider
            marks={{ 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' }}
            step={null}
            value={markValueCtrl}
            min={0}
            max={100}
            aria-label="Quarter steps"
          />
          <span style={readout}>Value: {markValue}</span>
        </div>
        <div className={fieldRow}>
          <Slider
            range
            marks={{ 0: 'Min', 50: 'Mid', 100: 'Max' }}
            value={markSpanCtrl}
            min={0}
            max={100}
            aria-label={['Marked minimum', 'Marked maximum']}
          />
          <span style={readout}>
            Value: [{markSpan[0]}, {markSpan[1]}]
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Vertical — bottom-to-top</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>vertical</code> lays the track out bottom-to-top via the
          modern <code>writing-mode</code> slider recipe (Chromium 119+,
          Firefox 120+, Safari 17.4+; older engines fall back to
          horizontal). Keyboard behavior stays native. The track length
          defaults to <code>calc(var(--haze-space-16) * 2)</code> — set{' '}
          <code>--haze-slider-track</code> to change it.
        </p>
        <div className={fieldRow}>
          <Slider
            vertical
            tooltip
            value={verticalValueCtrl}
            min={0}
            max={100}
            marks={{ 0: '0', 50: '50', 100: '100' }}
            aria-label="Vertical volume"
          />
          <span style={readout}>Value: {verticalValue}</span>
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
