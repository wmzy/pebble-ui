/*
 * createBrandTheme contract: the runtime brand-theme builder runs the exact
 * pipeline the build-time presets go through. Three anchors:
 *
 *  1. Preset parity — given a preset family's full seed set (light 9/10,
 *     dark 8/9), the runtime output is byte-identical to the build-time
 *     brandDeclarations() block, and re-seeding 'blue' reproduces the
 *     default theme block itself (what colors.ts interpolates).
 *  2. Dark derivation — omitting `dark` lifts the light seed by the fitted
 *     OKLCH lightness offset with chroma/hue preserved.
 *  3. CLI parity — cli/theme.mjs embeds a dependency-free port of the same
 *     math; for identical seeds its output must be byte-identical too.
 */

import type {Mode} from './palette';

import {createBrandThemeCss, renderStylesheet} from '../../../cli/theme.mjs';

import {parseOklch} from './oklch';
import {BRAND_FAMILIES, BRAND_SEEDS, PRIMITIVES, SEMANTIC_COLOR_TOKENS, brandDeclarations, createBrandTheme, themeDeclarations} from './palette';

/** The `--haze-{family}-{step}: oklch(…);` primitive value out of a declaration block. */
function primitiveIn(declarations: string, family: string, step: number) {
  const match = new RegExp(`^--haze-${family}-${step}: (oklch\\([^;]+\\));$`, 'm').exec(declarations);
  if (match === null) {
    throw new Error(`--haze-${family}-${step} not found in declarations`);
  }
  return parseOklch(match[1]!);
}

/** All seed anchors of one preset family in createBrandTheme's input shape. */
const presetOptions = (family: (typeof BRAND_FAMILIES)[number]) => ({
  name: family,
  light: BRAND_SEEDS[family].light[9]!,
  dark: BRAND_SEEDS[family].dark[9]!,
  overrides: {light: {10: BRAND_SEEDS[family].light[10]!}, dark: {8: BRAND_SEEDS[family].dark[8]!}},
});

describe('createBrandTheme — preset parity', () => {
  it.each(BRAND_FAMILIES)('reproduces the %s preset declarations byte-for-byte', (family) => {
    const theme = createBrandTheme(presetOptions(family));
    expect(theme.name).toBe(family);
    expect(theme.light).toBe(brandDeclarations(family, 'light'));
    expect(theme.dark).toBe(brandDeclarations(family, 'dark'));
  });

  it('re-seeding blue reproduces the default theme block (what colors.ts emits)', () => {
    const theme = createBrandTheme({
      name: 'blue',
      light: '#0066ff',
      dark: '#4d94ff',
      overrides: {light: {10: '#2563eb'}, dark: {8: '#3b82f6'}},
    });
    expect(theme.light).toBe(themeDeclarations('light', PRIMITIVES, SEMANTIC_COLOR_TOKENS));
    expect(theme.dark).toBe(themeDeclarations('dark', PRIMITIVES, SEMANTIC_COLOR_TOKENS));
  });
});

