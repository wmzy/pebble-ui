import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * axe baseline for the core interactive components (Popover, menu class,
 * Toast, FormItem) — states both closed and open/errored, since the open
 * panels carry the aria wiring. Only WCAG-tagged rules run: the harness
 * page is not a real document (no landmarks/h1), and best-practice-only
 * rules like `region` / `page-has-heading-one` are noise here — the same
 * policy as the unit-level jest-axe scans, which disable `region`.
 */

const WCAG_TAGS = [
  'wcag2a',
  'wcag21a',
  'wcag2aa',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
];

async function scan(page: Page, selector: string) {
  const results = await new AxeBuilder({page})
    .withTags(WCAG_TAGS)
    .include(selector)
    .analyze();
  const summary = results.violations
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .map((n) => n.target.join(' '))
          .join('; ')}`
    )
    .join('\n');
  expect(summary || 'no violations', summary).toBe('no violations');
}

/**
 * Open panels and toasts animate in via data-state (opacity fade over
 * the motion tokens); scanning a mid-fade element makes axe's
 * visibility math nondeterministic. Wait until no enter animation is
 * running and opacity is back at 1 (elements without data-state or
 * animation settle immediately).
 */
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

test.describe('axe baseline', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
  });

  test('closed Popover and menu triggers', async ({page}) => {
    await scan(page, '#popover-demo');
    await scan(page, '#menu-demo');
  });

  test('open Popover panel', async ({page}) => {
    const trigger = page.getByText('Open popover');
    await trigger.click();
    const panelId = await trigger.getAttribute('aria-controls');
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();
    await waitForOpenAnimationToSettle(panel);
    await scan(page, '#popover-demo');
  });

  test('open dropdown menu', async ({page}) => {
    await page.getByRole('button', {name: 'Actions'}).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await waitForOpenAnimationToSettle(menu);
    await scan(page, '#menu-demo');
  });

  test('shown toast', async ({page}) => {
    await page.locator('#toast-opener').click();
    // Demo opens a success toast, which now announces politely (role=status);
    // only danger toasts use the assertive alert role.
    const toast = page.getByRole('status');
    await expect(toast).toBeVisible();
    await waitForOpenAnimationToSettle(toast);
    await scan(page, '#toast-demo');
  });

  test('FormItem with and without validation error', async ({page}) => {
    await scan(page, '#form-demo');
    await page.getByRole('button', {name: 'Submit'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await scan(page, '#form-demo');
  });
});
