/**
 * Pure color math for the ColorPicker family: tolerant parsing of CSS
 * color strings (hex / rgb / hsl), serialization per format, and the
 * HSV <-> RGB <-> HSL conversions the saturation/value panel runs on.
 *
 * Deliberately independent of `../../tokens/oklch`: that module routes
 * through OKLab floats (its `parseHex` returns OKLCH), which would make
 * a hex -> hsv -> hex round trip quantization-lossy. Here hex channels
 * stay exact 8-bit integers and every conversion is the classic
 * rational form, so a value round-trips byte-identically.
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/** 8-bit sRGB channels (`r`/`g`/`b` are integers 0..255) plus a normalized alpha (0..1, optional). */
export type Rgb = {r: number; g: number; b: number; a?: number};

/** Hue in degrees (0..360), saturation and value as 0..1 fractions. */
export type Hsv = {h: number; s: number; v: number; a?: number};

/** Hue in degrees (0..360), saturation and lightness as 0..1 fractions. */
export type Hsl = {h: number; s: number; l: number; a?: number};

export type ParsedColor = {format: ColorFormat; rgb: Rgb};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * A color channel: bare number on `scale`, or a percentage of it
 * (`rgb(100%, 0%, 0%)`, `hsl(0, 100%, 50%)`, `alpha / 50%`).
 * Out-of-range values clamp (tolerant, like a color picker's own input).
 */
function parseChannel(raw: string, scale: number): number {
  const percent = raw.endsWith('%');
  const n = Number(percent ? raw.slice(0, -1) : raw);
  if (!Number.isFinite(n)) return Number.NaN;
  return clamp(percent ? (n / 100) * scale : n, 0, scale);
}

/** An alpha channel: 0..1, or a percentage of 1. */
function parseAlpha(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const a = parseChannel(raw, 1);
  return Number.isFinite(a) ? a : 1;
}

const NUMBER = String.raw`\d*\.?\d+`;
const RGB_RE = new RegExp(
  `^rgba?\\(\\s*(${NUMBER}%?)\\s*[,\\s]\\s*(${NUMBER}%?)\\s*[,\\s]\\s*(${NUMBER}%?)\\s*(?:[,/]\\s*(${NUMBER}%?)\\s*)?\\)$`,
  'i'
);
const HSL_RE = new RegExp(
  `^hsla?\\(\\s*(-?${NUMBER})(?:deg)?\\s*[,\\s]\\s*(${NUMBER})%\\s*[,\\s]\\s*(${NUMBER})%\\s*(?:[,/]\\s*(${NUMBER}%?)\\s*)?\\)$`,
  'i'
);

/**
 * Parse a CSS color string — `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`,
 * `rgb()/rgba()` and `hsl()/hsla()` with comma or modern slash syntax,
 * percentage channels and percentage alphas. Returns the source format
 * plus normalized RGBA, or `null` when nothing matches (invalid input
 * stays a no-op for the component).
 */
export function parseColor(input: string): ParsedColor | null {
  const raw = input.trim();

  const hex = HEX_RE.exec(raw);
  if (hex) {
    const digits = hex[1] ?? '';
    // Double each digit of a 3/4-digit shorthand (CSS-style tolerance).
    const expanded =
      digits.length === 3 || digits.length === 4
        ? digits
            .split('')
            .map((d) => d + d)
            .join('')
        : digits;
    const value = Number.parseInt(expanded, 16);
    const rgb: Rgb =
      expanded.length === 8
        ? {
            r: (value >>> 24) & 0xff,
            g: (value >>> 16) & 0xff,
            b: (value >>> 8) & 0xff,
            a: clamp01((value & 0xff) / 255),
          }
        : {r: (value >>> 16) & 0xff, g: (value >>> 8) & 0xff, b: value & 0xff};
    return {format: 'hex', rgb};
  }

  const rgbMatch = RGB_RE.exec(raw);
  if (rgbMatch) {
    const r = parseChannel(rgbMatch[1] ?? '0', 255);
    const g = parseChannel(rgbMatch[2] ?? '0', 255);
    const b = parseChannel(rgbMatch[3] ?? '0', 255);
    if (![r, g, b].every(Number.isFinite)) return null;
    return {
      format: 'rgb',
      rgb: {r: Math.round(r), g: Math.round(g), b: Math.round(b), a: parseAlpha(rgbMatch[4])},
    };
  }

  const hslMatch = HSL_RE.exec(raw);
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    // The regex consumes the trailing '%' of s/l, so they parse on the
    // 0..100 scale and divide down to fractions.
    const s = parseChannel(hslMatch[2] ?? '0', 100) / 100;
    const l = parseChannel(hslMatch[3] ?? '0', 100) / 100;
    if (![h, s, l].every(Number.isFinite)) return null;
    const rgb = hslToRgb({h: ((h % 360) + 360) % 360, s, l});
    return {format: 'hsl', rgb: {...rgb, a: parseAlpha(hslMatch[4])}};
  }

  return null;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function hex2(channel: number): string {
  return clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
}

/** Alpha as a decimal with trailing zeros trimmed (`0.5`, `0.35`, `1`). */
function alphaDecimal(a: number): string {
  const s = clamp01(a).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return s === '' ? '0' : s;
}

/**
 * Serialize RGBA in a format. The alpha channel is appended only when
 * `withAlpha` is set and it is below 1 — full opacity serializes as the
 * opaque form (`#rrggbb` / `rgb()` / `hsl()`), matching CSS equivalence.
 */
export function formatColor(rgb: Rgb, format: ColorFormat, withAlpha: boolean): string {
  const a = rgb.a ?? 1;
  const withAlphaChannel = withAlpha && a < 1;
  if (format === 'hex') {
    const base = `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`;
    return withAlphaChannel ? `${base}${hex2(a * 255)}` : base;
  }
  if (format === 'rgb') {
    return withAlphaChannel
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaDecimal(a)})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }
  const hsl = rgbToHsl(rgb);
  const h = Math.round(hsl.h);
  const s = Math.round(hsl.s * 100);
  const l = Math.round(hsl.l * 100);
  return withAlphaChannel
    ? `hsla(${h}, ${s}%, ${l}%, ${alphaDecimal(a)})`
    : `hsl(${h}, ${s}%, ${l}%)`;
}

