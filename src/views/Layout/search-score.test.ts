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
});
