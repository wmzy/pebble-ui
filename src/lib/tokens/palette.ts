/**
 * OKLCH-derived color palette — the single source of truth for haze-ui color
 * tokens.
 *
 * Primitive 12-step scales are seeded from the hex values of the previous
 * hand-tuned token system, so every semantic base color lands within ΔE ≤ 1.0
 * of its predecessor. Semantic tokens alias primitive steps; interaction
 * states (hover / active / subtle / focus-ring / border-hover) are emitted as
 * CSS relative-color formulas so consumer overrides of a base color propagate
 * to its derived states at runtime.
 */

import type {Oklch} from './oklch';

import {clampChroma, formatOklch, parseHex, parseOklch} from './oklch';

export type Mode = 'light' | 'dark';
export type Family = 'gray' | 'blue' | 'green' | 'amber' | 'red';

/** Brand families available as preset themes — see BRAND_SEEDS / brands.ts. */
export type BrandFamily = 'violet' | 'teal' | 'cyan' | 'orange' | 'rose';

export type PrimitiveScales = Record<Mode, Record<Family, readonly string[]>>;

export type SemanticColorToken = {
  /** CSS custom property name, e.g. '--haze-color-primary'. */
  name: string;
  /** Human-readable label for the docs registry. */
  label: string;
  /** Emitted CSS value per mode: a primitive alias or a relative-color formula. */
  css: Record<Mode, string>;
  /** Concrete computed value per mode (formula math applied to the aliased base). */
  resolved: Record<Mode, Oklch>;
};

type ModeParams = {
  /** Hue-preserving lightness shift for hover states (added to l). */
  hover: number;
  /** Lightness shift for active states (added to l). */
  active: number;
  /** Lightness shift for border-hover (added to l). */
  borderHover: number;
  /** Fixed lightness used by subtle backgrounds. */
  subtleL: number;
  /** Chroma damping factor used by subtle backgrounds (multiplied into c). */
  subtleC: number;
};

/**
 * Interaction-state parameters. The values are chosen so the resolved states
 * reproduce the previous hand-tuned primary states within ΔE ≤ 1
 * (light #0052cc/#003d99/#e6f0ff, dark #6aa6ff/#80b3ff/#1a2e4a). The same
 * parameters are applied to every semantic family.
 */
const DERIVED_PARAMS: Record<Mode, ModeParams> = {
  light: {hover: -0.045, active: -0.09, borderHover: -0.09, subtleL: 0.945, subtleC: 0.2},
  dark: {hover: 0.05, active: 0.09, borderHover: 0.08, subtleL: 0.26, subtleC: 0.35},
};

const FOCUS_RING_ALPHA = 0.4;

/**
 * Lightness nudge applied to the gray-9 anchor (= text-muted). Needed to
 * clear the 3.0:1 contrast floor on bg-muted in both modes; the resulting ΔE
 * against the old hexes (0.008 light / 0.014 dark) is far inside the ≤ 1.0
 * migration budget.
 */
const TEXT_MUTED_ADJUST: Record<Mode, number> = {light: -0.008, dark: 0.014};

type ScaleSeed = Readonly<Record<number, string>>;

/**
 * Migration seeds: step → previous hex value. Anchored steps are reproduced
 * exactly (up to 3-decimal OKLCH rounding); the remaining steps are
 * interpolated (lightness monotonic 1→12, chroma peaking at the anchor steps
 * and tapering toward both ends).
 */
const SEEDS: Record<Mode, Record<Family, ScaleSeed>> = {
  light: {
    gray: {1: '#ffffff', 2: '#f7f8fa', 3: '#eef0f4', 4: '#e0e0e0', 9: '#8a8a8a', 11: '#4a4a4a', 12: '#1a1a1a'},
    blue: {9: '#0066ff', 10: '#2563eb'},
    green: {9: '#15803d'},
    amber: {9: '#f59e0b'},
    red: {9: '#dc2626'},
  },
  dark: {
    gray: {1: '#121212', 2: '#1e1e1e', 3: '#2a2a2a', 4: '#333333', 9: '#707070', 11: '#b0b0b0', 12: '#e8e8e8'},
    blue: {8: '#3b82f6', 9: '#4d94ff'},
    green: {8: '#22c55e'},
    amber: {8: '#fbbf24'},
    red: {8: '#ef4444'},
  },
};

