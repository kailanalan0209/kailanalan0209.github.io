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
