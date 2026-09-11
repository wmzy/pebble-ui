import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { Ellipsis } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// Constrained width so truncation is observable in the demo.
const box = css`
  max-width: 22rem;
  padding: var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
`;

const stateLine = css`
  margin-top: var(--haze-space-2);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const LOREM =
  'The interactive variant of text truncation: it measures the clamped element with scrollHeight against clientHeight, exposes the full text through a Tooltip, and can grow a controlled expand/collapse toggle once overflow is detected. Typography.ellipsis covers the pure-CSS cases; Ellipsis adds behavior on top.';

/** Controlled expand state driven through the useControl triple. */
function ExpandableExample() {
  const [expanded, , ctrl] = useControl(undefined, false);
  return (
    <div className={box}>
      <Ellipsis lines={2} expandable expanded={ctrl}>
        {LOREM}
      </Ellipsis>
      <div className={stateLine}>expanded: {String(expanded)}</div>
    </div>
  );
}

// ─── Ellipsis ──────────────────────────────────────────────────
export default function EllipsisDemo() {
  return (
    <>
      <h1>Ellipsis</h1>
      <p className={intro}>
        Text truncation with line clamping, tooltip preview, and expand/collapse —
        the interactive sibling of Typography&#39;s pure-CSS ellipsis.
      </p>

      <div className={section}>
        <h2>Single line</h2>
        <div className={box}>
          <Ellipsis>{LOREM}</Ellipsis>
        </div>
      </div>

      <div className={section}>
        <h2>Multi-line</h2>
        <div className={box}>
          <Ellipsis lines={3}>{LOREM}</Ellipsis>
        </div>
      </div>

      <div className={section}>
        <h2>Tooltip preview</h2>
        <div className={box}>
          <Ellipsis lines={2} tooltip>{LOREM}</Ellipsis>
        </div>
        <p className={stateLine}>Hover or focus the clamped text to preview the full content.</p>
      </div>

      <div className={section}>
        <h2>Expandable (controlled)</h2>
        <ExpandableExample />
      </div>

      <div className={section}>
        <h2>Ellipsis Props</h2>
        <PropsTable of='EllipsisProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Truncation is detected, never assumed — affordances appear only when content overflows</li>
            <li>The expand toggle is a native <strong>&lt;button&gt;</strong> with <code>aria-expanded</code>, operable by keyboard</li>
            <li>Tooltip wiring (aria-describedby, hover + focus) is inherited from the library Tooltip</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
