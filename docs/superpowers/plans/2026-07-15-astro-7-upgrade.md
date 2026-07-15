# Astro 7 Safety Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the site from Astro 5.18.2 to exactly Astro 7.0.9, remove the current high-severity production dependency audit failure, and preserve all existing site behavior.

**Architecture:** Treat the existing unit, type, build-audit, and Playwright suites as the regression contract. Change only the pinned Astro dependency and npm lockfile first; modify `@astrojs/check`, source, or tests only when a concrete install or verification failure proves that a migration change is required.

**Tech Stack:** Node.js 20, npm, Astro 7.0.9, Astro Content Layer, TypeScript, Vitest, Playwright

**Migration References:**

- Astro 6 guide: `https://docs.astro.build/en/guides/upgrade-to/v6/`
- Astro 7 guide: `https://docs.astro.build/en/guides/upgrade-to/v7/`
- Astro 7 release notes: `https://astro.build/blog/astro-7/`

## Global Constraints

- Pin Astro to exactly `7.0.9`.
- Keep TypeScript at `5.9.3`, Vitest at `3.2.7`, and Playwright at `1.61.1`.
- Keep `@astrojs/check` at `0.9.9` unless npm reports an unsatisfied peer dependency or `astro check` proves incompatibility.
- Do not use `npm audit fix --force` or a bulk dependency upgrade command.
- Keep static output, all existing routes, content schemas, content, and visual behavior unchanged.
- Do not add an adapter, GitHub Pages configuration, SEO work, content changes, refactors, or formatting-only edits.
- Stop and switch to a separately reviewed Astro 5 → 6 → 7 plan if a direct upgrade cannot be completed with surgical compatibility changes.

---

## File Map

- Modify: `package.json` — change only the pinned Astro version unless a proven `@astrojs/check` incompatibility requires the smallest compatible adjustment.
- Modify: `package-lock.json` — accept only dependency-graph changes produced by installing the approved exact version.
- Reference: `src/content.config.ts` — verify that the existing Content Layer configuration continues to work; do not edit without a concrete failure.
- Reference: `src/layouts/ContentLayout.astro` — verify date/read-time spacing; do not edit without a failing regression.
- Reference: `src/components/SiteHeader.astro` and `src/components/ProjectCard.astro` — verify navigation and card text; do not edit without a failing regression.
- Test: `tests/unit/**/*.spec.*` — existing 26-test unit contract.
- Test: `tests/e2e/**/*.spec.ts` — existing 16-test route, i18n, accessibility, metadata, and responsive contract.
- Test: `scripts/audit-build.mjs` — existing internal-link and sensitive-content production audit.

### Task 1: Capture the Astro 5 Baseline

**Files:**
- Reference: `package.json`
- Reference: `package-lock.json`
- Test: `tests/unit/**/*.spec.*`
- Test: `tests/e2e/**/*.spec.ts`
- Test: `scripts/audit-build.mjs`

**Interfaces:**
- Consumes: current clean `main` branch at or after commit `159739e`.
- Produces: recorded baseline versions, test counts, page count, and the expected pre-upgrade npm audit failure.

- [ ] **Step 1: Confirm the worktree and runtime baseline**

Run:

```bash
git status --short
node --version
npm --version
npm ls astro @astrojs/check typescript vitest @playwright/test --depth=0
```

Expected:

- `git status --short` prints nothing.
- Node reports a `v20.x` version.
- Astro reports `5.18.2`.
- `@astrojs/check`, TypeScript, Vitest, and Playwright report the versions listed in Global Constraints.

- [ ] **Step 2: Run the complete pre-upgrade regression suite**

Run:

```bash
npm run verify
```

Expected:

- 26 unit tests pass.
- `astro check` reports 0 errors, 0 warnings, and 0 hints.
- 14 static pages build.
- The build audit passes.
- 16 Playwright tests pass.
- The command exits with status 0.

- [ ] **Step 3: Confirm the security failure this upgrade must remove**

Run:

```bash
npm audit --omit=dev --audit-level=high
```

Expected: non-zero exit status with a high-severity Astro advisory. Save the terminal evidence in the task notes; do not modify files in response to this expected failure.

### Task 2: Install the Exact Astro 7 Version

**Files:**
- Modify: `package.json:15-17`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the passing baseline and expected audit failure from Task 1.
- Produces: `astro@7.0.9` installed with no unrelated top-level dependency upgrades.

- [ ] **Step 1: Install only the approved Astro version**

Run:

```bash
npm install --save-exact astro@7.0.9
```

Expected: npm exits with status 0 and updates `package.json` to contain exactly:

```json
"dependencies": {
  "astro": "7.0.9"
}
```

