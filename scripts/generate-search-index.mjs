#!/usr/bin/env node
/**
 * Generate src/generated/search-index.json — the ⌘K palette's Docs tier.
 *
 * Every entry is shaped {type, label, sublabel?, route, keywords?}; four
 * kinds are collected:
 *
 *   - page:      static docs-page list (labels/keywords mirror the sidebar
 *                nav in src/views/Layout/index.tsx)
 *   - component: the sidebar's component-groups.ts (names + ALIASES search
 *                aliases, route=/components/<slug>)
 *   - section:   every <h2> title in each registered component demo (the
 *                registry in ComponentDetail/index.tsx maps routes → demo
 *                files); generic headings (Demo/Props/API/Accessibility)
 *                carry no component-specific meaning and are skipped
 *   - prop:      src/generated/props-docs.json descriptions joined onto
 *                props.json routes, plus the hand-written inline
 *                `PropsTable props={[...]}` rows inside demos (FormItem /
 *                FormList / useField / useToast have no generated props.json
 *                entry — form is a known extra outside the lib components
 *                tree, useToast is a hook API table). Each row's sublabel
 *                is prefixed with the owner derived from the nearest
 *                preceding h2/h3 heading.
 *
 * Extraction is purely syntactic (ts.createSourceFile, no type checker):
 * the data sources are literal object/array initializers and JSX text.
 *
 * The output is deterministic (fixed page list, sidebar/registry source
 * order, sorted prop type names — no timestamps) so two runs produce
 * byte-identical JSON.
 *
 * CLI:  node scripts/generate-search-index.mjs
 * API:  import { writeSearchIndex } from './scripts/generate-search-index.mjs'
 *       (vite.config.mts runs it right after writeProps: the prop entries
 *       join props.json, which must be regenerated first)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const defaultRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Docs pages surfaced as first-class search targets. Labels mirror the
 * sidebar nav; routes mirror src/views/index.tsx. Home/About are trivially
 * reachable and intentionally not indexed.
 */
const PAGES = [
  {
    label: 'Getting Started',
    sublabel: 'Guide',
    route: '/getting-started',
    keywords: ['install', 'setup', 'quickstart', 'usage'],
  },
  {
    label: 'Recipes',
    sublabel: 'Guide',
    route: '/recipes',
    keywords: ['patterns', 'examples', 'member crud', 'chat adapter'],
  },
  {
    label: 'Dark mode',
    sublabel: 'Guide',
    route: '/guides/dark-mode',
    keywords: ['theme', 'theming', 'night', 'color scheme'],
  },
  {
    label: 'Density (compact)',
    sublabel: 'Guide',
    route: '/guides/density',
    keywords: ['compact', 'spacing', 'dense'],
  },
  {
    label: 'Accessibility',
    sublabel: 'Guide',
    route: '/guides/a11y',
    keywords: ['a11y', 'screen reader', 'keyboard', 'axe', 'wcag'],
  },
  {
    label: 'Migrating from AntD / shadcn',
    sublabel: 'Guide',
    route: '/guides/migration',
    keywords: ['antd', 'shadcn', 'upgrade', 'port'],
  },
  {
    label: 'Design Tokens',
    sublabel: 'Reference',
    route: '/tokens',
    keywords: [
      'colors',
      'palette',
      'oklch',
      'css variables',
      'spacing',
      'typography',
    ],
  },
  {
    label: 'AI Showcase',
    sublabel: 'Demo',
    route: '/ai-showcase',
    keywords: ['chat', 'assistant', 'playground'],
  },
  {
    label: 'Theme Editor',
    sublabel: 'Tool',
    route: '/theme-editor',
    keywords: ['brand', 'customize', 'export theme', 'palette editor'],
  },
  {
    label: 'Changelog',
    sublabel: 'Reference',
    route: '/changelog',
    keywords: ['releases', 'version history', 'changes'],
  },
  {
    label: 'Help',
    sublabel: 'Reference',
    route: '/help',
    keywords: ['faq', 'support', 'troubleshooting'],
  },
];

/*
 * Demo h2 titles repeated on (nearly) every component page with identical
 * boilerplate content — pure noise in a query, excluded from the index.
 * Owner-qualified variants ("Accordion Props", "useToast API") survive.
 */
const GENERIC_SECTIONS = new Set(['Demo', 'Props', 'API', 'Accessibility']);

/** Prop rows that exist on every component with a generic description. */
const GHOST_PROPS = new Set(['className', 'style']);

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function parseSource(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

/** Property assignments of an object literal keyed by property name. */
function objectProps(obj) {
  const map = new Map();
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop)) map.set(prop.name.text, prop.initializer);
  }
  return map;
}

