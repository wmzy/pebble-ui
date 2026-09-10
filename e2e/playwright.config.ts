import * as path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  snapshotDir: './__snapshots__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5199',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      // Pixel baselines run on the same Playwright-pinned Chromium locally
      // and in CI, but host fontconfig fallbacks and GPU vs software
      // rasterization can still shift subpixels at text edges. A 2% pixel
      // ratio absorbs that platform noise without masking layout or color
      // regressions (panels are far more than 2% pixels).
      maxDiffPixelRatio: 0.02,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Firefox runs the engine-sensitive behavioral specs (pinned via
      // testMatch): the floating-collision spec plus the three overlay
      // specs (popover, dialog, dropdown-menu) — those exercise the
      // native popover/top-layer + anchor-positioning paths that vary
      // across engines. Firefox resolves the anchored tier like chromium
      // (anchor positioning shipped in Firefox 141+), and falls to the
      // JS-positioned tier on older engines — the specs assert the same
      // contracts either way. The rtl and keyboard-critical specs extend
      // the engine matrix without pixel baselines: logical-property
      // mirroring and keyboard interaction contracts (Tree roving,
      // Combobox multi-select chips, Calendar picker-mode grids) must
      // hold on every engine. Everything else stays chromium-only,
      // including the pixel baselines, which have no firefox snapshots.
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /(floating-collision|popover|dialog|dropdown-menu|rtl|keyboard-critical)\.spec\.ts$/,
    },
    {
      // WebKit likewise (anchor positioning shipped in WebKit 2.46+);
      // same engine-sensitive scope as firefox: collision + overlays +
      // rtl + keyboard-critical.
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /(floating-collision|popover|dialog|dropdown-menu|rtl|keyboard-critical)\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'npx vite --config e2e/vite.config.mts --port 5199',
    url: 'http://127.0.0.1:5199',
    cwd: repoRoot,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
