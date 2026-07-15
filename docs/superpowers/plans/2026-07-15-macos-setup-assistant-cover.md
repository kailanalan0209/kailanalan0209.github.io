# macOS 装机助手真实项目图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用用户提供的原始截图替换 macOS 装机助手的占位封面，并在中英文卡片和详情页完整、无裁切地展示。

**Architecture:** 项目内容 schema 增加默认值为 `cover` 的 `coverFit` 字段，只有 macOS 装机助手的中英文条目选择 `contain`。`ProjectCard` 消费该字段控制卡片图片；项目详情路由只把非占位封面传给 `ContentLayout`，因此文章与 API Pulse 详情保持原状。

**Tech Stack:** Astro 7、TypeScript、Astro Content Collections、Vitest、Playwright、CSS

## Global Constraints

- 原始资源必须逐字节复制到 `public/images/macos-setup-assistant.png`，不得压缩、裁切、重绘或生成替代图。
- 中文和英文项目共用 `/images/macos-setup-assistant.png`。
- 卡片与详情主图使用 16:9 区域、黑色背景和 `object-fit: contain`。
- `coverFit` 只允许 `cover` 或 `contain`，默认值必须是 `cover`。
- API Pulse、文章页面和其他项目的现有图片行为不得改变。
- 不修改项目文案，不增加未经证实的数据，不做无关重构。
- 所有实现遵循 RED → GREEN → COMMIT，并在发布前运行 `npm run verify`、两次依赖审计和生产构建扫描。

## File Map

- Create: `public/images/macos-setup-assistant.png` — 用户提供的原始截图副本。
- Create: `tests/e2e/project-images.spec.ts` — 中英文卡片、详情图和响应式行为回归测试。
- Modify: `src/content.config.ts` — 声明 `coverFit` 内容字段及默认值。
- Modify: `src/content/projects/macos-setup-assistant.md` — 中文条目使用真实封面和 `contain`。
- Modify: `src/content/projects/macos-setup-assistant.en.md` — 英文条目使用真实封面和 `contain`。
- Modify: `tests/unit/content-schema.spec.ts` — 锁定 `coverFit` 的默认和显式值。
- Modify: `src/components/ProjectCard.astro` — 把 `coverFit` 映射到卡片图片类。
- Modify: `src/layouts/ContentLayout.astro` — 提供可选详情主图接口。
- Modify: `src/pages/projects/[id].astro` — 中文项目仅传递非占位主图。
- Modify: `src/pages/en/projects/[id].astro` — 英文项目仅传递非占位主图。
- Modify: `src/styles/global.css` — 增加局部的 `contain` 和详情主图样式。

---

### Task 1: 原始资源与项目内容模型

**Files:**
- Create: `public/images/macos-setup-assistant.png`
- Modify: `src/content.config.ts`
- Modify: `src/content/projects/macos-setup-assistant.md`
- Modify: `src/content/projects/macos-setup-assistant.en.md`
- Test: `tests/unit/content-schema.spec.ts`

**Interfaces:**
- Consumes: 用户截图 `/var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-1de39efb-40ad-4286-b6f7-859d18e9731c.png`。
- Produces: `project.data.coverFit: 'cover' | 'contain'` 和公开资源 `/images/macos-setup-assistant.png`，供 Tasks 2–3 使用。

- [ ] **Step 1: 写入失败的 schema 测试**

在 `tests/unit/content-schema.spec.ts` 的第一个测试中保留现有断言并增加默认值断言：

```ts
expect(result.cover).toBe('/images/project-fallback.svg');
expect(result.coverFit).toBe('cover');
```

紧随其后增加显式值测试：

```ts
it('accepts contain for a project cover', () => {
  const result = projectSchema.parse({
    title: 'Example',
    summary: 'Summary',
    role: 'Builder',
    date: new Date('2026-01-01'),
    technologies: ['Astro'],
    cover: '/images/example.png',
    coverFit: 'contain',
    status: '已完成产品',
    outcome: 'Outcome',
    lang: 'zh',
    translationKey: 'example',
  });

  expect(result.coverFit).toBe('contain');
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm run test:unit -- tests/unit/content-schema.spec.ts`

