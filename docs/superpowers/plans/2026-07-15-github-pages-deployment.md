# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the Astro 7 static site at `https://kailanalan0209.github.io` with production metadata and automatic deployment from `main`.

**Architecture:** Keep Astro's static root-path output and add the production origin through `Astro.site`. Generate canonical and Open Graph URLs in the shared layout, but keep UI language fallbacks separate from real SEO alternates. Deploy with Astro's official GitHub Pages action to a public user-site repository.

**Tech Stack:** Astro 7.0.9, TypeScript 5.9.3, Vitest 3.2.7, Playwright 1.61.1, GitHub Actions, GitHub Pages

## Global Constraints

- The public repository must be `kailanalan0209/kailanalan0209.github.io`.
- The production origin must be exactly `https://kailanalan0209.github.io`.
- Keep `output: 'static'` and `trailingSlash: 'always'`; do not add an adapter or `base`.
- Use Node.js 24 for the GitHub Actions build and keep the project minimum at Node.js `>=22.12.0` and npm `>=9.6.5`.
- Use `actions/checkout@v7`, `withastro/action@v6`, and `actions/deploy-pages@v5`.
- Keep TypeScript 5.9.3, Vitest 3.2.7, Playwright 1.61.1, and `@astrojs/check` 0.9.9 unchanged.
- Only real translations receive `hreflang` alternates; UI fallback destinations are not translations.
- The 404 page must not emit canonical or alternate links.
- Do not add a custom domain, analytics, comments, search, social share images, Twitter Cards, JSON-LD, content changes, or visual changes.
- Do not initialize the remote repository with a README, `.gitignore`, or license.

---

## File Map

- `astro.config.mjs`: declares the production origin while preserving static root-path output.
- `src/layouts/BaseLayout.astro`: owns canonical, Open Graph URL/type, and translated-page alternate tags.
- `src/layouts/ContentLayout.astro`: forwards an optional real-translation URL to the base layout.
- `src/pages/**/*.astro`: identifies pages with real translations and marks the 404 page non-indexable.
- `tests/e2e/metadata.spec.ts`: verifies production URLs, translation alternates, untranslated pages, and 404 behavior.
- `tests/unit/deployment.spec.js`: locks down the GitHub Pages workflow's trigger, action versions, runtime, and permissions.
- `.github/workflows/deploy.yml`: builds and deploys `main` with the official Astro GitHub action.
- `README.md`: records the production URL and automatic deployment behavior.

---

### Task 1: Add production URLs and accurate language alternates

**Files:**
- Create: `tests/e2e/metadata.spec.ts`
- Modify: `astro.config.mjs:3-6`
- Modify: `src/layouts/BaseLayout.astro:6-31`
- Modify: `src/layouts/ContentLayout.astro:4-15`
- Modify: `src/pages/index.astro:13`
- Modify: `src/pages/about.astro:4`
- Modify: `src/pages/projects/index.astro:9`
- Modify: `src/pages/projects/[id].astro:15`
- Modify: `src/pages/en/index.astro:8`
- Modify: `src/pages/en/about.astro:4`
- Modify: `src/pages/en/projects/index.astro:8`
- Modify: `src/pages/en/projects/[id].astro:16`
- Modify: `src/pages/404.astro:4`
- Modify: `tests/e2e/smoke.spec.ts:43-49`

**Interfaces:**
- Consumes: `Astro.site`, `Astro.url.pathname`, existing `locale` and `languageHref` props.
- Produces: `BaseLayout` props `alternateHref?: string` and `indexable?: boolean`; `ContentLayout` prop `alternateHref?: string`.

- [ ] **Step 1: Write failing metadata E2E tests**

