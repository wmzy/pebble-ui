import { Segmented } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

// ─── Segmented ──────────────────────────────────────────────────
export default function SegmentedDemo() {
  return (
    <>
      <h1>Segmented</h1>
      <p className={intro}>Segmented control for switching between options.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Segmented options={['Map', 'Transit', 'Satellite']} />
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <Segmented options={['Small', 'Medium', 'Large']} size='sm' />
          <Segmented options={['Small', 'Medium', 'Large']} size='md' />
          <Segmented options={['Small', 'Medium', 'Large']} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SegmentedProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;group&quot;</strong> on the container</li>
            <li>Each segment is a native <strong>&lt;button&gt;</strong></li>
            <li>Active segment has visual highlight with shadow</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
