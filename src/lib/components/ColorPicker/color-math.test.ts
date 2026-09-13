import {
  cssColor,
  formatColor,
  hsvToRgb,
  hslToRgb,
  parseColor,
  rgbHexKey,
  rgbToHsl,
  rgbToHsv,
} from './color-math';

describe('color-math parsing', () => {
  it('parses 6-digit hex with and without #', () => {
    expect(parseColor('#ff0000')).toEqual({format: 'hex', rgb: {r: 255, g: 0, b: 0}});
    expect(parseColor('00ff00')).toEqual({format: 'hex', rgb: {r: 0, g: 255, b: 0}});
  });

  it('parses 3-digit shorthand by doubling digits', () => {
    expect(parseColor('#abc')).toEqual({format: 'hex', rgb: {r: 170, g: 187, b: 204}});
  });

  it('parses 8-digit and 4-digit hex alpha', () => {
    expect(parseColor('#ff000080')).toEqual({
      format: 'hex',
      rgb: {r: 255, g: 0, b: 0, a: 128 / 255},
    });
    expect(parseColor('#ff0000f')).toBeNull();
    expect(parseColor('#f00f')).toEqual({
      format: 'hex',
      rgb: {r: 255, g: 0, b: 0, a: 1},
    });
  });

  it('is case-insensitive', () => {
    expect(parseColor('#FF00AA')).toEqual({format: 'hex', rgb: {r: 255, g: 0, b: 170}});
  });

  it('parses rgb with commas, spaces and slash alpha', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({format: 'rgb', rgb: {r: 255, g: 0, b: 0}});
    expect(parseColor('rgb(0 255 0)')).toEqual({format: 'rgb', rgb: {r: 0, g: 255, b: 0}});
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({
      format: 'rgb',
      rgb: {r: 10, g: 20, b: 30, a: 0.5},
    });
    expect(parseColor('rgb(10 20 30 / 50%)')).toEqual({
      format: 'rgb',
      rgb: {r: 10, g: 20, b: 30, a: 0.5},
    });
  });

  it('parses percentage rgb channels and clamps out-of-range values', () => {
    expect(parseColor('rgb(100%, 0%, 0%)')).toEqual({format: 'rgb', rgb: {r: 255, g: 0, b: 0}});
    expect(parseColor('rgb(300, 20, 0)')).toEqual({format: 'rgb', rgb: {r: 255, g: 20, b: 0}});
  });

  it('parses hsl with deg and percentage alpha', () => {
    expect(parseColor('hsl(120, 100%, 50%)')).toEqual({format: 'hsl', rgb: {r: 0, g: 255, b: 0}});
    expect(parseColor('hsla(0deg, 100%, 50%, 25%)')).toEqual({
      format: 'hsl',
      rgb: {r: 255, g: 0, b: 0, a: 0.25},
    });
    expect(parseColor('hsl(120 100% 50%)')).toEqual({format: 'hsl', rgb: {r: 0, g: 255, b: 0}});
  });

  it('wraps negative hue', () => {
    // -60deg ≡ 300deg → magenta.
    expect(parseColor('hsl(-60, 100%, 50%)')?.rgb).toEqual({r: 255, g: 0, b: 255});
  });

  it('returns null for invalid input', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('notacolor')).toBeNull();
    expect(parseColor('#ff0000gg')).toBeNull();
    expect(parseColor('rgb(255, 0')).toBeNull();
    expect(parseColor('rgb(255, 0, 0, 0.5, 9)')).toBeNull();
    expect(parseColor('hsl(50, 30)')).toBeNull();
  });
});

