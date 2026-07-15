# WKL Portfolio

WKL 的双语作品集与中文优先博客，使用 Astro 构建为静态站点。

## 本地开发

需要 Node.js 22.12.0 或更新版本，以及 npm 9.6.5 或更高版本。

```bash
npm install
npm run dev
npm run verify
```

`npm run verify` 依次运行单元测试、Astro 检查、生产构建、构建审计和端到端测试。

## 内容维护

内容使用 Markdown，按集合存放：

- 项目：`src/content/projects/`
- 文章：`src/content/posts/`
- 经历：`src/content/experience/`

项目必填字段：`title`、`summary`、`role`、`date`、`technologies`、`status`、`outcome`、`lang`、`translationKey`。`cover` 可选，默认为 `/images/project-fallback.svg`；`featured` 可选，默认为 `false`。

文章必填字段：`title`、`summary`、`publishedAt`、`tags`、`lang`、`translationKey`、`readingMinutes`。`cover` 可选，默认为 `/images/article-fallback.svg`；`draft` 可选，默认为 `false`。

经历必填字段：`title`、`date`、`contribution`、`outcome`、`type`、`lang`、`translationKey`。

隐私规则：绝不直接粘贴源文档；只重写已经批准公开的事实。公开联系邮箱为 `2694421597@qq.com`。

生产构建输出到 `dist/`。

## 线上部署

生产站点：<https://kailanalan0209.github.io>

`main` 分支每次推送后，GitHub Actions 使用 Node.js 24 构建 Astro 静态站点，并将 `dist/` 发布到 GitHub Pages。
