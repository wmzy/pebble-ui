import { defaultStrings } from './locale';
import { createStrings } from './strings';
import { zhCN } from './zh-cn';

describe('createStrings', () => {
  it('overrides only the named message within a section', () => {
    const strings = createStrings(defaultStrings, {
      pagination: { previous: 'Précédent' },
    });
    expect(strings.pagination.previous).toBe('Précédent');
  });

  it('keeps sibling keys inside an overridden section', () => {
    const strings = createStrings(defaultStrings, {
      pagination: { previous: 'Précédent' },
    });
    expect(strings.pagination.next).toBe(defaultStrings.pagination.next);
  });

  it('keeps untouched sections wholesale', () => {
    const strings = createStrings(defaultStrings, {
      pagination: { previous: 'Précédent' },
    });
    expect(strings.empty).toEqual(defaultStrings.empty);
    expect(strings.alert).toEqual(defaultStrings.alert);
  });

  it('merges several sections in one call', () => {
    const strings = createStrings(defaultStrings, {
      pagination: { previous: 'Précédent', next: 'Suivant' },
      empty: { description: 'Aucune donnée' },
    });
    expect(strings.pagination.next).toBe('Suivant');
    expect(strings.empty.description).toBe('Aucune donnée');
    // a third section stays on the base copy
    expect(strings.spinner.loading).toBe(defaultStrings.spinner.loading);
  });

  it('derives a pack from a non-default base', () => {
    const strings = createStrings(zhCN, {
      empty: { description: '暂无内容' },
    });
    expect(strings.empty.description).toBe('暂无内容');
    expect(strings.pagination.previous).toBe(zhCN.pagination.previous);
  });

  it('carries {name} placeholders through overrides verbatim', () => {
    const strings = createStrings(defaultStrings, {
      tagInput: { tagCount: '{count} étiquettes' },
    });
    expect(strings.tagInput.tagCount).toBe('{count} étiquettes');
    // an untouched templated message keeps its placeholder too
    expect(strings.rating.stars).toBe(defaultStrings.rating.stars);
  });

  it('does not mutate the base pack', () => {
    const before = JSON.stringify(defaultStrings);
    createStrings(defaultStrings, {
      pagination: { previous: 'Précédent' },
      empty: { description: 'Aucune donnée' },
    });
    expect(JSON.stringify(defaultStrings)).toBe(before);
  });

  it('does not mutate the overrides', () => {
    const overrides = { pagination: { previous: 'Précédent' } };
    const before = JSON.stringify(overrides);
    createStrings(defaultStrings, overrides);
    expect(JSON.stringify(overrides)).toBe(before);
  });

  it('returns a pack whose sections are detached from the base', () => {
    const strings = createStrings(defaultStrings, {
      pagination: { previous: 'Précédent' },
    });
    strings.pagination.next = 'next (mutated)';
    expect(defaultStrings.pagination.next).toBe('Next');
  });

  it('covers every section of the base', () => {
    const strings = createStrings(defaultStrings, {});
    expect(Object.keys(strings).sort()).toEqual(
      Object.keys(defaultStrings).sort()
    );
  });

  it('has no axe violations', async () => {
    // strings.ts is a pure merge module with no DOM footprint of its
    // own, so axe scans a minimal host element standing in for a
    // consumer rendering merged copy.
    const { axe } = await import('jest-axe');
    const host = document.createElement('div');
    host.textContent = createStrings(defaultStrings, {
      empty: { description: 'Aucune donnée' },
    }).empty.description;
    document.body.append(host);
    const results = await axe(host, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
