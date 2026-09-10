import * as path from 'path';
import { fileURLToPath } from 'url';

import { transformAsync } from '@babel/core';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

/**
 * Same JSX+ lowering the root config applies: library source uses the
 * `x-class` attribute, which must be transformed before React sees it.
 */
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

/**
 * Dev server for Playwright smoke tests: serves e2e/app and compiles the
 * library straight from src/lib through the same pipeline the demo uses
 * (JSX+ transform, react plugin, Linaria extraction). The repo root
 * vite.config.mts is intentionally untouched.
 */
export default defineConfig({
  root: path.resolve(repoRoot, 'e2e/app'),
  // The Playwright webServer runs the dev server, which serves every
  // file under root implicitly; this input list exists so `vite build`
  // (if ever needed for debugging fixtures headlessly) emits exactly the
  // harness pages, and doubles as the registry of fixture entries.
  build: {
    rollupOptions: {
      input: [
        path.resolve(repoRoot, 'e2e/app/index.html'),
        path.resolve(repoRoot, 'e2e/app/collision.html'),
        path.resolve(repoRoot, 'e2e/app/reduced-motion.html'),
        path.resolve(repoRoot, 'e2e/app/snapshots.html'),
        path.resolve(repoRoot, 'e2e/app/snapshots-overlays.html'),
        path.resolve(repoRoot, 'e2e/app/components/button.html'),
        path.resolve(repoRoot, 'e2e/app/components/pagination.html'),
        path.resolve(repoRoot, 'e2e/app/components/chatcontainer.html'),
        path.resolve(repoRoot, 'e2e/app/components/rtl-floating.html'),
        path.resolve(repoRoot, 'e2e/app/components/keyboard-critical.html'),
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: /^babel-runtime-jsx-plus$/,
        replacement: path.resolve(repoRoot, 'src/lib/utils/classnames.ts'),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    open: false,
    fs: {
      // The smoke app imports library source from ../../src/**, which is
      // outside the vite root — allow the whole repo.
      allow: [repoRoot],
    },
  },
  plugins: [
    jsxPlusPlugin(),
    react({ exclude: ['node_modules/**'] }),
    wyw({
      evaluate: false,
      sourceMap: true,
      exclude: ['node_modules/**'],
      classNameSlug: (hash, title, args) => `haze-${args.name}__${title}`,
    }),
  ],
});
