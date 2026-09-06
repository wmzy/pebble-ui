import { CodeBlock } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── CodeBlock ──────────────────────────────────────────────────
export default function CodeBlockDemo() {
  return (
    <>
      <h1>CodeBlock</h1>
      <p className={intro}>Code display with language label and monospace styling.</p>

      <div className={section}>
        <h2>Demo</h2>
        <CodeBlock language='tsx'>
{`const greeting = "Hello, world!";
console.log(greeting);`}
        </CodeBlock>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CodeBlockProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as <strong>&lt;pre&gt;&lt;code&gt;</strong></li>
            <li>Language label is decorative (user-select: none)</li>
            <li>Horizontal scroll for long lines</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
