# 项目详情案例化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为两个项目的中英文详情页增加本地化项目事实区，并把四份正文整理为可信、可扫描的案例结构。

**Architecture:** 新增一个只负责项目事实展示的 `ProjectFacts.astro`，由中英文项目路由复用；叙事内容继续保留在 Markdown。现有 schema、`ContentLayout`、项目图片和文章路由不变。

**Tech Stack:** Astro 7、TypeScript、Astro Content Collections、Markdown、CSS、Playwright

## Global Constraints

- 只使用现有 frontmatter 和正文已经支持的事实，不添加未经验证的指标、客户、规模或外部背书。
- 事实区顺序固定为角色、状态、技术栈、结果，位于项目主图之后、Markdown 正文之前。
- 英文状态映射固定为 `Completed product`、`Team project`、`Concept design`；中文保持原值。
- 不修改 schema、frontmatter、卡片、主图、文章页面、URL 或 SEO。
- 桌面事实区为两列，移动端为单列，不产生横向溢出。
- 实现遵循 RED → GREEN → COMMIT；发布前运行完整验证、两次依赖审计和生产隐私扫描。

## File Map

- Create: `src/components/ProjectFacts.astro` — 本地化并渲染项目事实 `<dl>`。
- Create: `tests/e2e/project-details.spec.ts` — 事实区、案例章节、移动端和文章隔离测试。
- Modify: `src/pages/projects/[id].astro` — 中文项目接入事实区。
- Modify: `src/pages/en/projects/[id].astro` — 英文项目接入事实区。
- Modify: `src/styles/global.css` — 事实区两列/单列响应式样式。
- Modify: `src/content/projects/macos-setup-assistant.md` — 中文 macOS 案例章节。
- Modify: `src/content/projects/macos-setup-assistant.en.md` — 英文 macOS 案例章节。
- Modify: `src/content/projects/api-pulse.md` — 中文 API Pulse 案例章节。
- Modify: `src/content/projects/api-pulse.en.md` — 英文 API Pulse 案例章节。

---

### Task 1: 本地化项目事实区

**Files:**
- Create: `src/components/ProjectFacts.astro`
- Create: `tests/e2e/project-details.spec.ts`
- Modify: `src/pages/projects/[id].astro`
- Modify: `src/pages/en/projects/[id].astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `CollectionEntry<'projects'>` 的 `role`、`status`、`technologies`、`outcome` 和 locale。
- Produces: `<dl class="project-facts">`，供页面和 E2E 测试使用。

- [ ] **Step 1: 写入失败的事实区测试**

创建 `tests/e2e/project-details.spec.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx playwright test tests/e2e/project-details.spec.ts`

Expected: 5 个项目事实测试失败，因为 `.project-facts` 尚不存在；文章隔离测试通过。

- [ ] **Step 3: 创建最小 ProjectFacts 组件**

创建 `src/components/ProjectFacts.astro`：

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
  locale: 'zh' | 'en';
}

const { project, locale } = Astro.props;
const copy = locale === 'zh'
  ? { role: '角色', status: '状态', technologies: '技术栈', outcome: '结果' }
  : { role: 'Role', status: 'Status', technologies: 'Technologies', outcome: 'Outcome' };
const englishStatus = {
  '已完成产品': 'Completed product',
  '团队项目': 'Team project',
  '概念设计': 'Concept design',
} as const;
const status = locale === 'zh' ? project.data.status : englishStatus[project.data.status];
---
<dl class="project-facts">
  <div><dt>{copy.role}</dt><dd>{project.data.role}</dd></div>
  <div><dt>{copy.status}</dt><dd>{status}</dd></div>
  <div>
    <dt>{copy.technologies}</dt>
    <dd><ul class="tags">{project.data.technologies.map((item) => <li>{item}</li>)}</ul></dd>
  </div>
  <div><dt>{copy.outcome}</dt><dd>{project.data.outcome}</dd></div>
</dl>
```

- [ ] **Step 4: 在中英文项目路由接入组件**

在 `src/pages/projects/[id].astro` frontmatter 中增加：

```ts
import ProjectFacts from '../../components/ProjectFacts.astro';
```

并在 `<Content />` 前增加：

```astro
<ProjectFacts project={entry} locale="zh" />
```

在 `src/pages/en/projects/[id].astro` frontmatter 中增加：

```ts
import ProjectFacts from '../../../components/ProjectFacts.astro';
```

并在 `<Content />` 前增加：

```astro
<ProjectFacts project={entry} locale="en" />
```

- [ ] **Step 5: 添加事实区样式**

