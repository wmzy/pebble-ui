#!/usr/bin/env node
/**
 * create-haze-ui — scaffold a haze-ui app from the bundled templates.
 *
 * Usage: create-haze-ui [target-dir] [--template vite|nextjs]
 *
 * Zero runtime dependencies: plain Node built-ins, template assets copied
 * from ./templates next to this file (resolved via import.meta.url so the
 * CLI works through npx/pnpm dlx, global installs and direct node runs).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES = ['vite', 'nextjs'];

// Copy-filter: anything a local template checkout may have accumulated.
const SKIP_ENTRIES = new Set(['node_modules', '.git', '.DS_Store']);

const USAGE = `
Usage: create-haze-ui [target-dir] [--template <name>]

Scaffolds a haze-ui starter app into target-dir.

Options:
  --template, -t   Template to use: ${TEMPLATES.join(' | ')} (default: vite)
  --help, -h       Show this help

Examples:
  pnpm create haze-ui my-app
  pnpm create haze-ui my-app --template nextjs
  npm create haze-ui@latest my-app -- --template vite
`;

/** Parse argv without dependencies: one positional (target dir) + flags. */
const parseArgs = (args) =>
  args.reduce(
    (acc, arg) => {
      if (acc.expectTemplate) {
        acc.template = arg;
        acc.expectTemplate = false;
        return acc;
      }
      if (arg === '--template' || arg === '-t') {
        acc.expectTemplate = true;
        return acc;
      }
      if (arg.startsWith('--template=')) {
        acc.template = arg.slice('--template='.length);
        return acc;
      }
      if (arg === '--help' || arg === '-h') {
        acc.help = true;
        return acc;
      }
      if (arg.startsWith('-')) {
        acc.unknown.push(arg);
        return acc;
      }
      if (acc.dir === undefined) {
        acc.dir = arg;
      } else {
        acc.unknown.push(arg);
      }
      return acc;
    },
    {dir: undefined, template: undefined, expectTemplate: false, help: false, unknown: []}
  );

/** Fail with a friendly message instead of a stack trace. */
const fail = (message) => {
  console.error(`\x1b[31m${message}\x1b[0m\n`);
  console.error(USAGE);
  process.exit(1);
};

/** Turn a directory name into a valid npm package name. */
const toPackageName = (dirName) => {
  const name = dirName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+/, '');
  return name === '' ? 'haze-app' : name;
};

/** The install/dev commands for the package manager that invoked us. */
const detectPackageManager = () => {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';
  return 'npm';
};

const installCommand = (pm) => ({npm: 'npm install', pnpm: 'pnpm install', yarn: 'yarn', bun: 'bun install'})[pm];
const devCommand = (pm) => ({npm: 'npm run dev', pnpm: 'pnpm dev', yarn: 'yarn dev', bun: 'bun run dev'})[pm];

/** Recursive copy that keeps dotfiles (e.g. .gitignore) and file modes. */
const copyTemplate = (srcDir, destDir) => {
  mkdirSync(destDir, {recursive: true});
  for (const entry of readdirSync(srcDir, {withFileTypes: true})) {
    if (SKIP_ENTRIES.has(entry.name)) continue;
    const from = join(srcDir, entry.name);
    const to = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTemplate(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
    }
  }
};

const templatesDir = fileURLToPath(new URL('./templates', import.meta.url));

const {dir, template, expectTemplate, help, unknown} = parseArgs(process.argv.slice(2));

if (help) {
  console.log(USAGE);
  process.exit(0);
}
if (unknown.length > 0) {
  fail(`Unknown argument${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`);
}
if (expectTemplate) {
  fail('--template expects a value, e.g. --template nextjs');
}
const chosenTemplate = template ?? 'vite';
if (!TEMPLATES.includes(chosenTemplate)) {
  fail(`Unknown template "${chosenTemplate}". Available templates: ${TEMPLATES.join(', ')}`);
}
if (dir === undefined) {
  fail('Missing target directory.');
}

const targetDir = resolve(process.cwd(), dir);
const targetName = basename(targetDir);

if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
  fail(`Directory "${dir}" is not empty — pick an empty (or new) directory.`);
}

const templateDir = join(templatesDir, chosenTemplate);
copyTemplate(templateDir, targetDir);

// Rename the app to match the target directory.
const pkgPath = join(targetDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = toPackageName(targetName);
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const pm = detectPackageManager();
const relDir = dir === '.' ? '.' : dir;

console.log(`\x1b[32m✔\x1b[0m Scaffolded a haze-ui ${chosenTemplate} app in \x1b[1m${relDir}\x1b[0m\n`);
console.log('Next steps:');
if (relDir !== '.') console.log(`  cd ${relDir}`);
console.log(`  ${installCommand(pm)}`);
console.log(`  ${devCommand(pm)}\n`);
