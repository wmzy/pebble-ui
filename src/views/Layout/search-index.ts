/*
 * Docs-tier search for the ⌘K palette (./CommandPalette.tsx): a pure
 * matcher over the build-time index src/generated/search-index.json
 * (scripts/generate-search-index.mjs — pages, demo section titles, prop
 * descriptions). The component tier keeps the fuzzy scorer in
 * ./search-score.ts; this module only serves the entries that are not
 * components.
 *
 * Semantics: every whitespace-separated term must be a case-insensitive
 * substring of at least one of the entry's text fields (label, sublabel,
 * keywords) — an AND across terms, OR across fields. Hits keep index order
 * (pages → sections → props) and truncate at `maxN`.
 */

import rawIndex from '@/generated/search-index.json';

export type SearchEntryType = 'component' | 'page' | 'section' | 'prop';

export type SearchEntry = {
  type: SearchEntryType;
  label: string;
  sublabel?: string;
  route: string;
  keywords?: string[];
};

export const SEARCH_INDEX = rawIndex as SearchEntry[];

/** Docs rows shown per query — bounded like the sidebar's result list. */
export const MAX_DOC_RESULTS = 12;

export type DocHit = { entry: SearchEntry; indices: number[] };

const splitTerms = (query: string): string[] =>
  query.trim().toLowerCase().split(/\s+/).filter(Boolean);

/** Matched character positions in `label`, deduped and sorted (MatchText
 * merges adjacent indices into ranges — it expects sorted input). */
function labelIndices(label: string, terms: readonly string[]): number[] {
  const lower = label.toLowerCase();
  const positions = new Set<number>();
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0) {
      for (let i = at; i < at + term.length; i += 1) positions.add(i);
    }
  }
  return [...positions].sort((a, b) => a - b);
}

export function searchDocs(
  index: readonly SearchEntry[],
  query: string,
  maxN: number = MAX_DOC_RESULTS
): DocHit[] {
  const terms = splitTerms(query);
  if (terms.length === 0 || maxN <= 0) return [];

  const hits: DocHit[] = [];
  for (const entry of index) {
    // The component tier already fuzzy-scores components by name/alias.
    if (entry.type === 'component') continue;
    const fields = [
      entry.label.toLowerCase(),
      entry.sublabel?.toLowerCase() ?? '',
      ...(entry.keywords ?? []).map((keyword) => keyword.toLowerCase()),
    ];
    if (!terms.every((term) => fields.some((field) => field.includes(term)))) {
      continue;
    }
    hits.push({ entry, indices: labelIndices(entry.label, terms) });
    if (hits.length >= maxN) break;
  }
  return hits;
}
