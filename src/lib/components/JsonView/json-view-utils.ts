/**
 * Shape tags for the JSON tree renderer. `other` covers non-JSON JS
 * values (functions, symbols, bigint, Date, RegExp) rendered as leaf
 * text — robustness for hand-built `data`, since JSON.parse output only
 * ever produces the first seven kinds.
 */
export type JsonValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'array'
  | 'object'
  | 'other';

export function getJsonValueKind(value: unknown): JsonValueKind {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'undefined') return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (type === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
    return 'object';
  }
  return 'other';
}

/** Entries of a branch node: `Object.entries` pairs for objects, index
 * keys for arrays. Leaves (and empty branches) yield `[]`. */
export function jsonEntries(value: unknown): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.map((entry, index) => [String(index), entry]);
  }
  if (getJsonValueKind(value) === 'object') {
    return Object.entries(value as Record<string, unknown>);
  }
  return [];
}

/** Collections beyond this many entries render only their head plus a
 * "+N more" hint, keeping huge API payloads cheap to render. */
export const JSON_VIEW_MAX_ENTRIES = 100;

export type SlicedEntries = {
  visible: [string, unknown][];
  hiddenCount: number;
};

export function sliceEntries(
  entries: [string, unknown][],
  max: number
): SlicedEntries {
  if (entries.length <= max) return { visible: entries, hiddenCount: 0 };
  return { visible: entries.slice(0, max), hiddenCount: entries.length - max };
}

/** Leaf display text. Strings round-trip through JSON.stringify so the
 * quotes and any escapes render exactly as they would serialized. */
export function formatJsonLeaf(value: unknown, kind: JsonValueKind): string {
  if (kind === 'string') return JSON.stringify(value);
  if (kind === 'null') return 'null';
  if (kind === 'undefined') return 'undefined';
  return String(value);
}