/**
 * Brand preset seeds. Anchors sit near Tailwind's 600/700 steps (light) and
 * one step brighter (dark), mirroring how blue's dark anchors sit one step
 * above their light counterparts. Where a floor could not be cleared at the
 * nearest Tailwind step, the seed is darkened — the same policy as green-9
 * (#16a34a → #15803d): teal/cyan/orange light anchors move a full step to
 * 700 for white-on-primary 4.5:1, and rose-600 is nudged ΔE 0.011 darker so
 * primary-on-primary-subtle clears the 4.0 ratchet. Anchored steps 9/10
 * (light) and 8/9 (dark) match the primary/info STATUS_STEP slots.
 */
const BRAND_SEEDS: Record<BrandFamily, Record<Mode, ScaleSeed>> = {
  violet: {light: {9: '#7c3aed', 10: '#6d28d9'}, dark: {8: '#9b76fa', 9: '#a78bfa'}},
  teal: {light: {9: '#0f766e', 10: '#134e4a'}, dark: {8: '#14b8a6', 9: '#2dd4bf'}},
  cyan: {light: {9: '#0e7490', 10: '#155e75'}, dark: {8: '#06b6d4', 9: '#22d3ee'}},
  orange: {light: {9: '#c2410c', 10: '#9a3412'}, dark: {8: '#f97316', 9: '#fb923c'}},
  rose: {light: {9: '#dd1645', 10: '#be123c'}, dark: {8: '#f43f5e', 9: '#fb7185'}},
};

/** Endpoints of chromatic scales: light runs near-white → near-black, dark the inverse. */
const CHROMATIC_ENDPOINTS: Record<Mode, {l1: number; l12: number; c1: number; c12: number}> = {
  light: {l1: 0.982, l12: 0.16, c1: 0.018, c12: 0.045},
  dark: {l1: 0.155, l12: 0.982, c1: 0.03, c12: 0.012},
};

type Point = {x: number; y: number};

/** Piecewise-linear interpolation over sorted points (clamped at both ends). */
function interpolateAt(points: readonly Point[], x: number): number {
  const first = points[0]!;
  if (x <= first.x) return first.y;
  for (let i = 1; i < points.length; i++) {
    const point = points[i]!;
    if (x <= point.x) {
      const previous = points[i - 1]!;
      const t = (x - previous.x) / (point.x - previous.x);
      return previous.y + t * (point.y - previous.y);
    }
  }
  return points[points.length - 1]!.y;
}

function seedAnchors(seed: ScaleSeed, mode: Mode, gray: boolean): readonly {step: number; color: Oklch}[] {
  return Object.entries(seed)
    .map(([step, hex]) => {
      const parsed = parseHex(hex);
      const isTextMutedStep = gray && Number(step) === 9;
      const l = isTextMutedStep ? parsed.l + TEXT_MUTED_ADJUST[mode] : parsed.l;
      // The gray family is achromatic by definition: drop the residual chroma
      // the old hexes carried (~0.005 — imperceptible, ΔE-wise).
      return {step: Number(step), color: gray ? {l, c: 0, h: 0} : parsed};
    })
    .sort((a, b) => a.step - b.step);
}

function formatSteps(luminancePoints: readonly Point[], chromaAt: (step: number) => number, hueAt: (step: number) => number): readonly string[] {
  const steps: string[] = [];
  for (let step = 1; step <= 12; step++) {
    // Gamut-clamp (chroma reduction at fixed lightness/hue) every step.
    steps.push(formatOklch(clampChroma({l: interpolateAt(luminancePoints, step), c: chromaAt(step), h: hueAt(step)})));
  }
  return steps;
}

