#!/usr/bin/env node
/**
 * One-time codemod (kept as a maintenance tool): migrate inline
 * `<PropsTable props={[...]} />` tables in src/views/ComponentDetail/index.tsx
 * to generated references (`<PropsTable of='TypeName' />`), moving the
 * handwritten rows into src/generated/props-docs.json as override data.
 *
 * Merge semantics (mirrored by PropsTable v2 at runtime):
 *   - generated rows (scripts/generate-props.mjs → props.json) supply row
 *     order plus name/type, straight from the library source;
 *   - handwritten rows with the same name contribute description/default;
 *   - handwritten rows the generator cannot see (className, `...rest`,
 *     children, …) are appended at the end, preserving handwritten order.
 *
 * A table is migrated only when its key — inferred from the nearest
 * preceding <h2> ('Button Props' → ButtonProps, 'TreeNodeData' →
 * TreeNodeData, bare 'Props' → <EnclosingDemo minus Demo> + 'Props') —
 * resolves to a type in props.json. Everything else is left untouched.
 *
 * CLI: node scripts/migrate-props-tables.mjs [--check]   (--check: no writes)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetFile = path.join(rootDir, 'src/views/ComponentDetail/index.tsx');
const propsJsonFile = path.join(rootDir, 'src/generated/props.json');
const docsJsonFile = path.join(rootDir, 'src/generated/props-docs.json');

const checkOnly = process.argv.includes('--check');

/** Handwritten rows the generator intentionally cannot see (DOM-inherited). */
const isExpectedExtra = (name) =>
  name === 'className' || name.startsWith('...');

const propsIndex = (() => {
  const data = JSON.parse(readFileSync(propsJsonFile, 'utf8'));
  const index = new Map(); // typeName -> { component, kind, rows }
  for (const [component, entry] of Object.entries(data.components)) {
    for (const kind of ['propsTypes', 'otherTypes']) {
      for (const [typeName, rows] of Object.entries(entry[kind])) {
        index.set(typeName, { component, kind, rows });
      }
    }
  }
  return index;
})();

const code = readFileSync(targetFile, 'utf8');
const sourceFile = ts.createSourceFile(
  targetFile,
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

// ── collect h2 headings and PropsTable elements ─────────────────────────

const h2Ranges = [];
const tables = [];

const visit = (node, parents) => {
  const isJsxElement = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
  if (isJsxElement) {
    const tagName = ts.isJsxSelfClosingElement(node)
      ? node.tagName.getText(sourceFile)
      : node.openingElement.tagName.getText(sourceFile);
    if (tagName === 'h2') {
      h2Ranges.push({ pos: node.pos, end: node.end, text: jsxText(node) });
    } else if (tagName === 'PropsTable') {
      tables.push({ node, parents: [...parents] });
    }
  }
  node.forEachChild((child) => visit(child, [...parents, node]));
};
visit(sourceFile, []);

/** Concatenated text of all JsxText descendants (nested <code> included). */
function jsxText(element) {
  const parts = [];
  const walk = (node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).trim();
      if (text) parts.push(text);
    }
    node.forEachChild(walk);
  };
  walk(element);
  return parts.join(' ');
}

// ── per-table analysis ──────────────────────────────────────────────────

const docsEntries = new Map(); // typeName -> rows (insertion order preserved)
const replacements = []; // { start, end, text }
const report = { migrated: [], skipped: [], ghosts: [] };

for (const { node, parents } of tables) {
  const line = sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1;
  const attributes = ts.isJsxSelfClosingElement(node)
    ? node.attributes.properties
    : node.openingElement.attributes.properties;

  const propsAttr = attributes.find(
    (attr) => ts.isJsxAttribute(attr) && attr.name.text === 'props'
  );
  if (!propsAttr) {
    report.skipped.push({ line, reason: 'no inline props array (already migrated or foreign shape)' });
    continue;
  }
  if (attributes.length > 1) {
    report.skipped.push({ line, reason: 'unexpected extra attributes' });
    continue;
  }

  const arrayNode = propsAttr.initializer?.expression;
  if (!arrayNode || !ts.isArrayLiteralExpression(arrayNode)) {
    report.skipped.push({ line, reason: 'props value is not an array literal' });
    continue;
  }

  const rows = extractRows(arrayNode);
  if (!rows) {
    report.skipped.push({ line, reason: 'non-literal row value — needs manual migration' });
    continue;
  }

  const heading = [...h2Ranges]
    .filter((h2) => h2.end <= node.pos)
    .sort((a, b) => a.end - b.end)
    .at(-1);
  const demoBase = enclosingDemoBase(parents);
  const typeName = inferTypeName(heading?.text ?? '', demoBase);
  if (!typeName) {
    report.skipped.push({ line, reason: `cannot infer type key (h2: "${heading?.text ?? 'none'}")` });
    continue;
  }

  const match = lookupType(typeName, demoBase);
  if (!match) {
    report.skipped.push({ line, reason: `type ${typeName} not found in props.json (h2: "${heading?.text}")` });
    continue;
  }
  if (docsEntries.has(typeName)) {
    report.skipped.push({ line, reason: `type ${typeName} already documented above` });
    continue;
  }

  const generatedNames = new Set(match.rows.map((row) => row.name));
  const stats = { matched: 0, extra: 0, undocumented: 0, ghost: 0 };
  for (const row of rows) {
    if (generatedNames.has(row.name)) {
      stats.matched += 1;
    } else if (isExpectedExtra(row.name)) {
      stats.extra += 1;
    } else {
      stats.ghost += 1;
      report.ghosts.push({ line, typeName, prop: row.name });
    }
  }
  stats.undocumented = match.rows.filter(
    (row) => !rows.some((hand) => hand.name === row.name)
  ).length;

  docsEntries.set(typeName, rows);
  replacements.push({
    start: node.getStart(sourceFile),
    end: node.end,
    text: `<PropsTable of='${typeName}' />`,
  });
  report.migrated.push({
    line,
    typeName,
    component: match.component,
    ...stats,
  });
}

