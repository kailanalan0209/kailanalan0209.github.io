import { expect, test } from '@playwright/test';

test('portfolio index presents three photography series', async ({ page }) => {
  await page.goto('/works/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('摄影与影像');
  await expect(page.locator('.work-grid > article')).toHaveCount(3);
  for (const name of ['航空掠影', '俯瞰大地', '城市速度']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  }
  const coverRatios = await page.locator('.work-card img').evaluateAll((images) =>
    images.map((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width / rect.height;
    }),
  );
  for (const ratio of coverRatios) {
    expect(ratio).toBeGreaterThan(1.3);
    expect(ratio).toBeLessThan(1.36);
  }
  for (const image of await page.locator('.work-card img').all()) {
    await expect(image).toHaveAttribute('src', /-1280\.jpg$/);
  }
});

test('photography series exposes an optimized and accessible gallery', async ({ page }) => {
  await page.goto('/works/aviation/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('航空掠影');
  const images = page.locator('.work-gallery img');
  await expect(images).toHaveCount(8);
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute('src', /^\/images\/work\/aviation\/.+-1280\.jpg$/);
    await expect(image).toHaveAttribute('srcset', /1280w, .* 2400w$/);
    await expect(image).toHaveAttribute('alt', /.+/);
    await expect(image).toHaveAttribute('loading', 'lazy');
  }
});

test('portfolio navigation and credential are available in both languages', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByText('视觉中国签约摄影师', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '作品' })).toHaveAttribute('href', '/works/');

  await page.goto('/en/about/');
  await expect(page.getByText('Visual China contracted photographer', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/en/works/');
});

test('portfolio remains usable without horizontal overflow at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/works/');
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.locator('.work-grid > article')).toHaveCount(3);
});
