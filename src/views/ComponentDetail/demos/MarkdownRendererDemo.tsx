import { MarkdownRenderer } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── MarkdownRenderer ─────────────────────────────────────────
export default function MarkdownRendererDemo() {
  const md = `## Hello World

This is **bold** and *italic* text.

- Item one
- Item two
- Item three

\`\`\`js
console.log("Hello from code block");
\`\`\`

> This is a blockquote.`;

  return (
    <>
      <h1>MarkdownRenderer</h1>
      <p className={intro}>
        Renders markdown content to styled HTML with headings, lists, code
        blocks, and more.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxWidth: 480,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
            padding: 'var(--haze-space-4)',
          }}
        >
          <MarkdownRenderer content={md} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='MarkdownRendererProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders semantic HTML: <strong>&lt;h1&gt;</strong>-<strong>&lt;h6&gt;</strong>,{' '}
              <strong>&lt;ul&gt;</strong>, <strong>&lt;ol&gt;</strong>,{' '}
              <strong>&lt;blockquote&gt;</strong>
            </li>
            <li>
              Links open in new tab with <strong>rel=&quot;noopener&quot;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='markdownrenderer' />
    </>
  );
}
