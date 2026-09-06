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

const RTL_PAGES = [
  '/components/button',
  '/components/pagination',
  '/components/chatcontainer',
] as const;

test.describe('rtl baseline', () => {
  for (const path of RTL_PAGES) {
    test(`${path} renders RTL with zero axe violations`, async ({page}) => {
      // Init scripts run before the document element exists (verified:
      // readyState 'loading', documentElement null), so the assignment
      // defers to the first readystatechange — 'interactive' fires
      // before the page's deferred module scripts, i.e. before React
      // mounts and before first paint.
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
      await page.goto(path);

      const direction = await page.evaluate(
        () => getComputedStyle(document.documentElement).direction
      );
      expect(direction).toBe('rtl');

      await scan(page);
    });
  }
});