Create `tests/e2e/metadata.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const origin = 'https://kailanalan0209.github.io';

test('indexable pages expose absolute production metadata', async ({ page }) => {
  for (const path of ['/', '/posts/api-key-privacy/']) {
    await page.goto(path);
    const expectedUrl = origin + path;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedUrl);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', expectedUrl);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    expect(await page.content()).not.toContain('http://localhost:4321');
  }
});

test('translated pages expose both real language alternates', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]'))
    .toHaveAttribute('href', origin + '/about/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]'))
    .toHaveAttribute('href', origin + '/en/about/');

  await page.goto('/en/projects/api-pulse/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]'))
    .toHaveAttribute('href', origin + '/projects/api-pulse/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]'))
    .toHaveAttribute('href', origin + '/en/projects/api-pulse/');
});

test('fallback destinations are not advertised as translations', async ({ page }) => {
  await page.goto('/posts/api-key-privacy/');
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
});

test('404 omits indexable metadata', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});
```

Delete the obsolete test named `generated pages omit canonical links until the production origin is known` from `tests/e2e/smoke.spec.ts`.

- [ ] **Step 2: Run the focused E2E test to prove RED**

Run:

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx playwright test tests/e2e/metadata.spec.ts
```

Expected: FAIL because canonical, `og:url`, `og:type`, and alternate tags do not exist yet.

- [ ] **Step 3: Configure the production site origin**

Change `astro.config.mjs` to:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kailanalan0209.github.io',
  output: 'static',
  trailingSlash: 'always',
});
```

- [ ] **Step 4: Implement shared metadata in BaseLayout**

Extend the props and frontmatter in `src/layouts/BaseLayout.astro`:

```astro
interface Props {
  title: string;
  description: string;
  locale: Locale;
  languageHref?: string;
  alternateHref?: string;
  indexable?: boolean;
}
const {
  title,
  description,
  locale,
  languageHref = locale === 'zh' ? '/en/' : '/',
  alternateHref,
  indexable = true,
} = Astro.props;
const documentTitle = title === site.name ? title : title + ' · ' + site.name;
const canonicalUrl = indexable && Astro.site ? new URL(Astro.url.pathname, Astro.site) : undefined;
const alternateUrl = canonicalUrl && alternateHref ? new URL(alternateHref, Astro.site) : undefined;
const currentHreflang = locale === 'zh' ? 'zh-CN' : 'en';
const alternateHreflang = locale === 'zh' ? 'en' : 'zh-CN';
```

Add these elements after the color-scheme meta tag:

```astro
{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
{alternateUrl && <link rel="alternate" hreflang={currentHreflang} href={canonicalUrl} />}
{alternateUrl && <link rel="alternate" hreflang={alternateHreflang} href={alternateUrl} />}
{canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
{canonicalUrl && <meta property="og:type" content="website" />}
```

Keep the existing title, description, header, main content, and footer unchanged.

- [ ] **Step 5: Forward real translation URLs through ContentLayout**

Add `alternateHref?: string` to the `Props` interface in `src/layouts/ContentLayout.astro`, destructure it, and pass it through:

```astro
const { title, summary, date, locale, languageHref, alternateHref, readingMinutes } = Astro.props;
---
<BaseLayout
  title={title}
  description={summary}
  locale={locale}
  languageHref={languageHref}
  alternateHref={alternateHref}
>
```

- [ ] **Step 6: Mark only real page pairs as alternates**

Add `alternateHref` equal to the existing real language destination on these static page calls:

```astro
<!-- src/pages/index.astro -->
<BaseLayout title="WKL" description={site.zhDescription} locale="zh" languageHref="/en/" alternateHref="/en/">

<!-- src/pages/about.astro -->
<BaseLayout title="关于 WKL" description="WKL 的学习方向与履历摘要。" locale="zh" languageHref="/en/about/" alternateHref="/en/about/">

<!-- src/pages/projects/index.astro -->
<BaseLayout title="项目" description="WKL 的项目与实践。" locale="zh" languageHref="/en/projects/" alternateHref="/en/projects/">

<!-- src/pages/en/index.astro -->
<BaseLayout title="WKL" description={site.enDescription} locale="en" languageHref="/" alternateHref="/">

<!-- src/pages/en/about.astro -->
<BaseLayout title="About WKL" description="Current interests and resume summary." locale="en" languageHref="/about/" alternateHref="/about/">

<!-- src/pages/en/projects/index.astro -->
<BaseLayout title="Projects" description="WKL projects and practice." locale="en" languageHref="/projects/" alternateHref="/projects/">
```

