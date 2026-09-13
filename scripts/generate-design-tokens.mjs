#!/usr/bin/env node
/**
 * Export TOKEN_REGISTRY as W3C Design Tokens Format (DTF) JSON files:
 * dist/design-tokens/light.json and dist/design-tokens/dark.json, plus one
 * archive per brand preset — dist/design-tokens/{violet,teal,cyan,orange,
 * rose}-{light,dark}.json (color group resolved through that brand's theme,
 * every other category identical to the default archives).
 *
 * Shape: { $schema, haze: { <category>: { <leaf>: { $type, $value, $description } } } }
 * so standard tooling (Tokens Studio, Style Dictionary, Figma variables
 * sync) can consume the tokens without knowing anything about haze-ui's
 * CSS custom property naming.
 *
 * Runs against the built registry/palette (dist/tokens/*.js), not the
 * source: it is part of the build chain and must reflect what actually
 * ships. Missing dist is an error, not a skip.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const distDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist'
);
const registryPath = path.join(distDir, 'tokens', 'registry.js');
const palettePath = path.join(distDir, 'tokens', 'palette.js');
const oklchPath = path.join(distDir, 'tokens', 'oklch.js');

function fail(message) {
  console.error(`generate-design-tokens: ${message}`);
  process.exit(1);
}

for (const modulePath of [registryPath, palettePath, oklchPath]) {
  if (!existsSync(modulePath)) {
    fail(
      `${path.relative(process.cwd(), modulePath)} not found — run the lib build first (this script is part of the build chain and reads the built registry/palette)`
    );
  }
}

const { TOKEN_REGISTRY } = await import(pathToFileURL(registryPath).href);
const { BRAND_FAMILIES, buildBrandTheme } = await import(pathToFileURL(palettePath).href);
const { formatOklch } = await import(pathToFileURL(oklchPath).href);

// TokenDef.type (registry's storage typing) -> DTF $type.
const TYPE_MAP = {
  color: 'color',
  size: 'dimension',
  font: 'fontFamily',
  number: 'number',
  shadow: 'shadow',
};

/**
 * Leaf key inside the category group: `--haze-` stripped, then the
 * category prefix itself when the name carries it — color/radius/shadow
 * tokens repeat their category (--haze-color-primary -> primary),
 * typography/spacing use domain prefixes that must survive
 * (--haze-font-sans -> font-sans, --haze-space-2 -> space-2).
 */
function leafKey(token) {
  const stripped = token.name.replace(/^--haze-/, '');
  const categoryPrefix = `${token.category}-`;
  return stripped.startsWith(categoryPrefix)
    ? stripped.slice(categoryPrefix.length)
    : stripped;
}

/**
 * One mode's token tree. `resolveColor` supplies the color category's
 * $value: the registry value for the default themes, or the same token
 * resolved through a brand theme for the brand archives.
 */
function buildTree(mode, resolveColor) {
  const tree = {
    $schema: 'https://tr.designtokens.org/format/',
    haze: {},
  };
  for (const token of TOKEN_REGISTRY) {
    const $type = TYPE_MAP[token.type];
    if ($type === undefined) {
      fail(`token ${token.name} has unmapped type "${token.type}"`);
    }
    const group = tree.haze[token.category] ?? (tree.haze[token.category] = {});
    const key = leafKey(token);
    if (Object.hasOwn(group, key)) {
      fail(`leaf key collision in group "${token.category}": "${key}" (from ${token.name})`);
    }
    group[key] = {
      $type,
      $value: token.category === 'color' ? resolveColor(token) : token[mode],
      $description: token.label,
    };
  }
  return tree;
}

const outDir = path.join(distDir, 'design-tokens');
mkdirSync(outDir, { recursive: true });
for (const mode of ['light', 'dark']) {
  const file = path.join(outDir, `${mode}.json`);
  writeFileSync(file, `${JSON.stringify(buildTree(mode, (token) => token[mode]), null, 2)}\n`);
}

// Brand archives: primary/info/focus-ring rerouted to the brand family,
// neutrals and success/warning/danger identical to the defaults.
const brandThemes = new Map(BRAND_FAMILIES.map((family) => [family, buildBrandTheme(family)]));
for (const family of BRAND_FAMILIES) {
  const semantic = new Map(brandThemes.get(family).semanticTokens.map((token) => [token.name, token]));
  for (const mode of ['light', 'dark']) {
    const file = path.join(outDir, `${family}-${mode}.json`);
    writeFileSync(file, `${JSON.stringify(buildTree(mode, (token) => formatOklch(semantic.get(token.name).resolved[mode])), null, 2)}\n`);
  }
}
console.log(
  `generate-design-tokens: ${TOKEN_REGISTRY.length} tokens -> ${path.relative(process.cwd(), outDir)}/{light,dark}.json + ${BRAND_FAMILIES.length} brand archives ({${BRAND_FAMILIES.join(',')}}-{light,dark}.json)`
);
