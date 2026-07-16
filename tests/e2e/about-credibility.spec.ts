import { expect, test } from '@playwright/test';

const email = '2694421597@qq.com';

for (const about of [
  {
    path: '/about/',
    heading: '关于 WKL',
    capabilityHeading: '能力方向',
    capabilities: ['工具与自动化', 'API 与本地数据', '安全边界与可维护性'],
    workflowHeading: '工作方式',
    evidenceHeading: '代表项目',
    projectLinks: ['/projects/api-pulse/', '/projects/macos-setup-assistant/'],
    contact: `邮件联系 · ${email}`,
    projects: '查看全部项目',
    projectsHref: '/projects/',
  },
  {
    path: '/en/about/',
    heading: 'About WKL',
    capabilityHeading: 'Capabilities',
    capabilities: ['Tools and automation', 'APIs and local data', 'Safety boundaries and maintainability'],
    workflowHeading: 'How I work',
    evidenceHeading: 'Representative projects',
    projectLinks: ['/en/projects/api-pulse/', '/en/projects/macos-setup-assistant/'],
    contact: `Email · ${email}`,
    projects: 'View all projects',
    projectsHref: '/en/projects/',
  },
] as const) {
  test(`${about.path} explains capabilities and working method`, async ({ page }) => {
    await page.goto(about.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(about.heading);
    await expect(page.getByRole('heading', { name: about.capabilityHeading, level: 2 })).toBeVisible();
    await expect(page.locator('.capability-grid > li')).toHaveCount(3);
    for (const capability of about.capabilities) {
      await expect(page.getByRole('heading', { name: capability, level: 3 })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: about.workflowHeading, level: 2 })).toBeVisible();
    await expect(page.locator('.workflow-list > li')).toHaveCount(3);
    await expect(page.locator('main'))
      .not.toContainText(/精通|专家|expert|seeking opportunities|open to work/i);
  });

  test(`${about.path} exposes representative evidence and direct actions`, async ({ page }) => {
    await page.goto(about.path);
    await expect(page.getByRole('heading', { name: about.evidenceHeading, level: 2 })).toBeVisible();
    await expect(page.locator('.evidence-list > li')).toHaveCount(2);
    for (const href of about.projectLinks) {
      await expect(page.locator(`.evidence-list a[href="${href}"]`)).toHaveCount(1);
    }
    await expect(page.getByRole('link', { name: about.contact }))
      .toHaveAttribute('href', `mailto:${email}`);
    await expect(page.getByRole('link', { name: about.projects }))
      .toHaveAttribute('href', about.projectsHref);
    await expect(page.locator('.experience-list')).toHaveCount(0);
  });
}

for (const path of ['/about/', '/en/about/']) {
  test(`${path} remains usable at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    const actions = page.locator('.hero-actions a');
    await expect(actions).toHaveCount(2);
    await actions.first().focus();
    await expect(actions.first()).toBeFocused();
  });
}
