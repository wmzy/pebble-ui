import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Stable-state pixel baselines across the component library, one frame
 * per component: the static surfaces from e2e/app/snapshots.html
 * (mounted fully determined — controlled values, no timers, no network)
 * and the overlay surfaces from e2e/app/snapshots-overlays.html,
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
 * trigger. The submenu case opens the one nested pair (parent menu +
 * its submenu — designed to coexist); both are top-layer popovers, so
 * its baseline captures the full viewport, the only frame that contains
 * trigger + both panels.
 *
 * Spinner and Skeleton run infinite keyframes (spin / shimmer); the
 * fixture pins them to their unanimated base frame via a `frozen`
 * class — Playwright pauses infinite animations at their current phase,
 * which is an arbitrary rotation/opacity per run.
 *
 * The interaction-state expansion adds: the Button variant×size matrix,
 * the multiple Select trigger (chips) and its open listbox, single +
 * range Slider, DataTable with pinned columns scrolled to its midpoint,
 * an Image fullscreen preview (toolbar + dimmed backdrop), an expanded
 * DropdownMenu submenu, a dark-theme Dialog plus a dark-theme static
 * field cluster (the fixture re-declares tokens on a wrapper — the
 * theme classes are plain custom-property sets), and two RTL mirrors
 * (document dir injected before first paint, same addInitScript
 * approach as rtl.spec.ts, so logical CSS and [dir] selectors resolve
 * RTL from the start).
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
  'buttonmatrix',
  'selectmultiple',
  'slider',
  'descriptions',
  'jsonview',
  'sources',
  'filepreview',
  'masonry',
  'signature',
  'darkfields',
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

  // The ghost overlay only renders while the host is focused, so the
  // section is clicked before capturing — caret blink is hidden by
  // Playwright's default caret behavior for screenshot assertions.
  test('inlinecompletion baseline frame (focused, ghost visible)', async ({
    page,
  }) => {
    const section = page.locator('[data-snap="inlinecompletion"]');
    await section.getByRole('textbox').click();
    await expect(section).toHaveScreenshot('inlinecompletion.png');
  });

  test('accordion baseline frame (first item open)', async ({ page }) => {
    const section = page.locator('[data-snap="accordion"]');
    await section.locator('details').first().locator('summary').click();
    await expect(section.locator('details').first()).toHaveAttribute(
      'open',
      ''
    );
    await expect(section).toHaveScreenshot('accordion.png');
  });

  test('datatable baseline frame (fixed columns, scrolled to midpoint)', async ({
    page,
  }) => {
    const section = page.locator('[data-snap="datatable"]');
    await expect(section).toBeVisible();
    // Drive the horizontal scrollport to its midpoint — the only element
    // in the section that overflows IS the shared scroller (fixed columns
    // exist precisely because the colgroup overflows it). Midpoint (not
    // an edge) puts content beneath both pinned runs, exercising the
    // opaque sticky cells and their scroll-hint shadows.
    const scrolled = await section.evaluate((root) => {
      const scroller = Array.from(
        root.querySelectorAll<HTMLElement>('*')
      ).find((el) => el.scrollWidth > el.clientWidth + 1);
      if (!scroller) return -1;
      scroller.scrollLeft = Math.round(
        (scroller.scrollWidth - scroller.clientWidth) / 2
      );
      return scroller.scrollLeft;
    });
    expect(scrolled).toBeGreaterThan(0);
    await expect(section).toHaveScreenshot('datatable-fixed.png');
  });
});

/** Inject dir='rtl' before any page script runs — no LTR flash, so the
 * library's direction reads and logical CSS resolve RTL from first
 * paint (same helper contract as rtl.spec.ts; init scripts run before
 * the document element exists, so the assignment defers to the first
 * readystatechange, which fires before the page's deferred module
 * scripts — i.e. before React mounts). */
async function makeRtl(page: Page) {
  await page.addInitScript(() => {
    const apply = () => {
      document.documentElement.dir = 'rtl';
    };
    if (document.documentElement) {
      apply();
    } else {
      document.addEventListener('readystatechange', apply, { once: true });
    }
  });
}

