import { expect, test, type Locator } from '@playwright/test';

/**
 * Stable-state pixel baselines across the component library, one frame
 * per component: twenty static surfaces from e2e/app/snapshots.html
 * (mounted fully determined — controlled values, no timers, no network)
 * and the six overlay surfaces from e2e/app/snapshots-overlays.html,
 * captured in their open state. Cross-platform tolerance is configured
 * once in playwright.config.ts (maxDiffPixelRatio 0.02 — same pinned
 * Chromium locally and in CI, but host font fallbacks and rasterization
 * differ slightly); see the comment there for the rationale. Baselines
 * are chromium-only: the firefox/webkit projects pin testMatch to the
 * behavioral specs and never run this file.
 *
 * Overlay panels fade in over the motion tokens before reaching their
 * final state (identical pixels: the keyframes only animate opacity /
 * an initial 0.97 scale back to rest). Screenshots wait for that enter
 * animation to settle or they capture a mid-fade frame. Each test opens
 * exactly one panel on a fresh page — several popover=auto panels
 * cannot coexist (the browser light-dismisses all but the last), and a
 * statically-open modal dialog would block every other section's
 * trigger.
 *
 * Spinner and Skeleton run infinite keyframes (spin / shimmer); the
 * fixture pins them to their unanimated base frame via a `frozen`
 * class — Playwright pauses infinite animations at their current phase,
 * which is an arbitrary rotation/opacity per run.
 */

/** Waits until no enter animation is running and opacity is back to 1. */
async function waitForOpenAnimationToSettle(panel: Locator): Promise<void> {
  await expect
    .poll(() =>
      panel.evaluate((el) => {
        if (el.dataset.state === 'closed') return false;
        return (
          el.getAnimations({ subtree: true }).length === 0 &&
          getComputedStyle(el).opacity === '1'
        );
      })
    )
    .toBe(true);
}

const STATIC_SECTIONS = [
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'badge',
  'avatar',
  'tag',
  'tabs',
  'table',
  'pagination',
  'card',
  'spinner',
  'progress',
  'skeleton',
  'chatmessage',
  'markdown',
] as const;

test.describe('visual baselines — static components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snapshots');
  });

  for (const name of STATIC_SECTIONS) {
    test(`${name} baseline frame`, async ({ page }) => {
      const section = page.locator(`[data-snap="${name}"]`);
      await expect(section).toBeVisible();
      await expect(section).toHaveScreenshot(`${name}.png`);
    });
  }

  test('accordion baseline frame (first item open)', async ({ page }) => {
    const section = page.locator('[data-snap="accordion"]');
    await section.locator('details').first().locator('summary').click();
    await expect(section.locator('details').first()).toHaveAttribute(
      'open',
      ''
    );
    await expect(section).toHaveScreenshot('accordion.png');
  });
});

test.describe('visual baselines — overlay components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snapshots-overlays');
  });

  test('tooltip bubble', async ({ page }) => {
    await page.getByRole('button', { name: 'Hover for help' }).hover();
    const bubble = page.getByRole('tooltip');
    await expect(bubble).toBeVisible();
    await waitForOpenAnimationToSettle(bubble);
    await expect(bubble).toHaveScreenshot('tooltip-open.png');
  });

  test('popover panel', async ({ page }) => {
    const trigger = page.getByText('Open popover');
    await trigger.click();
    const panelId = await trigger.getAttribute('aria-controls');
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();
    await waitForOpenAnimationToSettle(panel);
    await expect(panel).toHaveScreenshot('popover-open.png');
  });

  test('dropdown menu panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await waitForOpenAnimationToSettle(menu);
    await expect(menu).toHaveScreenshot('dropdown-menu-open.png');
  });

  test('combobox open (focused input + listbox)', async ({ page }) => {
    const input = page.getByRole('combobox');
    // Open via a real pointer click — the first-click race (focus-driven
    // open light-dismissed by the same gesture) is fixed: Combobox opens
    // through the suppression-aware onTriggerClick, like Datepicker.
    // Focus follows the click, so the input keeps its focus ring in the
    // captured frame, matching the keyboard user's view.
    await input.click();
    const panelId = await input.getAttribute('aria-controls');
    const listbox = page.locator(`[id="${panelId}"]`);
    await expect(listbox).toBeVisible();
    // Width contract: on the anchored tier the panel's containing block
    // is the viewport-wide position-area region, so `min-width: 100%`
    // alone inflated a 240px input's listbox to ~1234px. The
    // `anchor-size(width)` re-pin must keep the panel at trigger width
    // (the fallback tier's 100% resolves to the input-width wrapper, so
    // the same contract holds on every engine).
    const inputBox = await input.boundingBox();
    const listboxBox = await listbox.boundingBox();
    expect(Math.abs(listboxBox!.width - inputBox!.width)).toBeLessThanOrEqual(1);
    await waitForOpenAnimationToSettle(listbox);
    // The panel is promoted to the top layer, so it paints outside the
    // component subtree — capture it directly, plus the focused trigger
    // (focus ring + placeholder) as its own frame.
    await expect(listbox).toHaveScreenshot('combobox-listbox-open.png');
    await expect(input).toHaveScreenshot('combobox-input-focused.png');
  });

  test('dialog', async ({ page }) => {
    await page.locator('#dialog-opener').click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await waitForOpenAnimationToSettle(dialog);
    await expect(dialog).toHaveScreenshot('dialog-open.png');
  });

  test('toast', async ({ page }) => {
    // duration 0 arms no auto-dismiss timer — the toast stays mounted.
    await page.locator('#toast-opener').click();
    const toast = page.getByRole('status');
    await expect(toast).toBeVisible();
    await waitForOpenAnimationToSettle(toast);
    await expect(toast).toHaveScreenshot('toast-open.png');
  });
});
