import { useState } from 'react';

import { useControl } from 'react-use-control';

import { Pagination } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// Full-feature pager: total summary, size changer, quick jumper and
// clickable ellipses, all reporting through onPageChange.
function ExtrasDemo() {
  const [, , pageCtrl] = useControl(undefined, 1);
  const [, , pageSizeCtrl] = useControl(undefined, 10);
  const [lastChange, setLastChange] = useState('—');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
      <Pagination
        page={pageCtrl}
        pageSize={pageSizeCtrl}
        total={200}
        pageSizeOptions={[10, 20, 50]}
        showSizeChanger
        showQuickJumper
        ellipsisJump
        showTotal={(t, [start, end]) => `${start}-${end} of ${t}`}
        onPageChange={(page, pageSize) => setLastChange(`page ${page} · size ${pageSize}`)}
      />
      <span data-testid='last-change'>onPageChange: {lastChange}</span>
    </div>
  );
}

// Minimal pager: page input + prev/next, with a total summary.
function SimpleDemo() {
  const [, , pageCtrl] = useControl(undefined, 3);

  return (
    <Pagination
      page={pageCtrl}
      total={120}
      simple
      showTotal={(t, [start, end]) => `${start}-${end} of ${t}`}
    />
  );
}

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
        <h2>Extras</h2>
        <p className={intro}>
          <code>showTotal</code>, <code>showSizeChanger</code>, <code>showQuickJumper</code> and{' '}
          <code>ellipsisJump</code> are all opt-in — the default pager stays a plain button row.
          Changing the page size resets to page 1; every navigation reports through{' '}
          <code>onPageChange(page, pageSize)</code>.
        </p>
        <ExtrasDemo />
      </div>

      <div className={section}>
        <h2>Simple</h2>
        <div className={row}>
          <SimpleDemo />
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
            <li>
              Size select, jump inputs and jump ellipses are labelled through the{' '}
              <strong>pagination</strong> locale section
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='pagination' />
    </>
  );
}
