# API Pulse 真实项目图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用用户提供的原始 API Pulse 仪表盘图片替换中英文占位封面，并在卡片和详情页完整、无裁切地展示。

**Architecture:** 不新增组件、schema 或 CSS。把实际为 JPEG 的源文件逐字节复制为 `/images/api-pulse.jpg`，再通过中英文内容条目的现有 `cover` 和 `coverFit` 字段接入已经验证的卡片与详情主图链路。

**Tech Stack:** Astro 7、Astro Content Collections、Playwright、GitHub Actions、GitHub Pages

## Global Constraints

- 源文件 `/Users/wkl/Downloads/api_dashboard_mockup_1781029849974.png` 必须逐字节复制，不转码、不压缩、不裁切、不重绘。
- 目标资源必须命名为 `public/images/api-pulse.jpg`，使 JPEG 内容、扩展名和线上 MIME 类型一致。
- 中英文 API Pulse 条目必须共用 `/images/api-pulse.jpg` 和 `coverFit: contain`。
- 卡片和详情页必须保持 16:9、黑色背景、`object-fit: contain` 和无横向溢出。
- macOS 装机助手、文章、站点布局和现有样式不得改变。
- 实现遵循 RED → GREEN → COMMIT，发布前运行完整验证、两次依赖审计和生产隐私扫描。

## File Map

- Create: `public/images/api-pulse.jpg` — 用户提供的 1024×1024 JPEG 原始字节副本。
- Modify: `src/content/projects/api-pulse.md` — 中文条目使用真实封面及 `contain`。
- Modify: `src/content/projects/api-pulse.en.md` — 英文条目使用真实封面及 `contain`。
- Modify: `tests/e2e/project-images.spec.ts` — 把 API Pulse 占位行为测试改为真实卡片和详情主图测试。

---

### Task 1: API Pulse 真实封面和详情主图

**Files:**
- Create: `public/images/api-pulse.jpg`
- Modify: `src/content/projects/api-pulse.md`
- Modify: `src/content/projects/api-pulse.en.md`
- Test: `tests/e2e/project-images.spec.ts`

**Interfaces:**
- Consumes: 现有 `cover: string`、`coverFit: 'cover' | 'contain'`、`.project-cover` 和 `.content-cover`。
- Produces: 中英文 API Pulse 页面公开资源 `/images/api-pulse.jpg`，天然尺寸 1024×1024。

- [ ] **Step 1: 把 API Pulse 卡片测试改成真实图片期望**

用以下循环替换 `API Pulse card retains the fallback cover behavior` 测试：

```ts
for (const [path, title] of [
  ['/', 'API Pulse'],
  ['/en/', 'API Pulse'],
] as const) {
  test(path + ' API Pulse card uses the complete dashboard image', async ({ page }) => {
    await page.goto(path);
    const image = page.locator('.card').filter({ hasText: title }).locator('img.project-cover');

    await expect(image).toHaveAttribute('src', '/images/api-pulse.jpg');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    const presentation = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        objectFit: style.objectFit,
        backgroundColor: style.backgroundColor,
        ratio: rect.width / rect.height,
      };
    });
    expect(presentation.objectFit).toBe('contain');
    expect(presentation.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(presentation.ratio).toBeCloseTo(16 / 9, 2);
  });
}
```

- [ ] **Step 2: 把 API Pulse 无主图测试改成中英文详情期望**

用以下循环替换 `API Pulse detail does not render a fallback hero image` 测试：

```ts
for (const [path, alt] of [
  ['/projects/api-pulse/', 'API Pulse项目封面'],
  ['/en/projects/api-pulse/', 'API Pulse project cover'],
] as const) {
  test(path + ' shows the complete API Pulse dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const image = page.locator('main article > img.content-cover');

    await expect(image).toHaveAttribute('src', '/images/api-pulse.jpg');
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
    expect(dimensions.naturalWidth).toBe(1024);
    expect(dimensions.naturalHeight).toBe(1024);
    expect(dimensions.hasOverflow).toBe(false);
  });
}
```

