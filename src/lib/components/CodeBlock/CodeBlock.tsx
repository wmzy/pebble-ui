import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type CodeBlockProps = {
  children: ReactNode;
  language?: string;
  className?: string;
};

const block = css`
  position: relative;
  background: var(--haze-color-bg-muted);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  overflow-x: auto;
`;

const pre = css`
  margin: 0;
  padding: var(--haze-space-4);
`;

const lang = css`
  position: absolute;
  top: var(--haze-space-2);
  inset-inline-end: var(--haze-space-3);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  text-transform: uppercase;
  user-select: none;
`;

export default function CodeBlock({ children, language, className }: CodeBlockProps) {
  return (
    <div x-class={[block, className]}>
      {language && <span x-class={[lang]}>{language}</span>}
      <pre x-class={[pre]}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

export type { CodeBlockProps };
