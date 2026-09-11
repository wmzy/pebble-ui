import { createElement } from 'react';
import { render, screen } from '@testing-library/react';

import Pagination from '../Pagination/Pagination';

import { localeDirection, useDirection } from '../../utils/direction';

import LocaleProvider from './LocaleProvider';
import { defaultStrings } from './locale';
import { createStrings } from './strings';
import { zhCN } from './zh-cn';
import { jaJP } from './ja-jp';
import { deDE } from './de-de';
import { frFR } from './fr-fr';
import { esES } from './es-es';
import { itIT } from './it-it';
import { ptBR } from './pt-br';
import { ruRU } from './ru-ru';
import { koKR } from './ko-kr';
import { arSA } from './ar-sa';

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

/** Every shipped pack, name first for it.each titles. */
const builtinPacks = [
  ['zhCN', zhCN],
  ['jaJP', jaJP],
  ['deDE', deDE],
  ['frFR', frFR],
  ['esES', esES],
  ['itIT', itIT],
  ['ptBR', ptBR],
  ['ruRU', ruRU],
  ['koKR', koKR],
  ['arSA', arSA],
] as const;

/** Every leaf path ('section.key') of a strings pack, depth-first. */
function leafPaths(node: unknown, prefix = ''): string[] {
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) =>
      leafPaths(value, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

/** Value at a dotted leaf path ('section.key'). */
function leafValue(pack: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (node, key) => (node as Record<string, unknown> | undefined)?.[key],
    pack
  );
}

/** Sorted comma-joined `{name}` placeholders of a message template. */
function placeholders(template: unknown): string {
  return [...String(template).matchAll(/\{\w+\}/g)]
    .map((match) => match[0])
    .sort()
    .join(',');
}

/** Renders the useDirection() resolution for provider-chain assertions. */
function DirectionProbe() {
  return createElement('output', { 'data-testid': 'direction' }, useDirection());
}

describe('built-in locale packs', () => {
  it.each(builtinPacks)(
    '%s covers the default pack key-for-key',
    (_name, pack) => {
      // recursive key-path diff catches missing, extra and renamed keys
      expect(leafPaths(pack).sort()).toEqual(
        leafPaths(defaultStrings).sort()
      );
    }
  );

  it.each(builtinPacks)(
    '%s keeps every placeholder of the English copy verbatim',
    (_name, pack) => {
      const drifted = leafPaths(defaultStrings).filter(
        (path) =>
          placeholders(leafValue(pack, path)) !==
          placeholders(leafValue(defaultStrings, path))
      );
      expect(drifted).toEqual([]);
    }
  );

  it.each(builtinPacks)('%s leaves no message empty', (_name, pack) => {
    const empty = leafPaths(pack).filter(
      (path) => String(leafValue(pack, path)) === ''
    );
    expect(empty).toEqual([]);
  });

  it('serves the ar-SA pack RTL: localeDirection and DirectionProbe', () => {
    // pure mapping the provider chain consults for the direction
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('ar-SA')).toBe('rtl');

    // the pack is opt-in via strings (only zh/ja resolve automatically),
    // so mount it alongside the tag it belongs to; useDirection must
    // report the derived 'rtl' and consumers must see Arabic copy.
    render(
      createElement(LocaleProvider, {
        locale: 'ar-SA',
        strings: arSA,
        children: [
          createElement(DirectionProbe),
          createElement(Pagination, { total: 20 }),
        ],
      })
    );
    expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
    expect(
      screen.getByRole('button', { name: 'السابق' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'التالي' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      createElement(LocaleProvider, {
        locale: 'ar-SA',
        strings: arSA,
        children: createElement(Pagination, { total: 20 }),
      })
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