If npm reports an unsatisfied peer dependency, stop before adding flags or changing another package. Record the exact error and use the systematic-debugging workflow to determine whether `@astrojs/check` is the proven cause.

- [ ] **Step 2: Audit the dependency diff before testing**

Run:

```bash
git diff -- package.json package-lock.json
npm ls astro @astrojs/check typescript vitest @playwright/test --depth=0
npm explain astro
```

Expected:

- `package.json` changes only `astro` from `5.18.2` to `7.0.9`.
- Astro resolves to `7.0.9`.
- The four constrained development dependencies retain their original versions.
- Lockfile changes are attributable to Astro's dependency graph.

If any constrained top-level package changed, restore only that package's approved version with an exact npm install and re-run this step before continuing.

- [ ] **Step 3: Run the fastest compatibility gates**

Run:

```bash
npm run test:unit
npm run check
```

Expected:

- 26 unit tests pass.
- `astro check` reports 0 errors, 0 warnings, and 0 hints.

If either command fails, stop and use systematic debugging. Modify source or `@astrojs/check` only when the error output and the official Astro 6/7 migration guides identify a specific required change.

- [ ] **Step 4: Build and audit the production output**

Run:

```bash
npm run build
npm run audit
find dist -name '*.html' -type f | wc -l
```

Expected:

- Astro builds successfully.
- The build log reports 14 pages.
- The build audit passes.
- The final command prints `14` after whitespace is ignored.

- [ ] **Step 5: Verify the Astro 7 output boundaries directly**

Run:

```bash
rg -n '2026年7月14日 · 2 分钟阅读' dist/posts/index.html dist/posts/api-key-privacy/index.html
rg -n '>Projects<|>Notes<|>About<|>Technologies<' dist/en -g '*.html'
rg -n '<p>API Pulse 通过服务端调用官方接口|<p>The native SwiftUI interface handles' dist -g '*.html'
rg -n 'http://localhost:4321|/Users/' dist src public || true
```

Expected:

- The reading metadata appears in both the Chinese post list and detail output.
- English navigation and technology labels remain separate and readable.
- Chinese and English Markdown paragraphs are present in generated project pages.
- The final command prints no matches.

- [ ] **Step 6: Run the browser regression suite**

Run:

```bash
npm run test:e2e
```

Expected: all 16 Playwright tests pass. If the dev server exits unexpectedly, diagnose the server lifecycle from the actual Playwright and Astro output before changing `playwright.config.ts`.

### Task 3: Prove the Upgrade Meets the Release Gate

**Files:**
- Verify: `package.json`
- Verify: `package-lock.json`
- Verify: all existing source and tests remain unchanged unless a proven migration fix was required in Task 2.

**Interfaces:**
- Consumes: the installed Astro 7 dependency and passing focused gates from Task 2.
- Produces: a complete verification record and one intentional upgrade commit.

- [ ] **Step 1: Run the complete combined verification command**

Run:

```bash
npm run verify
```

Expected:

- 26 unit tests pass.
- `astro check` reports 0 errors, 0 warnings, and 0 hints.
- 14 static pages build.
- The build audit passes.
- 16 Playwright tests pass.
- The command exits with status 0.

- [ ] **Step 2: Run the production security gate**

Run:

```bash
npm audit --omit=dev --audit-level=high
```

Expected: exit status 0 with no high-severity production dependency vulnerability.

Also run the full informational audit:

```bash
npm audit
```

Expected: record any remaining development-only advisory without expanding the approved upgrade scope. A remaining high-severity production advisory blocks completion.

- [ ] **Step 3: Review the final scope**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff -- package.json
git diff --name-only
```

Expected:

- `git diff --check` prints nothing.
- The expected changed files are `package.json` and `package-lock.json` only, unless Task 2 produced a documented, evidence-backed compatibility fix.
- No GitHub Pages, SEO, content, styling, or unrelated dependency changes appear.

- [ ] **Step 4: Commit the verified upgrade**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade Astro to 7.0.9"
```

If Task 2 required a proven compatibility edit, add only those exact source or test files to the same commit and list them in the handoff.

Expected: one commit containing only the verified Astro 7 upgrade and any strictly required migration fix.

- [ ] **Step 5: Verify the committed state**

Run:

```bash
git show --stat --oneline HEAD
git status --short
```

Expected:

- The latest commit is `chore: upgrade Astro to 7.0.9`.
- The worktree is clean.

## Execution Stop Condition

After Task 3 succeeds, stop. Do not create a GitHub repository, add a remote, configure GitHub Pages, or change production metadata in this implementation plan. Those changes require the next approved design and plan.
