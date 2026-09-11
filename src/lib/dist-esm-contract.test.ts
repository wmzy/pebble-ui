import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { rscSafeDistPaths } from '../../scripts/rsc-safe.mjs';

// 发布契约：dist 产物必须能被 Node 原生 ESM（以及 vitest 的外置依赖
// 通道）直接 import。两段历史教训：
// 1. ≤1.6.x 的 dist 以运行时依赖引入 babel-runtime-jsx-plus——该包只发
//    UMD（cjs-module-lexer 无法静态分析其具名导出），Node ESM 链接期
//    报 "does not provide an export named 'classnames'"，下游（painless
//    等）被迫在 vitest 里整体 stub/mock haze-ui。1.11 预打包改为内联
//    运行时后消除。
// 2. 1.11～1.11.0 的 dist 各模块副作用导入 *.wyw-in-js.css——Node 原生
//    ESM 解析不了 .css 说明符，下游只能靠 server.deps.inline 绕行。
//    v1.11.1 起 split-css 剥离这些导入后消除。
// 本用例在「先 build 后 test」的 release 流水线里对将发布的 dist 实测；
// 无 dist 时（普通 CI 先 test 后 build）跳过。
const distDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../dist'
);
const built = existsSync(path.join(distDir, 'index.js'));

function collectJs(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory()
      ? collectJs(path.join(dir, entry.name), rel)
      : entry.name.endsWith('.js')
        ? [rel]
        : [];
  });
}

const jsFiles = built ? collectJs(distDir) : [];

