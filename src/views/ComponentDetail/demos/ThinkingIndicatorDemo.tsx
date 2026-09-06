import { ThinkingIndicator } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── ThinkingIndicator ────────────────────────────────────────
export default function ThinkingIndicatorDemo() {
  return (
    <>
      <h1>ThinkingIndicator</h1>
      <p className={intro}>
        Animated bouncing dots with customizable text to indicate AI is
        processing.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
          }}
        >
          <ThinkingIndicator />
          <ThinkingIndicator text='Processing' />
          <ThinkingIndicator text='Generating' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ThinkingIndicatorProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely decorative animation; consider{' '}
              <strong>aria-live=&quot;polite&quot;</strong> on a parent for screen
              readers
            </li>
            <li>
              Dot animation respects <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='thinkingindicator' />
    </>
  );
}
