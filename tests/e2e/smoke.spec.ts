import { expect, test } from '@playwright/test';

test('root page identifies the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WKL/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把好奇心');
});

test('Chinese core routes expose their primary heading', async ({ page }) => {
  for (const [path, heading] of [
    ['/', '把好奇心'],
    ['/projects/', '项目'],
    ['/posts/', '文章'],
    ['/about/', '关于 WKL'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
  }
});

test('flagship projects and first posts have detail pages', async ({ page }) => {
  for (const path of [
    '/projects/macos-setup-assistant/',
    '/projects/api-pulse/',
    '/posts/macos-setup-workflow/',
    '/posts/api-key-privacy/',
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main article')).toBeVisible();
  }
});
