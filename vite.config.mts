import * as path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import rollupPluginTypeAsJsonSchema from 'rollup-plugin-type-as-json-schema';

export default defineConfig({
  resolve: {
    // conditions: [ 'browser', 'import', 'module', 'default' ],
    alias: [
      {
        find: /^@\/(.*)/,
        replacement: `${path.join(__dirname, 'src/$1')}`,
      },
    ],
  },
  esbuild: false,
  server: {
    open: true,
  },
  plugins: [
    react({
      exclude: ['node_modules/**'],
      babel: {
        configFile: true,
        babelrc: true,
      },
    }),
    rollupPluginTypeAsJsonSchema(),
    wyw({
      evaluate: false,
      sourceMap: true,
      exclude: ['node_modules/**'],
    }),
  ],
  optimizeDeps: {
    include: ['babel-runtime-jsx-plus'],
  },
});
