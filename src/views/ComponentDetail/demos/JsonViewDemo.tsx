// Wave 3 (component depth B) — demo not yet registered in the docs route
// table; switch this import to `@/lib` once JsonView lands in the barrel
// (Wave 5 wiring).
import { JsonView } from '@/lib/components/JsonView';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

const release = {
  name: 'haze-ui',
  version: '1.13.0',
  stable: true,
  stars: 1280,
  maintainers: ['zhang', 'li'],
  links: { repo: 'https://github.com/haze-ui/haze-ui', docs: null },
  tags: ['react', 'linaria', 'oklch'],
};

const bigPayload = Array.from({ length: 150 }, (_, i) => ({
  id: i,
  label: `entry-${i}`,
}));

// ─── JsonView ─────────────────────────────────────────────────
export default function JsonViewDemo() {
  return (
    <>
      <h1>JsonView</h1>
      <p className={intro}>
        Recursive JSON tree with collapsible branches, per-type value coloring
        and copy support — useful for inspecting tool payloads and API
        responses.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 640 }}>
          <JsonView data={release} copyable />
        </div>
      </div>

      <div className={section}>
        <h2>Collapsed by depth</h2>
        <p>
          <code>defaultExpandedDepth</code> controls the initial disclosure —
          nodes at or beyond that depth start collapsed and expand on click.
        </p>
        <div style={{ maxWidth: 640 }}>
          <JsonView data={release} defaultExpandedDepth={1} />
        </div>
      </div>

      <div className={section}>
        <h2>Large collections</h2>
        <p>
          Collections beyond 100 entries render their head plus a &ldquo;+N
          more&rdquo; hint instead of flooding the DOM.
        </p>
        <div style={{ maxWidth: 640 }}>
          <JsonView data={bigPayload} defaultExpandedDepth={0} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of="JsonViewProps" />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Each branch toggle is a native <code>&lt;button&gt;</code> with{' '}
              <code>aria-expanded</code> (and <code>aria-controls</code> while
              expanded) — keyboard operable out of the box
            </li>
            <li>
              Value colors carry meaning redundantly — the literal text
              (<code>true</code>, <code>null</code>, quotes on strings) always
              identifies the type, never color alone
            </li>
            <li>
              Copy button exposes its action through{' '}
              <code>aria-label</code> and shows a check glyph on success
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component="jsonview" />
    </>
  );
}
