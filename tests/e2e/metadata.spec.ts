import { expect, test } from '@playwright/test';

const origin = 'https://kailanalan0209.github.io';

test('indexable pages expose absolute production metadata', async ({ page }) => {
  for (const path of ['/', '/posts/api-key-privacy/']) {
    await page.goto(path);
    const expectedUrl = origin + path;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedUrl);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', expectedUrl);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    const defaultImage = origin + '/images/social-default.png';
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', defaultImage);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', defaultImage);
    expect(await page.content()).not.toContain('http://localhost:4321');
  }
});

test('project details use their own cover in social metadata', async ({ page }) => {
  for (const [path, image, alt] of [
    ['/projects/api-pulse/', '/images/api-pulse.jpg', 'API Pulse项目封面'],
    ['/en/projects/macos-setup-assistant/', '/images/macos-setup-assistant.png', 'macOS Setup Assistant project cover'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', origin + image);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', origin + image);
  }
});

test('indexable pages expose parseable localized JSON-LD', async ({ page }) => {
  for (const [path, type, language] of [
    ['/', 'WebSite', 'zh-CN'],
    ['/en/about/', 'WebPage', 'en'],
  ] as const) {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe(type);
    expect(data.url).toBe(origin + path);
    expect(data.inLanguage).toBe(language);
    expect(data.name).toBeTruthy();
    expect(data.description).toBeTruthy();
  }
});

test('brand social image and favicon are publishable assets', async ({ page, request }) => {
  const social = await request.get('/images/social-default.png');
  expect(social.status()).toBe(200);
  expect(social.headers()['content-type']).toBe('image/png');
  await page.goto('/');
  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/images/social-default.png';
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(dimensions).toEqual([1200, 630]);
  const favicon = await request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
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
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});
