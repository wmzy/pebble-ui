import { css } from '@linaria/core';

import { Masonry } from '@/lib/components/Masonry';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Masonry ───────────────────────────────────────────────────
const card = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  padding: var(--haze-space-4);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const heights = [6, 14, 9, 4, 11, 7, 12, 5, 10, 8, 13, 6];

function Wall({ label }: { label: string }) {
  return (
    <div className={card} style={{ height: `${heights[label.charCodeAt(0) % heights.length]}rem` }}>
      {label}
    </div>
  );
}

export default function MasonryDemo() {
  return (
    <>
      <h1>Masonry</h1>
      <p className={intro}>
        Pinterest-style column layout: children flow into equal-width columns and stack
        independently, so tall cards never stretch short ones. Unlike Grid there is no row
        alignment — each column is its own stack. Distribution happens in JS in source
        order (greedy shortest-column), so cards read left-to-right.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <Masonry>
          {Array.from({ length: 12 }, (_, i) => (
            <Wall key={String.fromCharCode(65 + i)} label={String.fromCharCode(65 + i)} />
          ))}
        </Masonry>
      </div>

      <div className={section}>
        <h2>Four columns, tighter gap</h2>
        <Masonry columns={4} gap={2}>
          {Array.from({ length: 12 }, (_, i) => (
            <Wall key={String.fromCharCode(65 + i)} label={String.fromCharCode(65 + i)} />
          ))}
        </Masonry>
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely presentational — plain <strong>&lt;div&gt;</strong> columns, no
              semantic role. Announce structure with an external label when the wall
              conveys meaning.
            </li>
            <li>
              Reading order follows source order (row-major), unlike CSS multicolumn which
              fills column-major.
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