在 `src/styles/global.css` 的 `.prose .content-cover` 规则后增加：

```css
.project-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin-block: 2rem; padding: 1px; overflow: hidden; border-radius: var(--radius); background: var(--line); }
.project-facts > div { padding: 1rem; background: var(--surface); }
.project-facts dt { color: var(--accent); font-size: .8rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.project-facts dd { margin: .35rem 0 0; }
.project-facts .tags { margin: 0; }
```

在现有 `@media (max-width: 48rem)` 内增加：

```css
.project-facts { grid-template-columns: 1fr; }
```

- [ ] **Step 6: 运行事实区测试确认 GREEN**

Run: `npx playwright test tests/e2e/project-details.spec.ts && npm run check`

Expected: 6 个 E2E 测试全部通过；Astro Check 为 0 errors、0 warnings、0 hints。

- [ ] **Step 7: 提交事实区**

```bash
git add src/components/ProjectFacts.astro src/pages/projects/'[id].astro' src/pages/en/projects/'[id].astro' src/styles/global.css tests/e2e/project-details.spec.ts
git commit -m "feat: add localized project facts"
```

---

### Task 2: 四份结构化项目案例

**Files:**
- Modify: `src/content/projects/macos-setup-assistant.md`
- Modify: `src/content/projects/macos-setup-assistant.en.md`
- Modify: `src/content/projects/api-pulse.md`
- Modify: `src/content/projects/api-pulse.en.md`
- Modify: `tests/e2e/project-details.spec.ts`

**Interfaces:**
- Consumes: 现有项目 frontmatter 和已验证的正文事实。
- Produces: 每个详情页五个可定位的 `<h2>` 案例章节。

- [ ] **Step 1: 写入失败的案例章节测试**

在 `tests/e2e/project-details.spec.ts` 末尾增加：

```ts
for (const project of [
  {
    path: '/projects/macos-setup-assistant/',
    headings: ['背景', '问题', '方案', '关键实现', '结果'],
    evidence: ['dry-run', 'APFS 写时复制'],
  },
  {
    path: '/projects/api-pulse/',
    headings: ['背景', '问题', '方案', '安全边界', '结果'],
    evidence: ['HttpOnly 会话 Cookie', '服务端内存'],
  },
  {
    path: '/en/projects/macos-setup-assistant/',
    headings: ['Background', 'Problem', 'Approach', 'Key implementation', 'Outcome'],
    evidence: ['dry-run', 'APFS copy-on-write'],
  },
  {
    path: '/en/projects/api-pulse/',
    headings: ['Background', 'Problem', 'Approach', 'Security boundaries', 'Outcome'],
    evidence: ['HttpOnly session cookies', 'server memory'],
  },
] as const) {
  test(project.path + ' presents a structured case study', async ({ page }) => {
    await page.goto(project.path);
    await expect(page.locator('main article h2')).toHaveText([...project.headings]);
    for (const phrase of project.evidence) {
      await expect(page.locator('main article')).toContainText(phrase);
    }
  });
}
```

- [ ] **Step 2: 运行新增测试确认 RED**

Run: `npx playwright test tests/e2e/project-details.spec.ts --grep "structured case study"`

Expected: 4 个测试失败，因为现有正文没有 `<h2>` 章节。

- [ ] **Step 3: 重写中文 macOS 案例正文**

把 `src/content/projects/macos-setup-assistant.md` frontmatter 后的正文替换为：

```md
## 背景

这个项目面向需要重复配置 Mac 的场景，目标是把分散的准备和安装操作整理成一个本地工作流。

## 问题

软件选择、安全校验、批量安装和结果查看需要形成一条可检查的连续流程，同时保留出错时定位问题所需的日志。

## 方案

原生 SwiftUI 界面负责软件选择、壁纸预览和结果查看，Shell 脚本负责包校验与实际安装，让界面层和可检查的执行层各自保持清晰。

## 关键实现

流程包含 dry-run、安全检查、安装后验证和日志记录。临时准备目录优先使用 APFS 写时复制，不支持时回退到普通复制。

## 结果

软件选择、安全检查、安装、验证和日志被整合进一个可维护的本地装机工作流。
```

- [ ] **Step 4: 重写英文 macOS 案例正文**

把 `src/content/projects/macos-setup-assistant.en.md` frontmatter 后的正文替换为：

