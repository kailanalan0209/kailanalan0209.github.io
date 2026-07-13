# WKL Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual, static Astro portfolio and blog that presents two flagship projects, three brief experiences, two Chinese articles, and a warm technology-focused visual identity.

**Architecture:** Astro statically generates all routes from focused page components and three Content Collections. Shared layouts and presentation components consume validated content, while a small locale utility owns every Chinese/English routing decision. Verification combines schema unit tests, Astro checks/builds, Playwright smoke tests, and a post-build privacy/link audit.

**Tech Stack:** Node.js 20.11.1, npm 10.2.4, Astro 5.18.2, TypeScript 5.9.3, Vitest 3.2.7, Playwright 1.61.1, @astrojs/check 0.9.9

## Global Constraints

- Chinese is the default language; English core pages live under `/en/`.
- Runtime JavaScript is limited to behavior that cannot be expressed with HTML and CSS.
- The initial brand is `WKL`; use a wordmark until an approved portrait exists.
- The public contact address is `2694421597@qq.com`.
- Project status is exactly one of `已完成产品`, `团队项目`, or `概念设计`.
- Do not publish student numbers, teacher names, team member lists, secrets, absolute local paths, or internal documents.
- No CMS, account system, comments, search, analytics, newsletter, database, automatic translation, custom domain, or deployment automation.
- Missing required content must fail the build; missing English articles must redirect to `/en/?notice=zh-only`.
- Every task must preserve keyboard navigation, visible focus, adequate contrast, alt text, and reduced-motion behavior.

---

## File Map

- `package.json`, `package-lock.json`: pinned dependencies and verification scripts.
- `astro.config.mjs`, `tsconfig.json`: strict static-site configuration.
- `src/content.config.ts`: collection loaders and schema definitions.
- `src/content/{projects,posts,experience}/`: source-controlled Markdown content.
- `src/lib/site.ts`: brand, navigation, locale, and fallback helpers.
- `src/layouts/BaseLayout.astro`, `ContentLayout.astro`: shared document and long-form shells.
- `src/components/`: focused navigation, card, list, and language components.
- `src/styles/global.css`: tokens, responsive layout, focus, and reduced-motion rules.
- `src/pages/`: Chinese default routes, English core routes, content routes, and 404.
- `public/images/`: approved project artwork and brand fallback SVGs only.
- `tests/unit/`: Vitest tests for schemas and locale behavior.
- `tests/e2e/`: Playwright tests for routes, navigation, responsiveness, and privacy-sensitive output.
- `scripts/audit-build.mjs`: internal-link and sensitive-pattern audit over `dist/`.

### Task 1: Establish the Astro project and verification harness

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Modify: `.gitignore`
- Create: `src/pages/index.astro`
- Create: `tests/e2e/smoke.spec.ts`
- Create: `playwright.config.ts`
- Generate: `package-lock.json`

**Interfaces:**
- Produces: npm scripts `dev`, `check`, `build`, `test:unit`, `test:e2e`, and `verify`.
- Produces: a static root route returning an HTML document with title `WKL`.

- [ ] **Step 1: Add the project manifest and strict configuration**

~~~json
{
  "name": "wkl-personal-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro build",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "audit": "node scripts/audit-build.mjs",
    "verify": "npm run test:unit && npm run check && npm run build && npm run audit && npm run test:e2e"
  },
  "dependencies": {
    "astro": "5.18.2"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.9",
    "@playwright/test": "1.61.1",
    "typescript": "5.9.3",
    "vitest": "3.2.7"
  }
}
~~~

`astro.config.mjs`:

~~~js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
});
~~~

`tsconfig.json`:

~~~json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
~~~

`.gitignore`:

~~~text
node_modules/
dist/
.astro/
playwright-report/
test-results/
.DS_Store
.superpowers/
work/
.worktrees/
~~~

- [ ] **Step 2: Install dependencies and the Playwright browser**

Run: `npm install && npx playwright install chromium`

Expected: `package-lock.json` is created; npm exits 0; Chromium installation exits 0.

- [ ] **Step 3: Write the failing root-page smoke test**

`tests/e2e/smoke.spec.ts`:

~~~ts
import { expect, test } from '@playwright/test';

test('root page identifies the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/WKL/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把好奇心');
});
~~~

`playwright.config.ts`:

~~~ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4321' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
  },
});
~~~

- [ ] **Step 4: Run the smoke test and verify it fails**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`

Expected: FAIL because `src/pages/index.astro` does not exist.

- [ ] **Step 5: Add the minimal root page**

`src/pages/index.astro`:

~~~astro
---
const title = 'WKL';
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <main><h1>把好奇心，做成看得见的东西。</h1></main>
  </body>
</html>
~~~

- [ ] **Step 6: Run the smoke test and static checks**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts && npm run check && npm run build`

Expected: one Playwright test passes; Astro reports 0 errors; `dist/index.html` exists.

- [ ] **Step 7: Commit the foundation**

~~~bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .gitignore playwright.config.ts src/pages/index.astro tests/e2e/smoke.spec.ts
git commit -m "chore: scaffold Astro portfolio"
~~~

