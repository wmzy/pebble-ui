import { FileInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── FileInput ─────────────────────────────────────────────────
export default function FileInputDemo() {
  return (
    <>
      <h1>FileInput</h1>
      <p className={intro}>Styled file picker with hidden native input.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <FileInput accept='image/*' />
          <FileInput accept='.pdf,.doc'>Upload Document</FileInput>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FileInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses a <strong>&lt;label&gt;</strong> wrapping a visually hidden{' '}
              <strong>&lt;input type=&quot;file&quot;&gt;</strong>
            </li>
            <li>
              Keyboard accessible — <strong>Tab</strong> focuses,{' '}
              <strong>Enter</strong>/<strong>Space</strong> opens file dialog
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='fileinput' />
    </>
  );
}
