#!/usr/bin/env node
/**
 * Generate src/generated/props.json for the demo docs site.
 *
 * For every src/lib/components/<Dir>/ directory this script extracts, via the
 * TypeScript Compiler API (no ts-json-schema-generator — type strings such as
 * `Control<string> | string` must survive verbatim):
 *
 *   - `imports`: public value exports of the directory barrel (components,
 *     hooks) — used by the docs "Copy import" button;
 *   - `propsTypes`: every *exported* type alias ending in `Props`, with one
 *     row per locally-declared property: { name, type, required }. Properties
 *     inherited from React's DOM lib (via `Omit<ComponentPropsWithoutRef<
 *     'element'>>` intersections) are skipped: a property is kept only when
 *     its declaration lives inside this repository;
 *   - `otherTypes`: non-Props public types that doc tables reference
 *     directly (TreeNodeData, TransferItem, …) — see OTHER_TYPES.
 *
 * The output is deterministic (no timestamps, sorted keys, declaration row
 * order) so two runs produce byte-identical JSON.
 *
 * CLI:  node scripts/generate-props.mjs
 * API:  import { generateProps, writeProps } from './scripts/generate-props.mjs'
 *       (vite.config.mts reuses writeProps for the demo/dev branch)
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

/** Non-Props public types that are documented in their own props table. */
const OTHER_TYPES = [
  'TreeNodeData',
  'TransferItem',
  'LogEntry',
  'LogLevel',
  'TreeState',
  'SegmentedOption',
  'ChatMessageRole',
];

const defaultRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Same casing rule as scripts/split-css.mjs (dist/css family names). */
const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

/** Demo route segment (`/components/:name`) — the sidebar's flat lowercase keys. */
const routeKeyOf = (dirName) => dirName.toLowerCase();

const listSourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.(ts|tsx)$/.test(entry.name) &&
        !/\.test\.(ts|tsx)$/.test(entry.name) &&
        entry.name !== 'index.ts'
    )
    .map((entry) => path.join(dir, entry.name))
    .sort();

/** Names exported by a module through `export ... {}` clauses (any form). */
function collectExportedNames(sourceFile) {
  const names = new Set();
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          names.add(element.name.text);
        }
      }
    } else if (
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    ) {
      if (ts.isTypeAliasDeclaration(statement)) names.add(statement.name.text);
    }
  }
  return names;
}

/**
 * Public value exports of a barrel: names in non-type-only
 * `export { default as X } from './X'` / `export { A, B } from './M'`.
 */
function collectValueExports(sourceFile) {
  const names = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause) continue;
    if (!ts.isNamedExports(statement.exportClause)) continue;
    if (statement.isTypeOnly || statement.exportClause.isTypeOnly) continue;
    for (const element of statement.exportClause.elements) {
      names.push(element.name.text);
    }
  }
  return names;
}

/** Row extraction — the heart of the pipeline. */
function rowsForType(checker, srcRoot, aliasDecl) {
  const symbol = checker.getSymbolAtLocation(aliasDecl.name);
  if (!symbol) return [];
  const declared = checker.getDeclaredTypeOfSymbol(symbol);
  const rows = [];
  for (const propSymbol of checker.getPropertiesOfType(declared)) {
    const declaration = propSymbol.declarations?.[0];
    if (!declaration) continue;
    const fileName = path.resolve(declaration.getSourceFile().fileName);
    // Skip properties inherited from React's DOM lib (or anything declared
    // outside src/: `... & Omit<ComponentPropsWithoutRef<'x'>>` merges them
    // in, but the docs table only lists locally-declared API). node_modules
    // lives inside the repo root, so the check must be scoped to src/.
    if (!fileName.startsWith(srcRoot)) continue;
    // Prefer the property's own type annotation: it is exactly what the
    // source declares, with aliases (`ControlOrValue<string[]>`,
    // `ReactNode`) intact. getTypeOfSymbolAtLocation + getNonNullableType
    // would lose alias symbols on unions that intrinsically contain
    // undefined (ReactNode) and explode them into their constituents.
    const annotationType = declaration.type
      ? checker.getTypeAtLocation(declaration.type)
      : undefined;
    const propType =
      annotationType ??
      checker.getNonNullableType(
        checker.getTypeOfSymbolAtLocation(propSymbol, aliasDecl.name)
      );
    rows.push({
      name: propSymbol.name,
      type: checker.typeToString(propType).replace(/"([^"\\]*)"/g, "'$1'"),
      required: (propSymbol.flags & ts.SymbolFlags.Optional) === 0,
    });
  }
  return rows;
}

