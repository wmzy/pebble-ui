/**
 * Build-time WCAG contrast gate for the OKLCH token system.
 *
 * Every ratio below is computed from the resolved semantic-token values of
 * the default theme AND the five brand presets (violet/teal/cyan/orange/
 * rose), so the gate runs in CI (`pnpm test`) — palette regressions fail
 * the build upstream of what axe can only catch on already-rendered pages.
 *
 * The math itself is cross-validated against culori in oklch.test.ts.
 */

import type {Mode,SemanticColorToken} from './palette';
import type {Oklch} from './oklch';

import {expect} from 'vitest';

import {clampChroma, formatOklch, wcagContrast} from './oklch';
import {BRAND_FAMILIES, PRIMITIVES, SEMANTIC_COLOR_TOKENS, buildBrandTheme} from './palette';
import {TOKEN_REGISTRY} from './registry';

const MODES: readonly Mode[] = ['light', 'dark'];
const SURFACES: readonly string[] = ['bg', 'bg-subtle', 'bg-muted'];

/** One theme under test: the default blue theme plus the brand presets. */
type ThemeTokens = {
  label: string;
  tokens: readonly SemanticColorToken[];
  byName: ReadonlyMap<string, SemanticColorToken>;
};

const toTheme = (label: string, tokens: readonly SemanticColorToken[]): ThemeTokens => ({
  label,
  tokens,
  byName: new Map(tokens.map((token) => [token.name, token])),
});

const THEMES: readonly ThemeTokens[] = [
  toTheme('default', SEMANTIC_COLOR_TOKENS),
  ...BRAND_FAMILIES.map((family) => toTheme(family, buildBrandTheme(family).semanticTokens)),
];

const DEFAULT_THEME = THEMES[0]!;

/** Resolve a semantic token by its short name ('text', 'primary-subtle', …) within one theme. */
function resolve(theme: ThemeTokens, name: string, mode: Mode): Oklch {
  const token = theme.byName.get(`--haze-color-${name}`);
  if (token === undefined) {
    throw new Error(`Unknown color token: --haze-color-${name}`);
  }
  return token.resolved[mode];
}

function contrast(theme: ThemeTokens, foreground: string, background: string, mode: Mode): number {
  return wcagContrast(resolve(theme, foreground, mode), resolve(theme, background, mode));
}

/** Assert a pair clears its floor with a message naming the pair and ratio. */
function expectContrastAtLeast(theme: ThemeTokens, foreground: string, background: string, mode: Mode, floor: number) {
  const ratio = contrast(theme, foreground, background, mode);
  expect(
    ratio,
    `${foreground} on ${background} (${theme.label}/${mode}): computed ${ratio.toFixed(3)} < floor ${floor}`,
  ).toBeGreaterThanOrEqual(floor);
}

describe('body text contrast (WCAG AA, 4.5:1)', () => {
  it.each(
    THEMES.flatMap((theme) =>
      MODES.flatMap((mode) =>
        ['text', 'text-secondary'].flatMap((foreground) =>
          SURFACES.map((background) => ({background, foreground, label: theme.label, mode, theme})),
        ),
      ),
    ),
  )('$foreground on $background ($label/$mode)', ({background, foreground, mode, theme}) => {
    expectContrastAtLeast(theme, foreground, background, mode, 4.5);
  });
});

describe('muted text contrast (3.0:1)', () => {
  // text-muted carries placeholder/decorative copy only, so it is held to the
  // 3:1 floor rather than AA body-text 4.5. The gray-9 seed carries a small
  // lightness nudge (TEXT_MUTED_ADJUST) specifically to clear this floor on
  // bg-muted in both modes — before the nudge light mode measured 3.026.
  // Brand presets share the default gray scale, so they clear it identically.
  it.each(
    THEMES.flatMap((theme) =>
      MODES.flatMap((mode) => SURFACES.map((background) => ({background, label: theme.label, mode, theme}))),
    ),
  )('text-muted on $background ($label/$mode)', ({background, mode, theme}) => {
    expectContrastAtLeast(theme, 'text-muted', background, mode, 3.0);
  });
});

