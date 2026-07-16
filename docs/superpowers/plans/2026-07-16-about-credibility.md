# About Page Credibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn both about pages into concise, evidence-backed explanations of WKL's capabilities, working method, representative projects, and direct contact path.

**Architecture:** Both Astro pages load featured projects at build time and render localized static copy around a lightweight evidence list. Shared global CSS provides the three-column capability layout, ordered workflow, two-column project evidence layout, and existing homepage action styles provide the contact controls.

**Tech Stack:** Astro 7.0.9, TypeScript 5.9.3, Playwright 1.61.1, existing global CSS

## Global Constraints

- Focus on macOS tools and automation plus API product practice.
- Show three capability groups and three working-method steps without expertise claims.
- Source both representative projects from the existing `projects` collection filtered by `lang` and `featured`.
- Show the public `site.email` contact link and current-language project-list link.
- Do not show job-seeking status, unverified metrics, or the three course/team experience entries.
- Do not add content collections, schema fields, scripts, forms, third-party services, dependencies, or new components.
- Preserve one `h1`, section `h2` headings, project `h3` headings, keyboard focus visibility, and a 390px layout without horizontal overflow.

---

### Task 1: Evidence-backed bilingual about pages

**Files:**
- Create: `tests/e2e/about-credibility.spec.ts`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/en/about.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `getCollection('projects')`, project `id`, `data.lang`, `data.featured`, `data.title`, `data.outcome`, `data.translationKey`, and `site.email`.
- Produces: `.capability-grid`, `.workflow-list`, and `.evidence-list` sections plus localized contact actions.

- [ ] **Step 1: Write the failing about-page tests**

Create `tests/e2e/about-credibility.spec.ts`:

```ts
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
    await expect(page.locator('main')).not.toContainText(/精通|专家|expert|seeking opportunities|open to work/i);
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
```

- [ ] **Step 2: Run the focused test and confirm the red state**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/about-credibility.spec.ts
```

Expected: 6 tests fail because the capability, workflow, evidence, and action sections do not exist.

- [ ] **Step 3: Implement the Chinese about page**

Replace `src/pages/about.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { site } from '../lib/site';
const projects = (await getCollection('projects')).filter((entry) => entry.data.lang === 'zh' && entry.data.featured);
---
<BaseLayout title="关于 WKL" description="WKL 的能力方向、工作方式与代表项目。" locale="zh" languageHref="/en/about/" alternateHref="/en/about/">
  <article class="prose shell">
    <p class="eyebrow">ABOUT</p><h1>关于 WKL</h1>
    <p class="lede">我专注于 macOS 工具与自动化、API 产品实践，把真实问题实现为边界清晰、可维护并有记录的作品。</p>
    <h2>能力方向</h2>
    <ul class="capability-grid">
      <li><h3>工具与自动化</h3><p>SwiftUI、Shell、macOS 工作流与安装流程。</p></li>
      <li><h3>API 与本地数据</h3><p>Node.js、HTTP API、SQLite 与本地状态管理。</p></li>
      <li><h3>安全边界与可维护性</h3><p>输入验证、隐私边界、可回滚流程、测试和文档。</p></li>
    </ul>
    <h2>工作方式</h2>
    <ol class="workflow-list">
      <li>从真实问题和使用路径出发。</li>
      <li>先明确安全、隐私和失败边界。</li>
      <li>形成可维护、可测试并有记录的工具或产品。</li>
    </ol>
    <h2>代表项目</h2>
    <ul class="evidence-list">
      {projects.map((project) => <li><h3><a href={'/projects/' + project.id + '/'}>{project.data.title}</a></h3><p>{project.data.outcome}</p></li>)}
    </ul>
    <h2>联系</h2>
    <p>如果这些实践与你正在解决的问题相关，可以直接通过邮件联系。</p>
    <div class="hero-actions" aria-label="联系与项目">
      <a class="action-link action-link-primary" href={'mailto:' + site.email}>邮件联系 · {site.email}</a>
      <a class="action-link" href="/projects/">查看全部项目</a>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Implement the English about page**