/**
 * Build the props index. `rootDir` defaults to the repo root derived from this
 * file's location — pass it explicitly when this module is inlined into a
 * bundler context (vite.config.mts) where import.meta.url is rewritten.
 */
export function generateProps(rootDir = defaultRoot()) {
  const componentsDir = path.join(rootDir, 'src/lib/components');
  if (!existsSync(componentsDir)) {
    throw new Error(`components directory not found: ${componentsDir}`);
  }

  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(componentsDir, entry.name))
    .filter((dir) => existsSync(path.join(dir, 'index.ts')))
    .sort();

  const rootFiles = dirs.flatMap((dir) => [
    path.join(dir, 'index.ts'),
    ...listSourceFiles(dir),
  ]);

  const configFile = ts.readConfigFile(
    path.join(rootDir, 'tsconfig.json'),
    ts.sys.readFile
  );
  if (configFile.error) {
    throw new Error(
      `failed to read tsconfig.json: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n')}`
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    rootDir
  );
  const program = ts.createProgram(rootFiles, {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const srcRoot = path.join(rootDir, 'src') + path.sep;

  const components = {};
  for (const dir of dirs) {
    const dirName = path.basename(dir);
    const barrel = program.getSourceFile(path.join(dir, 'index.ts'));
    if (!barrel) {
      throw new Error(`barrel not in program: ${dirName}/index.ts`);
    }

    const propsTypes = {};
    const otherTypes = {};
    for (const file of listSourceFiles(dir)) {
      const sourceFile = program.getSourceFile(file);
      if (!sourceFile) continue;
      const exportedNames = collectExportedNames(sourceFile);
      for (const statement of sourceFile.statements) {
        if (!ts.isTypeAliasDeclaration(statement)) continue;
        const name = statement.name.text;
        if (!exportedNames.has(name)) continue;
        if (/Props$/.test(name)) {
          propsTypes[name] = rowsForType(checker, srcRoot, statement);
        } else if (OTHER_TYPES.includes(name)) {
          const rows = rowsForType(checker, srcRoot, statement);
          // Non-object aliases (string unions like ChatMessageRole) have no
          // property rows — a props table cannot represent them.
          if (rows.length > 0) otherTypes[name] = rows;
        }
      }
    }

    components[dirName] = {
      routeKey: routeKeyOf(dirName),
      cssFamily: kebab(dirName),
      imports: collectValueExports(barrel),
      propsTypes: sortedValues(propsTypes),
      otherTypes: sortedValues(otherTypes),
    };
  }

  warnDuplicateTypeNames(components);
  return { components };
}

function sortedValues(map) {
  return Object.fromEntries(
    Object.keys(map)
      .sort()
      .map((key) => [key, map[key]])
  );
}

/** Same type name exported from two directories would make `of` lookups ambiguous. */
function warnDuplicateTypeNames(components) {
  const seen = new Map();
  for (const [component, entry] of Object.entries(components)) {
    for (const typeName of [
      ...Object.keys(entry.propsTypes),
      ...Object.keys(entry.otherTypes),
    ]) {
      const previous = seen.get(typeName);
      if (previous && previous !== component) {
        console.warn(
          `generate-props: type ${typeName} exported from both ${previous} and ${component}; docs lookup picks the first`
        );
      }
      seen.set(typeName, component);
    }
  }
}

/**
 * Write src/generated/props.json. Idempotent: when the generated content is
 * unchanged the file is not touched (keeps watcher/build timestamps stable).
 */
export function writeProps(rootDir = defaultRoot()) {
  const data = generateProps(rootDir);
  const outDir = path.join(rootDir, 'src/generated');
  const outFile = path.join(outDir, 'props.json');
  const content = `${JSON.stringify(data, null, 2)}\n`;
  mkdirSync(outDir, { recursive: true });
  const unchanged =
    existsSync(outFile) && readTrimmed(outFile) === content.trimEnd();
  if (!unchanged) {
    writeFileSync(outFile, content);
  }
  return {
    changed: !unchanged,
    outFile,
    componentCount: Object.keys(data.components).length,
  };
}

const readTrimmed = (file) =>
  existsSync(file) ? ts.sys.readFile(file)?.trimEnd() ?? '' : '';

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
    const { changed, outFile, componentCount } = writeProps();
    console.log(
      `generate-props: ${componentCount} components, ${changed ? 'wrote' : 'unchanged'} ${path.relative(defaultRoot(), outFile)} in ${Date.now() - started}ms`
    );
  } catch (error) {
    console.error(
      `generate-props: ${error instanceof Error ? error.stack : String(error)}`
    );
    process.exit(1);
  }
}
