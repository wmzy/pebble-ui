import * as path from 'path';
import { fileURLToPath } from 'url';

import { existsSync, readdirSync } from 'node:fs';

import { transformAsync } from '@babel/core';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';

import { writeProps } from './scripts/generate-props.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isLibBuild = process.env.BUILD_LIB === 'true';
const isDemoBuild = process.env.BUILD_DEMO === 'true';
// The docs app: demo build or dev server — but never the lib build or vitest.
const isDocsApp = isDemoBuild || (!isLibBuild && !process.env.VITEST);

// Lib entries: the root barrel plus every per-directory barrel that the
// package's `exports` subpaths (./components/*, ./form, ./tokens) point
// at. preserveModules tree-shakes re-export-only modules that are not
// entries — without listing them, dist/components/*/index.js would not
// exist and the subpaths would not resolve.
const libEntries = [
  path.resolve(__dirname, 'src/lib/index.ts'),
  ...['components', 'form', 'headless', 'tokens'].flatMap((group) =>
    readdirSync(path.resolve(__dirname, `src/lib/${group}`), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((dir) =>
        path.resolve(__dirname, `src/lib/${group}/${dir.name}/index.ts`)
      )
      .concat(
        group === 'components'
          ? []
          : [path.resolve(__dirname, `src/lib/${group}/index.ts`)]
      )
  ),
].filter((entry) => existsSync(entry));

function jsxPlusPlugin(): Plugin {
  return {
    name: 'jsx-plus',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.[jt]sx$/.test(id) || id.includes('node_modules')) return;
      if (!code.includes('x-class') && !code.includes('x-if')) return;
      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['jsx', 'typescript'] },
        plugins: ['transform-jsx-condition', 'transform-jsx-class'],
      });
      if (!result?.code) return;
      return { code: result.code, map: result.map };
    },
  };
}

// Docs app only: regenerate src/generated/props.json (PropsTable `of` data
// and the Copy-import index) before the module graph resolves it. Skipped
// for lib builds and vitest — neither reads the generated file.
function propsDocgenPlugin(): Plugin {
  return {
    name: 'haze-ui-props-docgen',
    configResolved() {
      const { changed, componentCount } = writeProps(__dirname);
      if (changed) {
        console.log(
          `props-docgen: regenerated src/generated/props.json (${componentCount} components)`
        );
      }
    },
  };
}

const buildConfig = (() => {
  if (isLibBuild) {
    return {
      lib: {
        entry: libEntries,
        formats: ['es'] as const,
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@linaria/core',
          'react-use-control',
          '@native-router/react',
          '@for-fun/event-emitter',
          // peer dependency — consumers bring their own copy
          'react-f0rm',
          // optional peer dependency (DataTable's engine) — kept external so
          // its CJS interop never leaks a `require()` call into the
          // pure-ESM dist (the Node ESM contract test imports dist/index.js
          // in bare node)
          '@tanstack/react-table',
          // optional peer dependency (Chart's engine) — same rule
          'recharts',
        ],
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src/lib',
          entryFileNames: '[name].js',
          // Every JS chunk starts with the 'use client' directive so Next.js
          // App Router users can import haze-ui from client components
          // without "You're importing a component that needs useState"
          // errors (same convention as Radix / Base UI / React-Aria dists).
          // Applies to JS chunks only — rolldown emits CSS as separate
          // assets that don't pass through the JS banner. Directive must
          // precede every import statement; verified by the ESM contract
          // test (dist-esm-contract.test.ts).
          banner: "'use client';",
        },
      },
      // Vite's lib mode defaults cssCodeSplit to false (one merged CSS
      // file). Force it on: with preserveModules every lib module emits its
      // own `*.wyw-in-js.css`, which scripts/split-css.mjs then groups into
      // dist/css/<component>.css subpaths and the dist/haze-ui.css
      // aggregate, so consumers can load per-component CSS instead of the
      // full 90kB stylesheet.
      cssCodeSplit: true,
    };
  }
  if (isDemoBuild) {
    return {
      outDir: 'dist',
    };
  }
  return undefined;
})();

export default defineConfig({
  base: isDemoBuild ? '/haze-ui/' : '/',
  resolve: {
    alias: [
      {
        find: /^babel-runtime-jsx-plus$/,
        replacement: path.resolve(__dirname, 'src/lib/utils/classnames.ts'),
      },
      {
        find: /^@\/(.*)/,
        replacement: `${path.join(__dirname, 'src/$1')}`,
      },
    ],
  },
  server: {
    open: true,
  },
  plugins: [
    jsxPlusPlugin(),
    ...(isDocsApp ? [propsDocgenPlugin()] : []),
    react({
      exclude: ['node_modules/**'],
    }),
    wyw({
      evaluate: false,
      sourceMap: true,
      exclude: ['node_modules/**'],
      classNameSlug: (hash, title, args) => `haze-${args.name}__${title}`,
    }),
  ],
  build: buildConfig,
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        'src/lib/**/*.test.{ts,tsx}',
        'src/lib/**/index.ts',
        'src/lib/tokens/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
