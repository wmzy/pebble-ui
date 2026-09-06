/* eslint-disable react-refresh/only-export-components --
   demo-app shared module: css snippets + helpers sit beside demo-only components;
   fast-refresh purity is irrelevant for the docs site (see utils/floating.tsx precedent) */
import { css } from '@linaria/core';

import { COMPONENT_TOKENS } from '@/lib';

import TokensTable from '../TokensTable';

import { section } from '../styles';

export const noop = () => {
  /* demo placeholder */
};

export function CssVarsSection({ component }: { component: string }) {
  const tokens = COMPONENT_TOKENS[component];
  if (!tokens?.length) return null;
  return (
    <div className={section}>
      <h2>CSS Variables</h2>
      <TokensTable tokens={tokens} />
    </div>
  );
}

// ─── Shared SVG helpers ─────────────────────────────────────────
export function StrokeSvg() {
  return (
    <svg viewBox='0 0 24 24'>
      <path
        d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>
  );
}

export const dataTableMeta = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

export const dataTableNote = css`
  max-width: 75ch;
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);

  code {
    font-family: var(--haze-font-mono);
    font-size: var(--haze-text-xs);
  }
`;

export const feedToolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  margin-bottom: var(--haze-space-3);
`;

export const feedMeta = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;
