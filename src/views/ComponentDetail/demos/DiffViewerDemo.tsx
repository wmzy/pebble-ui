import { DiffViewer } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── DiffViewer ───────────────────────────────────────────────
export default function DiffViewerDemo() {
  return (
    <>
      <h1>DiffViewer</h1>
      <p className={intro}>
        Line-by-line diff viewer with added/removed/unchanged highlighting and
        line numbers.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 560 }}>
          <DiffViewer
            oldValue={'const x = 1;\nconst y = 2;\nconsole.log(x + y);'}
            newValue={
              'const x = 10;\nconst y = 2;\nconst z = x + y;\nconsole.log(z);'
            }
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DiffViewerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Added lines highlighted in green, removed in red</li>
            <li>
              Line numbers use <strong>user-select: none</strong> to avoid
              accidental selection
            </li>
            <li>Monospace font for consistent alignment</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='diffviewer' />
    </>
  );
}