For dynamic project pages, pass the alternate only when the matching entry exists:

```astro
<!-- src/pages/projects/[id].astro -->
<ContentLayout ... languageHref={languageHref} alternateHref={translated ? languageHref : undefined}>

<!-- src/pages/en/projects/[id].astro -->
<ContentLayout ... languageHref={languageHref} alternateHref={chinese ? languageHref : undefined}>
```

Do not add `alternateHref` to posts. Mark the 404 layout call non-indexable:

```astro
<BaseLayout
  title="页面未找到 / Page not found"
  description="The requested page does not exist."
  locale="zh"
  languageHref="/en/"
  indexable={false}
>
```

- [ ] **Step 7: Run focused tests to prove GREEN**

Run:

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx playwright test tests/e2e/metadata.spec.ts tests/e2e/smoke.spec.ts
```

Expected: all metadata and smoke tests PASS; no Playwright-managed Astro process remains on port 4321.

- [ ] **Step 8: Commit Task 1**

```bash
git add astro.config.mjs src/layouts/BaseLayout.astro src/layouts/ContentLayout.astro src/pages tests/e2e
git diff --cached --check
git commit -m "feat: add production site metadata"
```

---

### Task 2: Add the official GitHub Pages workflow

**Files:**
- Create: `tests/unit/deployment.spec.js`
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: npm `package-lock.json`, `npm run build`, static `dist/`, branch `main`.
- Produces: GitHub Pages artifact and deployment URL from `steps.deployment.outputs.page_url`.

- [ ] **Step 1: Write a failing workflow contract test**

Create `tests/unit/deployment.spec.js`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../../.github/workflows/deploy.yml', import.meta.url);

describe('GitHub Pages deployment workflow', () => {
  it('uses the approved trigger, permissions, runtime, and action versions', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('withastro/action@v6');
    expect(workflow).toContain('node-version: 24');
    expect(workflow).toContain('actions/deploy-pages@v5');
    expect(workflow).toContain('name: github-pages');
  });
});
```

- [ ] **Step 2: Run the unit test to prove RED**

Run:

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx vitest run tests/unit/deployment.spec.js
```

Expected: FAIL with `ENOENT` for `.github/workflows/deploy.yml`.

- [ ] **Step 3: Add the minimal official deployment workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7
      - name: Install, build, and upload site
        uses: withastro/action@v6
        with:
          node-version: 24

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy site
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: Document the production deployment**

Append this section to `README.md`:

```markdown
## 线上部署

生产站点：<https://kailanalan0209.github.io>

`main` 分支每次推送后，GitHub Actions 使用 Node.js 24 构建 Astro 静态站点，并将 `dist/` 发布到 GitHub Pages。
```

- [ ] **Step 5: Run the workflow contract test to prove GREEN**

Run:

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx vitest run tests/unit/deployment.spec.js
```

Expected: 1 test PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add .github/workflows/deploy.yml tests/unit/deployment.spec.js README.md
git diff --cached --check
git commit -m "ci: deploy site to GitHub Pages"
```

---

### Task 3: Run complete local release verification

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: the completed metadata and deployment commits.
- Produces: evidence that the exact commit intended for `main` is safe to publish.

- [ ] **Step 1: Install from the committed lockfile**

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm ci
```

Expected: exit 0 and `found 0 vulnerabilities`.

