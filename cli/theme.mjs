#!/usr/bin/env node
/**
 * haze-ui-theme — generate a complete haze-ui brand theme CSS file from one
 * or two seed hexes, no Node dependencies.
 *
 *   node cli/theme.mjs --primary '#0066ff' [--dark '#0a3d99'] [--name brand] [--out brand.css]
 *   npx haze-ui-theme --primary '#7c3aed' --name acme
 *
 * The emitted classes (.haze-{name}-light / .haze-{name}-dark) are theme
 * REPLACEMENTS for lightTheme/darkTheme — apply one per subtree, never stack
 * on top of the default theme classes.
 *
 * The color math below is a dependency-free port of src/lib/tokens/oklch.ts
 * + the scale/semantic pipeline of src/lib/tokens/palette.ts (the library
 * source cannot be imported here: this file must also run from an
 * as-yet-unbuilt checkout, and dist/ is not guaranteed to exist). Drift is
 * pinned by src/lib/tokens/brand-theme.test.ts, which asserts this module's
 * output is byte-identical to createBrandTheme() for every preset seed set.
 */

// ---------------------------------------------------------------------------
// OKLCH math — ported from src/lib/tokens/oklch.ts
// ---------------------------------------------------------------------------

const SRGB_LINEAR_CUTOFF = 0.04045;
const LINEAR_SRGB_CUTOFF = 0.0031308;
const GAMUT_EPSILON = 1e-5;

const srgbToLinear = (channel) =>
  channel <= SRGB_LINEAR_CUTOFF ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

const linearToSrgb = (channel) =>
  channel <= LINEAR_SRGB_CUTOFF ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;

function linearRgbToOklab({r, g, b}) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb({L, a, b}) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

const lchToLab = ({l, c, h}) => {
  const hue = (h * Math.PI) / 180;
  return {L: l, a: c * Math.cos(hue), b: c * Math.sin(hue)};
};

const labToLch = ({L, a, b}) => {
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return {l: L, c: Math.sqrt(a * a + b * b), h: hue < 0 ? hue + 360 : hue};
};

const inGamut = (rgb) =>
  rgb.r >= -GAMUT_EPSILON && rgb.r <= 1 + GAMUT_EPSILON &&
  rgb.g >= -GAMUT_EPSILON && rgb.g <= 1 + GAMUT_EPSILON &&
  rgb.b >= -GAMUT_EPSILON && rgb.b <= 1 + GAMUT_EPSILON;

/** Reduce chroma until the color fits the sRGB gamut, preserving lightness and hue exactly. */
function clampChroma(color) {
  const l = Math.min(1, Math.max(0, color.l));
  const hue = (color.h * Math.PI) / 180;
  let low = 0;
  let high = Math.max(color.c, 0);
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    if (inGamut(oklabToLinearRgb({L: l, a: mid * Math.cos(hue), b: mid * Math.sin(hue)}))) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return color.alpha === undefined ? {l, c: low, h: color.h} : {l, c: low, h: color.h, alpha: color.alpha};
}

/** Parse `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` into OKLCH. */
function parseHex(hex) {
  const match = /^#([0-9a-f]{3,8})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (digits === undefined || (digits.length !== 3 && digits.length !== 4 && digits.length !== 6 && digits.length !== 8)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const expanded =
    digits.length === 3 || digits.length === 4 ? digits.split('').map((d) => d + d).join('') : digits;
  const alpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : undefined;
  const lch = labToLch(
    linearRgbToOklab({
      r: srgbToLinear(parseInt(expanded.slice(0, 2), 16) / 255),
      g: srgbToLinear(parseInt(expanded.slice(2, 4), 16) / 255),
      b: srgbToLinear(parseInt(expanded.slice(4, 6), 16) / 255),
    }),
  );
  return alpha === undefined ? lch : {...lch, alpha};
}

