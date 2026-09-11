import { useMemo } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type DiffLine = {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLine?: number;
  newLine?: number;
};

type DiffViewerProps = {
  oldValue: string;
  newValue: string;
  className?: string;
};

const wrapper = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-relaxed);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
`;

const header = css`
  display: flex;
  padding: var(--haze-space-2) var(--haze-space-3);
  background: var(--haze-color-bg-muted);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  border-bottom: 1px solid var(--haze-color-border);
`;

const body = css`
  overflow-x: auto;
`;

const line = css`
  display: flex;
  min-height: 1.25rem;
`;

const lineNum = css`
  flex-shrink: 0;
  width: 3rem;
  padding: 0 var(--haze-space-2);
  text-align: end;
  color: var(--haze-color-text-muted);
  user-select: none;
  border-inline-end: 1px solid var(--haze-color-border);
`;

const lineContent = css`
  flex: 1;
  padding: 0 var(--haze-space-3);
  white-space: pre;
`;

const added = css`
  background: var(--haze-color-success-subtle);
`;

const removed = css`
  background: var(--haze-color-danger-subtle);
`;

const addedPrefix = css`
  color: var(--haze-color-success);
`;

const removedPrefix = css`
  color: var(--haze-color-danger);
`;

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  // Simple line-by-line diff
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx]!;
    const newLine = newLines[newIdx]!;

    if (oldIdx >= oldLines.length) {
      result.push({ type: 'added', content: newLine, newLine: newIdx + 1 });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      result.push({ type: 'removed', content: oldLine, oldLine: oldIdx + 1 });
      oldIdx++;
    } else if (oldLine === newLine) {
      result.push({ type: 'unchanged', content: oldLine, oldLine: oldIdx + 1, newLine: newIdx + 1 });
      oldIdx++;
      newIdx++;
    } else {
      result.push({ type: 'removed', content: oldLine, oldLine: oldIdx + 1 });
      result.push({ type: 'added', content: newLine, newLine: newIdx + 1 });
      oldIdx++;
      newIdx++;
    }
  }

  return result;
}

export default function DiffViewer({ oldValue, newValue, className }: DiffViewerProps) {
  const strings = useStrings('diffViewer');
  const lines = useMemo(() => computeDiff(oldValue, newValue), [oldValue, newValue]);

  return (
    <div x-class={[wrapper, className]}>
      <div x-class={[header]}>{strings.header}</div>
      <div x-class={[body]}>
        {lines.map((line, i) => (
          <div key={i} x-class={[lineStyle, line.type === 'added' && added, line.type === 'removed' && removed]}>
            <span x-class={[lineNum]}>{line.oldLine ?? ''}</span>
            <span x-class={[lineNum]}>{line.newLine ?? ''}</span>
            <span x-class={[lineContent]}>
              {line.type === 'added' && <span x-class={[addedPrefix]}>+ </span>}
              {line.type === 'removed' && <span x-class={[removedPrefix]}>- </span>}
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// alias to avoid Linaria collision with the prop name
const lineStyle = line;

export type { DiffViewerProps, DiffLine };
