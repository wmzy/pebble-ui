import { Spinner } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Spinner ───────────────────────────────────────────────────
export default function SpinnerDemo() {
  return (
    <>
      <h1>Spinner</h1>
      <p className={intro}>Animated loading indicator for async operations.</p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Spinner size='sm' />
          <Spinner size='md' />
          <Spinner size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>With Text</h2>
        <div className={row}>
          <Spinner size='sm' />
          <span style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>Loading...</span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SpinnerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;status&quot;</strong> with{' '}
              <strong>aria-label=&quot;Loading&quot;</strong>
            </li>
            <li>
              Screen readers announce the loading state
            </li>
            <li>
              Animation respects <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='spinner' />
    </>
  );
}