Expected: FAIL，`result.coverFit` 当前为 `undefined`，且包含 `coverFit` 的显式输入尚未被输出。

- [ ] **Step 3: 添加最小 schema 字段**

在 `src/content.config.ts` 的 `cover` 后增加一行：

```ts
cover: z.string().startsWith('/').default('/images/project-fallback.svg'),
coverFit: z.enum(['cover', 'contain']).default('cover'),
status: projectStatus,
```

- [ ] **Step 4: 原样导入截图并校验哈希**

Run:

```bash
cp /var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-1de39efb-40ad-4286-b6f7-859d18e9731c.png public/images/macos-setup-assistant.png
shasum -a 256 /var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-1de39efb-40ad-4286-b6f7-859d18e9731c.png public/images/macos-setup-assistant.png
```

Expected: 两行 SHA-256 完全相同；目标图片尺寸仍为 `2624 × 1808`。

- [ ] **Step 5: 更新中英文项目 frontmatter**

在 `src/content/projects/macos-setup-assistant.md` 和 `src/content/projects/macos-setup-assistant.en.md` 中把：

```yaml
cover: /images/project-fallback.svg
```

替换为：

```yaml
cover: /images/macos-setup-assistant.png
coverFit: contain
```

- [ ] **Step 6: 运行定向检查确认 GREEN**

Run: `npm run test:unit -- tests/unit/content-schema.spec.ts && npm run check`

Expected: content schema 测试全部 PASS；Astro Check 报告 `0 errors`、`0 warnings`、`0 hints`。

- [ ] **Step 7: 提交资源与内容模型**

```bash
git add public/images/macos-setup-assistant.png src/content.config.ts src/content/projects/macos-setup-assistant.md src/content/projects/macos-setup-assistant.en.md tests/unit/content-schema.spec.ts
git commit -m "feat: add macOS project artwork"
```

---

### Task 2: 项目卡片完整展示截图

**Files:**
- Create: `tests/e2e/project-images.spec.ts`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 的 `project.data.coverFit` 和 `/images/macos-setup-assistant.png`。
- Produces: `.project-cover` 与 `.project-cover.media-contain`，供卡片端到端测试定位和验证。

- [ ] **Step 1: 写入失败的中英文卡片测试**

创建 `tests/e2e/project-images.spec.ts`：

```ts
import { expect, test } from '@playwright/test';

for (const [path, title] of [
  ['/', 'macOS 装机助手'],
  ['/en/', 'macOS Setup Assistant'],
] as const) {
  test(title + ' card uses the complete project screenshot', async ({ page }) => {
    await page.goto(path);
    const card = page.locator('.card').filter({ hasText: title });
    const image = card.locator('img.project-cover');

    await expect(image).toHaveAttribute('src', '/images/macos-setup-assistant.png');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    const presentation = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      return { objectFit: style.objectFit, backgroundColor: style.backgroundColor };
    });
    expect(presentation).toEqual({ objectFit: 'contain', backgroundColor: 'rgb(0, 0, 0)' });
  });
}

test('API Pulse card retains the fallback cover behavior', async ({ page }) => {
  await page.goto('/projects/');
  const image = page.locator('.card').filter({ hasText: 'API Pulse' }).locator('img.project-cover');

  await expect(image).toHaveAttribute('src', '/images/project-fallback.svg');
  expect(await image.evaluate((element) => getComputedStyle(element).objectFit)).toBe('cover');
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx playwright test tests/e2e/project-images.spec.ts`

Expected: FAIL，因为卡片图片尚无 `.project-cover` 类和 `contain` 样式。

- [ ] **Step 3: 给卡片图片添加内容驱动的类**

将 `src/components/ProjectCard.astro` 中的 `<img>` 替换为：

```astro
<img
  class:list={['project-cover', { 'media-contain': project.data.coverFit === 'contain' }]}
  src={project.data.cover}
  alt={project.data.title + (locale === 'zh' ? '项目封面' : ' project cover')}
  width="1600"
  height="900"
  loading="lazy"
  decoding="async"
/>
```

- [ ] **Step 4: 添加局部卡片样式**

在 `src/styles/global.css` 的 `.card img` 规则后增加：

```css
.card img.media-contain { background: #000; object-fit: contain; }
```

不修改现有 `.card img` 默认规则。

