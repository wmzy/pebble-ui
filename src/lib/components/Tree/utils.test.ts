import {
  filterTreeByQuery,
  flattenTreeData,
  flattenVisibleTree,
  findNodeByKey,
  getChildKeys,
  getParentKey,
  getAllLeafKeys,
  matchRanges,
  mergeLoadedChildren,
  pruneLoadedChildren,
} from './utils';

const tree = [
  {
    key: 'a',
    title: 'A',
    children: [
      { key: 'a-1', title: 'A1', children: [{ key: 'a-1-x', title: 'A1X' }] },
      { key: 'a-2', title: 'A2' },
    ],
  },
  { key: 'b', title: 'B' },
];

describe('Tree utils', () => {
  it('flattenTreeData returns depth-first node list', () => {
    expect(flattenTreeData(tree).map((n) => n.key)).toEqual([
      'a',
      'a-1',
      'a-1-x',
      'a-2',
      'b',
    ]);
  });

  it('flattenTreeData handles empty input', () => {
    expect(flattenTreeData([])).toEqual([]);
  });

  it('findNodeByKey finds nested node', () => {
    expect(findNodeByKey(tree, 'a-1-x')?.title).toBe('A1X');
  });

  it('findNodeByKey returns null for missing key', () => {
    expect(findNodeByKey(tree, 'zzz')).toBeNull();
  });

  it('findNodeByKey returns null for empty data', () => {
    expect(findNodeByKey([], 'a')).toBeNull();
  });

  it('getChildKeys returns all descendant keys recursively', () => {
    expect(getChildKeys(tree, 'a')).toEqual(['a-1', 'a-1-x', 'a-2']);
  });

  it('getChildKeys returns empty for childless parent', () => {
    expect(getChildKeys(tree, 'b')).toEqual([]);
  });

  it('getChildKeys returns empty for missing parent', () => {
    expect(getChildKeys(tree, 'zzz')).toEqual([]);
  });

  it('getParentKey returns direct parent key', () => {
    expect(getParentKey(tree, 'a-1-x')).toBe('a-1');
  });

  it('getParentKey returns null for root node', () => {
    expect(getParentKey(tree, 'a')).toBeNull();
  });

  it('getParentKey returns null for missing key', () => {
    expect(getParentKey(tree, 'zzz')).toBeNull();
  });

  it('getAllLeafKeys collects deepest leaves', () => {
    expect(getAllLeafKeys(tree)).toEqual(['a-1-x', 'a-2', 'b']);
  });

  it('getAllLeafKeys treats isLeaf nodes with children as leaves', () => {
    expect(
      getAllLeafKeys([
        {
          key: 'x',
          title: 'X',
          isLeaf: true,
          children: [{ key: 'x-1', title: 'X1' }],
        },
      ])
    ).toEqual(['x']);
  });
});

describe('flattenVisibleTree', () => {
  it('lists expanded-visible rows depth-first with levels and parents', () => {
    const rows = flattenVisibleTree(tree, ['a', 'a-1'], false);
    expect(rows.map((r) => r.key)).toEqual(['a', 'a-1', 'a-1-x', 'a-2', 'b']);
    expect(rows.map((r) => r.level)).toEqual([0, 1, 2, 1, 0]);
    expect(rows.map((r) => r.parentKey)).toEqual([null, 'a', 'a-1', 'a', null]);
  });

  it('omits collapsed subtrees', () => {
    expect(flattenVisibleTree(tree, [], false).map((r) => r.key)).toEqual([
      'a',
      'b',
    ]);
  });

  it('builds the showLine is-last chain per level', () => {
    const rows = flattenVisibleTree(tree, ['a'], false);
    expect(rows.map((r) => r.key)).toEqual(['a', 'a-1', 'a-2', 'b']);
    expect(rows.map((r) => r.isLast)).toEqual([
      [false], // a — not the last root
      [false, false], // a-1 — not the last child of a
      [false, true], // a-2 — last child of a
      [true], // b — last root
    ]);
  });

  it('marks tree-level and node-level disabled rows', () => {
    const data = [
      { key: 'x', title: 'X', disabled: true },
      { key: 'y', title: 'Y' },
    ];
    expect(flattenVisibleTree(data, [], false).map((r) => r.disabled)).toEqual([
      true,
      false,
    ]);
    expect(flattenVisibleTree(data, [], true).map((r) => r.disabled)).toEqual([
      true,
      true,
    ]);
  });

  it('keeps disabled parents expandable — their children stay focusable rows', () => {
    const rows = flattenVisibleTree(
      [
        {
          key: 'd',
          title: 'D',
          disabled: true,
          children: [{ key: 'd-1', title: 'D1' }],
        },
      ],
      ['d'],
      false
    );
    expect(rows.map((r) => r.key)).toEqual(['d', 'd-1']);
    expect(rows.map((r) => r.disabled)).toEqual([true, false]);
  });

  it('handles empty input', () => {
    expect(flattenVisibleTree([], [], false)).toEqual([]);
  });
});

