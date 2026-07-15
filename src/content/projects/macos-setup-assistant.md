---
title: macOS 装机助手
summary: 把软件选择、安全检查、批量安装和日志查看整合为一个本地工作流。
role: 产品设计与开发
date: 2026-07-10
technologies: [SwiftUI, Shell, APFS]
cover: /images/macos-setup-assistant.png
coverFit: contain
status: 已完成产品
outcome: 把软件选择、安全检查、安装与日志整合进一个可维护的本地工作流。
lang: zh
translationKey: macos-setup-assistant
featured: true
---

## 背景

这个项目面向需要重复配置 Mac 的场景，目标是把分散的准备和安装操作整理成一个本地工作流。

## 问题

软件选择、安全校验、批量安装和结果查看需要形成一条可检查的连续流程，同时保留出错时定位问题所需的日志。

## 方案

原生 SwiftUI 界面负责软件选择、壁纸预览和结果查看，Shell 脚本负责包校验与实际安装，让界面层和可检查的执行层各自保持清晰。

## 关键实现

流程包含 dry-run、安全检查、安装后验证和日志记录。临时准备目录优先使用 APFS 写时复制，不支持时回退到普通复制。

## 结果

软件选择、安全检查、安装、验证和日志被整合进一个可维护的本地装机工作流。
