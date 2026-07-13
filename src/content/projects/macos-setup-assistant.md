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
