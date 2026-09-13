import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Windows high contrast (forced-colors) contract. The library repairs
 * only the surfaces whose semantics would vanish when the UA squashes
 * author colors — see the @media (forced-colors: active) blocks across
 * the component styles. Playwright's emulateMedia({ forcedColors:
 * 'active' }) drives the same CDP Emulation.setEmulatedMedia feature
 * flag the task prescribes.
 *
 * Chromium-only on purpose: the repairs assert system-color computed
 * values (Highlight/CanvasText/GrayText), whose emulated values are an
 * engine detail; the firefox/webkit projects pin their testMatch to
 * the behavioral overlay specs and never run this file (the skip guard
 * below keeps that explicit if the matrix ever widens).
 *
 * Two contract directions:
 * - forced-colors active → boundaries, check states, selection chips,
 *   shape-carrying art and keyboard focus resolve to visible system
 *   colors (non-transparent, distinguishable from their neighbors).
 * - emulation off → nothing changed: boundaries transparent, no
 *   outlines — the repairs are fully media-gated.
 */

// Chromium-only on purpose: the repairs assert system-color computed
// values (Highlight/CanvasText/GrayText), whose emulated values are an
// engine detail. The firefox/webkit projects pin their testMatch to
// the behavioral overlay specs and never schedule this file; the
// browserName guard keeps that explicit if the matrix ever widens.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'forced-colors system-color assertions are chromium-scoped'
);

/** Alpha channel of a computed rgb()/rgba() color; 1 when opaque. */
function alphaOf(color: string): number {
  const match = /rgba?\(([^)]+)\)/.exec(color);
  if (!match) return Number.NaN;
  const parts = match[1]!.split(',').map((part) => part.trim());
  return parts.length === 4 ? Number.parseFloat(parts[3]!) : 1;
}

async function gotoAt(
  page: Page,
  forcedColors: 'active' | null
): Promise<void> {
  await page.emulateMedia({ forcedColors });
  await page.goto('/forced-colors.html');
}

/** Computed-style props of an element (optionally of a pseudo). */
function styleOf(
  locator: Locator,
  props: string[],
  pseudo?: string
): Promise<Record<string, string>> {
  return locator.evaluate(
    (el, { props, pseudo }) => {
      const computed = getComputedStyle(el, pseudo);
      return Object.fromEntries(
        props.map((prop) => [prop, computed.getPropertyValue(prop)])
      );
    },
    { props, pseudo }
  );
}

/** The floating panel a trigger controls, via aria-controls. */
async function panelOf(trigger: Locator): Promise<Locator> {
  const id = await trigger.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  return trigger.page().locator(`[id="${id}"]`);
}

