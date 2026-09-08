/**
 * Demo 构建前运行：把当前 git 状态写入 src/generated/version.json，
 * 供文档站页头与 Changelog 展示「本文档对应哪个版本」。
 *
 * - 降级：git 不可用（或仓库无 tag）时写 dev 占位，构建不因此失败。
 * - 幂等：version/gitTag/commit 与现有文件一致时保留原 buildDate，
 *   重复运行零 diff（version.json 入库，避免本地 build:demo 弄脏工作区）。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/generated/version.json'
);

/** git 命令失败（无 git / 浅克隆无 tag / 非仓库）一律返回 null。 */
function git(args) {
  try {
    const out = execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

const gitTag = git(['describe', '--tags', '--abbrev=0']);
const commit = git(['rev-parse', 'HEAD']);
const next = {
  version: gitTag ?? 'dev',
  gitTag,
  commit,
  buildDate: new Date().toISOString(),
};

let current = null;
try {
  current = JSON.parse(readFileSync(target, 'utf8'));
} catch {
  // 占位文件缺失或损坏，走全量写入。
}

const derivedUnchanged =
  current != null &&
  current.version === next.version &&
  current.gitTag === next.gitTag &&
  current.commit === next.commit &&
  typeof current.buildDate === 'string';

if (derivedUnchanged) {
  console.log(`version.json up to date: ${next.version} @ ${commit ?? 'unknown'}`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`version.json written: ${next.version} @ ${commit ?? 'unknown'}`);
}
