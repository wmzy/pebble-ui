import { InlineEdit } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── InlineEdit ─────────────────────────────────────────────────
export default function InlineEditDemo() {
  return (
    <>
      <h1>InlineEdit</h1>
      <p className={intro}>Click-to-edit text with inline input.</p>

      <div className={section}>
        <h2>Demo</h2>
        <InlineEdit placeholder='Click to edit this text' />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='InlineEditProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Display mode uses <strong>role=&quot;button&quot;</strong> with <strong>tabIndex</strong></li>
            <li>Enter starts editing, Enter commits, Escape cancels</li>
            <li>Blur commits the value</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
