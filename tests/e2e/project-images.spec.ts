import { expect, test } from '@playwright/test';

for (const [path, title] of [
  ['/', 'macOS 装机助手'],
  ['/en/', 'macOS Setup Assistant'],
] as const) {
  test(title + ' card uses the complete project screenshot', async ({ page }) => {
    await page.goto(path);
    const card = page.locator('.card').filter({ hasText: title });
    const image = card.locator('img.project-cover');

    await expect(image).toHaveAttribute('src', '/images/macos-setup-assistant.png');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    const presentation = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      return { objectFit: style.objectFit, backgroundColor: style.backgroundColor };
    });
    expect(presentation).toEqual({ objectFit: 'contain', backgroundColor: 'rgb(0, 0, 0)' });
  });
}

test('API Pulse card retains the fallback cover behavior', async ({ page }) => {
  await page.goto('/projects/');
  const image = page.locator('.card').filter({ hasText: 'API Pulse' }).locator('img.project-cover');

  await expect(image).toHaveAttribute('src', '/images/project-fallback.svg');
  expect(await image.evaluate((element) => getComputedStyle(element).objectFit)).toBe('cover');
});