/** Format as a CSS `oklch()` string: l/c to 3 decimals, h to 1 decimal. */
const formatOklch = (color) =>
  `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;

// ---------------------------------------------------------------------------
// Palette pipeline — ported from src/lib/tokens/palette.ts
// ---------------------------------------------------------------------------

const MODES = ['light', 'dark'];

/** Gray seeds and the text-muted nudge — mirror of SEEDS.gray / TEXT_MUTED_ADJUST. */
const GRAY_SEEDS = {
  light: {1: '#ffffff', 2: '#f7f8fa', 3: '#eef0f4', 4: '#e0e0e0', 9: '#8a8a8a', 11: '#4a4a4a', 12: '#1a1a1a'},
  dark: {1: '#121212', 2: '#1e1e1e', 3: '#2a2a2a', 4: '#333333', 9: '#707070', 11: '#b0b0b0', 12: '#e8e8e8'},
};
/** Success/warning/danger seeds — mirror of SEEDS.green/amber/red (fixed in every theme). */
const STATUS_SEEDS = {
  green: {light: {9: '#15803d'}, dark: {8: '#22c55e'}},
  amber: {light: {9: '#f59e0b'}, dark: {8: '#fbbf24'}},
  red: {light: {9: '#dc2626'}, dark: {8: '#ef4444'}},
};
const TEXT_MUTED_ADJUST = {light: -0.008, dark: 0.014};

const CHROMATIC_ENDPOINTS = {
  light: {l1: 0.982, l12: 0.16, c1: 0.018, c12: 0.045},
  dark: {l1: 0.155, l12: 0.982, c1: 0.03, c12: 0.012},
};

/** Piecewise-linear interpolation over sorted points (clamped at both ends). */
function interpolateAt(points, x) {
  const first = points[0];
  if (x <= first.x) return first.y;
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    if (x <= point.x) {
      const previous = points[i - 1];
      const t = (x - previous.x) / (point.x - previous.x);
      return previous.y + t * (point.y - previous.y);
    }
  }
  return points[points.length - 1].y;
}

function formatSteps(luminancePoints, chromaAt, hueAt) {
  const steps = [];
  for (let step = 1; step <= 12; step++) {
    steps.push(formatOklch(clampChroma({l: interpolateAt(luminancePoints, step), c: chromaAt(step), h: hueAt(step)})));
  }
  return steps;
}

function grayAnchors(seed, mode) {
  return Object.entries(seed)
    .map(([step, hex]) => {
      const parsed = parseHex(hex);
      const l = Number(step) === 9 ? parsed.l + TEXT_MUTED_ADJUST[mode] : parsed.l;
      return {step: Number(step), color: {l, c: 0, h: 0}};
    })
    .sort((a, b) => a.step - b.step);
}

/** The fixed neutral scales — identical to the default themes' gray family. */
const GRAY_SCALE = Object.fromEntries(
  MODES.map((mode) => [
    mode,
    formatSteps(grayAnchors(GRAY_SEEDS[mode], mode).map((a) => ({x: a.step, y: a.color.l})), () => 0, () => 0),
  ]),
);

/** The fixed success/warning/danger scales — identical to the default themes'. */
const STATUS_SCALE = Object.fromEntries(
  ['green', 'amber', 'red'].map((family) => [
    family,
    Object.fromEntries(
      MODES.map((mode) => [
        mode,
        chromaticScaleFromAnchors(
          Object.entries(STATUS_SEEDS[family][mode]).map(([step, hex]) => ({step: Number(step), color: parseHex(hex)})),
          mode,
        ),
      ]),
    ),
  ]),
);

function chromaticScaleFromAnchors(anchors, mode) {
  const endpoints = CHROMATIC_ENDPOINTS[mode];
  const luminancePoints = [{x: 1, y: endpoints.l1}, ...anchors.map((a) => ({x: a.step, y: a.color.l})), {x: 12, y: endpoints.l12}];
  const chromaPoints = [{x: 1, y: endpoints.c1}, ...anchors.map((a) => ({x: a.step, y: a.color.c})), {x: 12, y: endpoints.c12}];
  const huePoints = [
    {x: 1, y: anchors[0].color.h},
    ...anchors.map((a) => ({x: a.step, y: a.color.h})),
    {x: 12, y: anchors[anchors.length - 1].color.h},
  ];
  return formatSteps(luminancePoints, (step) => interpolateAt(chromaPoints, step), (step) => interpolateAt(huePoints, step));
}

// Semantic rerouting — mirror of DEFAULT_STATUS_FAMILY / STATUS_STEP / NEUTRAL_STEP.
const DEFAULT_STATUS_FAMILY = {primary: 'blue', success: 'green', warning: 'amber', danger: 'red', info: 'blue'};
const STATUS_STEP = {
  light: {primary: 9, success: 9, warning: 9, danger: 9, info: 10},
  dark: {primary: 9, success: 8, warning: 8, danger: 8, info: 8},
};
const NEUTRAL_STEP = {
  bg: 1,
  'bg-subtle': 2,
  'bg-muted': 3,
  text: 12,
  'text-secondary': 11,
  'text-muted': 9,
  border: 4,
};

// Interaction-state parameters — mirror of DERIVED_PARAMS / FOCUS_RING_ALPHA.
const DERIVED_PARAMS = {
  light: {hover: -0.045, active: -0.09, borderHover: -0.09, subtleL: 0.945, subtleC: 0.2},
  dark: {hover: 0.05, active: 0.09, borderHover: 0.08, subtleL: 0.26, subtleC: 0.35},
};
const FOCUS_RING_ALPHA = 0.4;

const primitiveVar = (family, step) => `var(--haze-${family}-${step})`;
const lightnessCalc = (delta) => `calc(l ${delta < 0 ? '-' : '+'} ${Math.abs(delta)})`;

function derivedCss(mode, baseVar, kind) {
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

/**
 * The full declaration block one mode of a brand theme carries: primitive
 * scales first (gray/{name}/green/amber/red), then the semantic aliases
 * with primary/info/focus-ring rerouted to the brand family.
 */
function themeDeclarations(mode, name, brandScale) {
  const primitives = [
    ['gray', GRAY_SCALE[mode]],
    [name, brandScale],
    ['green', STATUS_SCALE.green[mode]],
    ['amber', STATUS_SCALE.amber[mode]],
    ['red', STATUS_SCALE.red[mode]],
  ]
    .map(([family, steps]) => steps.map((value, index) => `--haze-${family}-${index + 1}: ${value};`).join('\n'))
    .join('\n');
  const statusFamily = {...DEFAULT_STATUS_FAMILY, primary: name, info: name};
  const lines = [];
  const statusGroup = (key) => {
    const base = `--haze-color-${key}`;
    const family = statusFamily[key];
    lines.push(`${base}: ${primitiveVar(family, STATUS_STEP[mode][key])};`);
    const baseVar = `var(${base})`;
    lines.push(`${base}-hover: ${derivedCss(mode, baseVar, 'hover')};`);
    lines.push(`${base}-active: ${derivedCss(mode, baseVar, 'active')};`);
    lines.push(`${base}-subtle: ${derivedCss(mode, baseVar, 'subtle')};`);
  };
  const neutral = (key) => lines.push(`--haze-color-${key}: ${primitiveVar('gray', NEUTRAL_STEP[key])};`);
  statusGroup('primary');
  neutral('bg');
  neutral('bg-subtle');
  neutral('bg-muted');
  neutral('text');
  neutral('text-secondary');
  neutral('text-muted');
  lines.push(`--haze-color-text-inverse: ${mode === 'light' ? 'oklch(1 0 0)' : GRAY_SCALE.light[11]};`);
  neutral('border');
  lines.push(`--haze-color-border-hover: ${derivedCss(mode, 'var(--haze-color-border)', 'border-hover')};`);
  statusGroup('success');
  statusGroup('warning');
  statusGroup('danger');
  statusGroup('info');
  lines.push(`--haze-color-focus-ring: ${derivedCss(mode, 'var(--haze-color-primary)', 'focus-ring')};`);
  return `${primitives}\n\n${lines.join('\n')}`;
}

// ---------------------------------------------------------------------------
// createBrandTheme mirror — identical options/semantics to palette.ts
// ---------------------------------------------------------------------------

const NEUTRAL_FAMILIES = new Set(['gray', 'green', 'amber', 'red']);
const FAMILY_NAME_RE = /^[a-z][a-z0-9-]*$/;
const DERIVED_SEED_OFFSETS = {infoStep: -0.07, darkPrimary: 0.2};

const clampLightness = (l) => Math.min(1, Math.max(0, l));
const shiftLightness = (color, delta) => clampChroma({l: clampLightness(color.l + delta), c: color.c, h: color.h});

function mergeAnchors(base, seed) {
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
 * Build a complete brand theme at runtime — mirror of palette.ts's
 * createBrandTheme (byte-identical output; enforced by brand-theme.test.ts).
 *
 * @param {{name?: string, light: string, dark?: string, overrides?: {light?: Record<number, string>, dark?: Record<number, string>}}} options
 * @returns {{name: string, light: string, dark: string}} bare declaration blocks per mode
 */
export function createBrandThemeCss({name = 'brand', light, dark, overrides} = {}) {
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
  return {
    name,
    light: themeDeclarations('light', name, chromaticScaleFromAnchors(anchors.light, 'light')),
    dark: themeDeclarations('dark', name, chromaticScaleFromAnchors(anchors.dark, 'dark')),
  };
}

/** Wrap the two declaration blocks into a standalone stylesheet. */
export function renderStylesheet(theme, {lightSeed, darkSeed}) {
  const header = [
    `/* haze-ui brand theme "${theme.name}" — generated by haze-ui-theme.`,
    `   light seed: ${lightSeed} · dark seed: ${darkSeed}`,
    '   Apply ONE class per subtree as a replacement for lightTheme/darkTheme. */',
  ].join('\n');
  const block = (mode) => `.haze-${theme.name}-${mode} {\n${theme[mode]}\n}`;
  return `${header}\n\n${block('light')}\n\n${block('dark')}\n`;
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const USAGE = `Usage: haze-ui-theme --primary <hex> [--dark <hex>] [--name <kebab>] [--out <file>]

  --primary <hex>   Light-mode primary seed, e.g. '#0066ff' (required).
  --dark <hex>      Dark-mode primary seed. Omit to derive it from --primary
                    (OKLCH lightness +0.2, chroma/hue preserved).
  --name <kebab>    Brand family name for the custom properties (default:
                    'brand'). Becomes --haze-<name>-1…12; may not be
                    gray/green/amber/red.
  --out <file>      Write the stylesheet to <file> instead of stdout.

Outputs .haze-<name>-light / .haze-<name>-dark classes carrying the complete
token set (primitive scales + semantic aliases + relative-color interaction
states) — use them as replacements for lightTheme/darkTheme.`;

