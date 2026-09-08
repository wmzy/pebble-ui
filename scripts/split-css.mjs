#!/usr/bin/env node
/**
 * Group the per-module CSS emitted by the lib build (`*.wyw-in-js.css`,
 * one file per module thanks to preserveModules + cssCodeSplit) into
 * consumer-facing subpaths:
 *
 *   dist/css/tokens.css        theme + design tokens (import once)
 *   dist/css/<component>.css   one file per component dir (kebab-case)
 *   dist/css/form.css          react-f0rm integration (FormItem)
 *   dist/haze-ui.css           full aggregate, served as 'haze-ui/styles.css'
 *   dist/css-manifest.json     export -> css-file mapping for tooling
 *
 * Components never import each other, so a component dir's CSS is
 * self-contained; tokens are the only shared layer and live in tokens.css.
 * Per-component files therefore require tokens.css (once), not each other.
 * Shared internal layers under src/lib/utils (the floating primitives) are
 * the one exception: their CSS is inlined into every consuming component's
 * file so those files stay self-contained too.
 *
 * Invariants enforced at the end (non-zero exit on failure):
 *   - every `.wyw-in-js.css` file is covered by at least one group
 *     (shared layers intentionally ride along with several)
 *   - the aggregate's class-name set equals the union of module CSS
 *   - no dangling `.wyw-in-js.css` import/require survives in dist JS —
 *     the styles are carried by `haze-ui/styles.css` / `haze-ui/css/*`,
 *     so the per-module side-effect imports are stripped together with
 *     the files (1.11.0 shipped them dangling: Node ESM, vitest inline
 *     and vite build all fail to resolve the removed files)
 *   - css-manifest.json partitions the barrel's value exports into
 *     families/noCss, and every css group is reachable via an export
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const cssDir = path.join(distDir, 'css');

const kebab = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase();

/** Recursively collect `*.wyw-in-js.css` files as paths relative to dist/. */
function collectModuleCss(dir = distDir, prefix = '') {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectModuleCss(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.wyw-in-js.css')) {
      files.push(rel);
    }
  }
  return files;
}

const moduleCssFiles = collectModuleCss().sort();
if (moduleCssFiles.length === 0) {
  console.error('split-css: no *.wyw-in-js.css found under dist/ — did the lib build run?');
  process.exit(1);
}

// Shared internal layers under src/lib/utils: their CSS must ride along
// with every consuming component group, or per-component files such as
// css/popover.css would carry only the visual skin without the floating
// positioning classes. Key = module path below dist (no extension);
// value = consuming css group names.
const sharedLayers = {
  'utils/floating': [
    'combobox',
    'context-menu',
    'datepicker',
    'dropdown-menu',
    'menu',
    'popover',
    'tooltip',
  ],
  // Sortable primitives (components in utils/sortable.tsx, hooks/styles in
  // utils/sortable-shared.ts): their classes ride along with the two
  // components that have opt-in `sortable` modes.
  'utils/sortable': ['tag-input', 'tag-group'],
  'utils/sortable-shared': ['tag-input', 'tag-group'],
};

/**
 * Map a dist-relative module css path to its consumer-facing group name.
 * Shared layers under utils/ return null — they are inlined into consumer
 * groups below instead of forming a group of their own.
 */
function groupOfModule(rel) {
  const segments = rel.split('/');
  if (segments[0] === 'tokens') return 'tokens';
  if (segments[0] === 'components') return kebab(segments[1]);
  if (segments[0] === 'form') return 'form';
  if (segments[0] === 'utils') return null;
  console.error(`split-css: unexpected module CSS location ${rel}`);
  return process.exit(1);
}

// Map output name -> list of module css paths (relative to dist/).
const groups = new Map();
for (const rel of moduleCssFiles) {
  const name = groupOfModule(rel);
  if (name === null) continue; // utils/ shared layers ride along via sharedLayers
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push(rel);
}

