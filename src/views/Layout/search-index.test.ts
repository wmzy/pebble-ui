import type { SearchEntry } from './search-index';

import { searchDocs } from './search-index';

/*
 * Pure-matcher unit tests for the Docs tier. Runs against a synthetic
 * index — the CommandPalette tests exercise the generated
 * search-index.json end to end.
 */

const index: SearchEntry[] = [
  { type: 'component', label: 'Dialog', route: '/components/dialog' },
  { type: 'page', label: 'Density (compact)', sublabel: 'Guide', route: '/guides/density', keywords: ['compact'] },
  { type: 'section', label: 'Remote search', sublabel: 'Select', route: '/components/select' },
  {
    type: 'prop',
    label: 'labelWidth',
    sublabel: 'FormItem — Horizontal label column width',
    route: '/components/form',
  },
  { type: 'prop', label: 'size', route: '/components/input' },
];

describe('searchDocs', () => {
  it('matches terms case-insensitively across label, sublabel and keywords', () => {
    // 'label' hits the label, 'width' the sublabel — AND across terms,
    // OR across fields.
    const [hit] = searchDocs(index, 'Label WIDTH');
    expect(hit?.entry.label).toBe('labelWidth');
    expect(hit?.entry.route).toBe('/components/form');
    expect(hit?.indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Keyword-only hit.
    expect(searchDocs(index, 'compact')[0]?.entry.route).toBe('/guides/density');
  });

  it('never surfaces the component tier (the fuzzy scorer owns it)', () => {
    expect(searchDocs(index, 'dialog')).toEqual([]);
  });

  it('requires every term to match', () => {
    expect(searchDocs(index, 'label nomatch')).toEqual([]);
    expect(searchDocs(index, 'remote search')).toHaveLength(1);
  });

  it('ignores empty queries and truncates at maxN keeping index order', () => {
    expect(searchDocs(index, '   ')).toEqual([]);
    const wide = Array.from({ length: 40 }, (_, i): SearchEntry => ({
      type: 'prop',
      label: `hit${i}`,
      route: '/components/x',
    }));
    const hits = searchDocs(wide, 'hit', 5);
    expect(hits.map((h) => h.entry.label)).toEqual([
      'hit0',
      'hit1',
      'hit2',
      'hit3',
      'hit4',
    ]);
  });
});