function parseArgs(argv) {
  const options = {primary: undefined, dark: undefined, name: 'brand', out: undefined};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const flag = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    const inline = arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : undefined;
    const value = inline ?? argv[++i];
    if (flag === '--help' || flag === '-h') {
      options.help = true;
    } else if (flag === '--primary') {
      options.primary = value;
    } else if (flag === '--dark') {
      options.dark = value;
    } else if (flag === '--name') {
      options.name = value;
    } else if (flag === '--out') {
      options.out = value;
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${USAGE}`);
    }
    if (value === undefined && !options.help) {
      throw new Error(`Missing value for ${flag}\n\n${USAGE}`);
    }
  }
  return options;
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (options.primary === undefined) {
    process.stderr.write(`haze-ui-theme: --primary is required\n\n${USAGE}\n`);
    return 1;
  }
  let theme;
  try {
    theme = createBrandThemeCss({name: options.name, light: options.primary, dark: options.dark});
  } catch (error) {
    process.stderr.write(`haze-ui-theme: ${error instanceof Error ? error.message : error}\n`);
    return 1;
  }
  const css = renderStylesheet(theme, {lightSeed: options.primary, darkSeed: options.dark ?? 'derived (oklch l +0.2)'});
  if (options.out === undefined) {
    process.stdout.write(css);
    return 0;
  }
  writeFileSync(options.out, css);
  process.stdout.write(`haze-ui-theme: wrote ${options.out} (.haze-${options.name}-light / .haze-${options.name}-dark)\n`);
  return 0;
}

// Run as a script; importable as a module when executed by the parity test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