describe('inverse text on solid status fills (WCAG AA, 4.5:1)', () => {
  // warning is excluded: it is never used as a solid fill under inverse text,
  // and amber physically cannot carry white text at 4.5:1 anyway (see the
  // amber bound comment in the subtle-ratchet table below).
  const FILLS: readonly string[] = ['primary', 'success', 'danger', 'info'];

  it.each(
    THEMES.flatMap((theme) =>
      MODES.flatMap((mode) => FILLS.map((fill) => ({fill, label: theme.label, mode, theme}))),
    ),
  )('text-inverse on $fill ($label/$mode)', ({fill, mode, theme}) => {
    expectContrastAtLeast(theme, 'text-inverse', fill, mode, 4.5);
  });
});

describe('primary as link/anchor text (WCAG AA, 4.5:1)', () => {
  it.each(THEMES.flatMap((theme) => MODES.map((mode) => ({label: theme.label, mode, theme}))))(
    'primary on bg ($label/$mode)',
    ({mode, theme}) => {
      expectContrastAtLeast(theme, 'primary', 'bg', mode, 4.5);
    },
  );
});

describe('status color on its own subtle background (ratchet floors)', () => {
  // Ratchet floors, not uniform WCAG floors: each floor is the Wave-1
  // measured ratio minus 0.15 headroom, pinning every pair to (at least)
  // what the palette delivers today. Any palette change that drops a pair
  // below its floor — e.g. a seed swap that lightens a status color — fails
  // the build and forces a conscious decision about the accessibility
  // trade-off. Improvements only ratchet these numbers up.
  //
  // The same table applies to the brand presets: every brand seed was chosen
  // to clear the blue-calibrated floors (teal/cyan/orange light anchors sit
  // one Tailwind step darker for exactly this reason), so a future brand
  // seed swap that softens a preset fails here like a default change would.
  //
  // The amber bound: warning can never reach 4.5:1 on its own subtle
  // background in light mode. Subtle tints sit at l = 0.945 (≈ #f2f3f5) and
  // even pure-seed amber #f59e0b on pure white only reaches 2.15:1 —
  // darkening amber far enough to pass 4.5 on a near-white tint would leave
  // the amber hue family entirely and stop reading as "warning". Hence the
  // 1.7 floor (measured 1.82) for light mode, while dark-mode amber on its
  // dark tint comfortably clears 9:1.
  const SUBTLE_FLOORS: readonly {dark: number; light: number; status: string}[] = [
    {dark: 5.05, light: 4.0, status: 'primary'},
    {dark: 6.5, light: 4.15, status: 'success'},
    {dark: 4.1, light: 3.95, status: 'danger'},
    {dark: 4.1, light: 4.25, status: 'info'},
    {dark: 9.2, light: 1.7, status: 'warning'},
  ];

  it.each(
    THEMES.flatMap((theme) =>
      SUBTLE_FLOORS.flatMap(({status, ...floors}) =>
        MODES.map((mode) => ({floor: floors[mode], label: theme.label, mode, status, theme})),
      ),
    ),
  )('$label: $status on $status-subtle ($mode) ≥ $floor', ({floor, mode, status, theme}) => {
    expectContrastAtLeast(theme, status, `${status}-subtle`, mode, floor);
  });
});

