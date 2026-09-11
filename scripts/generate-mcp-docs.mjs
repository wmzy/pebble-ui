#!/usr/bin/env node
/**
 * Build dist/mcp-docs.json — the single docs snapshot served by the
 * haze-ui MCP server (mcp/index.mjs). Sources:
 *
 *   - src/generated/props.json       required — TS-extracted props tables
 *                                     (missing = fatal: run generate-props.mjs)
 *   - src/generated/props-docs.json  optional — handwritten description/default
 *                                     overrides, merged with PropsTable parity
 *   - dist/registry.json             optional — peer deps + one-line descriptions
 *                                     (join key: css family ↔ registry item name)
 *   - dist/tokens/registry.js        optional — TOKEN_REGISTRY (dynamic import)
 *
 * CLI: node scripts/generate-mcp-docs.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relPath, { required }) {
  const file = path.join(rootDir, relPath);
  if (!existsSync(file)) {
    if (!required) return null;
    console.error(
      `${relPath} not found — run \`node scripts/generate-props.mjs\` first (fatal).`
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Load the shadcn registry; degrade to no metadata when dist/ is absent. */
function loadRegistry() {
  const registry = readJson('dist/registry.json', { required: false });
  if (!registry) {
    console.error(
      'generate-mcp-docs: dist/registry.json missing — components ship without peerDeps/description (run a lib build to include them).'
    );
    return new Map();
  }
  return new Map(registry.items.map((item) => [item.name, item]));
}

/** Load TOKEN_REGISTRY from the built token registry module. */
async function loadTokens() {
  const file = path.join(rootDir, 'dist', 'tokens', 'registry.js');
  if (!existsSync(file)) {
    console.error(
      'generate-mcp-docs: dist/tokens/registry.js missing — tokens list will be empty (run a lib build to include it).'
    );
    return [];
  }
  const mod = await import(pathToFileURL(file).href);
  return mod.TOKEN_REGISTRY ?? [];
}

/**
 * Merge one type's generated rows with its handwritten doc rows.
 * PropsTable parity (scripts/generate-llms-full.mjs): generated type wins;
 * docs only add description/default; unconsumed doc rows (ghost rows) are
 * appended in handwritten order.
 */
function mergeRows(generatedRows, docRows = []) {
  const docsByName = new Map(docRows.map((row) => [row.name, row]));
  const rows = generatedRows.map((row) => {
    const doc = docsByName.get(row.name);
    docsByName.delete(row.name);
    return {
      name: row.name,
      type: row.type,
      required: row.required ?? false,
      default: doc?.default,
      description: doc?.description ?? '',
    };
  });
  for (const doc of docRows) {
    if (!docsByName.has(doc.name)) continue;
    rows.push({
      name: doc.name,
      type: doc.type ?? '—',
      required: false,
      default: doc.default,
      description: doc.description ?? '',
    });
  }
  return rows;
}

/**
 * Build the component map: props tables + registry metadata, keyed by the
 * PascalCase export name (the props.json key). Registry items without a
 * props entry ('base', 'form', 'tokens', …) are not components and are
 * skipped.
 */
function buildComponents(propsComponents, docsByType, registryByFamily) {
  const components = {};
  for (const [name, entry] of Object.entries(propsComponents)) {
    const cssFamily = entry.cssFamily;
    const item = registryByFamily.get(cssFamily);
    const props = {};
    for (const [typeName, generatedRows] of [
      ...Object.entries(entry.propsTypes ?? {}),
      ...Object.entries(entry.otherTypes ?? {}),
    ]) {
      props[typeName] = mergeRows(generatedRows, docsByType[typeName]);
    }
    components[name] = {
      cssFamily,
      importStatement:
        `import { ${(entry.imports ?? [name]).join(', ')} } from 'haze-ui';\n` +
        `import 'haze-ui/css/tokens.css';\n` +
        `import 'haze-ui/css/${cssFamily}.css';`,
      peerDeps: (item?.dependencies ?? []).filter((dep) => dep !== 'haze-ui'),
      description: item?.description ?? '',
      props,
    };
  }
  return components;
}

async function main() {
  const props = readJson('src/generated/props.json', { required: true });
  const docsByType =
    readJson('src/generated/props-docs.json', { required: false }) ?? {};
  const registryByFamily = loadRegistry();
  const tokens = await loadTokens();

  const components = buildComponents(props.components ?? {}, docsByType, registryByFamily);
  const snapshot = {
    generatedAt: new Date().toISOString(),
    components,
    tokens,
  };

  const out = path.join(rootDir, 'dist', 'mcp-docs.json');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `generate-mcp-docs: wrote ${path.relative(rootDir, out)} — ` +
      `${Object.keys(components).length} components, ${tokens.length} tokens`
  );
}

main().catch((error) => {
  console.error(`generate-mcp-docs: ${error?.stack ?? error}`);
  process.exit(1);
});
