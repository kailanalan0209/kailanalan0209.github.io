import { expect, test } from '@playwright/test';

for (const project of [
  {
    path: '/projects/macos-setup-assistant/',
    labels: ['角色', '状态', '技术栈', '结果'],
    role: '产品设计与开发',
    status: '已完成产品',
    technologies: ['SwiftUI', 'Shell', 'APFS'],
    outcome: '把软件选择、安全检查、安装与日志整合进一个可维护的本地工作流。',
  },
  {
    path: '/projects/api-pulse/',
    labels: ['角色', '状态', '技术栈', '结果'],
    role: '设计与开发',
    status: '已完成产品',
    technologies: ['Node.js', 'HTTP API', 'SQLite'],
    outcome: '在不向浏览器暴露密钥的前提下汇总余额与本地用量。',
  },
  {
    path: '/en/projects/macos-setup-assistant/',
    labels: ['Role', 'Status', 'Technologies', 'Outcome'],
    role: 'Product design and development',
    status: 'Completed product',
    technologies: ['SwiftUI', 'Shell', 'APFS'],
    outcome: 'Combined selection, safety checks, installation, verification, and logs in one maintainable workflow.',
  },
  {
    path: '/en/projects/api-pulse/',
    labels: ['Role', 'Status', 'Technologies', 'Outcome'],
    role: 'Design and development',
    status: 'Completed product',
    technologies: ['Node.js', 'HTTP API', 'SQLite'],
    outcome: 'Summarized balance and local usage without exposing API keys to the browser.',
  },
] as const) {
  test(project.path + ' exposes localized project facts', async ({ page }) => {
    await page.goto(project.path);
    const facts = page.locator('main article > .project-facts');

    await expect(facts).toBeVisible();
    expect(await facts.locator('dt').allTextContents()).toEqual([...project.labels]);
    await expect(facts.locator('dd').nth(0)).toHaveText(project.role);
    await expect(facts.locator('dd').nth(1)).toHaveText(project.status);
    for (const technology of project.technologies) {
      await expect(facts.locator('dd').nth(2)).toContainText(technology);
    }
    await expect(facts.locator('dd').nth(3)).toHaveText(project.outcome);
  });
}

test('project facts collapse to one column without mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/api-pulse/');
  const columns = await page.locator('.project-facts').evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(1);
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
});

test('post details do not expose project facts', async ({ page }) => {
  await page.goto('/posts/api-key-privacy/');
  await expect(page.locator('.project-facts')).toHaveCount(0);
});