describe('derived-token formula parity (DERIVED_PARAMS math)', () => {
  type DerivedKind = 'hover' | 'active' | 'subtle' | 'border-hover' | 'focus-ring';

  // Mirror of DERIVED_PARAMS / FOCUS_RING_ALPHA from palette.ts (not
  // exported). If palette.ts changes a parameter, these tests fail until the
  // mirror is updated — that is the point: the emitted CSS formulas and the
  // TS resolved values can never silently diverge.
  const DERIVED_PARAMS: Record<Mode, {active: number; borderHover: number; hover: number; subtleC: number; subtleL: number}> = {
    light: {active: -0.09, borderHover: -0.09, hover: -0.045, subtleC: 0.2, subtleL: 0.945},
    dark: {active: 0.09, borderHover: 0.08, hover: 0.05, subtleC: 0.35, subtleL: 0.26},
  };
  const FOCUS_RING_ALPHA = 0.4;

  function kindOf(name: string): DerivedKind | null {
    if (name.endsWith('-focus-ring')) return 'focus-ring';
    if (name.endsWith('-border-hover')) return 'border-hover';
    if (name.endsWith('-hover')) return 'hover';
    if (name.endsWith('-active')) return 'active';
    if (name.endsWith('-subtle')) return 'subtle';
    return null;
  }

  /** Same ops the emitted CSS relative-color formula performs. */
  function expectedDerived(mode: Mode, base: Oklch, kind: DerivedKind): Oklch {
    const params = DERIVED_PARAMS[mode];
    switch (kind) {
      case 'hover':
        return clampChroma({l: base.l + params.hover, c: base.c, h: base.h});
      case 'active':
        return clampChroma({l: base.l + params.active, c: base.c, h: base.h});
      case 'subtle':
        return clampChroma({l: params.subtleL, c: base.c * params.subtleC, h: base.h});
      case 'border-hover':
        return clampChroma({l: base.l + params.borderHover, c: base.c, h: base.h});
      case 'focus-ring':
        return {l: base.l, c: base.c, h: base.h, alpha: FOCUS_RING_ALPHA};
    }
  }

  // Derived tokens are the ones emitted as relative-color formulas; aliases
  // reference a primitive var() instead.
  const derivedTokens = (tokens: readonly SemanticColorToken[]) =>
    tokens.filter((token) => token.css.light.startsWith('oklch(from'));

  it.each(THEMES)('$label: the derived set is exactly the -hover/-active/-subtle/border-hover/focus-ring tokens', (theme) => {
    // bg-subtle matches the -subtle suffix but is a primitive alias (gray-2),
    // not a relative-color formula — everything else suffix-shaped is derived.
    const bySuffix = theme.tokens
      .filter((token) => kindOf(token.name) !== null && token.name !== '--haze-color-bg-subtle')
      .map((token) => token.name);
    expect(
      derivedTokens(theme.tokens).map((token) => token.name),
      'name-suffix-derived set ≠ css-formula-derived set',
    ).toEqual(bySuffix);
  });

  it.each(
    THEMES.flatMap((theme) =>
      derivedTokens(theme.tokens).flatMap((token) => {
        const kind = kindOf(token.name);
        if (kind === null) {
          throw new Error(`Derived token ${token.name} has no recognized suffix`);
        }
        return MODES.map((mode) => ({kind, label: theme.label, mode, name: token.name, theme}));
      }),
    ),
  )('$name ($label/$mode) resolved matches DERIVED_PARAMS applied to its base', ({kind, mode, name, theme}) => {
    const token = theme.byName.get(name);
    if (token === undefined) {
      throw new Error(`Unknown color token: ${name}`);
    }
    // The formula must be wired to the base token the parity math uses.
    // border-hover strips only '-hover' (its base is --haze-color-border);
    // focus-ring is derived from primary per palette.ts, which its name
    // does not encode.
    const marker = kind === 'border-hover' ? '-hover' : `-${kind}`;
    const baseName = kind === 'focus-ring' ? '--haze-color-primary' : name.slice(0, name.length - marker.length);
    const base = theme.byName.get(baseName);
    if (base === undefined) {
      throw new Error(`Derived token ${name} has no base token ${baseName}`);
    }
    expect(token.css[mode], `${name} (${mode}) css formula is not based on ${baseName}`).toContain(
      `var(${baseName})`,
    );

    const expected = expectedDerived(mode, base.resolved[mode], kind);
    const resolved = token.resolved[mode];
    expect(resolved.l, `${name} (${mode}) l`).toBeCloseTo(expected.l, 9);
    expect(resolved.c, `${name} (${mode}) c`).toBeCloseTo(expected.c, 9);
    expect(resolved.h, `${name} (${mode}) h`).toBeCloseTo(expected.h, 9);
    expect(resolved.alpha, `${name} (${mode}) alpha`).toBe(expected.alpha);
  });
});

