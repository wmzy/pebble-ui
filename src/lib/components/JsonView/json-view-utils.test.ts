import {
  JSON_VIEW_MAX_ENTRIES,
  formatJsonLeaf,
  getJsonValueKind,
  jsonEntries,
  sliceEntries,
} from './json-view-utils';

describe('getJsonValueKind', () => {
  it('tags JSON primitives', () => {
    expect(getJsonValueKind('a')).toBe('string');
    expect(getJsonValueKind(1)).toBe('number');
    expect(getJsonValueKind(false)).toBe('boolean');
    expect(getJsonValueKind(null)).toBe('null');
    expect(getJsonValueKind(undefined)).toBe('undefined');
  });

  it('distinguishes arrays from objects', () => {
    expect(getJsonValueKind([])).toBe('array');
    expect(getJsonValueKind({})).toBe('object');
  });

  it('treats non-JSON exotic objects as other', () => {
    expect(getJsonValueKind(new Date())).toBe('other');
    expect(getJsonValueKind(/x/)).toBe('other');
    expect(getJsonValueKind(() => 1)).toBe('other');
    expect(getJsonValueKind(BigInt(1))).toBe('other');
  });
});

describe('jsonEntries', () => {
  it('returns key-value pairs of an object in order', () => {
    expect(jsonEntries({ b: 2, a: 1 })).toEqual([
      ['b', 2],
      ['a', 1],
    ]);
  });

  it('returns string index keys for arrays', () => {
    expect(jsonEntries(['x', 'y'])).toEqual([
      ['0', 'x'],
      ['1', 'y'],
    ]);
  });

  it('returns empty for leaves and empty branches', () => {
    expect(jsonEntries('str')).toEqual([]);
    expect(jsonEntries(3)).toEqual([]);
    expect(jsonEntries(null)).toEqual([]);
    expect(jsonEntries({})).toEqual([]);
    expect(jsonEntries([])).toEqual([]);
  });
});

describe('sliceEntries', () => {
  it('returns everything under the cap', () => {
    const entries: [string, unknown][] = [
      ['a', 1],
      ['b', 2],
    ];
    expect(sliceEntries(entries, JSON_VIEW_MAX_ENTRIES)).toEqual({
      visible: entries,
      hiddenCount: 0,
    });
  });

  it('returns exactly the cap at the boundary', () => {
    const entries = Array.from({ length: JSON_VIEW_MAX_ENTRIES }, (_, i) => [
      String(i),
      i,
    ]) as [string, unknown][];
    const sliced = sliceEntries(entries, JSON_VIEW_MAX_ENTRIES);
    expect(sliced.visible).toHaveLength(JSON_VIEW_MAX_ENTRIES);
    expect(sliced.hiddenCount).toBe(0);
  });

  it('keeps the head and counts the tail beyond the cap', () => {
    const entries = Array.from({ length: 150 }, (_, i) => [String(i), i]) as [
      string,
      unknown,
    ][];
    const sliced = sliceEntries(entries, JSON_VIEW_MAX_ENTRIES);
    expect(sliced.visible).toHaveLength(100);
    expect(sliced.visible[0]).toEqual(['0', 0]);
    expect(sliced.visible[99]).toEqual(['99', 99]);
    expect(sliced.hiddenCount).toBe(50);
  });
});

describe('formatJsonLeaf', () => {
  it('renders strings quoted, with escapes preserved', () => {
    expect(formatJsonLeaf('hello', 'string')).toBe('"hello"');
    expect(formatJsonLeaf('a"b\nc', 'string')).toBe('"a\\"b\\nc"');
  });

  it('renders JSON literals and numbers via String', () => {
    expect(formatJsonLeaf(1.5, 'number')).toBe('1.5');
    expect(formatJsonLeaf(true, 'boolean')).toBe('true');
    expect(formatJsonLeaf(false, 'boolean')).toBe('false');
    expect(formatJsonLeaf(null, 'null')).toBe('null');
    expect(formatJsonLeaf(undefined, 'undefined')).toBe('undefined');
  });

  it('stringifies exotic values on the other path', () => {
    expect(formatJsonLeaf(/ab/g, 'other')).toBe('/ab/g');
  });
});