### Task 2: Define validated content collections and seed real content

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/macos-setup-assistant.md`
- Create: `src/content/projects/api-pulse.md`
- Create: `src/content/posts/macos-setup-workflow.md`
- Create: `src/content/posts/api-key-privacy.md`
- Create: `src/content/experience/statistical-modeling.md`
- Create: `src/content/experience/aging-design.md`
- Create: `src/content/experience/omniguide.md`
- Create: `tests/unit/content-schema.spec.ts`

**Interfaces:**
- Produces: collections named `projects`, `posts`, and `experience`.
- Produces: exported schemas `projectSchema`, `postSchema`, and `experienceSchema`.
- Produces: project fields `title`, `summary`, `role`, `date`, `technologies`, `cover`, `status`, `outcome`, `lang`, `translationKey`, `featured`.

- [ ] **Step 1: Write failing schema tests**

`tests/unit/content-schema.spec.ts`:

~~~ts
import { describe, expect, it } from 'vitest';
import { experienceSchema, postSchema, projectSchema } from '../../src/content.config';

describe('content schemas', () => {
  it('rejects an unsupported project status', () => {
    const result = projectSchema.safeParse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      cover: '/images/project-fallback.svg',
      status: '进行中',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
      featured: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a Chinese post without an English translation', () => {
    expect(postSchema.safeParse({
      title: '文章',
      summary: '摘要',
      publishedAt: new Date('2026-07-14'),
      tags: ['开发记录'],
      cover: '/images/article-fallback.svg',
      lang: 'zh',
      translationKey: 'article',
      readingMinutes: 2,
      draft: false,
    }).success).toBe(true);
  });

  it('requires a personal contribution for experience', () => {
    expect(experienceSchema.safeParse({
      title: '比赛',
      date: '2024',
      outcome: '完成研究',
      type: '团队项目',
      lang: 'zh',
      translationKey: 'contest',
    }).success).toBe(false);
  });
});
~~~

- [ ] **Step 2: Run unit tests and verify the missing module failure**

Run: `npm run test:unit -- tests/unit/content-schema.spec.ts`

Expected: FAIL with “Cannot find module '../../src/content.config'”.

- [ ] **Step 3: Implement collection schemas and loaders**

`src/content.config.ts`:

~~~ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const language = z.enum(['zh', 'en']);
const projectStatus = z.enum(['已完成产品', '团队项目', '概念设计']);

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  date: z.coerce.date(),
  technologies: z.array(z.string().min(1)).min(1),
  cover: z.string().startsWith('/'),
  status: projectStatus,
  outcome: z.string().min(1),
  lang: language,
  translationKey: z.string().min(1),
  featured: z.boolean().default(false),
});

export const postSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.coerce.date(),
  tags: z.array(z.string().min(1)).min(1),
  cover: z.string().startsWith('/'),
  lang: language,
  translationKey: z.string().min(1),
  readingMinutes: z.number().int().positive(),
  draft: z.boolean().default(false),
});

export const experienceSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  contribution: z.string().min(1),
  outcome: z.string().min(1),
  type: z.enum(['团队项目', '课程概念']),
  lang: language,
  translationKey: z.string().min(1),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postSchema,
});
const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: experienceSchema,
});

export const collections = { projects, posts, experience };
~~~

- [ ] **Step 4: Add the seven approved content files**

`src/content/projects/macos-setup-assistant.md`:

~~~md
---
title: macOS 装机助手
summary: 把软件选择、安全检查、批量安装和日志查看整合为一个本地工作流。
role: 产品设计与开发
date: 2026-07-10
technologies: [SwiftUI, Shell, APFS]
cover: /images/project-fallback.svg
status: 已完成产品
outcome: 把软件选择、安全检查、安装与日志整合进一个可维护的本地工作流。
lang: zh
translationKey: macos-setup-assistant
featured: true
---

这个项目面向需要重复配置 Mac 的场景。原生 SwiftUI 界面负责选择、预览和查看结果，Shell 脚本负责校验与安装。

实现中重点处理了 dry-run、安全检查、安装后验证和日志记录。临时准备目录优先使用 APFS 写时复制，不支持时回退到普通复制。
~~~

`src/content/projects/api-pulse.md`:

~~~md
---
title: API Pulse
summary: 汇总 DeepSeek 余额、MiMo Key 状态和本地请求用量的仪表盘。
role: 设计与开发
date: 2026-07-13
technologies: [Node.js, HTTP API, SQLite]
cover: /images/project-fallback.svg
status: 已完成产品
outcome: 在不向浏览器暴露密钥的前提下汇总余额与本地用量。
lang: zh
translationKey: api-pulse
featured: true
---

API Pulse 通过服务端调用官方接口，并从本地数据库汇总请求数、Token、成功率和估算费用。

API Key 只在服务端内存中使用，浏览器通过 HttpOnly 会话 Cookie 隔离访客。公开部署时默认不读取站点所有者的本地凭据。
~~~

`src/content/posts/macos-setup-workflow.md`:

~~~md
---
title: 我如何把 macOS 批量安装流程做成原生工具
summary: 从脚本入口到 SwiftUI 界面，记录一次围绕安全、预览和可维护性的迭代。
publishedAt: 2026-07-14
tags: [开发记录, macOS]
cover: /images/article-fallback.svg
lang: zh
translationKey: macos-setup-workflow
readingMinutes: 3
draft: false
---

最初的问题不是“怎样做一个安装器”，而是怎样让重复装机过程可预览、可核对、可追踪。

最终流程把软件清单、dry-run、安全检查、安装后验证和日志放在同一条路径上。图形界面降低操作门槛，脚本仍保留为可排查、可扩展的底层能力。
~~~

`src/content/posts/api-key-privacy.md`:

~~~md
---
title: API Key 仪表盘中的隐私边界
summary: 为什么密钥留在服务端，以及本地能力与公开部署需要怎样隔离。
publishedAt: 2026-07-14
tags: [隐私, Node.js]
cover: /images/article-fallback.svg
lang: zh
translationKey: api-key-privacy
readingMinutes: 2
draft: false
---

用量仪表盘需要访问平台接口，但这不意味着浏览器应该接触 API Key。

API Pulse 把密钥限制在服务端内存，通过 HttpOnly Cookie 隔离会话。读取本机数据库的能力默认关闭，只有明确启用时才用于本地自用场景。
~~~

`src/content/experience/statistical-modeling.md`:

~~~md
---
title: 全国大学生统计建模大赛
date: "2024"
contribution: 参与数据采集、指标体系与模型研究。
outcome: 完成城市社会工作服务评价的 AHP/EWM 建模与实证分析。
type: 团队项目
lang: zh
translationKey: statistical-modeling
---
~~~

`src/content/experience/aging-design.md`:

~~~md
---
title: 智庆余年
date: "2024"
contribution: 参与需求研究与产品方案整理。
outcome: 形成智慧养老与 3D 打印适老化改造方案。
type: 团队项目
lang: zh
translationKey: aging-design
---
~~~

`src/content/experience/omniguide.md`:

~~~md
---
title: OmniGuide
date: "2025"
contribution: 完成系统构想与技术伦理分析。
outcome: 提出多模态视障辅助系统的端边云架构与隐私边界。
type: 课程概念
lang: zh
translationKey: omniguide
---
~~~

- [ ] **Step 5: Run unit tests, Astro check, and build**

Run: `npm run test:unit -- tests/unit/content-schema.spec.ts && npm run check && npm run build`

Expected: 3 unit tests pass; Astro reports 0 errors; all seven entries load without schema errors.

- [ ] **Step 6: Commit validated content**

~~~bash
git add src/content.config.ts src/content tests/unit/content-schema.spec.ts
git commit -m "feat: add validated portfolio content"
~~~

### Task 3: Build the shared design system and page shell

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/ContentLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/LanguageLink.astro`
- Create: `src/styles/global.css`
- Create: `public/images/project-fallback.svg`
- Create: `public/images/article-fallback.svg`
- Create: `tests/unit/site.spec.ts`