function extractRows(arrayNode) {
  const rows = [];
  for (const element of arrayNode.elements) {
    if (!ts.isObjectLiteralExpression(element)) return undefined;
    const row = {};
    for (const property of element.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        !ts.isIdentifier(property.name) ||
        !ts.isStringLiteral(property.initializer)
      ) {
        return undefined;
      }
      row[property.name.text] = property.initializer.text;
    }
    if (typeof row.name !== 'string') return undefined;
    rows.push(row);
  }
  return rows;
}

/** Nearest enclosing `function XxxDemo()` — the demo the table belongs to. */
function enclosingDemoBase(parents) {
  for (const parent of [...parents].reverse()) {
    if (ts.isFunctionDeclaration(parent) && parent.name) {
      return parent.name.text.replace(/Demo$/, '');
    }
  }
  return undefined;
}

/**
 * h2 text → type key:
 *   'Button Props' → ButtonProps   'Props' → <DemoBase>Props
 *   'LogEntry Type' → LogEntry     'useToast API' → useToast
 *   'TreeNodeData' → TreeNodeData
 */
function inferTypeName(heading, demoBase) {
  const propsMatch = heading.match(/^(.*?)\s*Props$/);
  if (propsMatch) {
    const base = propsMatch[1].trim() || demoBase;
    return base ? `${base}Props` : undefined;
  }
  const typeMatch = heading.match(/^(.*?)\s*Type$/);
  if (typeMatch) return typeMatch[1].trim() || undefined;
  const apiMatch = heading.match(/^(.*?)\s*API$/);
  if (apiMatch) return apiMatch[1].trim() || undefined;
  return heading.trim() || undefined;
}

function lookupType(typeName, demoBase) {
  const match = propsIndex.get(typeName);
  if (!match) return undefined;
  // On duplicate names across directories prefer the component the demo is
  // about (RadioButtonDemo → Radio), otherwise the first in props.json order.
  if (match.component !== demoBase) {
    for (const [name, entry] of propsIndex) {
      if (name === typeName && entry.component === demoBase) return entry;
    }
  }
  return match;
}

// ── apply ───────────────────────────────────────────────────────────────

if (replacements.length > 0 && !checkOnly) {
  let output = '';
  let cursor = 0;
  for (const { start, end, text } of replacements.sort((a, b) => a.start - b.start)) {
    output += code.slice(cursor, start) + text;
    cursor = end;
  }
  output += code.slice(cursor);
  writeFileSync(targetFile, output);

  const docsJson = `${JSON.stringify(
    Object.fromEntries([...docsEntries.entries()].sort(([a], [b]) => a.localeCompare(b))),
    null,
    2
  )}\n`;
  writeFileSync(docsJsonFile, docsJson);
}

// ── report ──────────────────────────────────────────────────────────────

console.log(
  `migrate-props-tables: ${tables.length} tables — ${report.migrated.length} migrated, ${report.skipped.length} skipped${checkOnly ? ' (check mode, nothing written)' : ''}`
);
for (const entry of report.migrated) {
  console.log(
    `  ✓ line ${entry.line} ${entry.typeName} (from ${entry.component}) — matched=${entry.matched} extra=${entry.extra} undocumented=${entry.undocumented} ghost=${entry.ghost}`
  );
}
for (const ghost of report.ghosts) {
  console.log(
    `  ⚠ ghost line ${ghost.line} ${ghost.typeName}.${ghost.prop} — handwritten row absent from the generated type (kept as override row)`
  );
}
for (const skip of report.skipped) {
  console.log(`  – line ${skip.line} skipped: ${skip.reason}`);
}
const ghostTables = [...new Set(report.ghosts.map((ghost) => ghost.typeName))];
if (ghostTables.length > 0) {
  console.log(`ghost summary: ${ghostTables.join(', ')}`);
}
