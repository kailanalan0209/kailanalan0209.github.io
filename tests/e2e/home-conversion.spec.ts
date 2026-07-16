import { expect, test } from '@playwright/test';

const email = '2694421597@qq.com';

for (const home of [
  {
    path: '/',
    heading: '把真实问题，做成可靠的工具与产品。',
    contact: `邮件联系 · ${email}`,
    projects: '查看项目',
    projectsHref: '/projects/',
  },
  {
    path: '/en/',
    heading: 'Build reliable tools and products from real problems.',
    contact: `Email · ${email}`,
    projects: 'View projects',
    projectsHref: '/en/projects/',
  },
] as const) {
  test(`${home.path} exposes focused positioning and direct actions`, async ({ page }) => {
    await page.goto(home.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(home.heading);
    await expect(page.locator('.hero .lede')).toContainText(/macOS/);
    await expect(page.locator('.hero .lede')).toContainText(/API/);
    await expect(page.getByRole('link', { name: home.contact }))
      .toHaveAttribute('href', `mailto:${email}`);
    await expect(page.getByRole('link', { name: home.projects }))
      .toHaveAttribute('href', home.projectsHref);
    await expect(page.locator('.hero'))
      .not.toContainText(/求职|正在寻找机会|open to work|seeking opportunities/i);
  });
}

test('English home links to Chinese notes honestly and to English experience', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { name: 'Notes in Chinese', level: 2 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Chinese notes' })).toHaveAttribute('href', '/posts/');
  await expect(page.getByRole('heading', { name: 'Experience', level: 2 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the experience summary' }))
    .toHaveAttribute('href', '/en/about/');
  const notes = page.locator('.section').filter({ has: page.getByRole('heading', { name: 'Notes in Chinese' }) });
  const experience = page.locator('.section').filter({ has: page.getByRole('heading', { name: 'Experience' }) });
  await expect(notes.locator('.card')).toHaveCount(0);
  await expect(experience.locator('.experience-list')).toHaveCount(0);
});

for (const path of ['/', '/en/']) {
  test(`${path} actions fit a 390px viewport and remain focusable`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    const actions = page.locator('.hero-actions a');
    await expect(actions).toHaveCount(2);
    await actions.first().focus();
    await expect(actions.first()).toBeFocused();
  });
}
