import { expect, test } from '@playwright/test';

const origin = 'https://kailanalan0209.github.io';

test('indexable pages expose absolute production metadata', async ({ page }) => {
  for (const path of ['/', '/posts/api-key-privacy/']) {
    await page.goto(path);
    const expectedUrl = origin + path;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedUrl);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', expectedUrl);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    expect(await page.content()).not.toContain('http://localhost:4321');
  }
});

test('translated pages expose both real language alternates', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]'))
    .toHaveAttribute('href', origin + '/about/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]'))
    .toHaveAttribute('href', origin + '/en/about/');

  await page.goto('/en/projects/api-pulse/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]'))
    .toHaveAttribute('href', origin + '/projects/api-pulse/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]'))
    .toHaveAttribute('href', origin + '/en/projects/api-pulse/');
});

test('fallback destinations are not advertised as translations', async ({ page }) => {
  await page.goto('/posts/api-key-privacy/');
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
});

test('404 omits indexable metadata', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});
