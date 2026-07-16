import { expect, test } from '@playwright/test';

for (const project of [
  {
    path: '/projects/macos-setup-assistant/',
    heading: '验证记录',
    version: '2.4',
    environment: 'macOS 27.0 · Apple 芯片',
    checks: ['安全预检查', '本地 dry-run', '校验和清单', '6 个自动化回归测试'],
    disclosureLabel: '公开边界：',
    disclosure: '不是第三方安全认证',
    firstCaseStudyHeading: '背景',
  },
  {
    path: '/projects/api-pulse/',
    heading: '验证记录',
    version: '1.0.0',
    environment: 'macOS 27.0 · Apple 芯片 · Node.js 24',
    checks: ['Node.js 语法检查', '公开静态资源凭据模式扫描', '匿名访问默认拒绝', 'HttpOnly 与 SameSite=Strict'],
    disclosureLabel: '公开边界：',
    disclosure: '不是第三方安全认证',
    firstCaseStudyHeading: '背景',
  },
  {
    path: '/en/projects/macos-setup-assistant/',
    heading: 'Verification Record',
    version: '2.4',
    environment: 'macOS 27.0 · Apple silicon',
    checks: ['Safety preflight', 'local dry run', 'Checksum manifest', '6 automated regression tests'],
    disclosureLabel: 'Disclosure:',
    disclosure: 'not a third-party security certification',
    firstCaseStudyHeading: 'Background',
  },
  {
    path: '/en/projects/api-pulse/',
    heading: 'Verification Record',
    version: '1.0.0',
    environment: 'macOS 27.0 · Apple silicon · Node.js 24',
    checks: ['Node.js syntax checks', 'credential-pattern scan', 'Anonymous dashboard access', 'HttpOnly and SameSite=Strict'],
    disclosureLabel: 'Disclosure:',
    disclosure: 'not a third-party security certification',
    firstCaseStudyHeading: 'Background',
  },
] as const) {
  test(project.path + ' exposes an owner verification record', async ({ page }) => {
    await page.goto(project.path);
    const evidence = page.locator('main article > .project-facts + .project-evidence');

    await expect(evidence.getByRole('heading', { level: 2 })).toHaveText(project.heading);
    await expect(evidence.locator('[data-evidence="version"]')).toHaveText(project.version);
    await expect(evidence.locator('time')).toHaveAttribute('datetime', '2026-07-16');
    await expect(evidence.locator('[data-evidence="environment"]')).toHaveText(project.environment);
    await expect(evidence.locator('.project-evidence-checks li')).toHaveCount(4);
    for (const check of project.checks) {
      await expect(evidence).toContainText(check);
    }
    await expect(evidence.locator('.project-evidence-disclosure strong')).toHaveText(project.disclosureLabel);
    await expect(evidence.locator('.project-evidence-disclosure')).toContainText(project.disclosure);
    await expect(evidence.getByRole('link')).toHaveCount(0);
    await expect(page.locator('.project-evidence + h2')).toHaveText(project.firstCaseStudyHeading);
  });
}

test('project verification record stays readable without mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/api-pulse/');

  const columns = await page.locator('.project-evidence-facts').evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(1);
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
});
