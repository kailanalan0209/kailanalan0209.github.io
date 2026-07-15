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
---

API Pulse calls official endpoints from the server and summarizes requests, tokens, success rate, and estimated cost from a local database.

Keys remain in server memory, visitor sessions are isolated with HttpOnly cookies, and public deployments do not read the site owner's local credentials by default.