- [ ] **Step 3: 运行测试确认 RED**

Run: `npx playwright test tests/e2e/project-images.spec.ts`

Expected: 4 个 API Pulse 测试失败；卡片仍引用 `/images/project-fallback.svg`，详情页找不到 `.content-cover`。现有 4 个 macOS 装机助手测试继续通过。

- [ ] **Step 4: 原样导入 JPEG 并校验格式、尺寸和哈希**

Run:

```bash
cp /Users/wkl/Downloads/api_dashboard_mockup_1781029849974.png public/images/api-pulse.jpg
file public/images/api-pulse.jpg
sips -g pixelWidth -g pixelHeight -g format public/images/api-pulse.jpg
shasum -a 256 /Users/wkl/Downloads/api_dashboard_mockup_1781029849974.png public/images/api-pulse.jpg
```

Expected: `file` 和 `sips` 均识别为 JPEG；尺寸为 1024×1024；两行 SHA-256 完全相同。

- [ ] **Step 5: 更新中英文 API Pulse frontmatter**

在 `src/content/projects/api-pulse.md` 和 `src/content/projects/api-pulse.en.md` 中把：

```yaml
cover: /images/project-fallback.svg
```

替换为：

```yaml
cover: /images/api-pulse.jpg
coverFit: contain
```

- [ ] **Step 6: 运行定向验证确认 GREEN**

Run: `npx playwright test tests/e2e/project-images.spec.ts && npm run check`

Expected: 8 个项目图片 E2E 测试全部通过；Astro Check 为 0 errors、0 warnings、0 hints。

- [ ] **Step 7: 提交实现**

```bash
git add public/images/api-pulse.jpg src/content/projects/api-pulse.md src/content/projects/api-pulse.en.md tests/e2e/project-images.spec.ts
git commit -m "feat: add API Pulse project artwork"
```

---

### Task 2: 完整验证和线上发布

**Files:**
- Verify only; no source changes expected.

**Interfaces:**
- Consumes: Task 1 的 `/images/api-pulse.jpg` 和中英文页面。
- Produces: 本地完整验证、GitHub Actions 成功结果和线上 DOM 证据。

- [ ] **Step 1: 检查资源和改动范围**

Run:

```bash
git status --short
git diff --check HEAD~1..HEAD
shasum -a 256 /Users/wkl/Downloads/api_dashboard_mockup_1781029849974.png public/images/api-pulse.jpg
```

Expected: 工作树干净；diff 检查无输出；资源哈希一致。

- [ ] **Step 2: 运行完整项目验证与审计**

Run:

```bash
npm run verify
npm audit --omit=dev
npm audit
```

Expected: 单元测试、Astro Check、14 页构建、build audit 和全部 E2E 测试通过；两次审计均为 0 vulnerabilities。

- [ ] **Step 3: 扫描生产构建**

Run:

```bash
test -f dist/images/api-pulse.jpg
if rg -n "/Users/|api_dashboard_mockup|API_KEY|sk-[A-Za-z0-9]|BEGIN .*PRIVATE KEY" dist src public --glob '!public/images/api-pulse.jpg'; then exit 1; else echo 'Production privacy scan passed'; fi
```

Expected: 构建包含目标图片，隐私扫描无匹配。

- [ ] **Step 4: 合入并推送 main**

按 `superpowers:finishing-a-development-branch` 合入 `main`，在合并结果上重新运行 `npm run verify`，然后执行：

```bash
git push origin main
```

- [ ] **Step 5: 监控 GitHub Pages 并验证线上资源**

等待对应 `main` 提交的 `deploy.yml` 工作流成功，然后验证：

```bash
curl -I https://kailanalan0209.github.io/images/api-pulse.jpg
```

Expected: HTTP 200，`content-type: image/jpeg`，线上文件 SHA-256 与本地一致。用 Playwright 检查中英文首页和详情页：图片路径为 `/images/api-pulse.jpg`，`object-fit: contain`，容器为 16:9，天然尺寸为 1024×1024；macOS 装机助手仍保持原图片和 `contain`。
