import { Skeleton } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Skeleton ──────────────────────────────────────────────────
export default function SkeletonDemo() {
  return (
    <>
      <h1>Skeleton</h1>
      <p className={intro}>Animated placeholder for loading states.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 320,
          }}
        >
          <Skeleton variant='text' width='80%' />
          <Skeleton variant='text' width='60%' />
          <Skeleton variant='rectangular' width={320} height={120} />
          <div className={row}>
            <Skeleton variant='circular' width={40} height={40} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--haze-space-1)',
              }}
            >
              <Skeleton variant='text' width='50%' />
              <Skeleton variant='text' width='80%' />
            </div>
          </div>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SkeletonProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely decorative — use{' '}
              <strong>aria-busy=&quot;true&quot;</strong> on the parent
              container during loading
            </li>
            <li>
              Shimmer animation is CSS-only, respects{' '}
              <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='skeleton' />
    </>
  );
}