- [ ] **Step 5: 运行卡片测试确认 GREEN**

Run: `npx playwright test tests/e2e/project-images.spec.ts`

Expected: 3 tests PASS。

- [ ] **Step 6: 提交卡片展示**

```bash
git add tests/e2e/project-images.spec.ts src/components/ProjectCard.astro src/styles/global.css
git commit -m "feat: preserve macOS cover framing"
```

---

### Task 3: 中英文详情主图与响应式保护

**Files:**
- Modify: `tests/e2e/project-images.spec.ts`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/pages/projects/[id].astro`
- Modify: `src/pages/en/projects/[id].astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 的 `cover`、`coverFit`，以及 Task 2 的 `.media-contain` 命名。
- Produces: `ContentLayout` 可选 props `cover?: string`、`coverAlt?: string`、`coverFit?: 'cover' | 'contain'` 和 `.content-cover` 主图元素。

- [ ] **Step 1: 写入失败的详情与响应式测试**

在 `tests/e2e/project-images.spec.ts` 末尾增加：

```ts
for (const [path, alt] of [
  ['/projects/macos-setup-assistant/', 'macOS 装机助手项目封面'],
  ['/en/projects/macos-setup-assistant/', 'macOS Setup Assistant project cover'],
] as const) {
  test(path + ' shows an uncropped detail image', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const image = page.locator('main article > img.content-cover');

    await expect(image).toHaveAttribute('src', '/images/macos-setup-assistant.png');
    await expect(image).toHaveAttribute('alt', alt);
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect(image).not.toHaveAttribute('loading', 'lazy');
    const dimensions = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        objectFit: style.objectFit,
        backgroundColor: style.backgroundColor,
        ratio: rect.width / rect.height,
        naturalWidth: (element as HTMLImageElement).naturalWidth,
        naturalHeight: (element as HTMLImageElement).naturalHeight,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(dimensions.objectFit).toBe('contain');
    expect(dimensions.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(dimensions.ratio).toBeCloseTo(16 / 9, 2);
    expect(dimensions.naturalWidth).toBe(2624);
    expect(dimensions.naturalHeight).toBe(1808);
    expect(dimensions.hasOverflow).toBe(false);
  });
}

test('API Pulse detail does not render a fallback hero image', async ({ page }) => {
  for (const path of ['/projects/api-pulse/', '/en/projects/api-pulse/']) {
    await page.goto(path);
    await expect(page.locator('main article > img.content-cover')).toHaveCount(0);
  }
});
```

- [ ] **Step 2: 运行新增测试确认 RED**

Run: `npx playwright test tests/e2e/project-images.spec.ts`

Expected: 3 new tests FAIL，因为详情页尚未渲染 `.content-cover`。

- [ ] **Step 3: 扩展 ContentLayout 的可选主图接口**

在 `src/layouts/ContentLayout.astro` 的 `Props` 中增加：

```ts
cover?: string;
coverAlt?: string;
coverFit?: 'cover' | 'contain';
```

把 props 解构更新为：

```ts
const {
  title,
  summary,
  date,
  locale,
  languageHref,
  alternateHref,
  readingMinutes,
  cover,
  coverAlt,
  coverFit = 'cover',
} = Astro.props;
```

在 `<p class="lede">{summary}</p>` 后增加：

```astro
{cover && (
  <img
    class:list={['content-cover', { 'media-contain': coverFit === 'contain' }]}
    src={cover}
    alt={coverAlt ?? ''}
    width="1600"
    height="900"
    decoding="async"
  />
)}
```

- [ ] **Step 4: 中文项目路由只传递非占位主图**

在 `src/pages/projects/[id].astro` 的 frontmatter 中、`languageHref` 后增加：

```ts
const cover = entry.data.cover === '/images/project-fallback.svg' ? undefined : entry.data.cover;
const coverAlt = cover ? entry.data.title + '项目封面' : undefined;
```

把 `ContentLayout` 调用改为：

```astro
<ContentLayout
  title={entry.data.title}
  summary={entry.data.summary}
  date={entry.data.date}
  locale="zh"
  languageHref={languageHref}
  alternateHref={translated ? languageHref : undefined}
  cover={cover}
  coverAlt={coverAlt}
  coverFit={entry.data.coverFit}
>
  <Content />
</ContentLayout>
```

