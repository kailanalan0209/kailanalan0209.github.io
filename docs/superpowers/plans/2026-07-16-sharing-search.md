# Sharing and Search Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete social sharing metadata, deterministic brand assets, basic JSON-LD, robots, and a collection-backed sitemap without adding dependencies.

**Architecture:** `BaseLayout` owns all page-level social and structured metadata, while `ContentLayout` forwards real project covers. Static public assets provide the default social card, favicon, and robots policy; an Astro prerendered endpoint builds the sitemap from static routes and content collections.

**Tech Stack:** Astro 7.0.9, TypeScript 5.9.3, Playwright 1.61.1, SVG, macOS `sips`, existing build audit

## Global Constraints

- Use absolute production URLs for Open Graph, Twitter Card, JSON-LD, robots, and sitemap output.
- Use existing project covers on project details and `/images/social-default.png` everywhere else.
- Keep the default social image exactly 1200×630 and retain its SVG source.
- Keep 404 free of canonical, `og:url`, `og:image`, Twitter Card, and JSON-LD.
- Include only real static pages, translated projects, and published Chinese posts in the sitemap.
- Do not add npm dependencies, analytics, third-party SEO services, content schema fields, or runtime network requests.
- Preserve existing canonical, hreflang, privacy, accessibility, and deployment behavior.

---

### Task 1: Social metadata, JSON-LD, and brand assets

**Files:**
- Create: `public/images/social-default.svg`
- Generate: `public/images/social-default.png`
- Create: `public/favicon.svg`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `tests/e2e/metadata.spec.ts`

**Interfaces:**
- `BaseLayout` consumes optional `image?: string` and `imageAlt?: string` props.
- `ContentLayout` forwards its existing `cover?: string` and `coverAlt?: string` as `image` and `imageAlt`.
- Every indexable page produces absolute social image metadata and one JSON-LD object.

- [ ] **Step 1: Extend metadata tests to define the new behavior**

In `tests/e2e/metadata.spec.ts`, extend `indexable pages expose absolute production metadata` inside its loop with:

```ts
    const defaultImage = origin + '/images/social-default.png';
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', defaultImage);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', defaultImage);
```

Add these tests:

```ts
test('project details use their own cover in social metadata', async ({ page }) => {
  for (const [path, image, alt] of [
    ['/projects/api-pulse/', '/images/api-pulse.jpg', 'API Pulse项目封面'],
    ['/en/projects/macos-setup-assistant/', '/images/macos-setup-assistant.png', 'macOS Setup Assistant project cover'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', origin + image);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', origin + image);
  }
});

test('indexable pages expose parseable localized JSON-LD', async ({ page }) => {
  for (const [path, type, language] of [
    ['/', 'WebSite', 'zh-CN'],
    ['/en/about/', 'WebPage', 'en'],
  ] as const) {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe(type);
    expect(data.url).toBe(origin + path);
    expect(data.inLanguage).toBe(language);
    expect(data.name).toBeTruthy();
    expect(data.description).toBeTruthy();
  }
});

test('brand social image and favicon are publishable assets', async ({ page, request }) => {
  const social = await request.get('/images/social-default.png');
  expect(social.status()).toBe(200);
  expect(social.headers()['content-type']).toBe('image/png');
  await page.goto('/');
  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/images/social-default.png';
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(dimensions).toEqual([1200, 630]);
  const favicon = await request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
});
```

Extend `404 omits indexable metadata` with:

```ts
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
```

- [ ] **Step 2: Run the metadata test and confirm the red state**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/metadata.spec.ts
```

Expected: failures for missing social image, Twitter Card, JSON-LD, favicon, and brand PNG; existing canonical and hreflang assertions continue to pass.

- [ ] **Step 3: Create the deterministic SVG brand assets**

Create `public/images/social-default.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">WKL social sharing card</title>
  <desc id="description">WKL wordmark with tools, automation, and API products positioning.</desc>
  <rect width="1200" height="630" fill="#151310"/>
  <circle cx="1040" cy="126" r="72" fill="#ff8a3d"/>
  <path d="M88 472H1112" stroke="#3b332b" stroke-width="2"/>
  <text x="88" y="304" fill="#f4ecdf" font-family="Inter, Arial, sans-serif" font-size="188" font-weight="800" letter-spacing="-8">WKL</text>
  <text x="92" y="414" fill="#ff8a3d" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">TOOLS · AUTOMATION · API PRODUCTS</text>
  <text x="92" y="540" fill="#b9aa98" font-family="Inter, Arial, sans-serif" font-size="26">kailanalan0209.github.io</text>