describe('color-math formatting', () => {
  it('serializes per format without alpha when opaque', () => {
    const rgb = {r: 255, g: 0, b: 0};
    expect(formatColor(rgb, 'hex', true)).toBe('#ff0000');
    expect(formatColor(rgb, 'rgb', true)).toBe('rgb(255, 0, 0)');
    expect(formatColor(rgb, 'hsl', true)).toBe('hsl(0, 100%, 50%)');
  });

  it('appends the alpha channel only when enabled and below 1', () => {
    const rgb = {r: 255, g: 0, b: 0, a: 0.502};
    expect(formatColor(rgb, 'hex', true)).toBe('#ff000080');
    expect(formatColor(rgb, 'rgb', true)).toBe('rgba(255, 0, 0, 0.502)');
    expect(formatColor(rgb, 'hsl', true)).toBe('hsla(0, 100%, 50%, 0.502)');
    // allowAlpha off: the channel is dropped entirely.
    expect(formatColor(rgb, 'hex', false)).toBe('#ff0000');
    // full opacity serializes as the opaque form even when enabled.
    expect(formatColor({...rgb, a: 1}, 'rgb', true)).toBe('rgb(255, 0, 0)');
  });

  it('serializes hsl from rgb input', () => {
    expect(formatColor({r: 64, g: 128, b: 255}, 'hsl', false)).toBe('hsl(220, 100%, 63%)');
  });

  it('paints cssColor with alpha always applied', () => {
    expect(cssColor({r: 255, g: 0, b: 0})).toBe('rgba(255, 0, 0, 1)');
    expect(cssColor({r: 10, g: 20, b: 30, a: 0.5})).toBe('rgba(10, 20, 30, 0.5)');
  });
});

describe('color-math conversions', () => {
  it('converts hsv primaries to rgb', () => {
    expect(hsvToRgb({h: 0, s: 1, v: 1})).toEqual({r: 255, g: 0, b: 0});
    expect(hsvToRgb({h: 120, s: 1, v: 1})).toEqual({r: 0, g: 255, b: 0});
    expect(hsvToRgb({h: 240, s: 1, v: 1})).toEqual({r: 0, g: 0, b: 255});
    expect(hsvToRgb({h: 0, s: 0, v: 1})).toEqual({r: 255, g: 255, b: 255});
    expect(hsvToRgb({h: 0, s: 0, v: 0})).toEqual({r: 0, g: 0, b: 0});
  });

  it('derives hsv from rgb', () => {
    expect(rgbToHsv({r: 255, g: 0, b: 0})).toEqual({h: 0, s: 1, v: 1});
    expect(rgbToHsv({r: 0, g: 255, b: 0})).toEqual({h: 120, s: 1, v: 1});
    expect(rgbToHsv({r: 0, g: 0, b: 255})).toEqual({h: 240, s: 1, v: 1});
    expect(rgbToHsv({r: 0, g: 0, b: 0})).toEqual({h: 0, s: 0, v: 0});
  });

  it('round-trips rgb through hsv byte-identically', () => {
    for (let channel = 0; channel <= 255; channel += 5) {
      const rgb = {r: channel, g: 255 - channel, b: (channel * 7) % 256};
      const back = hsvToRgb(rgbToHsv(rgb));
      expect(back).toEqual(rgb);
    }
  });

  it('derives hsl from rgb and back', () => {
    expect(rgbToHsl({r: 255, g: 0, b: 0})).toEqual({h: 0, s: 1, l: 0.5});
    expect(hslToRgb({h: 0, s: 0, l: 0.5})).toEqual({r: 128, g: 128, b: 128});
    // rgb()/hex round trips are byte-exact.
    const source = {r: 64, g: 128, b: 255};
    expect(parseColor(formatColor(source, 'rgb', false))?.rgb).toEqual(source);
    expect(parseColor(formatColor(source, 'hex', false))?.rgb).toEqual(source);
    // hsl quantizes saturation/lightness to whole percents: back within
    // two channel steps (0.5% lightness ≈ 1.3 channels + rounding).
    const fromHsl = parseColor(formatColor(source, 'hsl', false))?.rgb ?? {r: 0, g: 0, b: 0};
    expect(Math.abs(fromHsl.r - source.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(fromHsl.g - source.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(fromHsl.b - source.b)).toBeLessThanOrEqual(2);
  });

  it('keys colors canonically across formats', () => {
    expect(rgbHexKey(parseColor('#FF0000')!.rgb)).toBe(rgbHexKey(parseColor('rgb(255, 0, 0)')!.rgb));
    expect(rgbHexKey(parseColor('hsl(0, 100%, 50%)')!.rgb)).toBe(
      rgbHexKey(parseColor('#ff0000')!.rgb)
    );
    // alpha participates: same rgb at different opacity is a different key.
    expect(rgbHexKey({r: 255, g: 0, b: 0, a: 0.5})).not.toBe(rgbHexKey({r: 255, g: 0, b: 0}));
  });
});