function buildGrayScale(seed: ScaleSeed, mode: Mode): readonly string[] {
  const anchors = seedAnchors(seed, mode, true);
  return formatSteps(anchors.map((a) => ({x: a.step, y: a.color.l})), () => 0, () => 0);
}

function buildChromaticScale(seed: ScaleSeed, mode: Mode): readonly string[] {
  return chromaticScaleFromAnchors(seedAnchors(seed, mode, false), mode);
}

/**
 * Chromatic scale from pre-parsed anchors — the shared tail of the hex-seed
 * path above and the runtime-seed path createBrandTheme uses (its derived
 * anchors are OKLCH math results, so they must not round-trip through hex).
 */
function chromaticScaleFromAnchors(anchors: readonly {step: number; color: Oklch}[], mode: Mode): readonly string[] {
  const endpoints = CHROMATIC_ENDPOINTS[mode];
  const luminancePoints = [{x: 1, y: endpoints.l1}, ...anchors.map((a) => ({x: a.step, y: a.color.l})), {x: 12, y: endpoints.l12}];
  const chromaPoints = [{x: 1, y: endpoints.c1}, ...anchors.map((a) => ({x: a.step, y: a.color.c})), {x: 12, y: endpoints.c12}];
  const huePoints = [
    {x: 1, y: anchors[0]!.color.h},
    ...anchors.map((a) => ({x: a.step, y: a.color.h})),
    {x: 12, y: anchors[anchors.length - 1]!.color.h},
  ];
  return formatSteps(
    luminancePoints,
    (step) => interpolateAt(chromaPoints, step),
    (step) => interpolateAt(huePoints, step),
  );
}

const PRIMITIVES: PrimitiveScales = {
  light: {
    gray: buildGrayScale(SEEDS.light.gray, 'light'),
    blue: buildChromaticScale(SEEDS.light.blue, 'light'),
    green: buildChromaticScale(SEEDS.light.green, 'light'),
    amber: buildChromaticScale(SEEDS.light.amber, 'light'),
    red: buildChromaticScale(SEEDS.light.red, 'light'),
  },
  dark: {
    gray: buildGrayScale(SEEDS.dark.gray, 'dark'),
    blue: buildChromaticScale(SEEDS.dark.blue, 'dark'),
    green: buildChromaticScale(SEEDS.dark.green, 'dark'),
    amber: buildChromaticScale(SEEDS.dark.amber, 'dark'),
    red: buildChromaticScale(SEEDS.dark.red, 'dark'),
  },
};

/**
 * Primitive scales for one theme: family name → 12 formatted steps, per
 * mode. Default themes carry gray/blue/green/amber/red; brand themes carry
 * gray/{brand}/green/amber/red with the brand scale in blue's slot.
 */
type ThemeScales = Readonly<Record<Mode, Readonly<Record<string, readonly string[]>>>>;

function stepAt(scales: ThemeScales, mode: Mode, family: string, step: number): string {
  const value = scales[mode][family]?.[step - 1];
  if (value === undefined) {
    throw new Error(`Missing primitive ${family}-${step} in ${mode} mode`);
  }
  return value;
}

/**
 * Semantic-token generation context: which primitive scales to alias into
 * and which family each status color routes to. The default theme routes
 * primary/info to blue; brand themes reroute both to the brand family.
 */
type ThemeContext = {
  scales: ThemeScales;
  statusFamily: Readonly<Record<StatusKey, string>>;
};

const DEFAULT_STATUS_FAMILY: Readonly<Record<StatusKey, string>> = {primary: 'blue', success: 'green', warning: 'amber', danger: 'red', info: 'blue'};

