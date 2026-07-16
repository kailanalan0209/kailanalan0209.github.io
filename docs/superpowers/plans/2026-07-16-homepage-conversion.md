# Homepage Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade both homepages so visitors immediately understand WKL's macOS automation and API product focus, see credible project context, and can contact WKL through the public email address.

**Architecture:** Keep the pages static and continue reading projects, posts, and experience from Astro content collections. Add localized hero copy and semantic links directly in the two homepage templates, reuse `site.email`, and add only the small shared CSS rules required for the CTA group and section introductions.

**Tech Stack:** Astro 7.0.9, TypeScript 5.9.3, Playwright 1.61.1, existing global CSS

## Global Constraints

- Focus the positioning on macOS tools and automation plus API product practice.
- Show `2694421597@qq.com` in the primary contact link and do not show job-seeking or availability language.
- Keep project content sourced from the existing `projects` collection.
- Do not invent English translations for Chinese-only posts or experience entries.
- Do not add forms, email services, analytics, animation libraries, runtime dependencies, or a new design system.
- Preserve one `h1`, section `h2` headings, project-card `h3` headings, keyboard focus visibility, and a 390px layout without horizontal overflow.

---

### Task 1: Localized homepage positioning and contact path

**Files:**
- Create: `tests/e2e/home-conversion.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts`
- Modify: `tests/e2e/i18n.spec.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/en/index.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `site.email: string` from `src/lib/site.ts`; featured project collections already loaded by each homepage.
- Produces: `.hero-actions`, `.action-link`, `.action-link-primary`, and `.section-intro` markup and styles; localized links to email, projects, notes, and experience.

- [ ] **Step 1: Write the failing homepage conversion tests**

Create `tests/e2e/home-conversion.spec.ts`:

```ts
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
    await expect(page.locator('.hero')).not.toContainText(/求职|正在寻找机会|open to work|seeking opportunities/i);
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
```

In `tests/e2e/smoke.spec.ts`, replace both Chinese-home expectations containing `把好奇心` with `把真实问题`.

In `tests/e2e/i18n.spec.ts`, replace the English-home expectation containing `Turn curiosity` with `Build reliable tools`.

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/home-conversion.spec.ts
```

Expected: FAIL because the new headings, `.hero-actions`, and English content entries do not exist.

- [ ] **Step 3: Implement the Chinese homepage changes**

In `src/pages/index.astro`, replace the hero content with:

```astro
<section class="hero shell">
  <p class="eyebrow">个人实验室 · DIGITAL GARDEN</p>
  <h1>把真实问题，做成可靠的工具与产品。</h1>
  <p class="lede">聚焦 macOS 工具与自动化、API 产品实践，把问题、安全边界和实现过程整理成可维护的作品。</p>
  <div class="hero-actions" aria-label="主要操作">
    <a class="action-link action-link-primary" href={'mailto:' + site.email}>邮件联系 · {site.email}</a>
    <a class="action-link" href="/projects/">查看项目</a>
  </div>
</section>
```

Change the selected-project section opening to:

```astro
<section class="section shell">
  <div class="section-heading"><div><h2>精选项目</h2><p class="section-intro">从真实问题、安全边界到可维护实现，记录完整的产品实践过程。</p></div><a href="/projects/">查看全部</a></div>
```

- [ ] **Step 4: Implement the English homepage changes**

In `src/pages/en/index.astro`, replace the visible hero copy after the inline translation-notice script with:

```astro
<p class="eyebrow">PERSONAL LAB · DIGITAL GARDEN</p>
<h1>Build reliable tools and products from real problems.</h1>
<p class="lede">Focused on macOS tools and automation plus API product practice, with maintainable implementations and explicit safety boundaries.</p>
<div class="hero-actions" aria-label="Primary actions">
  <a class="action-link action-link-primary" href={'mailto:' + site.email}>Email · {site.email}</a>
  <a class="action-link" href="/en/projects/">View projects</a>
</div>
```

Replace the selected-project and trailing “More” sections with:

```astro
<section class="section shell">
  <div class="section-heading"><div><h2>Selected projects</h2><p class="section-intro">Product work that follows real problems through safety boundaries and maintainable implementation.</p></div><a href="/en/projects/">View all</a></div>
  <div class="card-grid">
    {projects.map((project) => <ProjectCard project={project} locale="en" href={'/en/projects/' + project.data.translationKey + '/'} headingLevel={3} />)}
  </div>
</section>
<section class="section shell"><h2>Notes in Chinese</h2><p>Long-form notes are currently published in Chinese.</p><p><a href="/posts/">Browse Chinese notes</a></p></section>
<section class="section shell"><h2>Experience</h2><p>See current practice areas and a concise background summary.</p><p><a href="/en/about/">Read the experience summary</a></p></section>
```

- [ ] **Step 5: Add the minimal shared styles**

Add after the existing `.lede` rule in `src/styles/global.css`:

```css
.hero-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
.action-link { display: inline-flex; min-height: 3rem; align-items: center; justify-content: center; padding: .65rem 1rem; border: 1px solid var(--line); border-radius: 999px; font-weight: 700; overflow-wrap: anywhere; text-decoration: none; }
.action-link:hover { border-color: var(--accent); }
.action-link-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); }
.section-intro { max-width: 42rem; margin-block: .35rem 0; color: var(--muted); }
```

Add inside the existing `@media (max-width: 48rem)` block:

```css
  .hero-actions { align-items: stretch; flex-direction: column; }
  .action-link { width: 100%; }
```

- [ ] **Step 6: Run the focused test and confirm the green state**

Run:

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/home-conversion.spec.ts
npm run check
```

Expected: 5 focused Playwright tests pass and Astro reports 0 errors, 0 warnings, and 0 hints.

- [ ] **Step 7: Commit the homepage feature**

```bash
git add tests/e2e/home-conversion.spec.ts src/pages/index.astro src/pages/en/index.astro src/styles/global.css
git add tests/e2e/smoke.spec.ts tests/e2e/i18n.spec.ts
git commit -m "feat: strengthen homepage contact path"
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

Expected: 28 existing unit tests pass; the E2E total increases from 37 to 42; Astro reports no diagnostics; 14 pages build and pass the build audit; both dependency audits report 0 vulnerabilities; the privacy scan and diff check pass.

- [ ] **Step 2: Perform local visual inspection**

Start the site and capture `/` at 1440×900 and `/en/` at 390×844. Confirm that the primary contact link is visually stronger than the project link, project cards remain the dominant proof below the hero, email text fits without clipping, and both pages retain the current dark editorial visual language.

- [ ] **Step 3: Merge and verify on a clean main workspace**

Fast-forward the completed feature branch into `main`, remove the owned `.worktrees/` worktree, delete the merged feature branch, and rerun Step 1 from the clean main workspace. Do not push if any command fails.

- [ ] **Step 4: Push and verify GitHub Pages**

```bash
git push origin main
RUN_ID=$(gh run list --workflow deploy.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

Expected: the workflow for the new homepage commit completes with `conclusion: success`.

- [ ] **Step 5: Verify the production DOM**

Use Playwright against `https://kailanalan0209.github.io/` and `/en/` to verify the localized `h1`, `mailto:` link, project link, English notes/experience links, 390px no-overflow behavior, and HTTP 200 responses. Confirm `git status --short --branch` reports a clean `main` synchronized with `origin/main`.
