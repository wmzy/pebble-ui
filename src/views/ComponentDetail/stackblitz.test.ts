import { buildStackblitzProject } from './stackblitz';

type GeneratedPkg = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
};

const parsePkg = (raw: string): GeneratedPkg => JSON.parse(raw) as GeneratedPkg;

const buttonSource = `import { Button } from '@/lib';

export default function Demo() {
  return <Button variant='solid'>Solid</Button>;
}
`;

describe('buildStackblitzProject', () => {
  it('emits a package.json with react/react-dom/haze-ui and vite devDeps', () => {
    const project = buildStackblitzProject('button', buttonSource);
    const pkg = parsePkg(project.files['package.json']!);
    expect(pkg.dependencies['haze-ui']).toBeDefined();
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
    expect(pkg.scripts.dev).toBe('vite');
  });

  it('returns a node template project opened on src/App.tsx', () => {
    const project = buildStackblitzProject('button', buttonSource);
    expect(project.template).toBe('node');
    expect(project.openFile).toBe('src/App.tsx');
  });

  it('aliases @/lib to the haze-ui package in vite.config.ts', () => {
    const viteConfig = buildStackblitzProject('button', buttonSource).files[
      'vite.config.ts'
    ]!;
    expect(viteConfig).toContain("'@/lib': 'haze-ui'");
  });

  it('embeds the demo source verbatim as src/App.tsx', () => {
    const project = buildStackblitzProject('button', buttonSource);
    expect(project.files['src/App.tsx']).toBe(buttonSource);
  });

  it('imports tokens.css and the component css family in src/main.tsx', () => {
    const main = buildStackblitzProject('button', buttonSource).files[
      'src/main.tsx'
    ]!;
    expect(main).toContain("import 'haze-ui/css/tokens.css'");
    expect(main).toContain("import 'haze-ui/css/button.css'");
    expect(main).toContain("from 'react-dom/client'");
  });

  it('appends known libs imported by the demo to dependencies', () => {
    const source = `import { Smile } from 'lucide-react';
import { FiX } from 'react-icons/fi';
import { Button } from '@/lib';

export default function Demo() {
  return <Button>hi</Button>;
}
`;
    const pkg = parsePkg(
      buildStackblitzProject('button', source).files['package.json']!
    );
    expect(pkg.dependencies['lucide-react']).toBeDefined();
    // 子路径导入（react-icons/fi）归并到包名
    expect(pkg.dependencies['react-icons']).toBeDefined();
  });

  it('falls back to tokens-only css when the routeKey is unknown', () => {
    const project = buildStackblitzProject('form', buttonSource);
    const main = project.files['src/main.tsx']!;
    expect(main).toContain("import 'haze-ui/css/tokens.css'");
    expect(main).not.toMatch(/haze-ui\/css\/(?!tokens)/);
    // 工程文件树依然完整
    expect(Object.keys(project.files)).toContain('src/App.tsx');
  });
});