// 'use client' 指令（vite banner 注入；rolldown 的 oxc codegen 会把单引号
// 重印为双引号，两种引号对 Next.js / React Flight / SWC 完全等价）。
const useClientDirective = /^\s*(['"])use client\1;/;
// RSC-safe 名单（scripts/rsc-safe.mjs）映射到 dist 产物路径。名单内模块
// 免指令，可被 React Server Component 直接 import。
const safeDistPaths = rscSafeDistPaths();

const distContract = built ? describe : describe.skip;
distContract('dist 发布契约：Node ESM / vitest 可直接 import', () => {
    it('JS 产物不残留 .css 说明符导入（Node 原生 ESM 解析不了 .css）', () => {
      const offenders = jsFiles.filter((rel) =>
        /(?:from\s*|import\s*)["'][^"']+\.css["']/.test(
          readFileSync(path.join(distDir, rel), 'utf8')
        )
      );
      expect(offenders).toEqual([]);
    });

    it('非 RSC-safe 模块首非空行是 use client 指令（Next.js App Router 客户端边界）', () => {
      // vite 库构建的 output.banner 注入。rolldown 的 oxc codegen 会把
      // banner 里的指令重印为双引号（'use client' → "use client"），两种
      // 引号对 Next.js / React Flight / SWC 完全等价，故都放行。指令必须
      // 位于任何 import 之前——断言"首个非空行"即隐含该约束。RSC-safe
      // 名单（scripts/rsc-safe.mjs：无 hook 的纯展示组件 + tokens +
      // classnames 运行时）例外，见下方两个用例。全量扫描严格强于抽查
      // （子 path 消费者可 import 任意模块，漏一个即在 server component
      // 里报 "needs useState"）。CSS 与 .d.ts 产物不经 JS banner，天然
      // 不含指令。
      const offenders = jsFiles.filter(
        (rel) =>
          !safeDistPaths.has(rel) &&
          !useClientDirective.test(readFileSync(path.join(distDir, rel), 'utf8'))
      );
      expect(offenders).toEqual([]);
    });

    it('RSC-safe 名单模块免 use client 指令，可作为 Server Component 直连', () => {
      // 名单缺文件同样是违规：safe 模块必须真实出现在 dist（每个组件目录
      // barrel 是 lib entry，tokens/classnames 经 import 图可达）。
      const offenders = [...safeDistPaths].filter(
        (rel) =>
          !existsSync(path.join(distDir, rel)) ||
          useClientDirective.test(
            readFileSync(path.join(distDir, rel), 'utf8')
          )
      );
      expect(offenders).toEqual([]);
    });

    it('RSC-safe 模块的传递闭包不跨越客户端边界', () => {
      // server bundler 从 safe 模块出发解析静态 import：一旦途中遇到
      // 'use client' 模块，该 import 变成 client reference，渲染即抛错。
      // 因此 safe 模块在 dist 内部的依赖闭包必须整体属于 safe 名单——
      // 共享运行时（utils/classnames.js）在名单里正是为此。
      const importRe = /(?:from|import)\s*["']([^"']+)["']/g;
      const offenders: string[] = [];
      for (const start of safeDistPaths) {
        const seen = new Set<string>();
        const queue = [start];
        while (queue.length > 0) {
          const rel = queue.pop()!;
          if (seen.has(rel)) continue;
          seen.add(rel);
          const source = readFileSync(path.join(distDir, rel), 'utf8');
          for (const match of source.matchAll(importRe)) {
            const spec = match[1];
            if (!spec?.startsWith('.')) continue; // 外部依赖（react 等）
            const resolved = path
              .posix.normalize(path.posix.join(path.posix.dirname(rel), spec))
              .replace(/^\//, '');
            if (!safeDistPaths.has(resolved)) offenders.push(`${start} -> ${resolved}`);
            if (!seen.has(resolved)) queue.push(resolved);
          }
        }
      }
      expect([...new Set(offenders)].sort()).toEqual([]);
    });

    it('基础 Tag 组件族保持 dnd-free：仅 Sortable* 变体与 utils 原语可触 @dnd-kit', () => {
      // @dnd-kit 三件套是 optional peers（Chart/recharts 同款契约）：
      // 基础 TagGroup/TagGroupItem/TagInput/TagInputCore 不得引用它们，
      // 否则每个消费者都被迫安装 dnd 运行时。只有 Sortable* 变体和
      // utils/sortable、utils/sortable-shared 两个原语模块允许静态引入。
      // 名单与产物双向对齐（镜像 RSC-safe 用例的两侧校验）：名单外出现
      // @dnd-kit 导入违规；名单内已存在的模块却没有引用（陈旧名单）
      // 同样违规。utils/sortable-handle 的 @dnd-kit 导入是 type-only，
      // 转译后擦除，故不在名单内。按导入说明符匹配而非裸字符串，避免
      // 产物里保留的 JSDoc 文字误报。
      const dndImport = /(?:from|import)\s*["']@dnd-kit[^"']*["']/;
      const allowlist = new Set([
        'components/TagGroup/SortableTagGroup.js',
        'components/TagInput/SortableTagInputCore.js',
        'utils/sortable.js',
        'utils/sortable-shared.js',
      ]);
      const offenders = jsFiles.filter(
        (rel) =>
          !allowlist.has(rel) &&
          dndImport.test(readFileSync(path.join(distDir, rel), 'utf8'))
      );
      expect(offenders).toEqual([]);
      const stale = [...allowlist].filter(
        (rel) =>
          existsSync(path.join(distDir, rel)) &&
          !dndImport.test(readFileSync(path.join(distDir, rel), 'utf8'))
      );
      expect(stale).toEqual([]);
    });

    it('barrel / form / headless / 有状态组件 / 浮层原语仍注入 use client', () => {
      // 根 barrel re-export 全量组件（含状态组件），必须保持客户端边界；
      // form/headless（hooks）、Switch/Button（useControl/内部状态）、
      // utils/floating（浮层原语）同理。
      const mustBeClient = [
        'index.js',
        'form/index.js',
        'headless/index.js',
        'components/Switch/Switch.js',
        'components/Switch/index.js',
        'components/Button/Button.js',
        'utils/floating.js',
      ];
      const offenders = mustBeClient.filter(
        (rel) =>
          !existsSync(path.join(distDir, rel)) ||
          !useClientDirective.test(
            readFileSync(path.join(distDir, rel), 'utf8')
          )
      );
      expect(offenders).toEqual([]);
    });

    it('入口在裸 Node ESM 下可完整链接并执行（UMD 具名导出回归在此复现）', () => {
      // 子进程裸跑 node，而非 vite 管线内的动态 import：vite 会把 .css
      // 当资源处理、把 CJS 转换包装，恰好掩盖上面两段历史坑。
      const script = `import(${JSON.stringify(
        pathToFileURL(path.join(distDir, 'index.js')).href
      )})\n  .then((m) => { if (!m.Button) process.exit(2); })\n  .catch((e) => { console.error(e.message); process.exit(1); });`;
      // 任一非零退出码都会让 execFileSync 抛错（含 stderr 的错误信息）
      execFileSync('node', ['--input-type=module', '-e', script], {
        stdio: 'pipe',
      });
    });
  }
);
