import generatedProps from '@/generated/props.json';

/**
 * “Open in StackBlitz”支持：把 demo 源码组装成可独立运行的
 * Vite + React + haze-ui 工程的内存文件树（纯函数，不触碰 sdk）。
 */

/** generatedProps.components 里每个组件条目中本模块关心的字段。 */
type GeneratedComponentEntry = {
  routeKey: string;
  cssFamily?: string;
};

export type StackblitzProject = {
  title: string;
  template: 'node';
  files: Record<string, string>;
  openFile: string;
};

/** demo 源码中可能出现、react/react-dom/haze-ui 之外的第三方依赖 → 版本。 */
const KNOWN_RUNTIME_DEPS: Record<string, string> = {
  'react-icons': '^5.7.0',
  'lucide-react': '^1.41.0',
  '@linaria/core': '^8.2.0',
  '@tanstack/react-table': '^9.2.4',
  'react-use-control': '^1.6.0',
};

const REACT_VERSION = '^19.2.8';
const HAZE_UI_VERSION = '^1.21.0';

/** 匹配 `from 'x'` / `import 'x'` / `import('x')` / `require('x')` 的说明符。 */
const IMPORT_SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

/** 'react-icons/fi' → 'react-icons'；'@scope/pkg/sub' → '@scope/pkg'。 */
function packageNameOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

/** route key（'data-table'）→ css family（'data-table'）；查不到 → undefined。 */
function cssFamilyFor(name: string): string | undefined {
  const components =
    generatedProps.components as Record<string, GeneratedComponentEntry>;
  return Object.values(components).find((entry) => entry.routeKey === name)
    ?.cssFamily;
}

/** 扫描源码 import 语句，收集已知第三方依赖（忽略相对/绝对导入）。 */
function inferDependencies(source: string): Record<string, string> {
  const deps: Record<string, string> = {};
  for (const match of source.matchAll(IMPORT_SPECIFIER_RE)) {
    const specifier = match[1]!;
    if (specifier.startsWith('.') || specifier.startsWith('/')) continue;
    const pkg = packageNameOf(specifier);
    const version = KNOWN_RUNTIME_DEPS[pkg];
    if (version && !(pkg in deps)) deps[pkg] = version;
  }
  return deps;
}

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>haze-ui demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // demo 源码统一从 '@/lib' 导入组件，直接解析到 npm 包
      '@/lib': 'haze-ui',
    },
  },
});
`;

/**
 * 组装 StackBlitz 工程：App.tsx 为 demo 源码原文；'@/lib' 由 vite alias
 * 解析到 haze-ui 包；main.tsx 引入 tokens.css 与该组件的 css family
 * （routeKey 查不到时回退 tokens-only，不抛错）；源码 import 的已知
 * 第三方库追加进 dependencies。
 */
export function buildStackblitzProject(
  name: string,
  source: string
): StackblitzProject {
  const cssFamily = cssFamilyFor(name);
  const cssImports = [
    "import 'haze-ui/css/tokens.css';",
    ...(cssFamily ? [`import 'haze-ui/css/${cssFamily}.css';`] : []),
  ].join('\n');

  const main = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

${cssImports}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

  const pkg = {
    name: 'haze-ui-demo',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { dev: 'vite' },
    dependencies: {
      react: REACT_VERSION,
      'react-dom': REACT_VERSION,
      'haze-ui': HAZE_UI_VERSION,
      ...inferDependencies(source),
    },
    devDependencies: {
      vite: '^8.2.2',
      '@vitejs/plugin-react': '^6.1.1',
      typescript: '^6.0.3',
    },
  };

  return {
    title: `haze-ui · ${name} demo`,
    template: 'node',
    files: {
      'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
      'vite.config.ts': viteConfig,
      'index.html': indexHtml,
      'src/main.tsx': main,
      'src/App.tsx': source,
    },
    openFile: 'src/App.tsx',
  };
}
