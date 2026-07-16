import { expect, test } from '@playwright/test';

test('English core pages use English headings and lang', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build reliable tools');
  await expect(page.getByText('This content is currently available in Chinese only.')).toBeHidden();
});

test('Chinese-only articles fall back with a notice', async ({ page }) => {
  await page.goto('/en/?notice=zh-only');
  await expect(page.getByText('This content is currently available in Chinese only.')).toBeVisible();
});

test('translated projects remain on the matching detail page', async ({ page }) => {
  await page.goto('/projects/api-pulse/');
  await page.getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL('/en/projects/api-pulse/');
});
