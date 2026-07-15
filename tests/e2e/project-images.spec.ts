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

for (const [path, alt] of [
  ['/projects/macos-setup-assistant/', 'macOS 装机助手项目封面'],
  ['/en/projects/macos-setup-assistant/', 'macOS Setup Assistant project cover'],
] as const) {
  test(path + ' shows an uncropped detail image', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const image = page.locator('main article > img.content-cover');

    await expect(image).toHaveAttribute('src', '/images/macos-setup-assistant.png');
    await expect(image).toHaveAttribute('alt', alt);
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect(image).not.toHaveAttribute('loading', 'lazy');
    const dimensions = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        objectFit: style.objectFit,
        backgroundColor: style.backgroundColor,
        ratio: rect.width / rect.height,
        naturalWidth: (element as HTMLImageElement).naturalWidth,
        naturalHeight: (element as HTMLImageElement).naturalHeight,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(dimensions.objectFit).toBe('contain');
    expect(dimensions.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(dimensions.ratio).toBeCloseTo(16 / 9, 2);
    expect(dimensions.naturalWidth).toBe(2624);
    expect(dimensions.naturalHeight).toBe(1808);
    expect(dimensions.hasOverflow).toBe(false);
  });
}

test('API Pulse detail does not render a fallback hero image', async ({ page }) => {
  for (const path of ['/projects/api-pulse/', '/en/projects/api-pulse/']) {
    await page.goto(path);
    await expect(page.locator('main article > img.content-cover')).toHaveCount(0);
  }
});
