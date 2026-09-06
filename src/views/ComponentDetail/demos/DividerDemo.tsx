import { Divider } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Divider ────────────────────────────────────────────────────
export default function DividerDemo() {
  return (
    <>
      <h1>Divider</h1>
      <p className={intro}>Visual separator between content sections.</p>

      <div className={section}>
        <h2>Horizontal</h2>
        <div style={{ maxWidth: 480 }}>
          <p style={{ margin: 0 }}>Content above</p>
          <Divider />
          <p style={{ margin: 0 }}>Content below</p>
        </div>
      </div>

      <div className={section}>
        <h2>Vertical</h2>
        <div className={row}>
          <span>Left</span>
          <Divider orientation='vertical' />
          <span>Right</span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DividerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;separator&quot;</strong>
            </li>
            <li>
              Vertical dividers have <strong>aria-orientation=&quot;vertical&quot;</strong>
            </li>
            <li>
              Horizontal renders as native <strong>&lt;hr&gt;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='divider' />
    </>
  );
}
