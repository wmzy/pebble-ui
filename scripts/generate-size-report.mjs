#!/usr/bin/env node
/**
 * Measure the built library's CSS footprint and write
 * src/generated/size-report.json for the docs site's Home "Bundle size"
 * section.
 *
 * Inputs are the artifacts of scripts/split-css.mjs:
 *   - dist/css/<family>.css  one file per component family, plus tokens.css
 *   - dist/haze-ui.css       the full aggregate served as 'haze-ui/styles.css'
 *
 * Each family is recorded as { family, cssBytes, cssGzipBytes } (gzip via
 * node:zlib gzipSync, level 9), alongside the aggregate. When dist/ is
 * absent — fresh clone, or a docs build before any lib build — the script
 * writes an empty report flagged `distAvailable: false` instead of
 * failing; the Home section then renders its "run pnpm build" hint.
 *
 * Runs standalone (`node scripts/generate-size-report.mjs`) and is invoked
 * from the docs app's vite configResolved (after generate-props), mirroring
 * writeLlmsFull.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const defaultRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Raw and gzipped byte size of a CSS file on disk. */
const measureCss = (file) => {
  const content = readFileSync(file);
  return {
    cssBytes: content.length,
    cssGzipBytes: gzipSync(content, { level: 9 }).length,
  };
};

/**
 * Collect the report data: every dist/css/*.css family (tokens first, then
 * alphabetical — the deterministic split-css ordering) plus the
 * dist/haze-ui.css aggregate. Empty when dist/ is missing.
 */
export function generateSizeReport(rootDir = defaultRoot()) {
  const cssDir = path.join(rootDir, 'dist', 'css');
  const aggregateFile = path.join(rootDir, 'dist', 'haze-ui.css');
  const distAvailable = existsSync(cssDir) && existsSync(aggregateFile);

  const families = [];
  let aggregate = null;
  if (distAvailable) {
    const names = readdirSync(cssDir)
      .filter((name) => name.endsWith('.css'))
      .sort((a, b) =>
        a === 'tokens.css' ? -1 : b === 'tokens.css' ? 1 : a.localeCompare(b)
      );
    for (const name of names) {
      families.push({
        family: name.slice(0, -'.css'.length),
        ...measureCss(path.join(cssDir, name)),
      });
    }
    aggregate = { family: 'haze-ui', ...measureCss(aggregateFile) };
  }
  return { distAvailable, families, aggregate };
}

const sameFamily = (a, b) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.family === b.family &&
    a.cssBytes === b.cssBytes &&
    a.cssGzipBytes === b.cssGzipBytes);

const sameFamilyList = (a = [], b = []) =>
  a.length === b.length && a.every((row, i) => sameFamily(row, b[i]));

/**
 * Write src/generated/size-report.json. Idempotent on the measured data:
 * `generatedAt` is refreshed only when the sizes actually change, keeping
 * watcher/build timestamps stable like generate-props.mjs.
 */
export function writeSizeReport(rootDir = defaultRoot()) {
  const data = generateSizeReport(rootDir);
  const outDir = path.join(rootDir, 'src/generated');
  const outFile = path.join(outDir, 'size-report.json');
  mkdirSync(outDir, { recursive: true });

  const previous = existsSync(outFile)
    ? JSON.parse(readFileSync(outFile, 'utf8'))
    : null;
  const unchanged =
    previous !== null &&
    previous.distAvailable === data.distAvailable &&
    sameFamilyList(previous.families, data.families) &&
    sameFamily(previous.aggregate, data.aggregate);

  if (!unchanged) {
    const report = { generatedAt: new Date().toISOString(), ...data };
    writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
  }
  return {
    changed: !unchanged,
    outFile,
    familyCount: data.families.length,
    distAvailable: data.distAvailable,
  };
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
    const { changed, outFile, familyCount, distAvailable } = writeSizeReport();
    if (!distAvailable) {
      console.warn(
        'generate-size-report: dist/ CSS not found — wrote an empty report; run pnpm build to regenerate'
      );
    }
    console.log(
      `generate-size-report: ${familyCount} families, ${changed ? 'wrote' : 'unchanged'} ${path.relative(defaultRoot(), outFile)} in ${Date.now() - started}ms`
    );
  } catch (error) {
    console.error(
      `generate-size-report: ${error instanceof Error ? error.stack : String(error)}`
    );
    process.exit(1);
  }
}
