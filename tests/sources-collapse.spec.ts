import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, id: string) {
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { __mapReady?: boolean }).__mapReady === true, null, { timeout: 15_000 });
  await page.evaluate((x) => (window as unknown as { __selectEvent?: (id: string) => void }).__selectEvent?.(x), id);
  const panel = page.getByTestId('event-panel');
  await expect(panel).toBeVisible();
  return panel;
}

test('long source list starts collapsed and toggles with the keyboard', async ({ page }) => {
  const panel = await open(page, 'pointe-du-hoc');
  const toggle = panel.getByRole('button', { name: /^Sources \(\d+\)$/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const n = Number((await toggle.textContent())!.match(/\((\d+)\)/)![1]);
  expect(n).toBeGreaterThan(3);
  await expect(panel.locator('.citation-list')).toBeHidden();

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.locator('.citation-list li')).toHaveCount(n);
  await expect(panel.locator('.citation-list li').first()).toBeVisible();

  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel.locator('.citation-list')).toBeHidden();
});

test('clicking a citation marker expands the list and scrolls to the entry', async ({ page }) => {
  const panel = await open(page, 'pointe-du-hoc');
  const toggle = panel.getByRole('button', { name: /^Sources \(\d+\)$/ });
  const n = Number((await toggle.textContent())!.match(/\((\d+)\)/)![1]);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await panel.locator('.cites a', { hasText: `[${n}]` }).first().click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const entry = panel.locator(`#cite-${n}`);
  await expect(entry).toBeInViewport();
  await expect(entry).toBeFocused();
});

test('short source list stays open with no toggle', async ({ page }) => {
  const panel = await open(page, 'ardenne-abbey-massacre');
  await expect(panel.getByRole('heading', { name: 'Sources', exact: true })).toBeVisible();
  await expect(panel.locator('.disclosure')).toHaveCount(0);
  await expect(panel.locator('.citation-list li').first()).toBeVisible();
});

test('source register in the about dialog is collapsible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sources & method' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sources and method' });
  const toggle = dialog.getByRole('button', { name: /^Source register \(\d+\)$/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(dialog.locator('ul.sources')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.locator('ul.sources li').first()).toBeVisible();
});