</svg>
```

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="WKL">
  <rect width="64" height="64" rx="14" fill="#151310"/>
  <text x="8" y="41" fill="#f4ecdf" font-family="Arial, sans-serif" font-size="25" font-weight="800">WKL</text>
  <circle cx="54" cy="13" r="6" fill="#ff8a3d"/>
</svg>
```

- [ ] **Step 4: Generate and verify the PNG mechanically**

```bash
sips -s format png public/images/social-default.svg --out public/images/social-default.png
sips -g pixelWidth -g pixelHeight public/images/social-default.png
```

Expected: `pixelWidth: 1200` and `pixelHeight: 630`.

- [ ] **Step 5: Implement BaseLayout metadata and JSON-LD**

Add to `BaseLayout.astro` Props:

```ts
  image?: string;
  imageAlt?: string;
```

Destructure with:

```ts
  image,
  imageAlt,
```

After the current hreflang constants, add:

```ts
const language = locale === 'zh' ? 'zh-CN' : 'en';
const openGraphLocale = locale === 'zh' ? 'zh_CN' : 'en_US';
const alternateOpenGraphLocale = locale === 'zh' ? 'en_US' : 'zh_CN';
const socialImagePath = image ?? '/images/social-default.png';
const usesDefaultSocialImage = image === undefined;
const socialImageUrl = canonicalUrl && Astro.site ? new URL(socialImagePath, Astro.site) : undefined;
const socialImageAlt = imageAlt ?? (locale === 'zh' ? 'WKL：工具、自动化与 API 产品实践' : 'WKL: tools, automation, and API product practice');
const isHome = Astro.url.pathname === '/' || Astro.url.pathname === '/en/';
const structuredData = canonicalUrl && Astro.site ? {
  '@context': 'https://schema.org',
  '@type': isHome ? 'WebSite' : 'WebPage',
  name: documentTitle,
  description,
  url: canonicalUrl.href,
  inLanguage: language,
  ...(!isHome && {
    isPartOf: {
      '@type': 'WebSite',
      name: site.name,
      url: new URL('/', Astro.site).href,
    },
  }),
} : undefined;
const serializedStructuredData = structuredData
  ? JSON.stringify(structuredData).replaceAll('<', '\\u003c')
  : undefined;
```

Inside `<head>`, add the favicon after color-scheme:

