# API Pulse 真实项目图设计

## 目标

用用户提供的 API Pulse 仪表盘图片替换中英文项目条目当前的占位封面，并在首页、项目列表和项目详情页完整展示该图片，不裁切界面内容。

## 成功标准

- 中英文 API Pulse 项目卡片都使用 `/images/api-pulse.jpg`。
- 中英文 API Pulse 详情页都在摘要后、正文前显示该图片。
- 卡片和详情页均保持 16:9 展示区域、黑色背景和 `object-fit: contain`。
- 原始 1024×1024 界面完整可见，页面不产生横向溢出。
- macOS 装机助手、文章页面和其他现有内容的图片行为不改变。
- 项目完整验证、依赖审计、生产扫描和 GitHub Pages 线上检查全部通过。

## 资源处理

用户文件路径为：

`/Users/wkl/Downloads/api_dashboard_mockup_1781029849974.png`

虽然文件名后缀为 `.png`，文件内容实际为无透明通道的 JPEG。为使扩展名、文件内容和线上 MIME 类型一致，按原始字节复制为：

`public/images/api-pulse.jpg`

不转码、不压缩、不裁切、不重绘。复制后比较源文件与目标文件的 SHA-256，并检查目标仍为 JPEG、1024×1024。

## 内容与展示

中英文 `api-pulse` 内容条目均设置：

```yaml
cover: /images/api-pulse.jpg
coverFit: contain
```

复用现有项目内容 schema、`ProjectCard` 和 `ContentLayout`：

- `ProjectCard` 在首页和项目列表中读取 `cover` 与 `coverFit`。
- 中英文项目路由把非占位封面传给 `ContentLayout`。
- `contain` 模式使用现有黑色背景和 16:9 区域。

本次不新增 schema 字段、组件、路由条件或 CSS 规则。

## 响应式与可访问性

- 卡片图片继续懒加载并异步解码。
- 详情主图继续异步解码，不强制懒加载首屏图片。
- 中文替代文本为 `API Pulse项目封面`，英文替代文本为 `API Pulse project cover`。
- 桌面和移动端都保持 16:9 容器，方形原图在容器中完整居中，左右使用黑色留边。

## 验证方案

按测试驱动方式先添加失败测试，再更新内容：

1. 验证中英文 API Pulse 卡片引用 `/images/api-pulse.jpg`，计算样式为 `contain`，容器比例为 16:9。
2. 验证中英文 API Pulse 详情页显示主图，替代文本正确，天然尺寸为 1024×1024，计算样式为 `contain`。
3. 验证 macOS 装机助手仍引用原图并保持 `contain`。
4. 在移动端验证详情主图无横向溢出。
5. 比较源文件与公开资源 SHA-256，运行完整项目验证、两次依赖审计和生产隐私扫描。

## 发布

本地验证通过后提交并合入 `main`，直接推送 GitHub。等待 GitHub Pages 工作流成功，再验证：

- 图片资源返回 HTTP 200 和正确的 `image/jpeg` 类型。
- 中英文首页和详情页均引用真实图片。
- 线上卡片及详情主图为 `contain` 和 16:9。
- macOS 装机助手线上展示保持不变。

## 非目标

- 不修改、生成或美化用户提供的仪表盘图片。
- 不重写 API Pulse 项目文案或增加项目成果。
- 不改变卡片布局、站点配色或全站图片系统。
- 不调整 macOS 装机助手、文章或其他内容。
