import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

    it('每个 JS 模块首非空行是 use client 指令（Next.js App Router 客户端边界）', () => {
      // vite 库构建的 output.banner 注入。rolldown 的 oxc codegen 会把
      // banner 里的指令重印为双引号（'use client' → "use client"），两种
      // 引号对 Next.js / React Flight / SWC 完全等价，故都放行。指令必须
      // 位于任何 import 之前——断言"首个非空行"即隐含该约束。全量扫描
      // 严格强于抽查（子path 消费者可 import 任意模块，漏一个即在
      // server component 里报 "needs useState"）。CSS 与 .d.ts 产物不经
      // JS banner，天然不含指令。
      const directive = /^\s*(['"])use client\1;/;
      const offenders = jsFiles.filter(
        (rel) =>
          !directive.test(
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