/** COMPONENT_GROUPS + ALIASES from component-groups.ts (syntactic read). */
function readComponentGroups(rootDir) {
  const sourceFile = parseSource(
    path.join(rootDir, 'src/views/Layout/component-groups.ts')
  );
  const groups = [];
  const aliases = {};

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      if (
        decl.name.text === 'COMPONENT_GROUPS' &&
        ts.isArrayLiteralExpression(decl.initializer)
      ) {
        for (const element of decl.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const props = objectProps(element);
          const group = props.get('group');
          const items = props.get('items');
          if (!group || !ts.isStringLiteral(group)) continue;
          const itemRows = [];
          if (items && ts.isArrayLiteralExpression(items)) {
            for (const item of items.elements) {
              if (!ts.isObjectLiteralExpression(item)) continue;
              const name = objectProps(item).get('name');
              const route = objectProps(item).get('route');
              if (name && route && ts.isStringLiteral(name) && ts.isStringLiteral(route)) {
                itemRows.push({ name: name.text, route: route.text });
              }
            }
          }
          groups.push({ group: group.text, items: itemRows });
        }
      }
      if (
        decl.name.text === 'ALIASES' &&
        ts.isObjectLiteralExpression(decl.initializer)
      ) {
        for (const prop of decl.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          if (!ts.isArrayLiteralExpression(prop.initializer)) continue;
          aliases[prop.name.text] = prop.initializer.elements
            .filter(ts.isStringLiteral)
            .map((element) => element.text);
        }
      }
    }
  }
  return { groups, aliases };
}

/*
 * The demo registry: `const demos = { route: ImportedDemo, ... }` plus the
 * default imports feeding it, resolved to absolute file paths. Only
 * registered demos are rendered, so only they are scanned.
 */