- [ ] **Step 5: 英文项目路由只传递非占位主图**

在 `src/pages/en/projects/[id].astro` 的 frontmatter 中、`languageHref` 后增加：

```ts
const cover = entry.data.cover === '/images/project-fallback.svg' ? undefined : entry.data.cover;
const coverAlt = cover ? entry.data.title + ' project cover' : undefined;
```

把 `ContentLayout` 调用改为：

```astro
<ContentLayout
  title={entry.data.title}
  summary={entry.data.summary}
  date={entry.data.date}
  locale="en"
  languageHref={languageHref}
  alternateHref={chinese ? languageHref : undefined}
  cover={cover}
  coverAlt={coverAlt}
  coverFit={entry.data.coverFit}
>
  <Content />
</ContentLayout>
```

- [ ] **Step 6: 添加详情主图样式**

在 `src/styles/global.css` 的 `.prose img` 后增加：

```css
.prose .content-cover { display: block; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--radius); object-fit: cover; }
.prose .content-cover.media-contain { background: #000; object-fit: contain; }
```

- [ ] **Step 7: 运行详情测试和 Astro 检查确认 GREEN**

Run: `npx playwright test tests/e2e/project-images.spec.ts && npm run check`

Expected: 6 Playwright tests PASS；Astro Check 报告 `0 errors`、`0 warnings`、`0 hints`。

- [ ] **Step 8: 提交详情展示**

```bash
git add tests/e2e/project-images.spec.ts src/layouts/ContentLayout.astro 'src/pages/projects/[id].astro' 'src/pages/en/projects/[id].astro' src/styles/global.css
git commit -m "feat: show macOS project detail artwork"
```

---

### Task 4: 完整验证与发布检查

**Files:**
- Verify only; no source changes expected.

**Interfaces:**
- Consumes: Tasks 1–3 的完整实现。
- Produces: 可发布结论以及本地、依赖、构建和线上证据。

- [ ] **Step 1: 检查改动范围与资源一致性**

Run:

```bash
git status --short
git diff --check HEAD~3..HEAD
shasum -a 256 /var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-1de39efb-40ad-4286-b6f7-859d18e9731c.png public/images/macos-setup-assistant.png
```

Expected: 工作树干净；`git diff --check` 无输出；两行 SHA-256 一致。

- [ ] **Step 2: 运行完整项目验证**

Run: `npm run verify`

Expected: unit tests、Astro Check、生产构建、build audit 和全部 Playwright tests 均通过。

- [ ] **Step 3: 运行依赖审计**

Run:

```bash
npm audit --omit=dev
npm audit
```

Expected: 两条命令均报告 `found 0 vulnerabilities`。

- [ ] **Step 4: 扫描生产构建中的资源与隐私风险**

Run:

```bash
test -f dist/images/macos-setup-assistant.png
rg -n "/Users/|codex-clipboard|API_KEY|sk-[A-Za-z0-9]|BEGIN .*PRIVATE KEY" dist src public --glob '!public/images/macos-setup-assistant.png'
```

Expected: `test` 返回 0；`rg` 无匹配。

- [ ] **Step 5: 按分支收尾流程集成并推送**

使用 `superpowers:finishing-a-development-branch` 复核提交和测试证据，选择合入 `main`；推送后记录新提交 SHA。

- [ ] **Step 6: 验证 GitHub Pages 发布与线上页面**

Run:

```bash
gh run list --workflow deploy.yml --limit 1
curl -I https://kailanalan0209.github.io/images/macos-setup-assistant.png
curl -fsS https://kailanalan0209.github.io/ | rg "/images/macos-setup-assistant.png"
curl -fsS https://kailanalan0209.github.io/projects/macos-setup-assistant/ | rg "content-cover|/images/macos-setup-assistant.png"
curl -fsS https://kailanalan0209.github.io/en/projects/macos-setup-assistant/ | rg "content-cover|/images/macos-setup-assistant.png"
```

Expected: 最新 workflow 状态为 `completed`/`success`；图片返回 HTTP 200；中文首页及中英文详情 HTML 均引用真实图片，详情含 `content-cover`。
