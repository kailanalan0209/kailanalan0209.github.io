---
title: macOS Setup Assistant
summary: A local workflow for selecting, checking, installing, and reviewing Mac software.
role: Product design and development
date: 2026-07-10
technologies: [SwiftUI, Shell, APFS]
cover: /images/macos-setup-assistant.png
coverFit: contain
status: 已完成产品
outcome: Combined selection, safety checks, installation, verification, and logs in one maintainable workflow.
lang: en
translationKey: macos-setup-assistant
featured: true
---

## Background

This project supports situations where Macs need to be configured repeatedly by turning separate preparation and installation steps into one local workflow.

## Problem

Software selection, safety checks, batch installation, and result review need to form one inspectable process while retaining the logs required to diagnose failures.

## Approach

The native SwiftUI interface handles software selection, wallpaper previews, and results. Shell scripts handle package validation and installation, keeping the interface separate from the inspectable execution layer.

## Key implementation

The workflow includes dry-run behavior, safety checks, post-install verification, and logs. Temporary staging prefers APFS copy-on-write and falls back to a normal copy when needed.

## Outcome

Selection, safety checks, installation, verification, and logs are combined in one maintainable local setup workflow.