function readDemoRegistry(rootDir) {
  const file = path.join(rootDir, 'src/views/ComponentDetail/index.tsx');
  const sourceFile = parseSource(file);

  const imports = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!statement.importClause?.name) continue;
    const specifier = statement.moduleSpecifier.text;
    const base = specifier.startsWith('@/')
      ? path.join(rootDir, 'src', specifier.slice(2))
      : path.resolve(path.dirname(file), specifier);
    for (const ext of ['.tsx', '.ts']) {
      if (existsSync(base + ext)) {
        imports.set(statement.importClause.name.text, base + ext);
        break;
      }
    }
  }

  const registry = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (decl.name.text !== 'demos' || !decl.initializer) continue;
      if (!ts.isObjectLiteralExpression(decl.initializer)) continue;
      for (const prop of decl.initializer.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        if (!ts.isIdentifier(prop.initializer)) continue;
        const demoFile = imports.get(prop.initializer.text);
        if (demoFile) registry.push({ route: prop.name.text, file: demoFile });
      }
    }
  }
  return registry;
}

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** JSX text keeps entity references verbatim — decode the common ones. */
function decodeEntities(text) {
  return text.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) {
      return String.fromCodePoint(parseInt(body.slice(1), 10));
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Concatenated JSX text of an element (nested tags walked, whitespace collapsed). */
function jsxText(element) {
  let out = '';
  const visit = (node) => {
    if (ts.isJsxText(node)) out += node.text;
    ts.forEachChild(node, visit);
  };
  visit(element);
  return decodeEntities(out).replace(/\s+/g, ' ').trim();
}

function jsxTagName(node) {
  // JsxSelfClosingElement carries `tagName`/`attributes` directly; on a
  // JsxElement both live on the opening element (TS 6 dropped the
  // shortcut properties).
  const tag = ts.isJsxSelfClosingElement(node)
    ? node.tagName
    : node.openingElement.tagName;
  return ts.isIdentifier(tag) ? tag.text : undefined;
}

function jsxAttributes(node) {
  return ts.isJsxSelfClosingElement(node)
    ? node.attributes
    : node.openingElement.attributes;
}

/** Owner context for a props table, derived from its nearest heading. */
function ownerFromHeading(heading) {
  return heading
    .split(' — ')[0]
    .split(' (')[0]
    .replace(/\s+props$/i, '')
    .replace(/\s+API$/i, '')
    .trim();
}

/** h2 section titles + hand-written PropsTable rows of one demo file. */
function scanDemo(sourceFile) {
  const sections = [];
  const propRows = [];
  let lastHeading = '';

  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = jsxTagName(node);
      if (tag === 'h2' || tag === 'h3') {
        const text = jsxText(node);
        if (text) {
          lastHeading = text;
          if (tag === 'h2' && !GENERIC_SECTIONS.has(text)) sections.push(text);
        }
      } else if (tag === 'PropsTable') {
        for (const attr of jsxAttributes(node).properties) {
          if (!ts.isJsxAttribute(attr) || attr.name.text !== 'props') continue;
          const initializer = attr.initializer;
          const array =
            initializer &&
            ts.isJsxExpression(initializer) &&
            initializer.expression &&
            ts.isArrayLiteralExpression(initializer.expression)
              ? initializer.expression
              : null;
          if (!array) continue;
          for (const element of array.elements) {
            if (!ts.isObjectLiteralExpression(element)) continue;
            const props = objectProps(element);
            const name = props.get('name');
            const description = props.get('description');
            if (name && ts.isStringLiteral(name) && description && ts.isStringLiteral(description)) {
              propRows.push({
                owner: ownerFromHeading(lastHeading),
                name: name.text,
                description: description.text,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { sections, propRows };
}

/** Prop entries from props.json routes × props-docs.json descriptions. */
function generatedPropEntries(rootDir) {
  const props = readJson(path.join(rootDir, 'src/generated/props.json'));
  const docs = readJson(path.join(rootDir, 'src/generated/props-docs.json'));
  const entries = [];
  for (const component of Object.keys(props.components).sort()) {
    const entry = props.components[component];
    const typeNames = [
      ...Object.keys(entry.propsTypes),
      ...Object.keys(entry.otherTypes),
    ].sort();
    for (const typeName of typeNames) {
      const rows = docs[typeName];
      if (!Array.isArray(rows)) continue;
      const owner = typeName.replace(/Props$/, '');
      for (const row of rows) {
        if (!row.description || GHOST_PROPS.has(row.name)) continue;
        entries.push({
          type: 'prop',
          label: row.name,
          sublabel: `${owner} — ${row.description}`,
          route: `/components/${entry.routeKey}`,
        });
      }
    }
  }
  return entries;
}

/**
 * Build the search index. `rootDir` defaults to the repo root derived from
 * this file's location — pass it explicitly when this module is inlined
 * into a bundler context (vite.config.mts) where import.meta.url is
 * rewritten.
 */
export function generateSearchIndex(rootDir = defaultRoot()) {
  const propsFile = path.join(rootDir, 'src/generated/props.json');
  if (!existsSync(propsFile)) {
    throw new Error(
      `generate-search-index: ${propsFile} not found — run generate-props first`
    );
  }

  const entries = [];
  for (const page of PAGES) {
    entries.push({ type: 'page', ...page });
  }

  const { groups, aliases } = readComponentGroups(rootDir);
  const nameByRoute = new Map();
  for (const group of groups) {
    for (const item of group.items) {
      nameByRoute.set(item.route, item.name);
      entries.push({
        type: 'component',
        label: item.name,
        route: `/components/${item.route}`,
        keywords: aliases[item.route] ?? [],
      });
    }
  }

  const sectionEntries = [];
  const demoPropEntries = [];
  const seenDemoProps = new Set();
  for (const { route, file } of readDemoRegistry(rootDir)) {
    const owner = nameByRoute.get(route) ?? route;
    const { sections, propRows } = scanDemo(parseSource(file));
    const seenSections = new Set();
    for (const label of sections) {
      if (seenSections.has(label)) continue;
      seenSections.add(label);
      sectionEntries.push({
        type: 'section',
        label,
        sublabel: owner,
        route: `/components/${route}`,
      });
    }
    for (const row of propRows) {
      const key = `${route}|${row.owner}|${row.name}`;
      if (seenDemoProps.has(key)) continue;
      seenDemoProps.add(key);
      demoPropEntries.push({
        type: 'prop',
        label: row.name,
        sublabel: `${row.owner} — ${row.description}`,
        route: `/components/${route}`,
      });
    }
  }
  entries.push(...sectionEntries, ...demoPropEntries, ...generatedPropEntries(rootDir));

  return entries;
}

/**
 * Write src/generated/search-index.json. Idempotent: when the generated
 * content is unchanged the file is not touched (keeps watcher/build
 * timestamps stable).
 */
export function writeSearchIndex(rootDir = defaultRoot()) {
  const data = generateSearchIndex(rootDir);
  const outDir = path.join(rootDir, 'src/generated');
  const outFile = path.join(outDir, 'search-index.json');
  const content = `${JSON.stringify(data, null, 2)}\n`;
  mkdirSync(outDir, { recursive: true });
  const unchanged =
    existsSync(outFile) &&
    (readFileSync(outFile, 'utf8').trimEnd() === content.trimEnd());
  if (!unchanged) {
    writeFileSync(outFile, content);
  }
  return { changed: !unchanged, outFile, entryCount: data.length };
}

const invokedDirectly = () => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
};

if (invokedDirectly()) {
  try {
    const started = Date.now();
    const { changed, outFile, entryCount } = writeSearchIndex();
    console.log(
      `generate-search-index: ${entryCount} entries, ${changed ? 'wrote' : 'unchanged'} ${path.relative(defaultRoot(), outFile)} in ${Date.now() - started}ms`
    );
  } catch (error) {
    console.error(
      `generate-search-index: ${error instanceof Error ? error.stack : String(error)}`
    );
    process.exit(1);
  }
}
