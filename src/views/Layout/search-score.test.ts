import { filterComponents, RANKS, scoreComponent } from './search-score';

describe('sidebar search scoring', () => {
  it('ranks a name prefix highest and returns its indices', () => {
    expect(scoreComponent('button', 'but')).toEqual({
      name: 'button',
      rank: RANKS.prefix,
      indices: [0, 1, 2],
    });
  });

  it('ranks word initials across compound names (case/whitespace insensitive)', () => {
    expect(scoreComponent('daterangepicker', ' DRP ')).toEqual({
      name: 'daterangepicker',
      rank: RANKS.initials,
      indices: [0, 4, 9],
    });
  });

  it('ranks a contiguous substring above a bare subsequence', () => {
    expect(scoreComponent('datepicker', 'pick')).toEqual({
      name: 'datepicker',
      rank: RANKS.substring,
      indices: [4, 5, 6, 7],
    });
    expect(scoreComponent('button', 'btn')).toEqual({
      name: 'button',
      rank: RANKS.subsequence,
      indices: [0, 2, 5],
    });
  });

  it('returns null when nothing matches', () => {
    expect(scoreComponent('button', 'zzz')).toBeNull();
    expect(scoreComponent('button', '   ')).toBeNull();
  });

  it('returns every component at rank none for an empty query', () => {
    expect(filterComponents(['button', 'input'], '')).toEqual([
      { name: 'button', rank: RANKS.none, indices: [] },
      { name: 'input', rank: RANKS.none, indices: [] },
    ]);
  });

  it('sorts by rank descending and keeps array order within a tier', () => {
    const matches = filterComponents(
      ['toast', 'daterangepicker', 'dropdownmenu', 'button'],
      'dr'
    );
    expect(matches.map((m) => m.name)).toEqual([
      'dropdownmenu', // prefix of the name (dr-opdown…)
      'daterangepicker', // word initials (d|r|p subsequence)
    ]);
    expect(matches[0]!.rank).toBe(RANKS.prefix);
    expect(matches[1]!.rank).toBe(RANKS.initials);
  });

  it('matches aliases at the same tiers as the name itself', () => {
    // 别名前缀高于组件名子序列
    expect(scoreComponent('dialog', 'mod', ['modal', 'popup'])).toEqual({
      name: 'dialog',
      rank: RANKS.prefix,
      indices: [], // 命中在别名上，展示名不高亮
    });
    // 别名子串命中（'nack' 是 'snackbar' 的非前缀子串）
    expect(
      scoreComponent('toast', 'nack', ['notification', 'snackbar'])
    ).toEqual({
      name: 'toast',
      rank: RANKS.substring,
      indices: [],
    });
    // 组件名自身不匹配时仅靠别名入选
    expect(scoreComponent('tooltip', 'hint', [])).toBeNull();
    expect(scoreComponent('tooltip', 'hint', ['hint'])).toEqual({
      name: 'tooltip',
      rank: RANKS.prefix,
      indices: [],
    });
  });

  it('prefers a name hit over an equal-tier alias hit and keeps its indices', () => {
    // 'ban' 同时是 name 前缀与 alias 'callout' 的子序列：同档名字优先
    expect(scoreComponent('banner', 'ban', ['callout'])).toEqual({
      name: 'banner',
      rank: RANKS.prefix,
      indices: [0, 1, 2],
    });
  });

  it('lets an alias outrank a weaker name hit', () => {
    // 'auto' 与 name 'combobox' 完全不匹配，但命中 alias 'autocomplete'
    // 前缀 → 仅靠别名入选
    const match = scoreComponent('combobox', 'auto', [
      'autocomplete',
      'search',
    ])!;
    expect(match).toEqual({
      name: 'combobox',
      rank: RANKS.prefix,
      indices: [],
    });
    // 名字命中更强时别名不干扰
    expect(scoreComponent('combobox', 'com', ['autocomplete'])).toEqual({
      name: 'combobox',
      rank: RANKS.prefix,
      indices: [0, 1, 2],
    });
  });

  it('filterComponents resolves aliases through the per-name map', () => {
    const aliases = {
      dialog: ['modal', 'popup'],
      popover: ['floating'],
    } as const;
    expect(filterComponents(['dialog', 'popover', 'button'], 'modal', aliases)).toEqual(
      [{ name: 'dialog', rank: RANKS.prefix, indices: [] }]
    );
    // 未提供别名表时行为不变
    expect(filterComponents(['dialog'], 'modal')).toEqual([]);
    // 空查询仍然全量返回（别名表在场也不影响）
    expect(filterComponents(['dialog', 'popover'], '', aliases)).toEqual([
      { name: 'dialog', rank: RANKS.none, indices: [] },
      { name: 'popover', rank: RANKS.none, indices: [] },
    ]);
  });
});