// Inline each shared layer's CSS into its consumer groups.
for (const [key, consumers] of Object.entries(sharedLayers)) {
  const rel = `${key}.wyw-in-js.css`;
  if (!moduleCssFiles.includes(rel)) {
    console.error(`split-css: shared layer ${key} emitted no module CSS — stale sharedLayers entry?`);
    process.exit(1);
  }
  for (const name of consumers) {
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(rel);
  }
}

const read = (rel) => readFileSync(path.join(distDir, rel), 'utf8').trim();
const banner = (name) => `/* haze-ui ${name} — generated by scripts/split-css.mjs, do not edit */`;

mkdirSync(cssDir, { recursive: true });

// tokens first, then everything else alphabetically — deterministic output.
const orderedNames = [...groups.keys()].sort((a, b) =>
  a === 'tokens' ? -1 : b === 'tokens' ? 1 : a.localeCompare(b)
);

for (const name of orderedNames) {
  const body = groups.get(name).map(read).join('\n');
  writeFileSync(path.join(cssDir, `${name}.css`), `${banner(name)}\n${body}\n`);
}

// Full aggregate for the `haze-ui/styles.css` subpath.
const aggregate = orderedNames.map((name) => groups.get(name).map(read).join('\n')).join('\n');
writeFileSync(path.join(distDir, 'haze-ui.css'), `${aggregate}\n`);

// Class-set parity check: aggregate must contain exactly the union of all
// module classes (no lost and no duplicated-with-different-content rules).
const classSet = (css) => new Set(css.match(/\.haze-[A-Za-z0-9_-]+/g) ?? []);
const union = new Set();
for (const rel of moduleCssFiles) {
  for (const cls of classSet(read(rel))) union.add(cls);
}
const aggregateClasses = classSet(aggregate);
const missing = [...union].filter((c) => !aggregateClasses.has(c));
const extra = [...aggregateClasses].filter((c) => !union.has(c));
if (missing.length > 0 || extra.length > 0) {
  console.error(`split-css: aggregate mismatch (missing: ${missing}, extra: ${extra})`);
  process.exit(1);
}

// ---- dist/css-manifest.json ---------------------------------------------
// Machine-readable export -> css-file mapping, published as the
// 'haze-ui/css-manifest.json' subpath. Consumers' on-demand css tooling
// (e.g. vite plugins) reads it instead of re-deriving kebab-case names or
// hand-maintaining family tables — those drift whenever a sub-component
// shares its directory's stylesheet (InputCore -> input.css once broke a
// consumer build exactly that way).
//
// Both sides are derived from this build's own artifacts, so no second
// hand-written table exists:
//   - export -> defining module: parsed from dist/index.js, where rollup
//     has already resolved every barrel re-export to the module that
//     actually defines the export (`import o from "./components/Button/Button.js"`);
//   - module -> css group: the same groupOfModule truth as the file split
//     above. components/<Dir>/ and form/ are whole-directory families
//     (cores and sub-components share the directory's file); tokens/* and
//     hooks/* are judged per module.

function fail(message) {
  console.error(`split-css: ${message}`);
  process.exit(1);
}

const indexCode = readFileSync(path.join(distDir, 'index.js'), 'utf8');

// local import binding -> module specifier
const bindings = new Map();
for (const m of indexCode.matchAll(
  /import\s+(?:([$\w]+)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([$\w]+)|([$\w]+))\s+from\s*["']([^"']+)["']/g
)) {
  const [, defaultWithNamed, named, namespace, def, spec] = m;
  if (def) bindings.set(def, spec);
  if (defaultWithNamed) bindings.set(defaultWithNamed, spec);
  if (namespace) bindings.set(namespace, spec);
  if (!named) continue;
  for (const clause of named.split(',')) {
    const parsed = clause.trim().match(/^([$\w]+)(?:\s+as\s+([$\w]+))?$/);
    if (!parsed) fail(`unparsable import clause "${clause.trim()}" in dist/index.js`);
    bindings.set(parsed[2] ?? parsed[1], spec);
  }
}

