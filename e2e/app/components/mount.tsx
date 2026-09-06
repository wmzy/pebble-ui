/**
 * Shared bootstrap for the per-component harness pages under
 * e2e/app/components/: mounts the page root with the library's token
 * classes applied (lightTheme colors + spacing/typography/motion scales),
 * mirroring the main smoke page so the library CSS resolves real token
 * values under Playwright.
 */
import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { createRoot } from 'react-dom/client';

import { lightTheme } from '../../../src/lib/tokens/colors';
import { motion } from '../../../src/lib/tokens/motion';
import { spacing } from '../../../src/lib/tokens/spacing';
import { typography } from '../../../src/lib/tokens/typography';

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
    <div className={`${shell} ${lightTheme} ${spacing} ${typography} ${motion}`}>
      {ui}
    </div>
  );
}
