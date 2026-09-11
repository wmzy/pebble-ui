/*
 * Density/spacing token contract: the compact scale stays one-to-one
 * aligned with the default spacing scale at ~75% per step, and the spacing
 * class keeps its indirect addressing form (--haze-space-N resolves through
 * var(--haze-density-space-N, <default>)).
 *
 * vitest runs with css:false, so the Linaria template text is not
 * observable at runtime. The emitted declarations are therefore asserted
 * through spacingDeclarations() — the exact function the css template
 * interpolates and Linaria evaluates at build time (colors.ts precedent) —
 * plus source-level regex checks that the template actually interpolates it
 * and carries no direct space values (fs source assertions follow the
 * rest-forward.test.ts / rtl.test.tsx precedent).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPACT_OVERRIDES } from './density';
import { SPACING_DEFAULTS, spacingDeclarations } from './spacing';

const SPACE_TOKENS = Object.keys(SPACING_DEFAULTS);

const densityTokenFor = (token: string): string =>
  token.replace('--haze-space-', '--haze-density-space-');

const px = (value: string): number => Number.parseFloat(value);

describe('SPACING_DEFAULTS', () => {
  it('covers exactly the ten overridable space steps', () => {
    expect([...SPACE_TOKENS].sort()).toEqual([
      '--haze-space-1',
      '--haze-space-10',
      '--haze-space-12',
      '--haze-space-16',
      '--haze-space-2',
      '--haze-space-3',
      '--haze-space-4',
      '--haze-space-5',
      '--haze-space-6',
      '--haze-space-8',
    ]);
  });

  it('declares pixel values only', () => {
    for (const value of Object.values(SPACING_DEFAULTS)) {
      expect(value).toMatch(/^\d+(\.\d+)?px$/);
    }
  });
});

describe('COMPACT_OVERRIDES', () => {
  it('aligns one-to-one with SPACING_DEFAULTS under the density name', () => {
    const expected = SPACE_TOKENS.map(densityTokenFor).sort();
    expect(Object.keys(COMPACT_OVERRIDES).sort()).toEqual(expected);
  });

  it('scales every step to ~75% of the default (±1px rounding)', () => {
    for (const [token, value] of Object.entries(SPACING_DEFAULTS)) {
      const densityToken = densityTokenFor(token) as keyof typeof COMPACT_OVERRIDES;
      const compactValue = COMPACT_OVERRIDES[densityToken];
      expect(compactValue).toBeDefined();
      expect(Math.abs(px(compactValue) - px(value) * 0.75)).toBeLessThanOrEqual(1);
    }
  });

  it('compacts rather than expands every step', () => {
    for (const [token, value] of Object.entries(SPACING_DEFAULTS)) {
      const densityToken = densityTokenFor(token) as keyof typeof COMPACT_OVERRIDES;
      expect(px(COMPACT_OVERRIDES[densityToken])).toBeLessThan(px(value));
    }
  });
});

describe('spacingDeclarations (indirect addressing)', () => {
  it('wraps every default value in its density fallback reference', () => {
    const declarations = spacingDeclarations();
    for (const [token, value] of Object.entries(SPACING_DEFAULTS)) {
      expect(declarations).toContain(
        `${token}: var(${densityTokenFor(token)}, ${value});`
      );
    }
  });

  it('emits exactly one declaration per space step', () => {
    expect(spacingDeclarations().split('\n')).toHaveLength(SPACE_TOKENS.length);
  });
});

describe('spacing.ts source (css template wiring)', () => {
  const source = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'spacing.ts'),
    'utf8'
  );

  it('interpolates spacingDeclarations() inside the spacing css template', () => {
    expect(source).toMatch(
      /export const spacing = css`[^`]*\$\{spacingDeclarations\(\)\}/
    );
  });

  it('declares no direct (non-zero) space values outside SPACING_DEFAULTS', () => {
    // Object-literal entries are quoted ('--haze-space-1': '4px'), so this
    // only matches a hand-written `--haze-space-N: <px>;` in the template.
    // --haze-space-0 stays direct on purpose: zero needs no density form.
    expect(source).not.toMatch(/--haze-space-\d+:\s*[1-9][\d.]*px/);
  });
});
