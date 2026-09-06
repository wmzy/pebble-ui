import { Breadcrumb, BreadcrumbItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Breadcrumb ────────────────────────────────────────────────
export default function BreadcrumbDemo() {
  return (
    <>
      <h1>Breadcrumb</h1>
      <p className={intro}>
        Navigation trail showing the current page location.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Breadcrumb>
          <BreadcrumbItem href='#'>Home</BreadcrumbItem>
          <BreadcrumbItem href='#'>Components</BreadcrumbItem>
          <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className={section}>
        <h2>Custom Separator</h2>
        <Breadcrumb separator='›'>
          <BreadcrumbItem href='#'>Docs</BreadcrumbItem>
          <BreadcrumbItem href='#'>UI</BreadcrumbItem>
          <BreadcrumbItem>Current</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className={section}>
        <h2>Breadcrumb Props</h2>
        <PropsTable of='BreadcrumbProps' />
      </div>

      <div className={section}>
        <h2>BreadcrumbItem Props</h2>
        <PropsTable of='BreadcrumbItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses{' '}
              <strong>&lt;nav aria-label=&quot;Breadcrumb&quot;&gt;</strong>{' '}
              with <strong>&lt;ol&gt;</strong>
            </li>
            <li>
              Last item has <strong>aria-current=&quot;page&quot;</strong>
            </li>
            <li>
              Separators have <strong>aria-hidden=&quot;true&quot;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='breadcrumb' />
    </>
  );
}