- [ ] **Step 2: Run the full project verification**

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run verify
```

Expected: 27 unit tests, Astro Check 0/0/0, 14 static pages, build audit PASS, and all E2E tests PASS.

- [ ] **Step 3: Run both dependency audit gates**

```bash
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm audit --omit=dev --audit-level=high
PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm audit
```

Expected: both commands exit 0 with 0 vulnerabilities.

- [ ] **Step 4: Inspect production output and repository scope**

```bash
rg -n "localhost:4321|/Users/|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY" dist && exit 1 || true
rg -n "https://kailanalan0209.github.io" dist/index.html dist/en/index.html
git diff --check 50d634c..HEAD
git status --short
```

Expected: no local path or private-key matches; production URL exists in Chinese and English output; diff check is clean; working tree is clean.

---

### Task 4: Create the public GitHub repository and publish main

**Files:**
- External state: `https://github.com/kailanalan0209/kailanalan0209.github.io`
- Local Git config: add `origin` only after repository creation succeeds.

**Interfaces:**
- Consumes: verified local `main` and the user's authenticated GitHub browser session.
- Produces: public remote repository, `origin`, pushed `main`, and a triggered Pages workflow.

- [ ] **Step 1: Reconfirm the target is still absent**

Open `https://github.com/kailanalan0209/kailanalan0209.github.io`.

Expected: GitHub returns Not Found. If it exists, stop and inspect ownership and history before adding a remote.

- [ ] **Step 2: Create the repository in the authenticated browser**

Open `https://github.com/new`, verify the signed-in owner is `kailanalan0209`, and set:

- Repository name: `kailanalan0209.github.io`
- Description: `WKL's bilingual portfolio and notes, built with Astro.`
- Visibility: Public
- Initialize with README: off
- Add `.gitignore`: None
- License: None

Create the repository. If authentication, account ownership, or secondary verification is unclear, stop without guessing credentials.

- [ ] **Step 3: Add the HTTPS remote and push main**

```bash
git remote add origin https://github.com/kailanalan0209/kailanalan0209.github.io.git
git push -u origin main
```

Expected: push succeeds and local `main` tracks `origin/main`. If browser authentication cannot authorize Git, use GitHub's supported browser/device authentication flow; do not place a token in the command line or repository.

- [ ] **Step 4: Ensure Pages uses GitHub Actions**

Open repository Settings → Pages. Set Build and deployment → Source to `GitHub Actions` if it is not already selected.

Expected: the repository displays GitHub Actions as the Pages source, and the pushed workflow is running or queued.

---

### Task 5: Verify the GitHub workflow and live site

**Files:**
- Verify only; no planned local changes.

**Interfaces:**
- Consumes: pushed workflow and GitHub Pages deployment.
- Produces: evidence for the public URL, core routes, metadata, and final clean repository state.

- [ ] **Step 1: Wait for the deployment workflow**

Open the repository Actions tab and inspect the `Deploy to GitHub Pages` run for the pushed commit.

Expected: both `build` and `deploy` jobs complete successfully. If either fails, inspect the exact failing step and return to a focused local fix; do not disable checks.

- [ ] **Step 2: Verify public route responses**

```bash
for path in / /en/ /projects/ /posts/ /about/; do
  curl --fail --silent --show-error --location --output /dev/null \
    --write-out "%{http_code} $path\n" "https://kailanalan0209.github.io$path"
done
```

Expected: every route reports HTTP 200.

- [ ] **Step 3: Verify live metadata and content**

```bash
curl --fail --silent --show-error --location https://kailanalan0209.github.io/ | \
  rg "<title>WKL</title>|rel=\"canonical\"|hreflang=\"zh-CN\"|hreflang=\"en\"|og:url"
curl --fail --silent --show-error --location https://kailanalan0209.github.io/en/ | \
  rg "Turn curiosity|https://kailanalan0209.github.io/en/"
curl --fail --silent --show-error --location https://kailanalan0209.github.io/does-not-exist | \
  rg "页面未找到|Page not found"
```

Expected: production metadata uses the GitHub Pages origin, English content is present, and the custom 404 recovery content is served.

- [ ] **Step 4: Record final Git state**

```bash
git status --short
git remote -v
git log --oneline --decorate -5
```

Expected: working tree clean; `origin` points to the user-site repository; local and remote `main` point to the same verified deployment commit.