describe('default theme regression guard (brand parameterization)', () => {
  // SEMANTIC_COLOR_TOKENS construction was parameterized so brand presets
  // can reroute primary/info to their own scale; these pins prove the
  // default theme did not move. Byte-level pinning of every default
  // resolved value lives in the registry describe below (TOKEN_REGISTRY is
  // generated pre-refactor and untouched).
  const NAMES: readonly string[] = [
    '--haze-color-primary',
    '--haze-color-primary-hover',
    '--haze-color-primary-active',
    '--haze-color-primary-subtle',
    '--haze-color-bg',
    '--haze-color-bg-subtle',
    '--haze-color-bg-muted',
    '--haze-color-text',
    '--haze-color-text-secondary',
    '--haze-color-text-muted',
    '--haze-color-text-inverse',
    '--haze-color-border',
    '--haze-color-border-hover',
    '--haze-color-success',
    '--haze-color-success-hover',
    '--haze-color-success-active',
    '--haze-color-success-subtle',
    '--haze-color-warning',
    '--haze-color-warning-hover',
    '--haze-color-warning-active',
    '--haze-color-warning-subtle',
    '--haze-color-danger',
    '--haze-color-danger-hover',
    '--haze-color-danger-active',
    '--haze-color-danger-subtle',
    '--haze-color-info',
    '--haze-color-info-hover',
    '--haze-color-info-active',
    '--haze-color-info-subtle',
    '--haze-color-focus-ring',
  ];

  it('token order and names are unchanged', () => {
    expect(SEMANTIC_COLOR_TOKENS.map((token) => token.name)).toEqual(NAMES);
  });

  it('default primary/info still alias the blue scale', () => {
    expect(DEFAULT_THEME.byName.get('--haze-color-primary')?.css).toEqual({
      light: 'var(--haze-blue-9)',
      dark: 'var(--haze-blue-9)',
    });
    expect(DEFAULT_THEME.byName.get('--haze-color-info')?.css).toEqual({
      light: 'var(--haze-blue-10)',
      dark: 'var(--haze-blue-8)',
    });
  });

  it('brand themes reroute exactly the primary/info aliases; everything else is byte-equal', () => {
    for (const family of BRAND_FAMILIES) {
      const theme = buildBrandTheme(family);
      expect(theme.semanticTokens.map((token) => token.name), `${family} token order`).toEqual(NAMES);

      // Shared scales are the same objects; blue is absent from the theme.
      expect(theme.primitives.light.gray).toBe(PRIMITIVES.light.gray);
      expect(theme.primitives.light.green).toBe(PRIMITIVES.light.green);
      expect(theme.primitives.light.amber).toBe(PRIMITIVES.light.amber);
      expect(theme.primitives.light.red).toBe(PRIMITIVES.light.red);
      expect(theme.declarations.light, `${family} light declarations`).not.toContain('--haze-blue-');
      expect(theme.declarations.dark, `${family} dark declarations`).not.toContain('--haze-blue-');
      expect(theme.declarations.light).toContain(`--haze-${family}-1: `);
      expect(theme.declarations.light).toContain(`--haze-${family}-12: `);

      for (const token of theme.semanticTokens) {
        const def = DEFAULT_THEME.byName.get(token.name);
        if (def === undefined) {
          throw new Error(`Unknown token ${token.name}`);
        }
        if (token.name === '--haze-color-primary' || token.name === '--haze-color-info') {
          const step = token.name === '--haze-color-primary' ? {dark: 9, light: 9} : {dark: 8, light: 10};
          expect(token.css, `${family} ${token.name} aliases the brand scale`).toEqual({
            light: `var(--haze-${family}-${step.light})`,
            dark: `var(--haze-${family}-${step.dark})`,
          });
        } else {
          // Derived formulas alias semantic base names, so their css strings
          // are identical — only the primary/info groups and focus-ring
          // resolve differently (through their rerouted bases).
          expect(token.css, `${family} ${token.name} css`).toEqual(def.css);
        }
        const rerouted =
          token.name.startsWith('--haze-color-primary') ||
          token.name.startsWith('--haze-color-info') ||
          token.name === '--haze-color-focus-ring';
        if (!rerouted) {
          expect(token.resolved.light, `${family} ${token.name} light`).toEqual(def.resolved.light);
          expect(token.resolved.dark, `${family} ${token.name} dark`).toEqual(def.resolved.dark);
        }
      }
    }
  });
});

describe('registry consistency (TOKEN_REGISTRY ↔ SEMANTIC_COLOR_TOKENS)', () => {
  const registryColors = TOKEN_REGISTRY.filter((entry) => entry.category === 'color');

  it('color name sets match exactly', () => {
    expect(
      registryColors.map((entry) => entry.name).sort(),
      'TOKEN_REGISTRY color entries ≠ SEMANTIC_COLOR_TOKENS names',
    ).toEqual([...SEMANTIC_COLOR_TOKENS.map((token) => token.name)].sort());
  });

  it.each(SEMANTIC_COLOR_TOKENS)('$name registry strings equal formatOklch(resolved)', (token) => {
    const entry = registryColors.find((candidate) => candidate.name === token.name);
    if (entry === undefined) {
      throw new Error(`${token.name} missing from TOKEN_REGISTRY color entries`);
    }
    expect(entry.light, `${token.name} light`).toBe(formatOklch(token.resolved.light));
    expect(entry.dark, `${token.name} dark`).toBe(formatOklch(token.resolved.dark));
  });
});
