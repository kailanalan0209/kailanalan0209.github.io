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
      const rect = element.getBoundingClientRect();
      return {
        objectFit: style.objectFit,
        backgroundColor: style.backgroundColor,
        ratio: rect.width / rect.height,
      };
    });
    expect(presentation.objectFit).toBe('contain');
    expect(presentation.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(presentation.ratio).toBeCloseTo(16 / 9, 2);
  });
}

for (const [path, title] of [
  ['/', 'API Pulse'],
  ['/en/', 'API Pulse'],
] as const) {
  test(path + ' API Pulse card uses the complete dashboard image', async ({ page }) => {
    await page.goto(path);
    const image = page.locator('.card').filter({ hasText: title }).locator('img.project-cover');

    await expect(image).toHaveAttribute('src', '/images/api-pulse.jpg');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    const presentation = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        objectFit: style.objectFit,
        backgroundColor: style.backgroundColor,
        ratio: rect.width / rect.height,
      };
    });
    expect(presentation.objectFit).toBe('contain');
    expect(presentation.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(presentation.ratio).toBeCloseTo(16 / 9, 2);
  });
}

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

for (const [path, alt] of [
  ['/projects/api-pulse/', 'API Pulse项目封面'],
  ['/en/projects/api-pulse/', 'API Pulse project cover'],
] as const) {
  test(path + ' shows the complete API Pulse dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const image = page.locator('main article > img.content-cover');

    await expect(image).toHaveAttribute('src', '/images/api-pulse.jpg');
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
    expect(dimensions.naturalWidth).toBe(1024);
    expect(dimensions.naturalHeight).toBe(1024);
    expect(dimensions.hasOverflow).toBe(false);
  });
}
