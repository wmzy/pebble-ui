/*
 * Scoring for the sidebar COMPONENTS search (hand-rolled, no dependencies).
 *
 * Case-insensitive, four tiers:
 *   4  prefix        query is a prefix of the name ("but" → button)
 *   3  word initial  query is a subsequence of word-initial letters
 *                    ("drp" → daterangepicker = date|range|picker)
 *   2  substring     query appears contiguously ("pick" → datepicker)
 *   1  subsequence   query chars appear in order ("btn" → button)
 *
 * Component names are concatenated compound words ("daterangepicker"), so
 * word boundaries come from a greedy longest-match lexicon of the UI terms
 * used across the list. A name the lexicon cannot split at its first
 * character stays a single word, which keeps initials conservative.
 *
 * Aliases ("modal" for dialog, see ./component-groups.ts ALIASES) compete
 * at the same tiers as the name itself: the best tier across name + aliases
 * wins. A tie prefers the name, and only name hits carry highlight indices —
 * alias positions do not map onto the displayed name.
 */

const RANK_PREFIX = 4;
const RANK_INITIALS = 3;
const RANK_SUBSTRING = 2;
const RANK_SUBSEQUENCE = 1;
export const RANK_NONE = 0;

export const RANKS = {
  prefix: RANK_PREFIX,
  initials: RANK_INITIALS,
  substring: RANK_SUBSTRING,
  subsequence: RANK_SUBSEQUENCE,
  none: RANK_NONE,
} as const;

const WORDS = new Set([
  'action', 'approval', 'area', 'aspect', 'back', 'bar', 'block', 'bottom',
  'bread', 'box', 'call', 'card', 'chat', 'check', 'code', 'color', 'combo',
  'confirm', 'container', 'context', 'conversation', 'counter', 'crumb',
  'date', 'diff', 'dialog', 'down', 'drop', 'edit', 'file', 'group',
  'indicator', 'inline', 'input', 'list', 'log', 'markdown', 'menu',
  'message', 'model', 'navigation', 'number', 'otp', 'password', 'picker',
  'range', 'ratio', 'renderer', 'scroll', 'sheet', 'step', 'stepper',
  'streaming', 'swipe', 'tag', 'text', 'thinking', 'time', 'timeline',
  'token', 'tool', 'tooltip', 'top', 'viewer', 'virtual',
]);

type WordIndex = { initials: string; positions: number[] };

const wordIndexCache = new Map<string, WordIndex>();

function wordIndex(name: string): WordIndex {
  const cached = wordIndexCache.get(name);
  if (cached) return cached;

  const initials: string[] = [];
  const positions: number[] = [];
  let i = 0;
  while (i < name.length) {
    initials.push(name[i]!);
    positions.push(i);
    let next = -1;
    for (let end = name.length; end > i; end -= 1) {
      if (WORDS.has(name.slice(i, end))) {
        next = end;
        break;
      }
    }
    i = next > i ? next : name.length;
  }

  const result = { initials: initials.join(''), positions };
  wordIndexCache.set(name, result);
  return result;
}

function subsequenceIndices(
  haystack: string,
  needle: string
): number[] | null {
  const indices: number[] = [];
  let matched = 0;
  for (let i = 0; i < haystack.length && matched < needle.length; i += 1) {
    if (haystack[i] === needle[matched]) {
      indices.push(i);
      matched += 1;
    }
  }
  return matched === needle.length ? indices : null;
}

function spanIndices(start: number, length: number): number[] {
  return Array.from({ length }, (_, k) => start + k);
}

type CandidateMatch = { rank: number; indices: number[] };

/** Scores one candidate string (a name or an alias) against the query. */
function scoreCandidate(candidate: string, q: string): CandidateMatch | null {
  const c = candidate.toLowerCase();

  if (c.startsWith(q)) {
    return { rank: RANK_PREFIX, indices: spanIndices(0, q.length) };
  }

  const { initials, positions } = wordIndex(candidate);
  const initialHits = subsequenceIndices(initials, q);
  if (initialHits) {
    return {
      rank: RANK_INITIALS,
      indices: initialHits.map((k) => positions[k]!),
    };
  }

  const at = c.indexOf(q);
  if (at >= 0) {
    return { rank: RANK_SUBSTRING, indices: spanIndices(at, q.length) };
  }

  const seq = subsequenceIndices(c, q);
  if (seq) return { rank: RANK_SUBSEQUENCE, indices: seq };

  return null;
}

export type ComponentMatch = { name: string; rank: number; indices: number[] };

export function scoreComponent(
  name: string,
  query: string,
  aliases: readonly string[] = []
): ComponentMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const nameMatch = scoreCandidate(name, q);
  let rank = nameMatch?.rank ?? RANK_NONE;
  let indices = nameMatch?.indices ?? [];

  for (const alias of aliases) {
    const aliasMatch = scoreCandidate(alias, q);
    if (aliasMatch && aliasMatch.rank > rank) {
      rank = aliasMatch.rank;
      indices = []; // hit lives on the alias, not the displayed name
    }
  }

  if (rank === RANK_NONE) return null;
  return { name, rank, indices };
}

export function filterComponents(
  names: readonly string[],
  query: string,
  aliases?: Readonly<Record<string, readonly string[]>>
): ComponentMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return names.map((name) => ({ name, rank: RANK_NONE, indices: [] }));
  }
  const matches: ComponentMatch[] = [];
  for (const name of names) {
    const match = scoreComponent(name, q, aliases?.[name] ?? []);
    if (match) matches.push(match);
  }
  // Stable sort: original array order breaks ties within a tier.
  matches.sort((a, b) => b.rank - a.rank);
  return matches;
}
