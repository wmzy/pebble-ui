import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * RTL baseline on real browser layout: three representative harness
 * pages (e2e/app/components/*.html) are loaded with dir='rtl' injected
 * before any app script runs (addInitScript — no LTR flash, so the
 * library's [dir='rtl'] selectors match from first paint). Each page
 * then proves the direction actually resolved and that axe reports no
 * WCAG violations — mirroring must not cost accessibility. The jsdom
 * rtl.test.tsx smoke cannot assert either: jsdom does no layout and
 * resolves no computed direction.
 *
 * Pages cover the three RTL-affected component families:
 *   - button — inline padding/gap on the workhorse control;
 *   - pagination — mirrored nav order, arrows, ellipsis, active state;
 *   - chatcontainer — row-reverse user bubbles + logical corner radii.
 *
 * Beyond the smoke baselines, the floating-mirror tests load a fourth
 * harness (rtl-floating) with a statically-open start-aligned Popover
 * and a hover-open inline-start Tooltip, and pin their RTL geometry on
 * real layout: start alignment hugs the trigger's RIGHT edge and the
 * inline-start placement lands on the trigger's physical right — the
 * inline-axis mirror the logical position-area values (and the
 * JS-positioned tier's dir-aware math) produce. jsdom cannot assert
 * either: it does no layout and resolves no computed direction.
 *
 * Only WCAG-tagged rules run (same policy as a11y.spec.ts): the harness
 * pages are not real documents (no landmarks/h1), and best-practice-only
 * rules like `region` / `page-has-heading-one` are noise here.
 */

const WCAG_TAGS = [
  'wcag2a',
  'wcag21a',
  'wcag2aa',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
];

async function scan(page: Page) {
  const results = await new AxeBuilder({page})
    .withTags(WCAG_TAGS)
    .include('#root')
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

/** Inject dir='rtl' before any page script runs — no LTR flash, so the
 * library's direction reads and logical CSS resolve RTL from first
 * paint (init scripts run before the document element exists — verified:
 * readyState 'loading', documentElement null — so the assignment defers
 * to the first readystatechange, 'interactive' firing before the page's
 * deferred module scripts, i.e. before React mounts). */
async function makeRtl(page: Page) {
  await page.addInitScript(() => {
    const apply = () => {
      document.documentElement.dir = 'rtl';
    };
    if (document.documentElement) {
      apply();
    } else {
      document.addEventListener('readystatechange', apply, {once: true});
    }
  });
}

const RTL_PAGES = [
  '/components/button',
  '/components/pagination',
  '/components/chatcontainer',
] as const;

test.describe('rtl baseline', () => {
  for (const path of RTL_PAGES) {
    test(`${path} renders RTL with zero axe violations`, async ({page}) => {
      await makeRtl(page);
      await page.goto(path);

      const direction = await page.evaluate(
        () => getComputedStyle(document.documentElement).direction
      );
      expect(direction).toBe('rtl');

      await scan(page);
    });
  }
});

test.describe('rtl floating mirror', () => {
  test.beforeEach(async ({page}) => {
    await makeRtl(page);
    await page.goto('/components/rtl-floating');
    const direction = await page.evaluate(
      () => getComputedStyle(document.documentElement).direction
    );
    expect(direction).toBe('rtl');
  });

  test('start-aligned popover hugs the trigger right edge under RTL', async ({page}) => {
    const trigger = page.getByRole('button', {name: 'Popover trigger'});
    const panel = page.locator(
      `#${await trigger.getAttribute('aria-controls')}`
    );
    await expect(panel).toBeVisible();

    const t = await trigger.boundingBox();
    const p = await panel.boundingBox();
    expect(t && p).toBeTruthy();

    // 'bottom-span' is start-aligned: under RTL the start edge is the
    // RIGHT edge (mirrored from LTR's left-edges-aligned geometry).
    expect(Math.abs(p!.x + p!.width - (t!.x + t!.width))).toBeLessThanOrEqual(1);
    // …and it still opens below the trigger (block axis never mirrors).
    expect(p!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
  });

  test('inline-start tooltip lands on the trigger physical right under RTL', async ({page}) => {
    // The tooltip trigger is the span carrying aria-describedby (the
    // visible text lives in a child span of the harness).
    const trigger = page.locator('[aria-describedby]');
    // Assert the popover case first: hovering fires showPopover for the
    // tooltip, and two popover=auto panels cannot coexist.
    const popoverTrigger = page.getByRole('button', {name: 'Popover trigger'});
    const popover = page.locator(
      `#${await popoverTrigger.getAttribute('aria-controls')}`
    );
    await expect(popover).toBeVisible();

    await trigger.hover();
    const bubble = page.locator(
      `#${await trigger.getAttribute('aria-describedby')}`
    );
    await expect(bubble).toBeVisible();

    const t = await trigger.boundingBox();
    const b = await bubble.boundingBox();
    expect(t && b).toBeTruthy();

    // The 'left' placement is inline-start: mirrored under RTL, the
    // bubble sits on the trigger's physical RIGHT (LTR: physical left).
    expect(b!.x).toBeGreaterThanOrEqual(t!.x + t!.width - 1);
    // Gap is a token (~4px); no overlap with the trigger.
    expect(b!.x).toBeLessThanOrEqual(t!.x + t!.width + 8);
  });
});
