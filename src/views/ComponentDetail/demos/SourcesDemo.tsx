import { Sources } from '@/lib/components/Sources';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Sources ──────────────────────────────────────────────────
const ragItems = [
  {
    id: 'tokens',
    title: 'Design tokens guide',
    url: 'https://example.com/design-tokens',
    snippet:
      'Every component reads its visual values from --haze-* custom properties, so a theme is just a token layer.',
  },
  {
    id: 'floating',
    title: 'CSS anchor positioning notes',
    url: 'https://example.com/anchor-positioning',
    snippet: 'Logical position-area values must spell out both axes.',
  },
  {
    id: 'internal',
    title: 'Internal review checklist',
    snippet: 'Unlinked sources render as plain text with no anchor.',
  },
];

export default function SourcesDemo() {
  return (
    <>
      <h1>Sources</h1>
      <p className={intro}>
        Numbered citation list for RAG answers: ordered entries with badge,
        title link and an expandable excerpt, plus a compact footnote form.
      </p>

      <div className={section}>
        <h2>Full list</h2>
        <div style={{ maxWidth: 520 }}>
          <Sources items={ragItems} />
        </div>
        <p className={intro}>
          Hover or focus an entry to peek its excerpt; the chevron keeps it
          expanded.
        </p>
      </div>

      <div className={section}>
        <h2>Pre-expanded entries</h2>
        <div style={{ maxWidth: 520 }}>
          <Sources items={ragItems} expanded={['tokens']} />
        </div>
      </div>

      <div className={section}>
        <h2>Compact footnotes</h2>
        <p className={intro}>
          Answer text ends with <Sources items={ragItems} compact /> inline.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SourcesProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Semantic ordered list (compact form: a named nav landmark)</li>
            <li>
              External links open in a new tab with{' '}
              <code>rel=&quot;noopener noreferrer&quot;</code>
            </li>
            <li>
              Excerpt toggles carry <code>aria-expanded</code> /{' '}
              <code>aria-controls</code>; hover-revealed excerpts stay in the
              accessibility tree only while visible
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='sources' />
    </>
  );
}