/** Steps are fitted to lightness order: light scales darken toward 12, dark scales lighten. */
const STATUS_STEP: Record<Mode, Record<StatusKey, number>> = {
  light: {primary: 9, success: 9, warning: 9, danger: 9, info: 10},
  dark: {primary: 9, success: 8, warning: 8, danger: 8, info: 8},
};

const NEUTRAL_STEP: Record<NeutralKey, number> = {
  bg: 1,
  'bg-subtle': 2,
  'bg-muted': 3,
  text: 12,
  'text-secondary': 11,
  'text-muted': 9,
  border: 4,
};

type StatusKey = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type NeutralKey = 'bg' | 'bg-subtle' | 'bg-muted' | 'text' | 'text-secondary' | 'text-muted' | 'border';
type DerivedKind = 'hover' | 'active' | 'subtle' | 'border-hover' | 'focus-ring';

const primitiveVar = (family: string, step: number): string => `var(--haze-${family}-${step})`;

const lightnessCalc = (delta: number): string => `calc(l ${delta < 0 ? '-' : '+'} ${Math.abs(delta)})`;

/** CSS relative-color formula: derived at runtime from the base token, so base overrides propagate. */
function derivedCss(mode: Mode, baseVar: string, kind: DerivedKind): string {
  const params = DERIVED_PARAMS[mode];
  switch (kind) {
    case 'hover':
      return `oklch(from ${baseVar} ${lightnessCalc(params.hover)} c h)`;
    case 'active':
      return `oklch(from ${baseVar} ${lightnessCalc(params.active)} c h)`;
    case 'subtle':
      return `oklch(from ${baseVar} ${params.subtleL} calc(c * ${params.subtleC}) h)`;
    case 'border-hover':
      return `oklch(from ${baseVar} ${lightnessCalc(params.borderHover)} c h)`;
    case 'focus-ring':
      return `oklch(from ${baseVar} l c h / ${FOCUS_RING_ALPHA})`;
  }
}

