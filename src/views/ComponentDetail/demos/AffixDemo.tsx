import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Affix ──────────────────────────────────────────────────────
export default function AffixDemo() {
  return (
    <>
      <h1>Affix</h1>
      <p className={intro}>Fixed position element relative to the viewport.</p>

      <div className={section}>
        <h2>Demo</h2>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>
          Affix positions children fixed to the viewport. Use <code>position</code> to set top or bottom, and <code>offset</code> for pixel offset.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AffixProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses CSS <strong>position: fixed</strong> with <strong>z-index: 100</strong></li>
            <li>Purely presentational wrapper</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