**Interfaces:**
- Produces: `type Locale = 'zh' | 'en'`.
- Produces: `getLocalePath(locale: Locale, path?: string): string`.
- Produces: `getFallbackPath(locale: Locale, hasTranslation: boolean, translatedPath?: string): string`.
- Produces: `BaseLayout` props `title`, `description`, `locale`, and optional `languageHref`.

- [ ] **Step 1: Write failing locale tests**

`tests/unit/site.spec.ts`:

~~~ts
import { describe, expect, it } from 'vitest';
import { getFallbackPath, getLocalePath } from '../../src/lib/site';

describe('locale routing', () => {
  it('keeps Chinese at the root', () => {
    expect(getLocalePath('zh', '/about/')).toBe('/about/');
  });
  it('prefixes English paths', () => {
    expect(getLocalePath('en', '/about/')).toBe('/en/about/');
  });
  it('falls back from untranslated Chinese content to English home', () => {
    expect(getFallbackPath('en', false)).toBe('/en/?notice=zh-only');
  });
  it('uses a translated path when one exists', () => {
    expect(getFallbackPath('en', true, '/en/projects/api-pulse/')).toBe('/en/projects/api-pulse/');
  });
});
~~~

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `npm run test:unit -- tests/unit/site.spec.ts`

Expected: FAIL with “Cannot find module '../../src/lib/site'”.

- [ ] **Step 3: Implement the site configuration and routing helpers**

`src/lib/site.ts`:

~~~ts
export type Locale = 'zh' | 'en';

export const site = {
  name: 'WKL',
  zhDescription: '把好奇心做成看得见的项目与文章。',
  enDescription: 'Projects and notes shaped by curiosity.',
  email: '2694421597@qq.com',
} as const;

export function getLocalePath(locale: Locale, path = '/'): string {
  const normalized = path.startsWith('/') ? path : '/' + path;
  if (locale === 'zh') return normalized;
  return normalized === '/' ? '/en/' : '/en' + normalized;
}

export function getFallbackPath(
  locale: Locale,
  hasTranslation: boolean,
  translatedPath?: string,
): string {
  if (hasTranslation && translatedPath) return translatedPath;
  return locale === 'en' ? '/en/?notice=zh-only' : '/';
}
~~~

- [ ] **Step 4: Implement layouts, header, footer, and language link**

`src/components/LanguageLink.astro`:

~~~astro
---
interface Props { href: string; label: string; }
const { href, label } = Astro.props;
---
<a class="language-link" href={href} hreflang={label === 'EN' ? 'en' : 'zh-CN'}>{label}</a>
~~~

`src/components/SiteHeader.astro`:

~~~astro
---
import LanguageLink from './LanguageLink.astro';
import { getLocalePath, type Locale } from '../lib/site';
interface Props { locale: Locale; languageHref: string; }
const { locale, languageHref } = Astro.props;
const copy = locale === 'zh'
  ? { projects: '项目', posts: '文章', about: '关于', language: 'EN' }
  : { projects: 'Projects', posts: 'Notes', about: 'About', language: '中' };
---
<header class="site-header shell">
  <a class="wordmark" href={getLocalePath(locale)}>WKL<span aria-hidden="true">●</span></a>
  <nav aria-label={locale === 'zh' ? '主导航' : 'Primary'}>
    <a href={getLocalePath(locale, '/projects/')}>{copy.projects}</a>
    <a href={locale === 'zh' ? '/posts/' : '/en/?notice=zh-only'}>{copy.posts}</a>
    <a href={getLocalePath(locale, '/about/')}>{copy.about}</a>
    <LanguageLink href={languageHref} label={copy.language} />
  </nav>
</header>
~~~

`src/components/SiteFooter.astro`:

~~~astro
---
import type { Locale } from '../lib/site';
import { site } from '../lib/site';
interface Props { locale: Locale; }
const { locale } = Astro.props;
---
<footer class="site-footer shell">
  <p>WKL · 2026</p>
  <p><a href={'mailto:' + site.email}>{locale === 'zh' ? '联系我' : 'Contact'} · {site.email}</a></p>
