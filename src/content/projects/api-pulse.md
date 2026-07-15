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
