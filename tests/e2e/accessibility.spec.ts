import { expect, test } from '@playwright/test';

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('reduced motion disables transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('a').first().evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(duration).toBe('0s');
});
