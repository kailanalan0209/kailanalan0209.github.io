import { expect, test } from '@playwright/test';

test('root page identifies the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WKL/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把好奇心');
});
