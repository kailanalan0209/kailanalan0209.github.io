import { expect, test } from '@playwright/test';

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: '跳到主要内容' });
  await expect(skipLink).toBeFocused();
  const outline = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('reduced motion disables transitions', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.card').first();
  const normalDuration = await card.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(normalDuration.split(',').some((duration) => Number.parseFloat(duration) > 0)).toBe(true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedDuration = await card.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(reducedDuration).toBe('0s');
});

test('home card titles follow their section headings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '精选项目', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最新文章', level: 2 })).toBeVisible();
  await expect(page.locator('.card h3')).toHaveCount(4);
  await expect(page.locator('.card h2')).toHaveCount(0);

  await page.goto('/projects/');
  await expect(page.locator('.card h2')).toHaveCount(2);
  await expect(page.locator('.card h3')).toHaveCount(0);

  await page.goto('/posts/');
  await expect(page.locator('.card h2')).toHaveCount(2);
  await expect(page.locator('.card h3')).toHaveCount(0);
});

test('card images use deferred asynchronous decoding', async ({ page }) => {
  await page.goto('/');

  const images = page.locator('.card img');
  await expect(images.first()).toHaveAttribute('loading', 'lazy');
  await expect(images.first()).toHaveAttribute('decoding', 'async');
});

test('primary navigation identifies only the current static section', async ({ page }) => {
  for (const [path, name] of [
    ['/projects/', '项目'],
    ['/posts/api-key-privacy/', '文章'],
    ['/about/', '关于'],
    ['/en/projects/api-pulse/', 'Projects'],
    ['/en/about/', 'About'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('navigation').getByRole('link', { name, exact: true }))
      .toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('navigation').locator('a[aria-current="page"]')).toHaveCount(1);
  }
});
