import { Disclosure } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Disclosure ────────────────────────────────────────────────
export default function DisclosureDemo() {
  return (
    <>
      <h1>Disclosure</h1>
      <p className={intro}>
        Single collapsible section using native details/summary.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <Disclosure summary='Click to expand'>
            This is the hidden content that appears when the disclosure is
            opened. It uses the native details/summary elements for built-in
            accessibility.
          </Disclosure>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DisclosureProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;details&gt;</strong>/
              <strong>&lt;summary&gt;</strong>
            </li>
            <li>
              <strong>Enter</strong>/<strong>Space</strong> toggles open/close
            </li>
            <li>Screen readers announce expanded/collapsed state</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='disclosure' />
    </>
  );
}