```md
## Background

This project supports situations where Macs need to be configured repeatedly by turning separate preparation and installation steps into one local workflow.

## Problem

Software selection, safety checks, batch installation, and result review need to form one inspectable process while retaining the logs required to diagnose failures.

## Approach

The native SwiftUI interface handles software selection, wallpaper previews, and results. Shell scripts handle package validation and installation, keeping the interface separate from the inspectable execution layer.

## Key implementation

The workflow includes dry-run behavior, safety checks, post-install verification, and logs. Temporary staging prefers APFS copy-on-write and falls back to a normal copy when needed.

## Outcome

Selection, safety checks, installation, verification, and logs are combined in one maintainable local setup workflow.
```

- [ ] **Step 5: 重写中文 API Pulse 案例正文**

把 `src/content/projects/api-pulse.md` frontmatter 后的正文替换为：

```md
## 背景

API Pulse 用于同时查看 DeepSeek 余额、MiMo Key 状态和本地记录的 API 请求用量。

## 问题

余额和用量需要集中呈现，但汇总过程不能把 API Key 暴露给浏览器，也不能让公共访客读取站点所有者的本地凭据。

## 方案

服务端调用官方接口获取状态，并从本地 SQLite 数据库汇总请求数、Token、成功率和估算费用，再把可展示的数据交给浏览器。

## 安全边界

API Key 只在服务端内存中使用，访客通过 HttpOnly 会话 Cookie 隔离。公开部署时默认不读取站点所有者的本地凭据。

## 结果

余额、Key 状态和本地用量在既定隐私边界内被汇总到同一个仪表盘中。
```

- [ ] **Step 6: 重写英文 API Pulse 案例正文**

把 `src/content/projects/api-pulse.en.md` frontmatter 后的正文替换为：

```md
## Background

API Pulse brings DeepSeek balance, MiMo key status, and locally recorded API usage into one dashboard.

## Problem

Balance and usage need a shared view without exposing API keys to the browser or allowing public visitors to read the site owner's local credentials.

## Approach

The server calls official endpoints for current status and summarizes requests, tokens, success rate, and estimated cost from a local SQLite database before returning displayable data to the browser.

## Security boundaries

Keys remain in server memory, visitors are isolated with HttpOnly session cookies, and public deployments do not read the site owner's local credentials by default.

## Outcome

Balance, key status, and local usage are presented in one dashboard within those privacy boundaries.
```

- [ ] **Step 7: 运行案例与完整项目详情测试确认 GREEN**

Run: `npx playwright test tests/e2e/project-details.spec.ts && npm run check`

Expected: 10 个 E2E 测试全部通过；Astro Check 为 0 errors、0 warnings、0 hints。

- [ ] **Step 8: 提交案例正文**

```bash
git add src/content/projects/macos-setup-assistant.md src/content/projects/macos-setup-assistant.en.md src/content/projects/api-pulse.md src/content/projects/api-pulse.en.md tests/e2e/project-details.spec.ts
git commit -m "content: structure project case studies"
```

---

### Task 3: 完整验证和发布

**Files:**
- Verify only; no source changes expected.

**Interfaces:**
- Consumes: Tasks 1–2 的事实区和四份案例正文。
- Produces: 完整本地证据、GitHub Pages 成功结果和线上 DOM 验证。

- [ ] **Step 1: 检查改动范围**

Run:

```bash
git status --short
git diff --check HEAD~2..HEAD
git diff --stat HEAD~2..HEAD
```

Expected: 工作树干净；diff 检查无输出；改动只涉及 File Map 中的文件。

- [ ] **Step 2: 运行完整验证与审计**

Run:

```bash
npm run verify
npm audit --omit=dev
npm audit
```

Expected: 单元测试、Astro Check、14 页构建、build audit 和全部 E2E 通过；两次审计均为 0 vulnerabilities。

- [ ] **Step 3: 运行生产隐私扫描**

Run:

```bash
if rg -n "/Users/|API_KEY|sk-[A-Za-z0-9]|BEGIN .*PRIVATE KEY" dist src public; then exit 1; else echo 'Production privacy scan passed'; fi
```

Expected: 无敏感匹配。

- [ ] **Step 4: 合入、复验并推送 main**

按 `superpowers:finishing-a-development-branch` 快进合入 `main`，清理 worktree 后在 `main` 重新运行 `npm run verify`，随后执行：

```bash
git push origin main
```

- [ ] **Step 5: 验证 GitHub Pages**

等待对应提交的 `deploy.yml` 成功。用 Playwright 在线验证：四个项目页都有四项本地化事实；英文状态为 `Completed product`；四页各有五个约定的 `<h2>`；移动端事实区为单列且无溢出；文章页没有 `.project-facts`。
