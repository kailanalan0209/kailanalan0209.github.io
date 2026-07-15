# Astro 7 安全升级设计规格

## 目标

将项目从 Astro 5.18.2 精确升级到 Astro 7.0.9，消除当前生产依赖的高危安全审计告警，同时保持现有页面、路由、内容和视觉行为不变。

本次升级与 GitHub Pages 部署配置分开进行。只有升级验证通过后，才开始添加站点地址、GitHub Actions 和首次发布配置。

## 修改范围

初始修改仅包括：

- `package.json` 中的 Astro 版本和 Node/npm `engines` 约束。
- `package-lock.json` 中由 npm 解析产生的必要依赖变化。
- `README.md` 中的本地 Node 版本要求。

只有当安装、类型检查、构建或测试提供明确失败证据时，才修改相关源码或测试。不得顺带升级 TypeScript、Vitest、Playwright，不重构页面，不调整视觉样式，不添加新功能。

如果 Astro 7 对 `@astrojs/check` 提出不兼容的 peer dependency 要求，可以升级该包到与 Astro 7 兼容的最低必要版本，并在变更说明中记录原因。

## 升级方式

使用 npm 手动安装精确版本 `astro@7.0.9`，不使用 `npm audit fix --force`，也不使用会自动扩大依赖变更范围的批量升级命令。

项目已经使用 Astro Content Layer API：集合配置位于 `src/content.config.ts`，集合定义了 loader，页面通过 `render(entry)` 渲染内容。因此不引入 Astro 6 的旧集合兼容标志，也不重写当前内容模型。

项目没有 Astro adapter、自定义 Vite 插件、SSR、Server Islands 或 View Transitions。这些迁移项不属于本次修改范围。

## 需要验证的兼容边界

### 内容与路由

- 中文根路由和 `/en/` 英文路由保持不变。
- 两个中文项目、两个英文项目和两篇中文文章继续生成详情页。
- 14 个现有静态页面全部生成。
- Content Collections schema、entry ID 和 `render(entry)` 行为保持不变。

### Astro 7 输出变化

Astro 7 使用新的编译器、Markdown 处理管线和 JSX 风格的空白压缩。升级后需要重点核对：

- 日期与阅读时长之间的可见空格和分隔符。
- 中英文导航、语言切换和卡片文字没有意外拼接。
- Markdown 段落、标题和列表仍生成预期 HTML。
- 生产构建没有新增本地地址、敏感内容或失效内部链接。

### 工具链

- Astro 7.0.9 要求 Node.js `>=22.12.0`；项目 README 与 `package.json` 必须明确这一最低版本。
- 本次本地升级使用 Codex 工作区提供的 Node.js 24.14.0。
- npm 最低版本继续为 `>=9.6.5`。
- TypeScript、Vitest 和 Playwright 保持现有版本，除非 npm 明确报告无法满足的依赖约束。
- 构建输出仍为静态 `dist/`，不添加 adapter。

## 验证顺序

1. 切换到 Node.js 24.14.0，记录升级前的依赖版本和干净工作树状态。
2. 安装精确版本 Astro 7.0.9。
3. 检查 `package.json` 与 lockfile，确认没有无关的顶层依赖升级。
4. 运行 `npm run test:unit`。
5. 运行 `npm run check`。
6. 运行 `npm run build`，确认生成 14 个页面。
7. 运行 `npm run audit`。
8. 运行 `npm run test:e2e`。
9. 运行完整的 `npm run verify`，确认组合流程也能通过。
10. 运行 `npm audit --omit=dev --audit-level=high`，确认生产依赖不存在高危告警。
11. 检查 Git diff，排除无关改动。

## 失败处理

如果直接升级失败：

- 先根据实际错误定位是否属于 Astro 6 或 Astro 7 的迁移要求。
- 仅修复能够由错误、迁移指南或回归测试直接证明的兼容问题。
- 每次只处理一个失败，再重新运行对应的最小验证命令。
- 不通过关闭检查、删除测试或放宽内容 schema 来绕过失败。

如果问题无法通过小范围修改解决，则停止直接升级，保留错误证据，并改为 Astro 5 → 6 → 7 的分阶段升级方案。不得在同一修改中加入 GitHub Pages 配置来掩盖或混合升级问题。

## 完成标准

只有同时满足以下条件，Astro 7 升级才算完成：

- `package.json` 精确使用 Astro 7.0.9。
- `package.json` 声明 Node.js `>=22.12.0` 和 npm `>=9.6.5`。
- README 声明 Node.js 22.12.0 或更新版本。
- 所有 26 个现有单元测试通过。
- Astro 检查为 0 错误、0 警告、0 提示。
- 14 个静态页面成功构建。
- 构建审计通过。
- 所有 16 个现有端到端测试通过。
- 完整 `npm run verify` 退出码为 0。
- 生产依赖的高危 npm 审计门禁通过。
- 页面、路由、内容和视觉行为没有有意变化。
- Git diff 中的每项修改都能追溯到升级需求。

## 后续边界

以下工作不包含在本规格中，将在升级完成后单独设计和实施：

- 创建 `kailanalan0209.github.io` GitHub 仓库。
- 配置 Astro `site`、canonical、hreflang 或社交分享元数据。
- 添加 GitHub Pages Actions 工作流。
- 丰富项目案例、替换占位图或修改关于页。