/** A paintable CSS color: always `rgba()` so transparency survives. */
export function cssColor(rgb: Rgb): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaDecimal(rgb.a ?? 1)})`;
}

/**
 * Canonical equality key: lowercase 8-digit hex. Two values in any mix
 * of formats compare equal iff their RGBA rounds equal — the preset
 * active state and the recent-colors dedupe both ride on this.
 */
export function rgbHexKey(rgb: Rgb): string {
  return `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}${hex2((rgb.a ?? 1) * 255)}`;
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

export function rgbToHsv({r, g, b}: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = (((gn - bn) / d) % 6 + 6) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return {h, s: max === 0 ? 0 : d / max, v: max};
}

export function hsvToRgb({h, s, v}: Hsv): Rgb {
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (hh < 1) {
    rgb = [c, x, 0];
  } else if (hh < 2) {
    rgb = [x, c, 0];
  } else if (hh < 3) {
    rgb = [0, c, x];
  } else if (hh < 4) {
    rgb = [0, x, c];
  } else if (hh < 5) {
    rgb = [x, 0, c];
  } else {
    rgb = [c, 0, x];
  }
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

export function rgbToHsl({r, g, b}: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) {
      h = (((gn - bn) / d) % 6 + 6) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return {h, s, l};
}

export function hslToRgb({h, s, l}: Hsl): Rgb {
  const hh = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return {r: gray, g: gray, b: gray};
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t0: number): number => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(channel(hh + 1 / 3) * 255),
    g: Math.round(channel(hh) * 255),
    b: Math.round(channel(hh - 1 / 3) * 255),
  };
}
