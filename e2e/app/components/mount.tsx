/**
 * Shared bootstrap for the per-component harness pages under
 * e2e/app/components/: mounts the page root with the library's token
 * classes applied (lightTheme colors + spacing/typography/motion scales),
 * mirroring the main smoke page so the library CSS resolves real token
 * values under Playwright.
 */
import type { CSSProperties, ReactNode } from 'react';

import { css } from '@linaria/core';
import { createRoot } from 'react-dom/client';

import { lightTheme } from '../../../src/lib/tokens/colors';
import { motion } from '../../../src/lib/tokens/motion';
import { spacing } from '../../../src/lib/tokens/spacing';
import { typography } from '../../../src/lib/tokens/typography';

import '../e2e-fonts.css';

// Inline style: the typography class also declares --haze-font-mono on
// the same element, and inline wins regardless of stylesheet emission
// order — see e2e-fonts.css for why the harness pins the font.
const pinnedMono = {
  '--haze-font-mono': "'Haze E2E Mono', monospace",
} as CSSProperties;

const shell = css`
  min-height: 100vh;
  box-sizing: border-box;
  margin: 0;
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  max-width: 40rem;
`;

export function mountPage(ui: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <div
      className={`${shell} ${lightTheme} ${spacing} ${typography} ${motion}`}
      style={pinnedMono}
    >
      {ui}
    </div>
  );
}