test.describe('forced-colors repairs', () => {
  test('ghost button keeps a visible boundary', async ({ page }) => {
    await gotoAt(page, 'active');
    const ghost = page.locator('#fc-ghost-button');
    const border = await styleOf(ghost, [
      'border-top-width',
      'border-top-style',
      'border-top-color',
    ]);
    expect(border['border-top-width']).toBe('1px');
    expect(border['border-top-style']).toBe('solid');
    expect(alphaOf(border['border-top-color']!)).toBeGreaterThan(0);
  });

  test('checked checkbox draws its checkmark on Highlight', async ({
    page,
  }) => {
    await gotoAt(page, 'active');
    const box = page.getByRole('checkbox', { name: 'FC checkbox', exact: true });
    await box.click();
    await expect(box).toBeChecked();
    const boxBorder = await styleOf(box, ['background-color', 'border-top-color']);
    // Checked surface: Highlight fill with the check drawn against it.
    expect(alphaOf(boxBorder['background-color']!)).toBeGreaterThan(0);
    const check = await styleOf(
      box,
      ['border-bottom-color', 'border-bottom-width', 'height'],
      '::after'
    );
    expect(check['height']).toBe('9px');
    expect(check['border-bottom-width']).toBe('2px');
    expect(alphaOf(check['border-bottom-color']!)).toBeGreaterThan(0);
    // The check must settle distinct from the box surface. Sampled as a
    // poll: under full-suite parallel load the two reads can straddle a
    // style/transition commit, and a one-shot comparison flakes even
    // though the terminal state is always HighlightText-on-Highlight.
    await expect
      .poll(
        async () => {
          const surface = (
            await styleOf(box, ['background-color'])
          )['background-color'];
          const mark = (
            await styleOf(box, ['border-bottom-color'], '::after')
          )['border-bottom-color'];
          return { surface, mark, distinct: mark !== surface };
        },
        { timeout: 5_000 }
      )
      .toMatchObject({ distinct: true });
  });

  test('switch stays visible and state-distinguishable', async ({
    page,
  }) => {
    await gotoAt(page, 'active');
    const on = page
      .locator('#fc-switch [data-slot="switch"]')
      .first();
    const onTrack = await styleOf(on, ['background-color', 'border-top-color']);
    const onThumb = await styleOf(
      on.locator('[data-slot="thumb"]'),
      ['background-color']
    );
    // ON: Highlight track (non-transparent) with a contrasting thumb.
    expect(alphaOf(onTrack['background-color']!)).toBeGreaterThan(0);
    expect(alphaOf(onThumb['background-color']!)).toBeGreaterThan(0);
    expect(onThumb['background-color']).not.toBe(
      onTrack['background-color']
    );

    const off = page
      .locator('#fc-switch [data-slot="switch"]')
      .nth(1);
    const offTrack = await styleOf(off, ['border-top-color', 'border-top-width']);
    const offThumb = await styleOf(
      off.locator('[data-slot="thumb"]'),
      ['background-color']
    );
    // OFF: CanvasText boundary + a visible thumb on the Canvas track.
    expect(offTrack['border-top-width']).toBe('1px');
    expect(alphaOf(offTrack['border-top-color']!)).toBeGreaterThan(0);
    expect(alphaOf(offThumb['background-color']!)).toBeGreaterThan(0);
  });

  test('radio selection dot stays visible', async ({ page }) => {
    await gotoAt(page, 'active');
    const selected = page.getByRole('radio', { name: 'Radio A' });
    await expect(selected).toBeChecked();
    const ring = await styleOf(selected, ['border-top-color']);
    expect(alphaOf(ring['border-top-color']!)).toBeGreaterThan(0);
    const dot = await styleOf(selected, ['background-color'], '::after');
    expect(alphaOf(dot['background-color']!)).toBeGreaterThan(0);
  });

  test('slider range fill stays visible over its rail', async ({ page }) => {
    await gotoAt(page, 'active');
    const section = page.locator('#fc-slider');
    const rail = await styleOf(
      section.locator('[data-slot="track"]'),
      ['background-color']
    );
    const fill = await styleOf(
      section.locator('[data-slot="fill"]'),
      ['background-color']
    );
    expect(alphaOf(rail['background-color']!)).toBeGreaterThan(0);
    expect(alphaOf(fill['background-color']!)).toBeGreaterThan(0);
    expect(fill['background-color']).not.toBe(rail['background-color']);
  });

  test('selection surfaces render distinguishable system chips', async ({
    page,
  }) => {
    await gotoAt(page, 'active');

    // Segmented: selected chip filled, unselected bounded by an inset
    // outline (its transparent no-border surface gets nothing else).
    const segments = page.locator('#fc-segmented button');
    const selected = await styleOf(segments.nth(1), ['background-color']);
    const unselected = await styleOf(segments.nth(0), [
      'background-color',
      'outline-style',
      'outline-width',
    ]);
    expect(alphaOf(selected['background-color']!)).toBeGreaterThan(0);
    expect(alphaOf(unselected['background-color']!)).toBe(0);
    expect(unselected['outline-style']).toBe('solid');
    expect(unselected['outline-width']).toBe('1px');

    // Pagination: the current page is a Highlight chip, its sibling a
    // plain Canvas surface.
    const current = await styleOf(
      page.locator('#fc-pagination [aria-current="page"]'),
      ['background-color']
    );
    const sibling = await styleOf(
      page.locator('#fc-pagination button[data-slot="item"]').nth(2),
      ['background-color']
    );
    expect(alphaOf(current['background-color']!)).toBeGreaterThan(0);
    expect(current['background-color']).not.toBe(
      sibling['background-color']
    );

    // Tabs: the selected tab is a Highlight chip; unselected tabs stay
    // transparent.
    const tabs = page.locator('#fc-tabs [role="tab"]');
    const activeTab = await styleOf(tabs.nth(1), [
      'background-color',
      'border-bottom-color',
    ]);
    const inactiveTab = await styleOf(tabs.nth(0), ['background-color']);
    expect(alphaOf(activeTab['background-color']!)).toBeGreaterThan(0);
    expect(alphaOf(activeTab['border-bottom-color']!)).toBeGreaterThan(0);
    expect(alphaOf(inactiveTab['background-color']!)).toBe(0);

    // Stepper: the current circle is a Highlight chip, the pending one
    // a Canvas surface; connectors stay visible.
    const icons = page.locator('#fc-stepper [data-slot="icon"]');
    const activeCircle = await styleOf(icons.nth(1), ['background-color']);
    const pendingCircle = await styleOf(icons.nth(2), ['background-color']);
    expect(alphaOf(activeCircle['background-color']!)).toBeGreaterThan(0);
    expect(activeCircle['background-color']).not.toBe(
      pendingCircle['background-color']
    );
    const connector = await styleOf(
      page.locator('#fc-stepper [data-slot="connector"]').first(),
      ['background-color']
    );
    expect(alphaOf(connector['background-color']!)).toBeGreaterThan(0);
  });

  test('shape-carrying art keeps its form', async ({ page }) => {
    await gotoAt(page, 'active');

    const fill = await styleOf(
      page.locator('#fc-progress [data-slot="fill"]'),
      ['background-color']
    );
    expect(alphaOf(fill['background-color']!)).toBeGreaterThan(0);

    const spinner = page.locator('#fc-spinner [data-slot="spinner"]');
    const ring = await styleOf(spinner.locator('circle'), ['stroke']);
    const arc = await styleOf(spinner.locator('path'), ['stroke']);
    expect(alphaOf(ring['stroke']!)).toBeGreaterThan(0);
    expect(alphaOf(arc['stroke']!)).toBeGreaterThan(0);
    expect(arc['stroke']).not.toBe(ring['stroke']);

    const skeleton = await styleOf(
      page.locator('#fc-skeleton [data-slot="skeleton"]'),
      ['background-color']
    );
    expect(alphaOf(skeleton['background-color']!)).toBeGreaterThan(0);
  });

  test('dialog panel separates from the canvas', async ({ page }) => {
    await gotoAt(page, 'active');
    await page.click('#fc-dialog-opener');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const border = await styleOf(dialog, [
      'border-top-width',
      'border-top-style',
      'border-top-color',
    ]);
    expect(border['border-top-width']).toBe('1px');
    expect(border['border-top-style']).toBe('solid');
    expect(alphaOf(border['border-top-color']!)).toBeGreaterThan(0);
  });

  test('popover panel keeps its boundary', async ({ page }) => {
    await gotoAt(page, 'active');
    // aria-controls lives on the Popover's trigger span wrapping the
    // button, not on the button itself.
    const trigger = page.locator('#fc-popover [aria-controls]');
    await page.click('#fc-popover-trigger');
    const panel = await panelOf(trigger);
    await expect(panel).toBeVisible();
    const border = await styleOf(panel, [
      'border-top-width',
      'border-top-color',
    ]);
    expect(border['border-top-width']).toBe('1px');
    expect(alphaOf(border['border-top-color']!)).toBeGreaterThan(0);
  });

  test('tooltip text renders CanvasText inside a boundary', async ({
    page,
  }) => {
    // No mouse transit in this test: the fixture mounts the tooltip
    // open (uncontrolled initial), and crossing the host would flip it
    // closed before the assertion.
    await gotoAt(page, 'active');
    const bubble = page.locator('#fc-tooltip [role="tooltip"]');
    await expect(bubble).toBeVisible();
    const tip = await styleOf(bubble, ['color', 'border-top-color']);
    expect(alphaOf(tip['color']!)).toBeGreaterThan(0);
    expect(alphaOf(tip['border-top-color']!)).toBeGreaterThan(0);
  });

  test('keyboard focus renders a real outline', async ({ page }) => {
    await gotoAt(page, 'active');
    // The ghost button is the page's first focusable element.
    await page.keyboard.press('Tab');
    const outline = await styleOf(page.locator('#fc-ghost-button'), [
      'outline-style',
      'outline-width',
      'outline-color',
    ]);
    expect(outline['outline-style']).toBe('solid');
    expect(outline['outline-width']).toBe('2px');
    expect(alphaOf(outline['outline-color']!)).toBeGreaterThan(0);

    await page.locator('#fc-text-input').focus();
    const inputOutline = await styleOf(page.locator('#fc-text-input'), [
      'outline-style',
      'outline-width',
    ]);
    expect(inputOutline['outline-style']).toBe('solid');
    expect(inputOutline['outline-width']).toBe('2px');
  });
});

test.describe('forced-colors repairs stay media-gated', () => {
  test('normal rendering keeps boundaries and outlines off', async ({
    page,
  }) => {
    await gotoAt(page, null);
    const ghost = await styleOf(page.locator('#fc-ghost-button'), [
      'border-top-color',
    ]);
    expect(alphaOf(ghost['border-top-color']!)).toBe(0);

    const segment = await styleOf(page.locator('#fc-segmented button').nth(0), [
      'outline-style',
    ]);
    expect(segment['outline-style']).toBe('none');

    const skeleton = await styleOf(
      page.locator('#fc-skeleton [data-slot="skeleton"]'),
      ['background-color']
    );
    expect(skeleton['background-color']).not.toBe('rgb(96, 0, 0)');
  });
});
