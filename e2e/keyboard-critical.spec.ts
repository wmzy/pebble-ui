import { expect, test } from '@playwright/test';

/**
 * Keyboard-critical contracts on real engines: the interactions jsdom
 * cannot fully vouch for (real focus navigation, popover-backed panel
 * focus retention, engine key dispatch). Loaded on chromium, firefox
 * and webkit (see playwright.config.ts testMatch) — the same
 * assertions must pass everywhere.
 *
 *   - Tree: Tab lands on the single roving tab stop; arrows move focus
 *     and expand/descend; Enter commits the selection.
 *   - Combobox (multiple): ArrowDown opens the panel and moves the
 *     aria-activedescendant highlight; Enter toggles chips without
 *     closing; Backspace drops the last chip.
 *   - Calendar (picker='month'): arrows rove the month grid; PageDown
 *     hops a year keeping the focused month; Enter commits "YYYY-MM".
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/components/keyboard-critical');
});

test.describe('Tree keyboard navigation', () => {
  test('Tab enters the roving tab stop and arrows move focus', async ({ page }) => {
    const first = page.getByRole('treeitem', { name: 'parent 0' });
    const second = page.getByRole('treeitem', { name: 'parent 1' });

    // Only the first item owns the tab stop (APG roving tabindex).
    await expect(first).toHaveAttribute('tabindex', '0');
    await expect(second).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute('tabindex', '0');
    await expect(first).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowUp');
    await expect(first).toBeFocused();
  });

  test('ArrowRight expands keeping focus, descends, and Enter selects', async ({ page }) => {
    const root = page.getByRole('treeitem', { name: 'parent 0' });
    const leaf = page.getByRole('treeitem', { name: 'leaf 0-0-0' });

    await root.focus();
    await expect(leaf).toBeHidden();

    // Collapsed branch: expand, focus stays on the branch.
    await page.keyboard.press('ArrowRight');
    await expect(leaf).toBeVisible();
    await expect(root).toBeFocused();

    // Expanded branch: descend to the first child.
    await page.keyboard.press('ArrowRight');
    await expect(leaf).toBeFocused();

    // Enter commits the selection (aria + the harness output).
    await page.keyboard.press('Enter');
    await expect(leaf).toHaveAttribute('aria-selected', 'true');
    await expect(root).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('tree-out')).toHaveText('0-0-0');
  });
});

test.describe('Combobox multiple keyboard', () => {
  test('ArrowDown opens and highlights, Enter toggles chips, Backspace drops the last', async ({ page }) => {
    const input = page.getByRole('combobox');
    // The chip box is the multiple-mode trigger: the input's parent,
    // which holds the chips; the option panel is a sibling further out.
    const box = input.locator('..');
    await input.focus();

    // Closed panel: ArrowDown opens it and highlights the first option.
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = page.locator(
      `#${await input.getAttribute('aria-controls')}`
    );
    await expect(listbox).toBeVisible();
    const apple = page.getByRole('option', { name: 'Apple', exact: true });
    await expect(apple).toHaveAttribute(
      'id',
      await input.getAttribute('aria-activedescendant')
    );

    // Enter picks Apple: chip appears, panel stays open, focus retained.
    await page.keyboard.press('Enter');
    await expect(box.getByText('Apple')).toBeVisible();
    await expect(apple).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toBeFocused();

    // The highlight persists, so one arrow steps to Banana and Enter
    // adds the second chip.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(box.getByText('Banana')).toBeVisible();

    // Backspace on the empty query drops the most recent chip only.
    await page.keyboard.press('Backspace');
    await expect(box.getByText('Banana')).toBeHidden();
    await expect(box.getByText('Apple')).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Calendar month picker keyboard', () => {
  test('arrows rove the grid, PageDown hops a year, Enter commits', async ({ page }) => {
    const scope = page.getByTestId('case-calendar');
    const month = (m: number) => scope.locator(`[data-haze-month="${m}"]`);

    await month(2).focus();
    await page.keyboard.press('ArrowRight');
    await expect(month(3)).toBeFocused();

    // Three-column month grid: ArrowDown is one row = +3 months.
    await page.keyboard.press('ArrowDown');
    await expect(month(6)).toBeFocused();

    // PageDown hops a calendar year, keeping the focused month.
    await page.keyboard.press('PageDown');
    await expect(scope.getByText('2027')).toBeVisible();
    await expect(month(6)).toBeFocused();

    // Enter picks July 2027, serialized as "YYYY-MM".
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('calendar-out')).toHaveText('2027-07');
  });
});
