import { Banner } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { noop } from './shared';

// ─── Banner ─────────────────────────────────────────────────────
export default function BannerDemo() {
  return (
    <>
      <h1>Banner</h1>
      <p className={intro}>Dismissible alert banner with variant colors.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-2)' }}>
          <Banner variant='info'>This is an informational banner.</Banner>
          <Banner variant='success'>Operation completed successfully.</Banner>
          <Banner variant='warning'>Please review your settings.</Banner>
          <Banner variant='danger' onClose={noop}>Something went wrong.</Banner>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BannerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;alert&quot;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Close&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