/** Same math the relative-color formulas perform, applied in TypeScript. */
function derivedResolved(mode: Mode, base: Oklch, kind: DerivedKind): Oklch {
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

function aliasToken(ctx: ThemeContext, name: string, label: string, family: string, step: Record<Mode, number>): SemanticColorToken {
  return {
    name,
    label,
    css: {light: primitiveVar(family, step.light), dark: primitiveVar(family, step.dark)},
    resolved: {
      light: parseOklch(stepAt(ctx.scales, 'light', family, step.light)),
      dark: parseOklch(stepAt(ctx.scales, 'dark', family, step.dark)),
    },
  };
}

function derivedToken(name: string, label: string, baseName: string, base: Record<Mode, Oklch>, kind: DerivedKind): SemanticColorToken {
  const baseVar = `var(${baseName})`;
  return {
    name,
    label,
    css: {light: derivedCss('light', baseVar, kind), dark: derivedCss('dark', baseVar, kind)},
    resolved: {light: derivedResolved('light', base.light, kind), dark: derivedResolved('dark', base.dark, kind)},
  };
}

function statusGroup(ctx: ThemeContext, key: StatusKey): readonly SemanticColorToken[] {
  const base = aliasToken(ctx, `--haze-color-${key}`, key[0]!.toUpperCase() + key.slice(1), ctx.statusFamily[key], {
    light: STATUS_STEP.light[key],
    dark: STATUS_STEP.dark[key],
  });
  return [
    base,
    derivedToken(`${base.name}-hover`, `${base.label} Hover`, base.name, base.resolved, 'hover'),
    derivedToken(`${base.name}-active`, `${base.label} Active`, base.name, base.resolved, 'active'),
    derivedToken(`${base.name}-subtle`, `${base.label} Subtle`, base.name, base.resolved, 'subtle'),
  ];
}

function neutralToken(ctx: ThemeContext, key: NeutralKey, label: string): SemanticColorToken {
  return aliasToken(ctx, `--haze-color-${key}`, label, 'gray', {light: NEUTRAL_STEP[key], dark: NEUTRAL_STEP[key]});
}

/**
 * Text inverse sits on saturated fills, not on the theme background: light
 * mode is pure white, dark mode reuses the light scale's darkest gray (the
 * previous #1a1a1a) rather than any dark-mode step.
 */
const textInverseToken = (ctx: ThemeContext): SemanticColorToken => ({
  name: '--haze-color-text-inverse',
  label: 'Text Inverse',
  css: {light: 'oklch(1 0 0)', dark: stepAt(ctx.scales, 'light', 'gray', 12)},
  resolved: {light: {l: 1, c: 0, h: 0}, dark: parseOklch(stepAt(ctx.scales, 'light', 'gray', 12))},
});

/**
 * Full semantic token set for one theme context: the primary group, the
 * neutral aliases, border + border-hover, the success/warning/danger/info
 * groups, and the primary-derived focus ring.
 */
function buildSemanticTokens(ctx: ThemeContext): readonly SemanticColorToken[] {
  const primaryTokens = statusGroup(ctx, 'primary');
  const primaryBase = primaryTokens[0]!;
  const borderToken = neutralToken(ctx, 'border', 'Border');
  return [
    ...primaryTokens,
    neutralToken(ctx, 'bg', 'Background'),
    neutralToken(ctx, 'bg-subtle', 'Background Subtle'),
    neutralToken(ctx, 'bg-muted', 'Background Muted'),
    neutralToken(ctx, 'text', 'Text'),
    neutralToken(ctx, 'text-secondary', 'Text Secondary'),
    neutralToken(ctx, 'text-muted', 'Text Muted'),
    textInverseToken(ctx),
    borderToken,
    derivedToken('--haze-color-border-hover', 'Border Hover', borderToken.name, borderToken.resolved, 'border-hover'),
    ...statusGroup(ctx, 'success'),
    ...statusGroup(ctx, 'warning'),
    ...statusGroup(ctx, 'danger'),
    ...statusGroup(ctx, 'info'),
    derivedToken('--haze-color-focus-ring', 'Focus Ring', primaryBase.name, primaryBase.resolved, 'focus-ring'),
  ];
}

const SEMANTIC_COLOR_TOKENS: readonly SemanticColorToken[] = buildSemanticTokens({
  scales: PRIMITIVES,
  statusFamily: DEFAULT_STATUS_FAMILY,
});

/** Brand families shipped as preset theme classes (see tokens/brands.ts). */
const BRAND_FAMILIES: readonly BrandFamily[] = ['violet', 'teal', 'cyan', 'orange', 'rose'];

export type BrandThemeDef = {
  /** The brand family taking blue's slot (primary/info/focus-ring route here). */
  family: BrandFamily;
  /** The theme's primitive scales: gray/{family}/green/amber/red per mode. */
  primitives: ThemeScales;
  /** The full semantic token set with primary/info rerouted to the brand. */
  semanticTokens: readonly SemanticColorToken[];
  /** Class-ready declarations per mode — the exact shape colors.ts emits. */
  declarations: Record<Mode, string>;
};

/** One brand family's scale set: the brand takes blue's slot in the family order. */
function brandScales(family: BrandFamily): ThemeScales {
  const withBrand = (mode: Mode): Record<string, readonly string[]> =>
    Object.fromEntries<readonly string[]>([
      ['gray', PRIMITIVES[mode].gray],
      [family, buildChromaticScale(BRAND_SEEDS[family][mode], mode)],
      ['green', PRIMITIVES[mode].green],
      ['amber', PRIMITIVES[mode].amber],
      ['red', PRIMITIVES[mode].red],
    ]);
  return {light: withBrand('light'), dark: withBrand('dark')};
}

/**
 * Build a complete brand preset theme: the brand's primitive scale in
 * blue's slot plus the full semantic set with primary/info rerouted to it
 * (focus-ring follows primary transitively through its relative-color
 * formula). Neutrals and success/warning/danger stay on the default
 * scales, so only the primary/info groups and focus-ring differ.
 */
function buildBrandTheme(family: BrandFamily): BrandThemeDef {
  const primitives = brandScales(family);
  const semanticTokens = buildSemanticTokens({
    scales: primitives,
    statusFamily: {...DEFAULT_STATUS_FAMILY, primary: family, info: family},
  });
  return {
    family,
    primitives,
    semanticTokens,
    declarations: {
      light: themeDeclarations('light', primitives, semanticTokens),
      dark: themeDeclarations('dark', primitives, semanticTokens),
    },
  };
}

/**
 * The declarations a theme class carries: primitive scales first, then
 * semantic aliases with their relative-color formulas. colors.ts emits the
 * same shape for the default themes; brands.ts emits it per preset.
 */
function themeDeclarations(mode: Mode, scales: ThemeScales, semanticTokens: readonly SemanticColorToken[]): string {
  const primitives = Object.entries(scales[mode])
    .flatMap(([family, steps]) => steps.map((value, index) => `--haze-${family}-${index + 1}: ${value};`))
    .join('\n');
  const semantic = semanticTokens.map((token) => `${token.name}: ${token.css[mode]};`).join('\n');
  return `${primitives}\n\n${semantic}`;
}

/** Class-ready declarations for one brand preset theme — what brands.ts interpolates. */
function brandDeclarations(family: BrandFamily, mode: Mode): string {
  return buildBrandTheme(family).declarations[mode];
}

/**
 * Families a custom brand name may not take: their scales carry the fixed
 * neutrals and the success/warning/danger statuses every theme routes to.
 */
const NEUTRAL_FAMILIES: ReadonlySet<string> = new Set(['gray', 'green', 'amber', 'red']);

/** The family name becomes CSS custom-property idents (`--haze-{name}-*`), so kebab-lowercase only. */
const FAMILY_NAME_RE = /^[a-z][a-z0-9-]*$/;

/**
 * Seed-derivation offsets, fitted to the mean light→dark relationship
 * measured in OKLCH across the six seed families (blue + the five brand
 * presets): the dark primary anchor sits 0.2 higher in lightness than the
 * light one, and each mode's info anchor sits 0.07 below its primary
 * (step 10 in light, step 8 in dark). Chroma and hue are preserved, so the
 * derived dark keeps the seed's identity; a hex passed as `dark` always
 * wins over the derivation.
 */
const DERIVED_SEED_OFFSETS = {infoStep: -0.07, darkPrimary: 0.2} as const;

export type BrandSeedOverrides = {
  /** Extra light-mode anchors merged over the derived ones, e.g. `{10: '#6d28d9'}`. */
  light?: ScaleSeed;
  /** Extra dark-mode anchors merged over the derived ones, e.g. `{8: '#9b76fa'}`. */
  dark?: ScaleSeed;
};

export type CreateBrandThemeOptions = {
  /**
   * Brand family name — becomes the primitive scale's custom-property
   * prefix (`--haze-{name}-1…12`). Lowercase kebab (`brand`, `acme-corp`).
   * A preset name ('violet' … 'rose') reproduces that preset's slots;
   * 'blue' re-seeds the default theme's own scale.
   */
  name: string;
  /** Light-mode primary seed (hex) — anchors scale step 9. */
  light: string;
  /**
   * Dark-mode primary seed (hex) — anchors dark step 9. Omit to derive it
   * from `light` via the family lightness relationship (see
   * DERIVED_SEED_OFFSETS).
   */
  dark?: string;
  /** Explicit anchors merged over the derived seeds — same slots the presets pin. */
  overrides?: BrandSeedOverrides;
};

/** Runtime-built brand theme: class-ready declaration blocks per mode (see brands.ts for the preset shape). */
export type BrandThemeCss = {name: string; light: string; dark: string};

const clampLightness = (l: number): number => Math.min(1, Math.max(0, l));

const shiftLightness = (color: Oklch, delta: number): Oklch =>
  clampChroma({l: clampLightness(color.l + delta), c: color.c, h: color.h});

/** Merge hex-seed overrides over derived anchors; later entries win, result stays step-sorted. */
function mergeAnchors(base: readonly {step: number; color: Oklch}[], seed: ScaleSeed | undefined): readonly {step: number; color: Oklch}[] {
  const byStep = new Map(base.map((anchor) => [anchor.step, anchor.color]));
  for (const [step, hex] of Object.entries(seed ?? {})) {
    if (Number(step) < 1 || Number(step) > 12) {
      throw new Error(`Seed anchor step ${step} is outside the 1–12 scale`);
    }
    byStep.set(Number(step), parseHex(hex));
  }
  return [...byStep.entries()].map(([step, color]) => ({step, color})).sort((a, b) => a.step - b.step);
}

/**
 * Build a complete custom brand theme at runtime from one or two seed hexes
 * — the same pipeline the build-time presets go through (primitive scales,
 * semantic rerouting of primary/info to the brand family, relative-color
 * interaction states), so the output is byte-compatible with
 * `brandDeclarations()` given equivalent seeds.
 *
 * The returned blocks are bare custom-property declarations (no selector):
 * hand them to a `<style>` tag or a Linaria `css` template as
 * `.my-brand-light { … }` / `.my-brand-dark { … }` classes, exactly like the
 * preset theme classes. As with the presets, the blocks are complete theme
 * REPLACEMENTS for lightTheme/darkTheme — never stack them on top.
 */
function createBrandTheme({name, light, dark, overrides}: CreateBrandThemeOptions): BrandThemeCss {
  if (!FAMILY_NAME_RE.test(name)) {
    throw new Error(`Invalid brand name "${name}" — use a lowercase kebab identifier (letters, digits, hyphens)`);
  }
  if (NEUTRAL_FAMILIES.has(name)) {
    throw new Error(`Brand name "${name}" collides with a fixed neutral family (gray/green/amber/red)`);
  }
  const lightPrimary = parseHex(light);
  const darkPrimary = dark === undefined ? shiftLightness(lightPrimary, DERIVED_SEED_OFFSETS.darkPrimary) : parseHex(dark);
  const anchors = {
    light: mergeAnchors(
      [
        {step: 9, color: lightPrimary},
        {step: 10, color: shiftLightness(lightPrimary, DERIVED_SEED_OFFSETS.infoStep)},
      ],
      overrides?.light,
    ),
    dark: mergeAnchors(
      [
        {step: 9, color: darkPrimary},
        {step: 8, color: shiftLightness(darkPrimary, DERIVED_SEED_OFFSETS.infoStep)},
      ],
      overrides?.dark,
    ),
  };
  const withBrand = (mode: Mode): Record<string, readonly string[]> =>
    Object.fromEntries<readonly string[]>([
      ['gray', PRIMITIVES[mode].gray],
      [name, chromaticScaleFromAnchors(anchors[mode], mode)],
      ['green', PRIMITIVES[mode].green],
      ['amber', PRIMITIVES[mode].amber],
      ['red', PRIMITIVES[mode].red],
    ]);
  const scales: ThemeScales = {light: withBrand('light'), dark: withBrand('dark')};
  const semanticTokens = buildSemanticTokens({
    scales,
    statusFamily: {...DEFAULT_STATUS_FAMILY, primary: name, info: name},
  });
  return {
    name,
    light: themeDeclarations('light', scales, semanticTokens),
    dark: themeDeclarations('dark', scales, semanticTokens),
  };
}

export {PRIMITIVES, SEMANTIC_COLOR_TOKENS, BRAND_FAMILIES, BRAND_SEEDS, buildBrandTheme, brandDeclarations, themeDeclarations, createBrandTheme};
export type {ThemeScales, ScaleSeed};
