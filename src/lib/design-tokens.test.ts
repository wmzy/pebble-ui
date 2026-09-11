import type { TokenDef } from '@/lib/tokens/registry';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN_REGISTRY } from '@/lib/tokens/registry';

// 发布契约：dist/design-tokens/{light,dark}.json（generate-design-tokens.mjs
// 从构建产物 TOKEN_REGISTRY 导出的 W3C Design Tokens Format 文件，发布为
// haze-ui/design-tokens/*.json 子路径，供 Tokens Studio / Style Dictionary
// / Figma 管线消费）必须与源码 registry 逐条对账——工具链按 $value 落
// Figma 变量或生成平台 token，任何漂移直接污染下游设计资产。
// 本用例在「先 build 后 test」的 release 流水线里对将发布的 dist 实测；
// 无 dist 时（普通 CI 先 test 后 build）跳过。
const distDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../dist'
);
const built = existsSync(path.join(distDir, 'design-tokens', 'light.json'));

type DtfToken = { $type: string; $value: string; $description: string };
type DtfFile = {
  $schema: string;
  haze: Record<string, Record<string, DtfToken>>;
};

// describe.skip 仍会执行工厂函数（vitest 同 jest 语义：skip 只标记执行，
// 收集阶段照跑）——dist 缺席时工厂里不能做文件 IO，否则普通 CI
// （先 test 后 build）在本用例上套件级炸红。读操作一律以 built 门控。
const readTokenFile = (mode: 'light' | 'dark') =>
  built
    ? (JSON.parse(
        readFileSync(path.join(distDir, 'design-tokens', `${mode}.json`), 'utf8')
      ) as DtfFile)
    : undefined;

const lightFile = readTokenFile('light');
const darkFile = readTokenFile('dark');

// registry 存储类型 -> DTF $type（与 generate-design-tokens.mjs 的映射对账；
// 在测试里镜像映射而非 import 产物里的推导，才能抓住映射本身的漂移）。
const TYPE_MAP: Record<TokenDef['type'], string> = {
  color: 'color',
  size: 'dimension',
  font: 'fontFamily',
  number: 'number',
  shadow: 'shadow',
};

// 叶子键推导契约：剥 --haze- 前缀，name 自带类别前缀的（color/radius/
// shadow）再剥一层，domain 前缀（font-/space- 等）保留。
const leafKeyOf = (token: TokenDef) => {
  const stripped = token.name.replace(/^--haze-/, '');
  const categoryPrefix = `${token.category}-`;
  return stripped.startsWith(categoryPrefix)
    ? stripped.slice(categoryPrefix.length)
    : stripped;
};

const leafOf = (file: DtfFile, token: TokenDef): DtfToken => {
  const group = file.haze[token.category];
  if (group === undefined) {
    throw new Error(`missing group "${token.category}"`);
  }
  const entry = group[leafKeyOf(token)];
  if (entry === undefined) {
    throw new Error(`missing leaf "${token.category}.${leafKeyOf(token)}"`);
  }
  return entry;
};

const dtfContract = built ? describe : describe.skip;
dtfContract('dist 发布契约：design-tokens JSON 与 TOKEN_REGISTRY 一致', () => {
  it('两个文件可解析且顶层形状正确（$schema + haze 五组）', () => {
    for (const file of [lightFile, darkFile]) {
      if (file === undefined) throw new Error('unreachable: gated by built');
      expect(file.$schema).toBe('https://tr.designtokens.org/format/');
      expect(Object.keys(file.haze).sort()).toEqual([
        'color',
        'radius',
        'shadow',
        'spacing',
        'typography',
      ]);
    }
  });

  it('叶子键全局唯一且条数 = TOKEN_REGISTRY 长度（键冲突静默覆盖即红）', () => {
    for (const file of [lightFile, darkFile]) {
      if (file === undefined) throw new Error('unreachable: gated by built');
      const leaves = Object.entries(file.haze).flatMap(([group, entries]) =>
        Object.keys(entries).map((leaf) => `${group}.${leaf}`)
      );
      expect(new Set(leaves).size).toBe(leaves.length);
      expect(leaves.length).toBe(TOKEN_REGISTRY.length);
    }
  });

  it('每条 token 两文件都有叶子，$value/$type/$description 与 registry 逐条相等', () => {
    expect(TOKEN_REGISTRY.length).toBeGreaterThan(0);
    for (const token of TOKEN_REGISTRY) {
      for (const [file, mode] of [
        [lightFile, 'light'],
        [darkFile, 'dark'],
      ] as const) {
        if (file === undefined) throw new Error('unreachable: gated by built');
        const entry = leafOf(file, token);
        expect(entry.$value).toBe(token[mode]);
        expect(entry.$type).toBe(TYPE_MAP[token.type]);
        expect(entry.$description).toBe(token.label);
      }
    }
  });

  it('叶子键锚点：规格示例键位稳定（下游管线按这些路径取值）', () => {
    // 与 generate-design-tokens.mjs 注释里的规格示例一一对应，锁死
    // leafKey 推导不被无意改动。
    const anchors: Record<string, string> = {
      '--haze-color-primary': 'color.primary',
      '--haze-font-sans': 'typography.font-sans',
      '--haze-space-2': 'spacing.space-2',
      '--haze-radius-md': 'radius.md',
      '--haze-shadow-lg': 'shadow.lg',
    };
    if (lightFile === undefined) throw new Error('unreachable: gated by built');
    const byName = new Map(TOKEN_REGISTRY.map((t) => [t.name, t]));
    for (const [name, anchor] of Object.entries(anchors)) {
      // 锚点 token 必须仍存在于 registry（改名后锚点静默变空转即红）。
      expect(byName.has(name)).toBe(true);
      const [group, leaf] = anchor.split('.') as [string, string];
      expect(Object.hasOwn(lightFile.haze[group] ?? {}, leaf)).toBe(true);
    }
  });
});
