# 分享预览与搜索基础设施设计

## 目标

让站点页面在社交平台、即时通讯分享和搜索引擎抓取时呈现完整、可信且与站内视觉一致的信息。补齐分享图片、Twitter Card、站点图标、robots、sitemap 和基础结构化数据，同时保持静态站点、零新依赖和现有隐私边界。

## 成功标准

- 所有可索引页面输出绝对生产 URL 的 Open Graph 图片和 Twitter Card 元数据。
- 项目详情页使用自身现有封面；其他可索引页面使用统一的 1200×630 WKL 品牌默认图。
- 可索引页面输出可解析且与当前页面一致的 JSON-LD；404 不输出 canonical、分享图片、分享 URL 或 JSON-LD。
- 浏览器可以读取 SVG favicon。
- `/robots.txt` 允许正常抓取并指向绝对生产 URL 的 `/sitemap.xml`。
- `/sitemap.xml` 覆盖中英文静态页、双语项目详情和已发布文章，不包含 404、草稿或语言回退伪页面。
- 不新增运行时依赖、统计服务、第三方 SEO 服务或网络请求。
- 既有元数据、语言切换、构建审计、隐私扫描和 Pages 部署无回归。

## 元数据架构

### BaseLayout

`BaseLayout.astro` 新增两个可选属性：

- `image?: string`：以 `/` 开头的站内公开图片路径；
- `imageAlt?: string`：分享图片的可访问描述。

可索引页面在 `Astro.site` 存在时计算：

- canonical URL；
- 分享图片绝对 URL，默认 `/images/social-default.png`；
- 当前语言 `zh-CN` 或 `en`；
- Open Graph locale `zh_CN` 或 `en_US`。

输出内容包括：

- `og:url`、`og:type=website`、`og:title`、`og:description`；
- `og:image` 与 `og:image:alt`；使用默认品牌图时额外输出准确的 `og:image:width=1200` 和 `og:image:height=630`，项目原图尺寸不同，因此不声明不准确的尺寸；
- `og:locale`，有真实翻译时输出 `og:locale:alternate`；
- `twitter:card=summary_large_image`、`twitter:title`、`twitter:description`、`twitter:image` 和 `twitter:image:alt`；
- SVG favicon link。

404 的 `indexable=false` 继续保留标题和描述，但不输出上述依赖生产 URL 的分享图片、Twitter Card、canonical 或结构化数据。

### ContentLayout 与项目页

`ContentLayout.astro` 将现有 `cover` 和 `coverAlt` 同时传给 `BaseLayout` 的 `image` 与 `imageAlt`。因此两个项目详情页自动使用 API Pulse 或 macOS 装机助手现有封面。

文章页目前使用通用 SVG 插图且详情页不展示封面，本轮不把文章 fallback SVG 用作分享图；文章与列表、首页、关于页统一使用品牌默认图。

## 品牌资源

新增：

- `public/images/social-default.svg`：1200×630 的可编辑源文件；
- `public/images/social-default.png`：由 SVG 机械转换得到的发布图片；
- `public/favicon.svg`：使用现有深色背景、暖白 WKL 字标和橙色圆点。

分享图只使用 WKL 字标、深色背景、橙色强调和 “TOOLS · AUTOMATION · API PRODUCTS” 定位文字，不使用照片、项目截图拼贴或无法稳定复现的生成式图像。SVG 源文件与 PNG 同步提交，方便后续调整。

## 基础结构化数据

每个可索引页面输出一个 JSON-LD 对象：

- 首页 `/` 与 `/en/` 使用 `WebSite`；
- 其他页面使用 `WebPage`；
- 字段包含 `@context`、`@type`、`name`、`description`、`url`、`inLanguage`；
- 非首页增加 `isPartOf`，指向生产站点的 `WebSite`。

本轮不声明 Person 的姓名、职位、社交账号，也不把项目标记为 SoftwareApplication，因为当前内容不足以完整支撑这些字段。JSON 序列化时转义 `<`，避免数据进入脚本上下文时产生注入边界。

## Sitemap 与 robots

新增 `src/pages/sitemap.xml.ts` 静态端点，在构建时读取 `projects` 和 `posts` 内容集合：

- 固定路径：`/`、`/about/`、`/projects/`、`/posts/`、`/en/`、`/en/about/`、`/en/projects/`；
- 中文项目使用 `/projects/{id}/`；
- 英文项目使用 `/en/projects/{translationKey}/`；
- 文章仅包含 `lang=zh` 且 `draft=false` 的 `/posts/{id}/`。

端点基于 `Astro.site` 生成绝对 URL，使用 XML 转义函数处理路径内容，响应类型为 `application/xml; charset=utf-8`。路径经 `Set` 去重并排序，保证构建结果稳定。

`public/robots.txt` 内容固定为：

```text
User-agent: *
Allow: /

Sitemap: https://kailanalan0209.github.io/sitemap.xml
```

## 实现边界

- 修改 `BaseLayout.astro` 和 `ContentLayout.astro`。
- 新增一个 sitemap 静态端点、robots、favicon、分享图 SVG 与 PNG。
- 扩展现有元数据 E2E 测试；如需要，扩展构建审计单元测试验证 sitemap/robots 的生产安全边界。
- 不修改内容集合 schema、现有 Markdown、页面正文、导航、联系路径或部署工作流。
- 不新增 npm 包；图片转换属于构建前一次性机械操作，不进入站点运行时。

## 验证方案

- 验证首页和文章页使用绝对品牌默认分享图。
- 验证中英文项目详情使用各自封面的绝对 URL。
- 验证 Twitter Card 字段与 Open Graph 标题、描述、图片保持一致。
- 解析 JSON-LD，验证页面类型、URL、语言、标题和描述。
- 验证 404 不输出 canonical、`og:url`、`og:image`、Twitter Card 或 JSON-LD。
- 请求 robots 与 sitemap，验证状态码、内容类型、生产 URL、动态项目和文章路径，并排除 404 与草稿。
- 检查默认分享图像素为 1200×630，favicon 可读取。
- 运行 `npm run verify`、两种依赖审计、构建审计与生产目录隐私扫描。
- 推送后等待精确 SHA 的 Pages 工作流成功，并在线复验元数据、图片、robots 和 sitemap。
