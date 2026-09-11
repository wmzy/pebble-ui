import * as path from 'path';
import { fileURLToPath } from 'url';

import { existsSync, readdirSync } from 'node:fs';

import { transformAsync } from '@babel/core';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';

import { writeProps } from './scripts/generate-props.mjs';
import { writeLlmsFull } from './scripts/generate-llms-full.mjs';
import { writeSizeReport } from './scripts/generate-size-report.mjs';
import { isRscSafeModule } from './scripts/rsc-safe.mjs';

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
// and the Copy-import index) before the module graph resolves it, then the
// repo-root llms-full.txt single-file API reference built on top of it.
// Skipped for lib builds and vitest — neither reads the generated file.
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
      const llms = writeLlmsFull(__dirname);
      if (llms.changed) {
        console.log(
          `props-docgen: regenerated llms-full.txt (${llms.componentCount} components)`
        );
      }
      const size = writeSizeReport(__dirname);
      if (size.changed) {
        console.log(
          `props-docgen: regenerated size-report.json (${size.familyCount} families)`
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
          // regular dependency (haze-ui's form engine, same-author library)
          // — external so its CJS interop never leaks a `require()` call
          // into the pure-ESM dist; the resolver subpaths are re-exported
          // from haze-ui/form and follow the same rule
          'react-f0rm',
          'react-f0rm/resolvers/standard-schema',
          'react-f0rm/resolvers/zod',
          'react-f0rm/resolvers/yup',
          // regular dependency (DataTable's engine) — kept external so
          // its CJS interop never leaks a `require()` call into the
          // pure-ESM dist (the Node ESM contract test imports dist/index.js
          // in bare node)
          '@tanstack/react-table',
          // regular dependency (Chart's engine) — same rule
          'recharts',
          // regular dependency (QRCode's engine) — same rule
          'qrcode',
          // regular dependencies (drag-and-drop for the sortable
          // TagInput/TagGroup modes) — same rule
          '@dnd-kit/core',
          '@dnd-kit/sortable',
          '@dnd-kit/utilities',
        ],
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src/lib',
          entryFileNames: '[name].js',
          // Every JS chunk starts with the 'use client' directive so Next.js
          // App Router users can import haze-ui from client components
          // without "You're importing a component that needs useState"
          // errors (same convention as Radix / Base UI / React-Aria dists).
          // EXCEPTION: modules on the RSC-safe list (scripts/rsc-safe.mjs —
          // hook-free presentational components, design tokens and the
          // classnames helper they compile against) skip the banner so they
          // can be imported directly from React Server Components. The list
          // is keyed by source path, so relativize the chunk's facade
          // module id; chunks without a facade (or outside src/lib) keep
          // the banner. Applies to JS chunks only — rolldown emits CSS as
          // separate assets that don't pass through the JS banner. Directive
          // must precede every import statement; both directions are
          // verified by the ESM contract test (dist-esm-contract.test.ts).
          banner: (chunk) =>
            isRscSafeModule(chunk.facadeModuleId) ? '' : "'use client';",
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
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'mcp/**/*.test.mjs'],
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
