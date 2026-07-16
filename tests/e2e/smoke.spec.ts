import { expect, test } from '@playwright/test';

test('root page identifies the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WKL/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把真实问题');
});

test('Chinese core routes expose their primary heading', async ({ page }) => {
  for (const [path, heading] of [
    ['/', '把真实问题'],
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

test('post cards and details expose UTC-stable reading metadata', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('.card').filter({ hasText: 'API Key 仪表盘中的隐私边界' }).locator('.eyebrow'))
    .toHaveText('2026年7月14日 · 2 分钟阅读');

  await page.goto('/posts/api-key-privacy/');
  await expect(page.locator('main article > .eyebrow')).toHaveText('2026年7月14日 · 2 分钟阅读');
});

test('404 page offers both recovery routes', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('link', { name: '返回中文首页' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'English home' })).toHaveAttribute('href', '/en/');
});
