---
title: API Pulse
summary: 汇总 DeepSeek 余额、MiMo Key 状态和本地请求用量的仪表盘。
role: 设计与开发
date: 2026-07-13
technologies: [Node.js, HTTP API, SQLite]
cover: /images/api-pulse.jpg
coverFit: contain
status: 已完成产品
outcome: 在不向浏览器暴露密钥的前提下汇总余额与本地用量。
lang: zh
translationKey: api-pulse
featured: true
---

API Pulse 通过服务端调用官方接口，并从本地数据库汇总请求数、Token、成功率和估算费用。

API Key 只在服务端内存中使用，浏览器通过 HttpOnly 会话 Cookie 隔离访客。公开部署时默认不读取站点所有者的本地凭据。
