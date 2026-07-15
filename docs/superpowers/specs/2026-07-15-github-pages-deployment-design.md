# GitHub Pages 上线设计规格

## 目标

将当前 Astro 7 静态站点发布到 `https://kailanalan0209.github.io`，并在每次向 `main` 推送后由 GitHub Actions 自动构建和部署。

目标仓库为公开的 GitHub 用户站点仓库 `kailanalan0209/kailanalan0209.github.io`。源码、内容和提交历史将公开可见。

## 方案选择

采用 Astro 官方推荐的 GitHub Pages Action，而不是自行组合 Node 安装、构建和 artifact 上传步骤，也不维护单独的 `gh-pages` 分支。

工作流使用当前官方文档的主要版本：

- `actions/checkout@v7`
- `withastro/action@v6`
- `actions/deploy-pages@v5`

Astro Action 使用已提交的 `package-lock.json` 识别 npm，并显式使用 Node.js 24 构建。

## Astro 发布配置

`astro.config.mjs` 增加：

```js
site: 'https://kailanalan0209.github.io'
```

不设置 `base`。仓库名符合 `<username>.github.io` 特殊格式，站点从域名根路径发布，现有 `/about/`、`/projects/` 和 `/en/` 等绝对路径不需改写。

仍保持 `output: 'static'` 和 `trailingSlash: 'always'`，不添加 adapter。

## 生产元数据

`BaseLayout.astro` 使用固定的生产 `site` 生成绝对 URL，不使用本地开发服务器的 origin。

所有正常页面输出：

- 指向当前路径的 `link[rel="canonical"]`。
- 与 canonical 相同的 `og:url`。
- `og:type="website"`。
- 现有 `og:title` 和 `og:description`。

只有真实存在中英文对应页面时，才输出 `hreflang="zh-CN"` 和 `hreflang="en"` 的 alternate 链接。用于界面跳转的 `languageHref` 与 SEO alternate 分开：

- 首页、关于页、项目列表和已翻译项目输出中英文 alternate。
- 中文独有文章和没有翻译的项目不把语言提示页或列表页冒充为翻译。
- 404 页不输出 canonical 和 alternate，避免将错误页当作可索引内容。

本次不新增社交分享图片、Twitter Card 或结构化数据，因为还没有已确认的生产分享图。

## GitHub Actions 工作流

新增 `.github/workflows/deploy.yml`，它：

- 在推送 `main` 和手动触发时运行。
- 仅授予 `contents: read`、`pages: write` 和 `id-token: write`。
- 由独立 `build` job 构建并上传 Pages artifact。
- 由依赖 `build` 的 `deploy` job 发布到 `github-pages` environment。
- 不接受秘密参数，不读取本地凭据，不向仓库写入构建产物。

## GitHub 仓库与发布流程

1. 在用户已登录的 GitHub 会话中创建公开空仓库 `kailanalan0209.github.io`。
2. 不在 GitHub 端初始化 README、`.gitignore` 或 license，避免与本地历史冲突。
3. 将 `origin` 设为该仓库的 HTTPS 地址，推送本地 `main`。
4. 在仓库 Pages 设置中选择 GitHub Actions 作为发布源。
5. 等待首次 workflow 成功，然后验证线上 URL。

如果浏览器未登录、登录账号不是 `kailanalan0209`、目标仓库在操作期间被创建，或 GitHub 要求额外身份验证，则停止外部操作并保留已验证的本地提交，不猜测用户凭据。

## 验证与成功标准

本地修改必须先通过：

- 针对 canonical、`og:url`、`og:type` 和 hreflang 的 RED/GREEN 测试。
- `npm run verify`。
- `npm audit --omit=dev --audit-level=high` 和完整 `npm audit`。
- 构建产物不包含 `localhost`、`/Users/` 或私钥标记。
- Git diff 仅包含部署、生产 URL、相关测试和文档。

线上完成标准：

- `main` 已推送到 `kailanalan0209/kailanalan0209.github.io`。
- GitHub Pages workflow 的 build 和 deploy jobs 都成功。
- `https://kailanalan0209.github.io/` 返回成功响应并显示中文首页。
- `/en/`、`/projects/`、`/posts/`、`/about/` 和自定义 404 恢复路径可用。
- 页面 canonical 和 alternate 均指向 `https://kailanalan0209.github.io`，不包含本地地址。

## 明确不包含

- 自定义域名或 `CNAME`。
- 访问统计、评论、搜索、邮件订阅或后台服务。
- 内容重写、视觉调整或项目卡片补全。
- 社交分享图片、Twitter Card 或 JSON-LD。
- 为 Windows 重写现有 Playwright 启动命令。
