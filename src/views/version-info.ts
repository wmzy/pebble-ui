import versionJson from '@/generated/version.json';

/**
 * src/generated/version.json 由 scripts/write-version.mjs 在 demo 构建前
 * 从 git 写入（无 git 时为 dev 占位）。字段可能为 null，展示侧必须兜底。
 */
export type VersionInfo = {
  version: string;
  gitTag: string | null;
  commit: string | null;
  buildDate: string | null;
};

export const versionInfo = versionJson as VersionInfo;

const REPO = 'wmzy/haze-ui';

/** 「查看源码」链接：有 tag 指向 tag 的 tree，降级时指向 main。 */
export const sourceUrl = `https://github.com/${REPO}/tree/${
  versionInfo.gitTag ?? 'main'
}`;

export const shortCommit = versionInfo.commit
  ? versionInfo.commit.slice(0, 7)
  : null;
