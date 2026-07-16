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
evidence:
  version: 1.0.0
  verifiedAt: '2026-07-16'
  environment: macOS 27.0 · Apple 芯片 · Node.js 24
  checks:
    - Node.js 语法检查通过。
    - 本地界面可访问，公开静态资源凭据模式扫描通过。
    - 关闭本地凭据读取时，匿名访问默认拒绝仪表盘数据。
    - 会话清除响应使用 HttpOnly 与 SameSite=Strict Cookie 边界。
  disclosure: 此记录由项目所有者在无真实 API Key 的本地环境中验证；源码和内部配置保持私有，不提供下载，也不是第三方安全认证。
---

## 背景

API Pulse 用于同时查看 DeepSeek 余额、MiMo Key 状态和本地记录的 API 请求用量。

## 问题

余额和用量需要集中呈现，但汇总过程不能把 API Key 暴露给浏览器，也不能让公共访客读取站点所有者的本地凭据。

## 方案

服务端调用官方接口获取状态，并从本地 SQLite 数据库汇总请求数、Token、成功率和估算费用，再把可展示的数据交给浏览器。

## 安全边界

API Key 只在服务端内存中使用，访客通过 HttpOnly 会话 Cookie 隔离。公开部署时默认不读取站点所有者的本地凭据。

## 结果

余额、Key 状态和本地用量在既定隐私边界内被汇总到同一个仪表盘中。
