import { TokenCounter } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── TokenCounter ─────────────────────────────────────────────
export default function TokenCounterDemo() {
  return (
    <>
      <h1>TokenCounter</h1>
      <p className={intro}>
        Progress bar showing token usage with color changes at warning and
        danger thresholds.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <TokenCounter used={1500} max={8000} label='Context' />
          <TokenCounter used={6000} max={8000} label='Context' />
          <TokenCounter used={7500} max={8000} label='Context' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TokenCounterProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Color changes at 70% (warning) and 90% (danger) thresholds
            </li>
            <li>Uses tabular-nums for consistent number alignment</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tokencounter' />
    </>
  );
}