describe('createBrandTheme — declaration shape', () => {
  const theme = createBrandTheme({name: 'acme', light: '#0066ff'});

  it.each(['light', 'dark'] as const)('carries the key tokens in the %s block', (mode: Mode) => {
    const declarations = theme[mode];
    // the brand's own primitive scale, with primary/info routed to it
    expect(declarations).toMatch(/^--haze-acme-1: oklch\(/m);
    expect(declarations).toContain('--haze-acme-9: ');
    expect(declarations).toContain(`--haze-color-primary: var(--haze-acme-9);`);
    expect(declarations).toContain(`--haze-color-info: var(--haze-acme-${mode === 'light' ? 10 : 8});`);
    // semantic groups + relative-color interaction states
    expect(declarations).toContain('--haze-color-primary-hover: oklch(from var(--haze-color-primary) calc(l');
    expect(declarations).toContain('--haze-color-primary-subtle: oklch(from var(--haze-color-primary)');
    expect(declarations).toContain('--haze-color-focus-ring: oklch(from var(--haze-color-primary) l c h / 0.4);');
    // fixed neutrals/status families stay on the default scales
    expect(declarations).toContain(`--haze-color-success: var(--haze-green-${mode === 'light' ? 9 : 8});`);
    expect(declarations).toContain('--haze-color-text: var(--haze-gray-12);');
  });

  it('emits primitives first, then semantics, one declaration per line', () => {
    const lines = theme.light.split('\n');
    const lastPrimitive = lines.findIndex((line) => line.startsWith('--haze-red-12:'));
    const firstSemantic = lines.findIndex((line) => line.startsWith('--haze-color-primary:'));
    expect(lastPrimitive).toBeGreaterThan(0);
    expect(lines.filter((line) => line === '')).toEqual([lines[firstSemantic - 1]]); // exactly one separator
    for (const line of lines.filter((line) => line !== '')) {
      expect(line).toMatch(/^--haze-[a-z0-9-]+: .+;$/);
    }
  });

  it('differs between light and dark beyond the neutral flip', () => {
    expect(theme.light).not.toBe(theme.dark);
    const lightPrimary = primitiveIn(theme.light, 'acme', 9);
    const darkPrimary = primitiveIn(theme.dark, 'acme', 9);
    expect(lightPrimary.h).toBeCloseTo(darkPrimary.h, 5);
    expect(darkPrimary.l).toBeGreaterThan(lightPrimary.l);
  });
});

describe('createBrandTheme — dark derivation', () => {
  const seed = '#c2410c'; // orange-600: a chromatic, in-gamut anchor
  const derived = createBrandTheme({name: 'brand', light: seed});
  const explicit = createBrandTheme({name: 'brand', light: seed, dark: '#fb923c'});

  it('lifts the primary anchor lightness by the fitted offset, preserving hue', () => {
    const lightPrimary = primitiveIn(derived.light, 'brand', 9);
    const darkPrimary = primitiveIn(derived.dark, 'brand', 9);
    expect(darkPrimary.l - lightPrimary.l).toBeCloseTo(0.2, 3);
    expect(darkPrimary.h).toBeCloseTo(lightPrimary.h, 4);
    expect(darkPrimary.c).toBeLessThanOrEqual(lightPrimary.c + 1e-9); // gamut clamp only reduces
  });

  it('places the derived info anchor one step below its mode primary', () => {
    for (const mode of ['light', 'dark'] as const) {
      const primary = primitiveIn(derived[mode], 'brand', 9);
      const step = mode === 'light' ? 10 : 8;
      const info = primitiveIn(derived[mode], 'brand', step);
      expect(primary.l - info.l).toBeCloseTo(0.07, 3);
    }
  });

  it('an explicit dark seed wins over the derivation', () => {
    expect(explicit.dark).not.toBe(derived.dark);
    expect(primitiveIn(explicit.dark, 'brand', 9)).toEqual(parseOklch('oklch(0.758 0.159 55.9)'));
  });

  it('stays in-family: derived dark tracks the preset relationship', () => {
    // every preset's dark-vs-light primary gap is a positive lightness lift
    for (const family of BRAND_FAMILIES) {
      const gap =
        primitiveIn(brandDeclarations(family, 'dark'), family, 9).l -
        primitiveIn(brandDeclarations(family, 'light'), family, 9).l;
      expect(gap).toBeGreaterThan(0.1);
      expect(gap).toBeLessThan(0.3);
    }
  });
});

describe('createBrandTheme — validation', () => {
  it('rejects names that are not lowercase kebab identifiers', () => {
    expect(() => createBrandTheme({name: 'Acme', light: '#0066ff'})).toThrow(/Invalid brand name "Acme"/);
    expect(() => createBrandTheme({name: 'my brand', light: '#0066ff'})).toThrow(/Invalid brand name/);
  });

  it('rejects names colliding with the fixed neutral families', () => {
    for (const family of ['gray', 'green', 'amber', 'red']) {
      expect(() => createBrandTheme({name: family, light: '#0066ff'})).toThrow(
        /collides with a fixed neutral family/,
      );
    }
  });

  it('rejects invalid seeds through the hex parser', () => {
    expect(() => createBrandTheme({name: 'brand', light: '0066ff'})).toThrow(/Invalid hex color/);
    expect(() => createBrandTheme({name: 'brand', light: '#0066ff', dark: '#nope'})).toThrow(/Invalid hex color/);
  });

  it('rejects override anchors outside the 1–12 scale', () => {
    expect(() => createBrandTheme({name: 'brand', light: '#0066ff', overrides: {light: {13: '#000000'}}})).toThrow(
      /outside the 1–12 scale/,
    );
  });
});

describe('cli/theme.mjs — parity with createBrandTheme', () => {
  it.each(BRAND_FAMILIES)('matches the TS pipeline for the %s preset seeds', (family) => {
    const options = presetOptions(family);
    expect(createBrandThemeCss(options)).toEqual(createBrandTheme(options));
  });

  it('matches for a custom seed with a derived dark mode', () => {
    const options = {name: 'acme', light: '#0066ff'};
    expect(createBrandThemeCss(options)).toEqual(createBrandTheme(options));
  });

  it('matches for a custom seed with overrides', () => {
    const options = {name: 'acme', light: '#7c3aed', dark: '#a78bfa', overrides: {light: {10: '#6d28d9'}}};
    expect(createBrandThemeCss(options)).toEqual(createBrandTheme(options));
  });

  it('validates names and seeds the same way', () => {
    expect(() => createBrandThemeCss({name: 'Gray', light: '#0066ff'})).toThrow(/Invalid brand name/);
    expect(() => createBrandThemeCss({name: 'gray', light: '#0066ff'})).toThrow(/collides with a fixed neutral family/);
    expect(() => createBrandThemeCss({name: 'brand', light: 'blue'})).toThrow(/Invalid hex color/);
  });

  it('wraps the blocks into a stylesheet with both mode classes', () => {
    const theme = createBrandThemeCss({name: 'acme', light: '#0066ff'});
    const css = renderStylesheet(theme, {lightSeed: '#0066ff', darkSeed: 'derived (oklch l +0.2)'});
    expect(css.startsWith('/* haze-ui brand theme "acme" — generated by haze-ui-theme.')).toBe(true);
    expect(css).toContain(`.haze-acme-light {\n${theme.light}\n}`);
    expect(css).toContain(`.haze-acme-dark {\n${theme.dark}\n}`);
  });
});
