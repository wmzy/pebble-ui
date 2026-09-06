import { Textarea } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Textarea ──────────────────────────────────────────────────
export default function TextareaDemo() {
  return (
    <>
      <h1>Textarea</h1>
      <p className={intro}>
        Multi-line text input, styled consistently with Input.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Textarea size='sm' placeholder='Small' rows={3} />
        </div>
        <div className={fieldRow}>
          <Textarea size='md' placeholder='Medium' rows={3} />
        </div>
        <div className={fieldRow}>
          <Textarea size='lg' placeholder='Large' rows={3} />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Textarea disabled placeholder='Disabled' rows={3} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TextareaProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;textarea&gt;</strong>
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
            <li>
              Supports <strong>resize: vertical</strong> by default
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='textarea' />
    </>
  );
}
