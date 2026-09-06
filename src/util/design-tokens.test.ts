import type {TokenDef} from '@/lib';
import type {DesignTokenNode, DesignTokensFile} from './design-tokens';

import {TOKEN_REGISTRY} from '@/lib';

import {toDesignTokens} from './design-tokens';

/** Look up one exported token; fails the test with a clear message when absent. */
function token(file: DesignTokensFile, group: string, key: string): DesignTokenNode {
  const node = file[group]?.[key];
  if (!node) throw new Error(`missing token ${group}.${key} in exported file`);
  return node;
}

function registryDef(name: string): TokenDef {
  const def = TOKEN_REGISTRY.find((t) => t.name === name);
  if (!def) throw new Error(`missing ${name} in TOKEN_REGISTRY`);
  return def;
}

describe('toDesignTokens', () => {
  it('groups tokens by mapped category', () => {
    const file = toDesignTokens(TOKEN_REGISTRY);

    expect(Object.keys(file).sort()).toEqual(['color', 'dimension', 'font', 'shadow', 'spacing']);

    const groupForCategory = {
      color: 'color',
      typography: 'font',
      spacing: 'spacing',
      radius: 'dimension',
      shadow: 'shadow',
    } as const;

    for (const [cat, group] of Object.entries(groupForCategory)) {
      const expected = TOKEN_REGISTRY.filter((t) => t.category === cat).length;
      expect(Object.keys(file[group] ?? {}).length).toBe(expected);
    }
  });

  it('exports every registry token with $value, $type and the css-var extension', () => {
    const file = toDesignTokens(TOKEN_REGISTRY);
    const seen = new Set<string>();

    for (const group of Object.values(file)) {
      for (const [key, node] of Object.entries(group)) {
        expect(typeof node.$value).toBe('string');
        expect(node.$value.length).toBeGreaterThan(0);
        expect(typeof node.$type).toBe('string');
        const varName = node.$extensions['haze-ui.css-var'];
        expect(varName).toMatch(/^--haze-/);
        expect(key).toBe(varName.replace(/^--haze-/, ''));
        expect(seen).not.toContain(varName);
        seen.add(varName);
      }
    }

    expect(seen.size).toBe(TOKEN_REGISTRY.length);
  });

  it('maps $type per token kind', () => {
    const file = toDesignTokens(TOKEN_REGISTRY);

    expect(token(file, 'color', 'color-primary').$type).toBe('color');
    expect(token(file, 'spacing', 'space-2').$type).toBe('dimension');
    expect(token(file, 'dimension', 'radius-md').$type).toBe('dimension');
    expect(token(file, 'font', 'text-sm').$type).toBe('dimension');
    expect(token(file, 'font', 'font-sans').$type).toBe('fontFamily');
    expect(token(file, 'font', 'leading-normal').$type).toBe('number');
    expect(token(file, 'font', 'weight-bold').$type).toBe('number');
    expect(token(file, 'shadow', 'shadow-md').$type).toBe('shadow');
  });

  it('exports known token values with their css-var names', () => {
    const file = toDesignTokens(TOKEN_REGISTRY);

    const primary = token(file, 'color', 'color-primary');
    expect(primary.$value).toBe(registryDef('--haze-color-primary').light);
    expect(primary.$value).toMatch(/^oklch\(/);
    expect(primary.$extensions).toEqual({'haze-ui.css-var': '--haze-color-primary'});

    const space2 = token(file, 'spacing', 'space-2');
    expect(space2.$value).toBe('8px');
    expect(space2.$extensions).toEqual({'haze-ui.css-var': '--haze-space-2'});

    const radiusMd = token(file, 'dimension', 'radius-md');
    expect(radiusMd.$value).toBe('6px');
    expect(radiusMd.$extensions).toEqual({'haze-ui.css-var': '--haze-radius-md'});

    const textSm = token(file, 'font', 'text-sm');
    expect(textSm.$value).toBe('14px');
    expect(textSm.$extensions).toEqual({'haze-ui.css-var': '--haze-text-sm'});

    const fontSans = token(file, 'font', 'font-sans');
    expect(fontSans.$value).toMatch(/^-apple-system/);
    expect(fontSans.$extensions).toEqual({'haze-ui.css-var': '--haze-font-sans'});

    const weightBold = token(file, 'font', 'weight-bold');
    expect(weightBold.$value).toBe('700');
    expect(weightBold.$extensions).toEqual({'haze-ui.css-var': '--haze-weight-bold'});

    const shadowMd = token(file, 'shadow', 'shadow-md');
    expect(shadowMd.$value).toBe('0 4px 6px rgba(0, 0, 0, 0.07)');
    expect(shadowMd.$extensions).toEqual({'haze-ui.css-var': '--haze-shadow-md'});
  });

  it('defaults to the light theme', () => {
    expect(toDesignTokens(TOKEN_REGISTRY)).toEqual(toDesignTokens(TOKEN_REGISTRY, {theme: 'light'}));
  });

  it('exports distinct values per theme for dual-valued tokens', () => {
    const primaryDef = registryDef('--haze-color-primary');
    expect(primaryDef.light).not.toBe(primaryDef.dark);

    const light = toDesignTokens(TOKEN_REGISTRY, {theme: 'light'});
    const dark = toDesignTokens(TOKEN_REGISTRY, {theme: 'dark'});

    expect(token(light, 'color', 'color-primary').$value).toBe(primaryDef.light);
    expect(token(dark, 'color', 'color-primary').$value).toBe(primaryDef.dark);
    expect(token(light, 'color', 'color-primary').$value)
      .not.toBe(token(dark, 'color', 'color-primary').$value);

    // Mode-independent tokens keep identical values in both exports.
    expect(token(dark, 'spacing', 'space-2').$value).toBe('8px');
  });

  it('accepts a registry subset', () => {
    const subset = TOKEN_REGISTRY.filter(
      (t) => t.name === '--haze-color-primary' || t.name === '--haze-space-2',
    );
    const file = toDesignTokens(subset);

    expect(Object.keys(file).sort()).toEqual(['color', 'spacing']);
    expect(Object.keys(file.color ?? {})).toEqual(['color-primary']);
    expect(Object.keys(file.spacing ?? {})).toEqual(['space-2']);
  });

  it('returns plain JSON-serializable data (no live object references)', () => {
    const file = toDesignTokens(TOKEN_REGISTRY);
    expect(JSON.parse(JSON.stringify(file))).toEqual(file);
  });
});
