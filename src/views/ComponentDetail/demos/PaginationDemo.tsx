import { useControl } from 'react-use-control';

import { Pagination } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Pagination ────────────────────────────────────────────────
export default function PaginationDemo() {
  const [, , pageCtrl] = useControl(undefined, 1);

  return (
    <>
      <h1>Pagination</h1>
      <p className={intro}>Navigate through paginated content.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Pagination page={pageCtrl} total={100} pageSize={10} />
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <Pagination total={50} pageSize={10} size='sm' />
          <Pagination total={50} pageSize={10} size='md' />
          <Pagination total={50} pageSize={10} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PaginationProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as <strong>&lt;nav&gt;</strong> element
            </li>
            <li>
              Active page has <strong>aria-current=&quot;page&quot;</strong>
            </li>
            <li>
              Previous/Next buttons have <strong>aria-label</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='pagination' />
    </>
  );
}