Replace `src/pages/en/about.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { site } from '../../lib/site';
const projects = (await getCollection('projects')).filter((entry) => entry.data.lang === 'en' && entry.data.featured);
---
<BaseLayout title="About WKL" description="WKL's capabilities, working method, and representative projects." locale="en" languageHref="/about/" alternateHref="/about/">
  <article class="prose shell"><p class="eyebrow">ABOUT</p><h1>About WKL</h1>
    <p class="lede">I focus on macOS tools and automation plus API product practice, turning real problems into maintainable work with explicit boundaries and reusable records.</p>
    <h2>Capabilities</h2>
    <ul class="capability-grid">
      <li><h3>Tools and automation</h3><p>SwiftUI, Shell, macOS workflows, and installation flows.</p></li>
      <li><h3>APIs and local data</h3><p>Node.js, HTTP APIs, SQLite, and local state management.</p></li>
      <li><h3>Safety boundaries and maintainability</h3><p>Input validation, privacy boundaries, rollback paths, tests, and documentation.</p></li>
    </ul>
    <h2>How I work</h2>
    <ol class="workflow-list">
      <li>Start from a real problem and its usage path.</li>
      <li>Define safety, privacy, and failure boundaries first.</li>
      <li>Build a maintainable, testable, and documented tool or product.</li>
    </ol>
    <h2>Representative projects</h2>
    <ul class="evidence-list">
      {projects.map((project) => <li><h3><a href={'/en/projects/' + project.data.translationKey + '/'}>{project.data.title}</a></h3><p>{project.data.outcome}</p></li>)}
    </ul>
    <h2>Contact</h2>
    <p>If this work relates to a problem you are solving, you can reach me directly by email.</p>
    <div class="hero-actions" aria-label="Contact and projects">
      <a class="action-link action-link-primary" href={'mailto:' + site.email}>Email · {site.email}</a>
      <a class="action-link" href="/en/projects/">View all projects</a>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 5: Add the minimal shared styles**

Add before `.project-facts` in `src/styles/global.css`:

```css
.capability-grid, .evidence-list { display: grid; gap: 1rem; padding: 0; list-style: none; }
.capability-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.evidence-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.capability-grid li, .evidence-list li { padding: 1.25rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.capability-grid h3, .evidence-list h3 { margin-top: 0; }
.workflow-list { display: grid; gap: .75rem; padding-left: 1.5rem; }
.workflow-list li { padding-left: .5rem; }
```

Add inside the existing `@media (max-width: 48rem)` block:

```css
  .capability-grid, .evidence-list { grid-template-columns: 1fr; }
```

- [ ] **Step 6: Run the focused test and confirm the green state**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/about-credibility.spec.ts
npm run check
```

Expected: 6 focused Playwright tests pass and Astro reports 0 errors, 0 warnings, and 0 hints.

- [ ] **Step 7: Commit the about-page feature**

```bash
git add tests/e2e/about-credibility.spec.ts src/pages/about.astro src/pages/en/about.astro src/styles/global.css
git commit -m "feat: add evidence-backed about pages"
```

---

### Task 2: Full verification and release

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: the complete static site and deployment workflow.
- Produces: verified local build and live GitHub Pages deployment.

- [ ] **Step 1: Run the complete local verification suite**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npm run verify
npm audit --omit=dev
npm audit
if rg -n "/Users/|API_KEY|sk-[A-Za-z0-9]|BEGIN .*PRIVATE KEY" dist src public; then exit 1; else echo 'Production privacy scan passed'; fi
git diff --check origin/main..HEAD
```

Expected: 28 unit tests and 49 E2E tests pass; Astro reports no diagnostics; 14 pages build and pass the build audit; both dependency audits report 0 vulnerabilities; privacy and diff checks pass.

- [ ] **Step 2: Perform local visual inspection**

Capture `/about/` at 1440×900 and `/en/about/` at 390×844. Confirm that capabilities scan quickly, workflow steps retain order, project evidence remains lighter than full project cards, contact is visually primary, and no text clips or overflows.

- [ ] **Step 3: Merge and reverify on clean main**

Fast-forward the feature branch into `main`, remove the owned `.worktrees/` worktree, delete the merged branch, and repeat Step 1 from the clean main workspace. Do not push if any command fails.

- [ ] **Step 4: Push and watch the exact Pages run**

```bash
git push origin main
HEAD_SHA=$(git rev-parse HEAD)
RUN_ID=$(gh run list --workflow deploy.yml --branch main --limit 10 --json databaseId,headSha --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId" | head -1)
test -n "$RUN_ID"
gh run watch "$RUN_ID" --exit-status
```

Expected: the workflow for the exact pushed SHA completes successfully.

- [ ] **Step 5: Verify the production DOM and repository state**

Use Playwright against `https://kailanalan0209.github.io/about/` and `/en/about/` to verify HTTP 200, localized headings, three capabilities, three workflow steps, two project evidence items, email and project links, and 390px no-overflow behavior. Confirm the workflow conclusion is `success` and `git status --short --branch` reports clean `main` synchronized with `origin/main`.
