import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * prefers-reduced-motion contract: the motion token class
 * (src/lib/tokens/motion.ts) overrides --haze-duration-fast/normal/slow
 * to 0ms inside `@media (prefers-reduced-motion: reduce)`. Every
 * token-driven transition and enter/exit animation must therefore
 * resolve to 0s computed durations under
 * emulateMedia({ reducedMotion: 'reduce' }), and keep non-zero values
 * under 'no-preference' — including after a live preference flip
 * without a reload, since the media query re-evaluates in place.
 */

/** Parse a possibly comma-separated computed duration list into seconds. */
function seconds(computed: string): number[] {
  return computed.split(',').map((entry) => parseFloat(entry));
}

async function gotoAt(
  page: Page,
  reducedMotion: 'reduce' | 'no-preference'
): Promise<void> {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/reduced-motion.html');
}

/** The harness root carries the motion token class (components/mount.tsx). */
async function durationTokens(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('#root > div')!);
    return [
      style.getPropertyValue('--haze-duration-fast'),
      style.getPropertyValue('--haze-duration-normal'),
      style.getPropertyValue('--haze-duration-slow'),
    ];
  });
}

async function openPopoverPanel(page: Page): Promise<Locator> {
  const trigger = page.getByText('Open popover');
  await trigger.click();
  const panelId = await trigger.getAttribute('aria-controls');
  const panel = page.locator(`[id="${panelId}"]`);
  await expect(panel).toBeVisible();
  return panel;
}

async function openDialog(page: Page): Promise<Locator> {
  await page.click('#dialog-opener');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('prefers-reduced-motion', () => {
  test('collapses every --haze-duration-* token to 0ms under reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'reduce');
    expect(await durationTokens(page)).toEqual(['0ms', '0ms', '0ms']);
  });

  test('keeps full token values without reduce', async ({ page }) => {
    await gotoAt(page, 'no-preference');
    expect(await durationTokens(page)).toEqual(['120ms', '200ms', '300ms']);
  });

  test('token override responds to a live preference change', async ({
    page,
  }) => {
    await gotoAt(page, 'no-preference');
    expect(await durationTokens(page)).toEqual(['120ms', '200ms', '300ms']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await durationTokens(page)).toEqual(['0ms', '0ms', '0ms']);
  });

  test('button hover transitions resolve to 0s under reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'reduce');
    const computed = await page
      .getByRole('button', { name: 'Solid action' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(seconds(computed).every((s) => s === 0)).toBe(true);
  });

  test('button hover transitions stay animated without reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'no-preference');
    const computed = await page
      .getByRole('button', { name: 'Solid action' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(seconds(computed).every((s) => s > 0)).toBe(true);
  });

  test('switch state transitions resolve to 0s under reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'reduce');
    const computed = await page
      .getByRole('switch', { name: 'Motion switch' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(seconds(computed).every((s) => s === 0)).toBe(true);
  });

  test('switch state transitions stay animated without reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'no-preference');
    const computed = await page
      .getByRole('switch', { name: 'Motion switch' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(seconds(computed).every((s) => s > 0)).toBe(true);
  });

  test('popover enter animation resolves to 0s under reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'reduce');
    const panel = await openPopoverPanel(page);
    expect(
      await panel.evaluate((el) => getComputedStyle(el).animationDuration)
    ).toBe('0s');
  });

  test('popover enter animation runs at the fast duration without reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'no-preference');
    const panel = await openPopoverPanel(page);
    expect(
      await panel.evaluate((el) => getComputedStyle(el).animationDuration)
    ).toBe('0.12s');
  });

  test('dialog enter animation resolves to 0s under reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'reduce');
    const dialog = await openDialog(page);
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).animationDuration)
    ).toBe('0s');
  });

  test('dialog enter animation runs at the normal duration without reduce', async ({
    page,
  }) => {
    await gotoAt(page, 'no-preference');
    const dialog = await openDialog(page);
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).animationDuration)
    ).toBe('0.2s');
  });
});