describe('matchRanges', () => {
  it('finds every case-insensitive non-overlapping occurrence', () => {
    expect(matchRanges('Banana bandana', 'ANA')).toEqual([
      [1, 4],
      [11, 14],
    ]);
  });

  it('returns empty for an empty query or no hit', () => {
    expect(matchRanges('Target file', '')).toEqual([]);
    expect(matchRanges('Target file', 'zzz')).toEqual([]);
  });
});

describe('filterTreeByQuery', () => {
  it('keeps matches plus their ancestor path and reports both key sets', () => {
    const result = filterTreeByQuery(tree, 'x');
    expect(result).not.toBeNull();
    expect(result!.matchedKeys).toEqual(['a-1-x']);
    expect([...result!.ancestorKeys].sort()).toEqual(['a', 'a-1']);
    expect(result!.tree).toHaveLength(1);
    expect(result!.tree[0]!.key).toBe('a');
    expect(result!.tree[0]!.children).toHaveLength(1);
    expect(result!.tree[0]!.children![0]!.key).toBe('a-1');
    expect(result!.tree[0]!.children![0]!.children).toHaveLength(1);
  });

  it('keeps a node whose own title misses when a descendant hits', () => {
    const result = filterTreeByQuery(tree, 'A1X');
    expect(result!.tree[0]!.children).toHaveLength(1);
    expect(result!.tree[0]!.children![0]!.key).toBe('a-1');
  });

  it('returns null for an empty query so callers keep their data by reference', () => {
    expect(filterTreeByQuery(tree, '')).toBeNull();
  });

  it('returns an empty tree when nothing matches', () => {
    expect(filterTreeByQuery(tree, 'zzz')!.tree).toEqual([]);
  });
});

describe('mergeLoadedChildren', () => {
  it('attaches cached children to childless nodes anywhere in the tree', () => {
    const merged = mergeLoadedChildren(tree, {
      b: [{ key: 'b-1', title: 'B1' }],
    });
    expect(merged[1]!.children).toEqual([{ key: 'b-1', title: 'B1' }]);
  });

  it('marks an empty load as a leaf', () => {
    const merged = mergeLoadedChildren([{ key: 'b', title: 'B' }], {
      b: [],
    });
    expect(merged[0]!.isLeaf).toBe(true);
    expect(merged[0]!.children).toBeUndefined();
  });

  it('never overrides children the controlled data ships itself', () => {
    const merged = mergeLoadedChildren(tree, {
      a: [{ key: 'intruder', title: 'Intruder' }],
    });
    expect(merged[0]!.children!.map((n) => n.key)).toEqual(['a-1', 'a-2']);
  });

  it('returns the same reference when nothing is cached', () => {
    expect(mergeLoadedChildren(tree, {})).toBe(tree);
  });
});

describe('pruneLoadedChildren', () => {
  it('drops entries whose key left the controlled data', () => {
    const loaded = { gone: [{ key: 'gone-0', title: 'G0' }] };
    expect(pruneLoadedChildren(loaded, tree)).toEqual({});
  });

  it('drops entries whose node now ships its own children', () => {
    const loaded = { a: [{ key: 'stale', title: 'Stale' }] };
    expect(pruneLoadedChildren(loaded, tree)).toEqual({});
  });

  it('keeps valid entries and the reference when nothing is pruned', () => {
    const loaded = { b: [{ key: 'b-1', title: 'B1' }] };
    expect(pruneLoadedChildren(loaded, tree)).toBe(loaded);
  });
});
