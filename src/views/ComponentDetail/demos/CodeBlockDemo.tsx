import type { Highlighter } from '@/lib/components/CodeBlock';

import { CodeBlock } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Pluggable highlighting demo helpers ────────────────────────
// Fake stand-in for shiki / Prism / highlight.js — the library ships no
// highlighter of its own, and this demo installs none either.
const TOKEN_RE =
  /('[^'\n]*'|"[^"\n]*")|(\/\/[^\n]*)|\b(?:const|let|var|function|return|import|export|from|default|await|async|if|else|new|class|extends)\b|\b\d+\b/g;

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function fakeHighlight(code: string, _language: string): string {
  return escapeHtml(code).replace(TOKEN_RE, (token) => {
    if (/^['"]/.test(token)) {
      return `<span style="color: var(--haze-color-success)">${token}</span>`;
    }
    if (token.startsWith('//')) {
      return `<span style="color: var(--haze-color-text-muted)">${token}</span>`;
    }
    if (/^\d/.test(token)) {
      return `<span style="color: var(--haze-color-warning)">${token}</span>`;
    }
    return `<span style="color: var(--haze-color-primary)">${token}</span>`;
  });
}

// Async shape mirrors shiki: grammars/WASM load lazily, so codeToHtml
// returns a Promise. CodeBlock renders plain text until it settles.
const fakeHighlightAsync: Highlighter = (code, language) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(fakeHighlight(code, language)), 400);
  });

const SAMPLE = `import { Button } from 'haze-ui';

// stand-in tokenizer: strings, comments, keywords, numbers
const limit = 42;

export function mount(target: HTMLElement) {
  return <Button tone="primary">Go</Button>;
}`;

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
        <h2>Pluggable highlighting</h2>
        <p className={intro}>
          Pass a <code>highlight</code> function to enable syntax highlighting. The library ships
          no highlighter of its own — wire one in and keep the base bundle lean:
        </p>
        <CodeBlock language='tsx'>
{`import { codeToHtml } from 'shiki';

// highlight receives (code, language) and returns HTML or a Promise<string>
<CodeBlock
  language="ts"
  highlight={(code, language) =>
    codeToHtml(code, { lang: language, theme: 'github-dark' })
  }
>
  {'const answer = 42;'}
</CodeBlock>`}
        </CodeBlock>
        <p className={intro}>
          Synchronous results render in the same commit. Async results render the plain code
          first and swap in highlighted HTML once the Promise settles; a rejected Promise falls
          back to plain text. The two blocks below use a built-in fake highlighter (regex +
          color tokens) instead of a real dependency:
        </p>
        <h3>Synchronous</h3>
        <CodeBlock language='tsx' highlight={fakeHighlight}>
          {SAMPLE}
        </CodeBlock>
        <h3>Asynchronous (resolves after 400ms)</h3>
        <CodeBlock language='tsx' highlight={fakeHighlightAsync}>
          {SAMPLE}
        </CodeBlock>
        <A11yNote>
          <ul>
            <li>Highlighted HTML is injected as-is — sanitize untrusted input, or only highlight trusted sources</li>
            <li>While an async highlighter is pending, the plain code stays readable (no loading state)</li>
          </ul>
        </A11yNote>
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
