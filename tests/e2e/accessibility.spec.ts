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