```astro
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

Replace the existing Open Graph block with:

```astro
    {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    {canonicalUrl && <meta property="og:type" content="website" />}
    <meta property="og:title" content={documentTitle} />
    <meta property="og:description" content={description} />
    {canonicalUrl && <meta property="og:locale" content={openGraphLocale} />}
    {alternateUrl && <meta property="og:locale:alternate" content={alternateOpenGraphLocale} />}
    {socialImageUrl && <meta property="og:image" content={socialImageUrl} />}
    {socialImageUrl && usesDefaultSocialImage && <meta property="og:image:width" content="1200" />}
    {socialImageUrl && usesDefaultSocialImage && <meta property="og:image:height" content="630" />}
    {socialImageUrl && <meta property="og:image:alt" content={socialImageAlt} />}
    {socialImageUrl && <meta name="twitter:card" content="summary_large_image" />}
    {socialImageUrl && <meta name="twitter:title" content={documentTitle} />}
    {socialImageUrl && <meta name="twitter:description" content={description} />}
    {socialImageUrl && <meta name="twitter:image" content={socialImageUrl} />}
    {socialImageUrl && <meta name="twitter:image:alt" content={socialImageAlt} />}
    {serializedStructuredData && <script type="application/ld+json" is:inline set:html={serializedStructuredData}></script>}
```

- [ ] **Step 6: Forward content covers to BaseLayout**

Change the `BaseLayout` opening tag in `ContentLayout.astro` to:

```astro
<BaseLayout
  title={title}
  description={summary}
  locale={locale}
  languageHref={languageHref}
  alternateHref={alternateHref}
  image={cover}
  imageAlt={coverAlt}
>
```

- [ ] **Step 7: Run focused verification and commit**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/metadata.spec.ts
npm run check
sips -g pixelWidth -g pixelHeight public/images/social-default.png
git diff --check
git add public/images/social-default.svg public/images/social-default.png public/favicon.svg src/layouts/BaseLayout.astro src/layouts/ContentLayout.astro tests/e2e/metadata.spec.ts
git commit -m "feat: add social sharing metadata"
```

Expected: 7 metadata tests pass, Astro reports no diagnostics, and the PNG remains 1200×630.

---

### Task 2: Collection-backed sitemap and robots

**Files:**
- Create: `src/pages/sitemap.xml.ts`
- Create: `public/robots.txt`
- Create: `tests/e2e/search-discovery.spec.ts`

**Interfaces:**
- `GET: APIRoute` consumes `Astro.site` plus `projects` and `posts` collections.
- Produces `/sitemap.xml` as `application/xml; charset=utf-8` and `/robots.txt` as plain text.

- [ ] **Step 1: Write failing discovery tests**

Create `tests/e2e/search-discovery.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const origin = 'https://kailanalan0209.github.io';

test('robots allows crawling and points to the production sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe(
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
});

test('sitemap exposes real static and collection-backed routes only', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');
  const xml = await response.text();
  for (const path of [
    '/', '/about/', '/projects/', '/posts/', '/en/', '/en/about/', '/en/projects/',
    '/projects/api-pulse/', '/projects/macos-setup-assistant/',
    '/en/projects/api-pulse/', '/en/projects/macos-setup-assistant/',
    '/posts/api-key-privacy/', '/posts/macos-setup-workflow/',
  ]) {
    expect(xml).toContain(`<loc>${origin}${path}</loc>`);
  }
  expect(xml).not.toContain('/404');
  expect(xml).not.toContain('notice=zh-only');
  expect(xml).not.toContain('localhost');
});
```

- [ ] **Step 2: Run the discovery test and confirm the red state**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/search-discovery.spec.ts
```

Expected: both tests fail because robots and sitemap do not exist.

- [ ] **Step 3: Add robots.txt**

Create `public/robots.txt` exactly as:

```text
User-agent: *
Allow: /

Sitemap: https://kailanalan0209.github.io/sitemap.xml
```

The file must end with one newline.

- [ ] **Step 4: Implement the sitemap endpoint**

Create `src/pages/sitemap.xml.ts`:

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const staticPaths = [
  '/', '/about/', '/projects/', '/posts/',
  '/en/', '/en/about/', '/en/projects/',
];

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Astro site is required to build sitemap.xml');

  const projects = await getCollection('projects');
  const posts = await getCollection('posts');
  const paths = new Set(staticPaths);

  for (const project of projects) {
    paths.add(project.data.lang === 'zh'
      ? `/projects/${project.id}/`
      : `/en/projects/${project.data.translationKey}/`);
  }
  for (const post of posts) {
    if (post.data.lang === 'zh' && !post.data.draft) paths.add(`/posts/${post.id}/`);
  }

  const urls = [...paths]
    .sort()
    .map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
```

- [ ] **Step 5: Run focused verification and commit**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npx playwright test tests/e2e/search-discovery.spec.ts
npm run check
npm run build
npm run audit
git diff --check
git add src/pages/sitemap.xml.ts public/robots.txt tests/e2e/search-discovery.spec.ts
git commit -m "feat: add search discovery files"
```

Expected: 2 discovery tests pass; Astro reports no diagnostics; build and audit pass; `dist/sitemap.xml` and `dist/robots.txt` exist.

---

### Task 3: Full verification and release

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: complete static site, metadata assets, discovery endpoints, and deployment workflow.
- Produces: verified live sharing and search infrastructure.

- [ ] **Step 1: Run complete local verification**

```bash
export PATH="/Users/wkl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npm run verify
npm audit --omit=dev || npm audit --omit=dev
npm audit || npm audit
if rg -n "/Users/|API_KEY|sk-[A-Za-z0-9]|BEGIN .*PRIVATE KEY" dist src public; then exit 1; else echo 'Production privacy scan passed'; fi
sips -g pixelWidth -g pixelHeight public/images/social-default.png
git diff --check origin/main..HEAD
```

Expected: 28 unit tests and 54 E2E tests pass; Astro has no diagnostics; 14 HTML pages plus the sitemap build; audits report 0 vulnerabilities; privacy and diff checks pass; social PNG is 1200×630.

- [ ] **Step 2: Inspect the social image**

Open `public/images/social-default.png` at original detail and confirm sharp WKL text, visible orange circle, readable positioning line, no clipping, and exact 1200×630 canvas.

- [ ] **Step 3: Merge and reverify on clean main**

Fast-forward into `main`, remove the owned `.worktrees/` directory entry, delete the merged branch, and repeat Step 1 from clean main. Do not push on failure.

- [ ] **Step 4: Push and watch the exact Pages run**

```bash
git push origin main
HEAD_SHA=$(git rev-parse HEAD)
RUN_ID=$(gh run list --workflow deploy.yml --branch main --limit 10 --json databaseId,headSha --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId" | head -1)
test -n "$RUN_ID"
gh run watch "$RUN_ID" --exit-status
```

- [ ] **Step 5: Verify production assets and DOM**

Verify HTTP 200 for `/`, both project details, `/images/social-default.png`, `/favicon.svg`, `/robots.txt`, and `/sitemap.xml`. Check production Open Graph, Twitter Card, JSON-LD, project-specific images, 404 omissions, robots, sitemap routes, exact workflow SHA, and a clean synchronized `main`.
