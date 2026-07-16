---
title: API Pulse
summary: A dashboard for DeepSeek balance, MiMo key status, and locally recorded API usage.
role: Design and development
date: 2026-07-13
technologies: [Node.js, HTTP API, SQLite]
cover: /images/api-pulse.jpg
coverFit: contain
status: 已完成产品
outcome: Summarized balance and local usage without exposing API keys to the browser.
lang: en
translationKey: api-pulse
featured: true
evidence:
  version: 1.0.0
  verifiedAt: '2026-07-16'
  environment: macOS 27.0 · Apple silicon · Node.js 24
  checks:
    - Node.js syntax checks passed.
    - The local interface loaded and the public asset credential-pattern scan passed.
    - Anonymous dashboard access was denied while local credential loading was disabled.
    - The session-clear response used HttpOnly and SameSite=Strict cookie boundaries.
  disclosure: This record was verified locally by the project owner without real API keys; source and internal configuration remain private, with no downloads provided. It is not a third-party security certification.
---

## Background

API Pulse brings DeepSeek balance, MiMo key status, and locally recorded API usage into one dashboard.

## Problem

Balance and usage need a shared view without exposing API keys to the browser or allowing public visitors to read the site owner's local credentials.

## Approach

The server calls official endpoints for current status and summarizes requests, tokens, success rate, and estimated cost from a local SQLite database before returning displayable data to the browser.

## Security boundaries

Keys remain in server memory, visitors are isolated with HttpOnly session cookies, and public deployments do not read the site owner's local credentials by default.

## Outcome

Balance, key status, and local usage are presented in one dashboard within those privacy boundaries.
