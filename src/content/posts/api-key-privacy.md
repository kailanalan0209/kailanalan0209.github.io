---
title: API Key 仪表盘中的隐私边界
summary: 为什么密钥留在服务端，以及本地能力与公开部署需要怎样隔离。
publishedAt: 2026-07-14
tags: [隐私, Node.js]
cover: /images/article-fallback.svg
lang: zh
translationKey: api-key-privacy
readingMinutes: 2
draft: false
---

用量仪表盘需要访问平台接口，但这不意味着浏览器应该接触 API Key。

API Pulse 把密钥限制在服务端内存，通过 HttpOnly Cookie 隔离会话。读取本机数据库的能力默认关闭，只有明确启用时才用于本地自用场景。
