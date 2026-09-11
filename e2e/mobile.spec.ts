import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Mobile overlay contracts on a phone viewport (chromium-mobile project:
 * Pixel 7 emulation — 412×839, touch, isMobile). The behaviors a desktop
 * viewport cannot vouch for:
 *
 *   - BottomSheet (swipeToDismiss): the drag follows the finger
 *     (translateY tracks the pointer), releasing past the threshold
 *     dismisses through the onClose exit (counted once), releasing
 *     under it springs the sheet back to its resting position;
 *   - Drawer: the right drawer runs the native modal path, covers the
 *     full viewport height and pins to the physical right edge at 320px
 *     (within its 85vw clamp), and Escape runs the animated exit;
 *   - Dialog: `width: 100%` / `max-width: 480px` clamps to the narrow
 *     viewport — the panel spans it exactly with no horizontal overflow;
 *   - Popover: a tap opens the panel anchored below the trigger, and an
 *     outside tap light-dismisses it.
 *
 * Mouse-driven pointer drags exercise the same pointerdown/move/up
 * handlers touch input takes (the component is pointer-type agnostic);
 * taps use the emulated touchscreen.
 *
 * The harness body is tall enough that the sheet's dismiss threshold
 * stays at the 88px floor rather than height/4, keeping the drag
 * distances below deterministic.
 */

/** Waits until no enter animation is running (sheets/dialogs animate in
 * via data-state; dragging/closing from a half-run enter would race the
 * transform reads). Same shape as dialog.spec.ts. */
async function waitForOpenAnimationToSettle(panel: Locator): Promise<void> {
  await expect
    .poll(() =>
      panel.evaluate((el) => el.getAnimations({ subtree: true }).length === 0)
    )
    .toBe(true);
}

/**
 * Drags the sheet down by `distance` px from inside its body, stepping
 * every 10px so the pointermove stream crosses the 8px slop that flips
 * the gesture from pending to dragging.
 */
async function dragSheetDown(
  page: Page,
  sheet: Locator,
  distance: number
): Promise<void> {
  const box = await sheet.boundingBox();
  expect(box).not.toBeNull();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + 80; // inside the body, below the drag handle
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let dy = 10; dy <= distance; dy += 10) {
    await page.mouse.move(startX, startY + dy, { steps: 2 });
  }
}

test.describe('BottomSheet drag dismiss', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/mobile');
    await page.locator('#sheet-opener').click();
  });

  test('drag follows the finger and dismisses through onClose past the threshold', async ({
    page,
  }) => {
    const sheet = page.locator('#mobile-sheet');
    await expect(sheet).toBeVisible();
    await waitForOpenAnimationToSettle(sheet);

    await dragSheetDown(page, sheet, 200);
    // Mid-drag: the sheet tracks the pointer (dragging = true, no
    // transition), clamped to the downward direction only.
    await expect
      .poll(() => sheet.evaluate((el) => el.style.transform))
      .toBe('translateY(200px)');

    await page.mouse.up();
    // Past the 88px threshold the release runs the standard exit: the
    // sheet slides out from the dragged position and unmounts.
    await expect(sheet).toBeHidden();
    // The dismissal exited through onClose — exactly once.
    await expect(page.locator('#sheet-close-count')).toHaveText('1');
  });

  test('short drag springs back and keeps the sheet open', async ({ page }) => {
    const sheet = page.locator('#mobile-sheet');
    await expect(sheet).toBeVisible();
    await waitForOpenAnimationToSettle(sheet);
    const restingTop = (await sheet.boundingBox())!.y;

    await dragSheetDown(page, sheet, 40);
    await expect
      .poll(() => sheet.evaluate((el) => el.style.transform))
      .toBe('translateY(40px)');
    await page.mouse.up();

    // Under the threshold: spring back to the resting position and the
    // sheet stays open (no onClose).
    await expect
      .poll(async () => (await sheet.boundingBox())!.y, { timeout: 2_000 })
      .toBeCloseTo(restingTop, 0);
    await expect(sheet).toBeVisible();
    await expect(page.locator('#sheet-close-count')).toHaveText('0');
  });
});

test.describe('Drawer on phone viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/mobile');
    await page.locator('#drawer-opener').click();
  });

  test('covers the full height and pins to the right edge at 320px', async ({
    page,
  }) => {
    const drawer = page.locator('dialog').filter({ hasText: 'Drawer body' });
    await expect(drawer).toBeVisible();
    await waitForOpenAnimationToSettle(drawer);

    // Native modal path: only showModal reaches the top layer.
    await expect
      .poll(() => drawer.evaluate((el) => el.matches(':modal')))
      .toBe(true);

    const viewport = page.viewportSize()!;
    const box = (await drawer.boundingBox())!;
    // 320px fixed width, within the min(280, 85vw) clamps.
    expect(box.width).toBeCloseTo(320, 0);
    expect(box.width).toBeLessThanOrEqual(viewport.width * 0.85 + 1);
    // Full viewport height and flush with the physical right edge.
    expect(box.height).toBeCloseTo(viewport.height, 0);
    expect(box.x + box.width).toBeCloseTo(viewport.width, 0);
  });

  test('Escape runs the animated exit, closes, and restores opener focus', async ({
    page,
  }) => {
    const drawer = page.locator('dialog').filter({ hasText: 'Drawer body' });
    await expect(drawer).toBeVisible();
    await waitForOpenAnimationToSettle(drawer);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe('drawer-opener');
  });
});

test.describe('Dialog on small screens', () => {
  test('width clamps to the narrow viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/components/mobile');
    await page.locator('#dialog-opener').click();

    const dialog = page.getByRole('dialog', { name: 'Confirm action' });
    await expect(dialog).toBeVisible();
    await waitForOpenAnimationToSettle(dialog);

    const viewport = page.viewportSize()!;
    const box = (await dialog.boundingBox())!;
    // width: 100% with max-width 480px on a 412px viewport: the panel
    // spans the viewport exactly and never bleeds past either edge.
    expect(box.width).toBeCloseTo(viewport.width, 0);
    expect(box.x).toBeGreaterThanOrEqual(-0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  });
});

test.describe('Popover tap', () => {
  test('opens on tap, anchors below the trigger, light-dismisses on outside tap', async ({
    page,
  }) => {
    await page.goto('/components/mobile');

    // The Popover trigger is the wrapper span[role=button] around the
    // #popover-trigger span (aria-expanded/aria-controls live there).
    const trigger = page.getByRole('button', { name: 'Popover trigger' });
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await page.touchscreen.tap(
      triggerBox!.x + triggerBox!.width / 2,
      triggerBox!.y + triggerBox!.height / 2
    );

    const panelId = await trigger.getAttribute('aria-controls');
    expect(panelId).not.toBeNull();
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Native path on the phone engine too: top-layer popover.
    await expect
      .poll(() => panel.evaluate((el) => el.matches(':popover-open')))
      .toBe(true);

    // Anchored below the trigger with horizontal overlap.
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.y).toBeGreaterThanOrEqual(
      triggerBox!.y + triggerBox!.height
    );
    expect(panelBox.x).toBeLessThan(triggerBox!.x + triggerBox!.width);
    expect(panelBox.x + panelBox.width).toBeGreaterThan(triggerBox!.x);

    // Tap far outside: light dismiss.
    await page.touchscreen.tap(8, 880);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });
});