test.describe('visual baselines — rtl mirrors', () => {
  test.beforeEach(async ({ page }) => {
    await makeRtl(page);
    await page.goto('/snapshots');
  });

  test('pagination rtl mirror (nav order + arrows flipped)', async ({
    page,
  }) => {
    const section = page.locator('[data-snap="pagination"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot('pagination-rtl.png');
  });

  test('select multiple trigger rtl mirror (chips + caret flipped)', async ({
    page,
  }) => {
    const section = page.locator('[data-snap="selectmultiple"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot('select-multiple-rtl.png');
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
    // Two comboboxes live on this page: the Combobox input and the
    // multiple Select's SelectFloating trigger (aria-label "Overlay
    // fruits") — target the input by its accessible name.
    const input = page.getByRole('combobox', { name: 'Pick a fruit' });
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
    // The page carries three <dialog> elements now (light Dialog, dark
    // Dialog, Image preview) — closed native dialogs are display:none,
    // so role+name matching leaves exactly the open one.
    const dialog = page.getByRole('dialog', { name: 'Confirm action' });
    await expect(dialog).toBeVisible();
    await waitForOpenAnimationToSettle(dialog);
    await expect(dialog).toHaveScreenshot('dialog-open.png');
  });

  test('dialog (dark theme)', async ({ page }) => {
    await page.locator('#dark-dialog-opener').click();
    const dialog = page.getByRole('dialog', { name: 'Confirm deletion' });
    await expect(dialog).toBeVisible();
    await waitForOpenAnimationToSettle(dialog);
    await expect(dialog).toHaveScreenshot('dialog-open-dark.png');
  });

  test('image preview (fullscreen toolbar + dimmed backdrop)', async ({
    page,
  }) => {
    // The thumbnail and the preview <img> share the same alt (the
    // preview dialog renders inside the section, no portal) — the
    // thumbnail is the first img, then jump to the top-layer dialog.
    await page.locator('[data-snap="imagepreview"] img').first().click();
    const overlay = page.getByRole('dialog', { name: 'Fixture artwork' });
    await expect(overlay).toBeVisible();
    // Wait for the data-URI SVG to decode: toBeVisible only proves the
    // element boxes, and a not-yet-decoded image paints as blank space.
    await expect
      .poll(() =>
        overlay
          .locator('img')
          .evaluate((el) => el.complete && el.naturalWidth > 0)
      )
      .toBe(true);
    await waitForOpenAnimationToSettle(overlay);
    // The overlay is a fullscreen 100vw×100vh native dialog, so this one
    // frame carries the toolbar, the centered image and the ::backdrop
    // dim together.
    await expect(overlay).toHaveScreenshot('image-preview-open.png');
  });

  test('dropdown menu with submenu expanded', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click();
    // Only one menu is open right now — closed popovers are hidden and
    // excluded from role matching — so this resolves to the parent menu.
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await waitForOpenAnimationToSettle(menu);
    const share = page.getByRole('menuitem', { name: 'Share' });
    await share.click();
    const submenuId = await share.getAttribute('aria-owns');
    const submenu = page.locator(`[id="${submenuId}"]`);
    await expect(submenu).toBeVisible();
    await waitForOpenAnimationToSettle(submenu);
    // Both panels are top-layer popovers painting outside the DOM
    // subtree; the viewport is the smallest frame containing the
    // trigger, the menu and its expanded submenu.
    await expect(page).toHaveScreenshot('dropdown-submenu-open.png');
  });

  test('select multiple open (trigger + checked listbox)', async ({
    page,
  }) => {
    const trigger = page.getByRole('combobox', { name: 'Overlay fruits' });
    await trigger.click();
    const panelId = await trigger.getAttribute('aria-controls');
    const listbox = page.locator(`[id="${panelId}"]`);
    await expect(listbox).toBeVisible();
    await waitForOpenAnimationToSettle(listbox);
    await expect(listbox).toHaveScreenshot('select-multiple-open.png');
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