</footer>
~~~

`src/layouts/BaseLayout.astro`:

~~~astro
---
import SiteFooter from '../components/SiteFooter.astro';
import SiteHeader from '../components/SiteHeader.astro';
import { site, type Locale } from '../lib/site';
import '../styles/global.css';
interface Props {
  title: string;
  description: string;
  locale: Locale;
  languageHref?: string;
}
const { title, description, locale, languageHref = locale === 'zh' ? '/en/' : '/' } = Astro.props;
const documentTitle = title === site.name ? title : title + ' · ' + site.name;
---
<!doctype html>
<html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <meta name="color-scheme" content="dark" />
    <meta property="og:title" content={documentTitle} />
    <meta property="og:description" content={description} />
    <link rel="canonical" href={Astro.url.href} />
    <title>{documentTitle}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">{locale === 'zh' ? '跳到主要内容' : 'Skip to content'}</a>
    <SiteHeader locale={locale} languageHref={languageHref} />
    <main id="main-content" tabindex="-1"><slot /></main>
    <SiteFooter locale={locale} />
  </body>
</html>
~~~

`src/layouts/ContentLayout.astro`:

~~~astro
---
import BaseLayout from './BaseLayout.astro';
import type { Locale } from '../lib/site';
interface Props {
  title: string;
  summary: string;
  date: Date;
  locale: Locale;
  languageHref?: string;
  readingMinutes?: number;
}
const { title, summary, date, locale, languageHref, readingMinutes } = Astro.props;
---
<BaseLayout title={title} description={summary} locale={locale} languageHref={languageHref}>
  <article class="prose shell">
    <p class="eyebrow">{new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', { dateStyle: 'medium' }).format(date)}{readingMinutes ? ' · ' + readingMinutes + (locale === 'zh' ? ' 分钟阅读' : ' min read') : ''}</p>
    <h1>{title}</h1>
    <p class="lede">{summary}</p>
    <slot />
  </article>
</BaseLayout>
~~~

- [ ] **Step 5: Add the exact visual tokens and accessibility rules**

`src/styles/global.css` begins with:

~~~css
:root {
  color-scheme: dark;
  --bg: #151310;
  --surface: #211d18;
  --text: #f4ecdf;
  --muted: #b9aa98;
  --accent: #ff8a3d;
  --line: #3b332b;
  --max: 72rem;
  --radius: 1.25rem;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html { background: var(--bg); color: var(--text); scroll-behavior: smooth; }
body { margin: 0; line-height: 1.65; }
a { color: inherit; text-underline-offset: .2em; }
a:focus-visible, button:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
.shell { width: min(calc(100% - 2rem), var(--max)); margin-inline: auto; }
.skip-link { position: absolute; left: 1rem; top: -4rem; }
.skip-link:focus { top: 1rem; z-index: 10; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
~~~

Append these rules:

~~~css
.site-header, .site-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 1.25rem; }
.site-header nav { display: flex; align-items: center; gap: 1rem; }
.wordmark { font-weight: 800; text-decoration: none; letter-spacing: .08em; }
.wordmark span, .eyebrow { color: var(--accent); }
.hero { padding-block: clamp(5rem, 12vw, 10rem); }
.hero h1 { max-width: 12ch; margin: 0; font-size: clamp(3rem, 9vw, 7rem); line-height: .98; letter-spacing: -.05em; }
.lede { max-width: 44rem; color: var(--muted); font-size: 1.15rem; }
.section { padding-block: 4rem; border-top: 1px solid var(--line); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
.card { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); transition: transform .2s ease, border-color .2s ease; }
.card:hover { transform: translateY(-3px); border-color: var(--accent); }
.card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.card-body { padding: 1.25rem; }
.card h2, .card h3 { margin-block: .35rem; }
.tags { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; list-style: none; color: var(--muted); }
.experience-list { display: grid; gap: 1rem; padding: 0; list-style: none; }
.experience-list li { padding: 1.25rem; border-left: 3px solid var(--accent); background: var(--surface); }
.prose { max-width: 48rem; padding-block: 5rem; }
.prose h1 { font-size: clamp(2.5rem, 7vw, 5rem); line-height: 1; }
.prose img { max-width: 100%; height: auto; }
.site-footer { margin-top: 4rem; border-top: 1px solid var(--line); color: var(--muted); }
@media (max-width: 48rem) {
  .site-header, .site-footer, .section-heading { align-items: flex-start; flex-direction: column; }
  .site-header nav { width: 100%; flex-wrap: wrap; justify-content: space-between; }
  .card-grid { grid-template-columns: 1fr; }
}
~~~

- [ ] **Step 6: Add two deterministic SVG fallbacks**

`public/images/project-fallback.svg`:

~~~svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img">
  <title>WKL project cover</title>
  <rect width="1600" height="900" fill="#151310"/>
  <circle cx="1320" cy="180" r="180" fill="#ff8a3d"/>
  <text x="120" y="740" fill="#f4ecdf" font-family="system-ui" font-size="96" font-weight="700">WKL / PROJECT</text>
</svg>
~~~

`public/images/article-fallback.svg`:

~~~svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img">
  <title>WKL article cover</title>
  <rect width="1600" height="900" fill="#151310"/>
  <circle cx="280" cy="200" r="180" fill="#ff8a3d"/>
  <text x="120" y="740" fill="#f4ecdf" font-family="system-ui" font-size="96" font-weight="700">WKL / NOTES</text>
</svg>
~~~

- [ ] **Step 7: Run unit and static checks**

Run: `npm run test:unit -- tests/unit/site.spec.ts && npm run check && npm run build`

Expected: 4 locale tests pass; Astro reports 0 errors; build exits 0.

- [ ] **Step 8: Commit the shared system**

~~~bash
git add src/lib src/layouts src/components src/styles public/images tests/unit/site.spec.ts
git commit -m "feat: add portfolio design system"
~~~

### Task 4: Implement Chinese pages and dynamic content routes

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/projects/[id].astro`
- Create: `src/pages/posts/index.astro`
- Create: `src/pages/posts/[id].astro`
- Create: `src/pages/about.astro`
- Create: `src/components/ProjectCard.astro`
- Create: `src/components/PostCard.astro`
- Create: `src/components/ExperienceList.astro`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `getCollection('projects' | 'posts' | 'experience')`.
- Produces: routes `/`, `/projects/`, `/projects/:id/`, `/posts/`, `/posts/:id/`, and `/about/`.
- Produces: card props matching the schemas from Task 2.

- [ ] **Step 1: Extend smoke tests for all Chinese routes**

Add tests that assert:

~~~ts
test('Chinese core routes expose their primary heading', async ({ page }) => {
  for (const [path, heading] of [
    ['/', '把好奇心'],
    ['/projects/', '项目'],
    ['/posts/', '文章'],
    ['/about/', '关于 WKL'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
  }
});

test('flagship projects and first posts have detail pages', async ({ page }) => {
  for (const path of [
    '/projects/macos-setup-assistant/',
    '/projects/api-pulse/',
    '/posts/macos-setup-workflow/',
    '/posts/api-key-privacy/',
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main article')).toBeVisible();
  }
});
~~~

- [ ] **Step 2: Run the focused browser tests and verify route failures**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`

Expected: root test passes; new route tests fail with 404.

- [ ] **Step 3: Implement focused cards and the experience list**

`src/components/ProjectCard.astro`:

~~~astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { project: CollectionEntry<'projects'>; href: string; locale?: 'zh' | 'en'; }
const { project, href, locale = 'zh' } = Astro.props;
---
<article class="card">
  <img src={project.data.cover} alt={project.data.title + (locale === 'zh' ? '项目封面' : ' project cover')} width="1600" height="900" />
  <div class="card-body">
    <p class="eyebrow">{project.data.status}</p>
    <h2><a href={href}>{project.data.title}</a></h2>
    <p>{project.data.summary}</p>
    <ul class="tags" aria-label={locale === 'zh' ? '使用技术' : 'Technologies'}>
      {project.data.technologies.map((item) => <li>{item}</li>)}
    </ul>
  </div>
</article>
~~~

`src/components/PostCard.astro`:

~~~astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { post: CollectionEntry<'posts'>; href: string; }
const { post, href } = Astro.props;
---
<article class="card">
  <img src={post.data.cover} alt={post.data.title + '文章封面'} width="1600" height="900" />
  <div class="card-body">
    <p class="eyebrow">{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(post.data.publishedAt)} · {post.data.readingMinutes} 分钟阅读</p>
    <h2><a href={href}>{post.data.title}</a></h2>
    <p>{post.data.summary}</p>
    <ul class="tags" aria-label="文章标签">{post.data.tags.map((tag) => <li>{tag}</li>)}</ul>
  </div>
</article>
~~~

`src/components/ExperienceList.astro`:

~~~astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { entries: CollectionEntry<'experience'>[]; }
const { entries } = Astro.props;
---
<ul class="experience-list">
  {entries.map((entry) => (
    <li>
      <p class="eyebrow">{entry.data.date} · {entry.data.type}</p>
      <h3>{entry.data.title}</h3>
      <p>{entry.data.contribution}</p>
      <p>{entry.data.outcome}</p>
    </li>
  ))}
</ul>
~~~

- [ ] **Step 4: Implement list and detail routes**

`src/pages/projects/index.astro`:

~~~astro
---
import { getCollection } from 'astro:content';
import ProjectCard from '../../components/ProjectCard.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
const projects = (await getCollection('projects'))
  .filter((entry) => entry.data.lang === 'zh')
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title="项目" description="WKL 的项目与实践。" locale="zh" languageHref="/en/projects/">
  <section class="section shell"><h1>项目</h1><div class="card-grid">
    {projects.map((project) => <ProjectCard project={project} href={'/projects/' + project.id + '/'} />)}
  </div></section>
</BaseLayout>
~~~

`src/pages/posts/index.astro`:

~~~astro
---
import { getCollection } from 'astro:content';
import PostCard from '../../components/PostCard.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
const posts = (await getCollection('posts'))
  .filter((entry) => entry.data.lang === 'zh' && !entry.data.draft)
  .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
---
<BaseLayout title="文章" description="WKL 的开发记录与思考。" locale="zh" languageHref="/en/?notice=zh-only">
  <section class="section shell"><h1>文章</h1><div class="card-grid">
    {posts.map((post) => <PostCard post={post} href={'/posts/' + post.id + '/'} />)}
  </div></section>
</BaseLayout>
~~~

`src/pages/projects/[id].astro`:

~~~astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import ContentLayout from '../../layouts/ContentLayout.astro';
export async function getStaticPaths() {
  const entries = (await getCollection('projects')).filter((entry) => entry.data.lang === 'zh');
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
interface Props { entry: CollectionEntry<'projects'>; }
const { entry } = Astro.props;
const { Content } = await render(entry);
const translations = (await getCollection('projects')).filter((item) => item.data.lang === 'en');
const translated = translations.find((item) => item.data.translationKey === entry.data.translationKey);
const languageHref = translated ? '/en/projects/' + translated.data.translationKey + '/' : '/en/';
---
<ContentLayout title={entry.data.title} summary={entry.data.summary} date={entry.data.date} locale="zh" languageHref={languageHref}>
  <Content />
</ContentLayout>
~~~

`src/pages/posts/[id].astro`:

~~~astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import ContentLayout from '../../layouts/ContentLayout.astro';
export async function getStaticPaths() {
  const entries = (await getCollection('posts')).filter((entry) => entry.data.lang === 'zh' && !entry.data.draft);
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
interface Props { entry: CollectionEntry<'posts'>; }
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ContentLayout title={entry.data.title} summary={entry.data.summary} date={entry.data.publishedAt} locale="zh" languageHref="/en/?notice=zh-only" readingMinutes={entry.data.readingMinutes}>
  <Content />
</ContentLayout>
~~~

- [ ] **Step 5: Rebuild the home and about pages**

`src/pages/index.astro`:

~~~astro
---
import { getCollection } from 'astro:content';
import ExperienceList from '../components/ExperienceList.astro';
import PostCard from '../components/PostCard.astro';
import ProjectCard from '../components/ProjectCard.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { site } from '../lib/site';
const projects = (await getCollection('projects')).filter((e) => e.data.lang === 'zh' && e.data.featured);
const posts = (await getCollection('posts')).filter((e) => e.data.lang === 'zh' && !e.data.draft)
  .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()).slice(0, 2);
const experience = (await getCollection('experience')).filter((e) => e.data.lang === 'zh');
---
<BaseLayout title="WKL" description={site.zhDescription} locale="zh" languageHref="/en/">
  <section class="hero shell">
    <p class="eyebrow">个人实验室 · DIGITAL GARDEN</p>
    <h1>把好奇心，做成看得见的东西。</h1>
    <p class="lede">我通过真实项目学习，把遇到的问题整理成可维护的工具和可复用的知识。</p>
  </section>
  <section class="section shell"><div class="section-heading"><h2>精选项目</h2><a href="/projects/">查看全部</a></div>
    <div class="card-grid">{projects.map((project) => <ProjectCard project={project} href={'/projects/' + project.id + '/'} />)}</div>
  </section>
  <section class="section shell"><div class="section-heading"><h2>最新文章</h2><a href="/posts/">查看全部</a></div>
    <div class="card-grid">{posts.map((post) => <PostCard post={post} href={'/posts/' + post.id + '/'} />)}</div>
  </section>
  <section class="section shell"><h2>其他经历</h2><ExperienceList entries={experience} /></section>
  <section class="section shell"><h2>继续了解</h2><p><a href="/about/">关于 WKL 与履历摘要</a></p></section>
</BaseLayout>
~~~

`src/pages/about.astro`:

~~~astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="关于 WKL" description="WKL 的学习方向与履历摘要。" locale="zh" languageHref="/en/about/">
  <article class="prose shell">
    <p class="eyebrow">ABOUT</p><h1>关于 WKL</h1>
    <p class="lede">我通过把真实问题做成可维护的工具来学习，也把过程整理成能复用的文章。</p>
    <h2>当前实践</h2><ul><li>SwiftUI 与 macOS 工具</li><li>Shell 自动化与安全边界</li><li>Node.js 服务与 API 集成</li><li>数据研究与产品构想</li></ul>
    <h2>履历摘要</h2><p>计算机科学与技术学习者，持续参与软件工具、数据研究与产品方案实践。</p>
    <h2>联系方式</h2><p><a href="mailto:2694421597@qq.com">2694421597@qq.com</a></p>
  </article>
</BaseLayout>
~~~

- [ ] **Step 6: Run route tests and static checks**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts && npm run check && npm run build`

Expected: all smoke tests pass; Astro reports 0 errors; every expected route is emitted under `dist/`.

- [ ] **Step 7: Commit Chinese pages**

~~~bash
git add src/pages src/components tests/e2e/smoke.spec.ts
git commit -m "feat: build Chinese portfolio pages"
~~~

### Task 5: Add English core pages and deterministic translation fallback

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/about.astro`
- Create: `src/pages/en/projects/index.astro`
- Create: `src/pages/en/projects/[id].astro`
- Create: `src/content/projects/macos-setup-assistant.en.md`
- Create: `src/content/projects/api-pulse.en.md`
- Modify: `src/components/LanguageLink.astro`
- Create: `tests/e2e/i18n.spec.ts`

**Interfaces:**
- Consumes: `translationKey` to pair Chinese and English project entries.
- Produces: English routes `/en/`, `/en/about/`, `/en/projects/`, and two English project details.
- Produces: untranslated article target `/en/?notice=zh-only`.

- [ ] **Step 1: Write failing i18n browser tests**

`tests/e2e/i18n.spec.ts`:

~~~ts
import { expect, test } from '@playwright/test';

test('English core pages use English headings and lang', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn curiosity');
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
~~~

- [ ] **Step 2: Run i18n tests and verify route failures**

Run: `npm run test:e2e -- tests/e2e/i18n.spec.ts`

Expected: FAIL because `/en/` and translated project routes do not exist.

- [ ] **Step 3: Add two English project summaries**

`src/content/projects/macos-setup-assistant.en.md`:

~~~md
---
title: macOS Setup Assistant
summary: A local workflow for selecting, checking, installing, and reviewing Mac software.
role: Product design and development
date: 2026-07-10
technologies: [SwiftUI, Shell, APFS]
cover: /images/project-fallback.svg
status: 已完成产品
outcome: Combined selection, safety checks, installation, verification, and logs in one maintainable workflow.
lang: en
translationKey: macos-setup-assistant
featured: true
---

The native SwiftUI interface handles selection, previews, and results while Shell scripts keep checks and installation inspectable.

The workflow includes dry-run behavior, package validation, post-install verification, logs, and an APFS copy-on-write optimization with a normal-copy fallback.
~~~

`src/content/projects/api-pulse.en.md`:

~~~md
---
title: API Pulse
summary: A dashboard for DeepSeek balance, MiMo key status, and locally recorded API usage.
role: Design and development
date: 2026-07-13
technologies: [Node.js, HTTP API, SQLite]
cover: /images/project-fallback.svg
status: 已完成产品
outcome: Summarized balance and local usage without exposing API keys to the browser.
lang: en
translationKey: api-pulse
featured: true
---

API Pulse calls official endpoints from the server and summarizes requests, tokens, success rate, and estimated cost from a local database.

Keys remain in server memory, visitor sessions are isolated with HttpOnly cookies, and public deployments do not read the site owner's local credentials by default.
~~~

- [ ] **Step 4: Implement English core routes**

`src/pages/en/index.astro`:

~~~astro
---
import { getCollection } from 'astro:content';
import ProjectCard from '../../components/ProjectCard.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { site } from '../../lib/site';
const projects = (await getCollection('projects')).filter((entry) => entry.data.lang === 'en' && entry.data.featured);
const showNotice = Astro.url.searchParams.get('notice') === 'zh-only';
---
<BaseLayout title="WKL" description={site.enDescription} locale="en" languageHref="/">
  <section class="hero shell">
    {showNotice && <p role="status">This content is currently available in Chinese only.</p>}
    <p class="eyebrow">PERSONAL LAB · DIGITAL GARDEN</p>
    <h1>Turn curiosity into things people can see and use.</h1>
    <p class="lede">I learn through real projects, then turn the process into maintainable tools and reusable notes.</p>
  </section>
  <section class="section shell"><h2>Selected projects</h2><div class="card-grid">
    {projects.map((project) => <ProjectCard project={project} locale="en" href={'/en/projects/' + project.data.translationKey + '/'} />)}
  </div></section>
  <section class="section shell"><h2>More</h2><p><a href="/en/about/">About WKL and resume summary</a></p></section>
</BaseLayout>
~~~

`src/pages/en/about.astro`:

~~~astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---
<BaseLayout title="About WKL" description="Current interests and resume summary." locale="en" languageHref="/about/">
  <article class="prose shell"><p class="eyebrow">ABOUT</p><h1>About WKL</h1>
    <p class="lede">I learn by turning real problems into maintainable tools and reusable notes.</p>
    <h2>Current practice</h2><ul><li>SwiftUI and macOS tools</li><li>Shell automation and safety boundaries</li><li>Node.js services and API integration</li><li>Data research and product concepts</li></ul>
    <h2>Resume summary</h2><p>Computer science learner working across software tools, data research, and product concepts.</p>
    <h2>Contact</h2><p><a href="mailto:2694421597@qq.com">2694421597@qq.com</a></p>
  </article>
</BaseLayout>
~~~

`src/pages/en/projects/index.astro` queries English projects, sorts by date, and renders `ProjectCard` with href `/en/projects/{translationKey}/`. `src/pages/en/projects/[id].astro` returns paths whose id is `translationKey`, renders the entry with `ContentLayout locale="en"`, and pairs its language link to the Chinese entry ID sharing the same key.

- [ ] **Step 5: Pair language links by translation key**

`src/pages/en/projects/[id].astro`:

~~~astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import ContentLayout from '../../../layouts/ContentLayout.astro';
export async function getStaticPaths() {
  const entries = (await getCollection('projects')).filter((entry) => entry.data.lang === 'en');
  return entries.map((entry) => ({ params: { id: entry.data.translationKey }, props: { entry } }));
}
interface Props { entry: CollectionEntry<'projects'>; }
const { entry } = Astro.props;
const { Content } = await render(entry);
const chinese = (await getCollection('projects')).find(
  (item) => item.data.lang === 'zh' && item.data.translationKey === entry.data.translationKey,
);
const languageHref = chinese ? '/projects/' + chinese.id + '/' : '/';
---
<ContentLayout title={entry.data.title} summary={entry.data.summary} date={entry.data.date} locale="en" languageHref={languageHref}>
  <Content />
</ContentLayout>
~~~

`src/pages/en/projects/index.astro`:

~~~astro
---
import { getCollection } from 'astro:content';
import ProjectCard from '../../../components/ProjectCard.astro';
import BaseLayout from '../../../layouts/BaseLayout.astro';
const projects = (await getCollection('projects')).filter((entry) => entry.data.lang === 'en')
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title="Projects" description="WKL projects and practice." locale="en" languageHref="/projects/">
  <section class="section shell"><h1>Projects</h1><div class="card-grid">
    {projects.map((project) => <ProjectCard project={project} locale="en" href={'/en/projects/' + project.data.translationKey + '/'} />)}
  </div></section>
</BaseLayout>
~~~

- [ ] **Step 6: Run i18n tests and complete checks**

Run: `npm run test:e2e -- tests/e2e/i18n.spec.ts && npm run test:unit && npm run check && npm run build`

Expected: 3 i18n tests pass; all unit tests pass; Astro reports 0 errors; build exits 0.

- [ ] **Step 7: Commit bilingual navigation**

~~~bash
git add src/pages/en src/content/projects/*.en.md src/components/LanguageLink.astro tests/e2e/i18n.spec.ts
git commit -m "feat: add English portfolio routes"
~~~

### Task 6: Add 404 handling and post-build safety audits

**Files:**
- Create: `src/pages/404.astro`
- Create: `scripts/audit-build.mjs`
- Create: `tests/fixtures/audit-broken/index.html`
- Create: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: static `/404.html` with Chinese and English recovery links.
- Produces: audit command that exits nonzero for broken internal links or sensitive patterns.

- [ ] **Step 1: Write failing 404 and keyboard tests**

`tests/e2e/accessibility.spec.ts`:

~~~ts
import { expect, test } from '@playwright/test';

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('reduced motion disables transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('a').first().evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(duration).toBe('0s');
});
~~~

Add to `smoke.spec.ts`:

~~~ts
test('404 page offers both recovery routes', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('link', { name: '返回中文首页' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'English home' })).toHaveAttribute('href', '/en/');
});
~~~

- [ ] **Step 2: Run focused tests and verify failures**

Run: `npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/smoke.spec.ts`

Expected: FAIL on missing 404 and incomplete focus/reduced-motion behavior.

- [ ] **Step 3: Implement the bilingual 404 and focus behavior**

`src/pages/404.astro`:

~~~astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="页面未找到 / Page not found" description="The requested page does not exist." locale="zh" languageHref="/en/">
  <section class="hero shell">
    <p class="eyebrow">404</p><h1>页面未找到</h1><p>请求的页面不存在或已经移动。</p>
    <p><a href="/">返回中文首页</a></p>
    <h2>Page not found</h2><p>The requested page does not exist or has moved.</p>
    <p><a href="/en/">English home</a></p>
  </section>
</BaseLayout>
~~~

Confirm `BaseLayout.astro` contains `<main id="main-content" tabindex="-1">` and its skip link uses `href="#main-content"`; these exact attributes are already introduced in Task 3 and must not be changed.

- [ ] **Step 4: Implement the build audit**

`scripts/audit-build.mjs`:

~~~js
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.AUDIT_DIR || 'dist');
const sensitive = [
  /04231613/,
  /\/Users\//,
  /API_KEY\s*=/,
  /sk-[A-Za-z0-9]/,
  /BEGIN PRIVATE KEY/,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return files.flat().filter((file) => file.endsWith('.html'));
}

function toTarget(href) {
  const pathname = href.split('#')[0].split('?')[0];
  if (!pathname.startsWith('/')) return null;
  if (pathname === '/') return path.join(root, 'index.html');
  if (pathname.endsWith('/')) return path.join(root, pathname, 'index.html');
  return path.join(root, pathname.replace(/^\//, ''));
}

const errors = [];
const files = await walk(root);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const pattern of sensitive) {
    if (pattern.test(html)) errors.push(path.relative(root, file) + ': sensitive match ' + pattern);
  }
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const target = toTarget(match[1]);
    if (!target) continue;
    try { await access(target); }
    catch { errors.push(path.relative(root, file) + ': broken link ' + match[1]); }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Build audit passed: ' + files.length + ' HTML files checked.');
~~~

`tests/fixtures/audit-broken/index.html`:

~~~html
<!doctype html><html><body><a href="/missing/">broken</a></body></html>
~~~

- [ ] **Step 5: Verify the audit fails on a controlled fixture**

Run: `AUDIT_DIR=tests/fixtures/audit-broken node scripts/audit-build.mjs`

Expected: audit exits nonzero and names `/missing/`.

- [ ] **Step 6: Run the clean audit and browser checks**

Run: `npm run build && npm run audit && npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/smoke.spec.ts`

Expected: audit passes; accessibility and smoke tests pass.

- [ ] **Step 7: Commit safety checks**

~~~bash
git add src/pages/404.astro src/layouts/BaseLayout.astro src/styles/global.css scripts/audit-build.mjs tests/e2e tests/fixtures/audit-broken/index.html
git commit -m "test: add portfolio safety audits"
~~~

### Task 7: Complete responsive QA and release verification

**Files:**
- Create: `tests/e2e/responsive.spec.ts`
- Create: `README.md`
- Modify only if a test proves necessary: files introduced in Tasks 1–6

**Interfaces:**
- Consumes: all routes and npm scripts from earlier tasks.
- Produces: one documented local workflow and a passing `npm run verify`.

- [ ] **Step 1: Write responsive and navigation tests**

`tests/e2e/responsive.spec.ts`:

~~~ts
import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(viewport.name + ' layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}
~~~

- [ ] **Step 2: Run responsive tests and make only evidence-driven fixes**

Run: `npm run test:e2e -- tests/e2e/responsive.spec.ts`

Expected: 2 tests pass. If either fails, change only the overflowing selector or navigation breakpoint identified by Playwright, rerun, and record the exact changed file in the commit.

- [ ] **Step 3: Add concise maintainer documentation**

`README.md` contains:

- Purpose: bilingual WKL portfolio and Chinese-first blog.
- Requirements: Node.js 20.3.0 or newer within the Node 20 line, npm 9.6.5 or newer.
- Commands: `npm install`, `npm run dev`, `npm run verify`.
- Content paths and required collection fields.
- Privacy rule: never paste source documents directly; rewrite approved public facts.
- Public contact address: `2694421597@qq.com`.
- Static deployment output: `dist/`; no provider-specific instructions.

- [ ] **Step 4: Run the complete verification pipeline**

Run: `npm run verify`

Expected, in order: all Vitest tests pass; Astro reports 0 errors; production build exits 0; build audit passes; all Playwright tests pass.

- [ ] **Step 5: Inspect the production output for scope and privacy**

Run:

~~~bash
find dist -type f | sort
rg -n '04231613|/Users/|API_KEY|sk-[A-Za-z0-9]|BEGIN PRIVATE KEY|老师|指导教师' dist src || true
git status --short
~~~

Expected: emitted files match approved routes and assets; ripgrep prints no sensitive matches; Git status shows only intended Task 7 files.

- [ ] **Step 6: Commit the verified release**

~~~bash
git add README.md tests/e2e/responsive.spec.ts src
git commit -m "docs: complete portfolio release workflow"
~~~

- [ ] **Step 7: Record final evidence**

Run: `git log --oneline --decorate -8 && git status --short`

Expected: the task commits are visible in order and the working tree contains no unintended tracked changes.
