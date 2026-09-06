import { ColorPicker } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── ColorPicker ────────────────────────────────────────────────
export default function ColorPickerDemo() {
  return (
    <>
      <h1>ColorPicker</h1>
      <p className={intro}>Color selection with native picker, text input, and presets.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <ColorPicker presets={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ColorPickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Native <strong>&lt;input type=&quot;color&quot;&gt;</strong> for visual picking</li>
            <li>Text input for manual hex entry</li>
            <li>Preset buttons have <strong>aria-label</strong> with the color value</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
