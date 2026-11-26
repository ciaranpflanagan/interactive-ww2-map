import { test, expect } from '@playwright/test';

test('loads, scrubs the timeline and opens a sourced event', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await expect(page.getByTestId('current-date')).toHaveText('6 June 1944');
  await page.waitForFunction(() => (window as unknown as { __mapReady?: boolean }).__mapReady === true, null, { timeout: 15_000 });

  // The panel must show sources for whatever event is opened.
  await page.evaluate(() => (window as unknown as { __selectEvent?: (id: string) => void }).__selectEvent?.('omaha-beach'));
  const panel = page.getByTestId('event-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Omaha Beach' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(panel.locator('.citation-list li').first()).toBeVisible();

  const slider = page.getByRole('slider', { name: 'Date' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('current-date')).toHaveText('7 June 1944');

  await page.getByRole('button', { name: 'Sources & method' }).click();
  await expect(page.getByRole('dialog', { name: 'Sources and method' })).toBeVisible();
  expect(errors).toEqual([]);
});