// exported name -> module specifier
const exported = new Map();
for (const m of indexCode.matchAll(/^export\s*\{([^}]*)\}\s*;?\s*$/gm)) {
  for (const clause of m[1].split(',')) {
    const parsed = clause.trim().match(/^([$\w]+)(?:\s+as\s+([$\w]+))?$/);
    if (!parsed) fail(`unparsable export clause "${clause.trim()}" in dist/index.js`);
    const name = parsed[2] ?? parsed[1];
    const spec = bindings.get(parsed[1]);
    if (!spec) fail(`export "${name}" (local "${parsed[1]}") has no matching import in dist/index.js`);
    exported.set(name, spec);
  }
}
if (exported.size === 0) fail('no exports parsed from dist/index.js — build output shape changed?');

const families = {};
const noCss = [];
for (const [name, spec] of exported) {
  if (!spec.startsWith('./')) {
    noCss.push(name); // external re-export (react-use-control) — no css of its own
    continue;
  }
  const base = spec.slice(2).replace(/\.js$/, '');
  const segments = base.split('/');
  const family =
    segments[0] === 'components'
      ? segments.slice(0, 2).join('/')
      : segments[0] === 'form'
        ? 'form'
        : base;
  const css = moduleCssFiles.find(
    (rel) => rel === `${family}.wyw-in-js.css` || rel.startsWith(`${family}/`)
  );
  if (css) families[name] = groupOfModule(css);
  else noCss.push(name);
}

// Every css group must be reachable through some export, otherwise the
// file ships dead (a component dir that forgot its barrel export).
const unreachable = orderedNames.filter((n) => !Object.values(families).includes(n));
if (unreachable.length > 0) {
  fail(`css groups without any barrel export: ${unreachable.join(', ')} — export them or drop the css`);
}

const manifest = {
  families: Object.fromEntries(Object.keys(families).sort().map((k) => [k, families[k]])),
  noCss: [...noCss].sort(),
};
writeFileSync(path.join(distDir, 'css-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

// The per-module files are superseded by dist/css/* and dist/haze-ui.css;
// drop them so the published package ships each rule exactly once — and
// strip their side-effect imports from the JS outputs, otherwise the
// published package references files that no longer exist.
for (const rel of moduleCssFiles) {
  rmSync(path.join(distDir, rel));
}
stripDanglingCssImports();

/** Remove `import "./x.wyw-in-js.css"` / `require("./x.wyw-in-js.css")` from dist JS. */
function stripDanglingCssImports() {
  const jsExtensions = new Set(['.js', '.cjs', '.mjs']);
  const esmImport = /import\s*["'][^"']*\.wyw-in-js\.css["'];?/g;
  const cjsRequire = /require\(\s*["'][^"']*\.wyw-in-js\.css["']\s*\);?/g;
  const strip = (dir = distDir) => {
    let stripped = 0;
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stripped += strip(full);
      } else if (jsExtensions.has(path.extname(entry.name))) {
        const code = readFileSync(full, 'utf8');
        const next = code.replace(esmImport, '').replace(cjsRequire, '');
        if (next !== code) {
          writeFileSync(full, next);
          stripped += 1;
        }
      }
    }
    return stripped;
  };
  const strippedFiles = strip();
  if (strippedFiles === 0) {
    console.error('split-css: no .wyw-in-js.css imports found in dist JS — build output shape changed?');
    process.exit(1);
  }
  console.log(`split-css: stripped dangling css imports from ${strippedFiles} JS files`);
}

const perComponent = orderedNames.filter((n) => n !== 'tokens').length;
console.log(
  `split-css: ${perComponent} component files + tokens.css + haze-ui.css (${union.size} classes) written to dist/css`
);
console.log(
  `split-css: css-manifest.json written (${Object.keys(families).length} families, ${noCss.length} noCss)`
);
