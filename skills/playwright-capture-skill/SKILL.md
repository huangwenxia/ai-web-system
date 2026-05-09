---
name: playwright-capture
description: Capture JS-rendered webpages with Playwright through reusable TypeScript scripts. Use when a provided URL needs real rendered DOM, screenshots, asset URLs, visible text, or CSS for high-fidelity recreation and normal fetch returns blank or incomplete content.
---

# Playwright Capture Skill

Use this skill when Claude needs the **real rendered page**, not just raw HTML.

## When to Use

Trigger this skill when:
- the user provides a URL and asks for 1:1 页面复刻 / pixel recreation
- `WebFetch` or plain fetch returns an empty shell but the page is clearly JS-rendered
- Claude needs runtime DOM, screenshots, visible text, asset URLs, inline SVG, or background-image sources
- Claude needs a stable first-frame capture before rebuilding the page in Vue / HTML / TS

## Guardrails

- Only use URLs explicitly provided by the user or found in local project files.
- Do not invent URLs.
- Prefer a stable rendered state first. If animation is hard to preserve, capture the static visual state before attempting anything dynamic.
- For authenticated/private pages, do not assume access. Ask before any interactive login flow.
- Before running `ensure`, `capture`, `download-assets`, or `compare-local`, Claude must first know either the target `--projectDir` or the explicit output/runtime directories.
- If the task has no clear project directory and the user has not provided explicit directories, stop and ask. Do not fall back to a user-profile cache directory.
- If Claude will rely on project-derived defaults, say which directories will be used before running the command.
- Each command should print a standard `Preflight summary (...)` block before touching the filesystem so the operator can confirm the managed paths at a glance.

## Runtime Directory Policy

This skill must not silently write artifacts or browser caches into the user profile.

### Project-scoped defaults

When `--projectDir` is available, the scripts derive these locations automatically:

```text
<projectDir>/capture/playwright/<timestamp>-<slug>/
<projectDir>/.playwright-capture/runtime/
<projectDir>/.playwright-capture/ms-playwright/
```

### Explicit overrides

If the caller needs a different location, they may pass:
- `--outputDir`
- `--workspaceDir`
- `--browserCacheDir`

These directories must be chosen deliberately. The scripts do not fall back to `~/.tmp/playwright-capture` or `%LOCALAPPDATA%/ms-playwright` anymore.

## Executable Scripts

All scripts are **Node + TypeScript**.

```text
scripts/
  ensure-playwright.ts
  capture-page.ts
  download-assets.ts
  compare-local.ts
  clean-managed.ts
  prune-managed.ts
  run-skill.ts
  shared.ts
```

### Script responsibilities

- `ensure-playwright.ts`
  - resolves the managed runtime directories
  - installs Playwright if missing
  - installs Chromium if missing
- `capture-page.ts`
  - opens the real page in Playwright
  - waits for runtime rendering
  - saves screenshot + rendered HTML + structured capture JSON
- `download-assets.ts`
  - downloads entry js/css/image assets referenced by the page shell or captured HTML
  - reuses the existing capture directory when `--html` points at a captured `page.html`
- `compare-local.ts`
  - opens a rebuilt local page and saves a local comparison screenshot
- `clean-managed.ts`
  - clears managed project-local artifacts and/or runtime caches after explicit confirmation
- `prune-managed.ts`
  - keeps only the newest N managed capture directories after explicit confirmation
- `run-skill.ts`
  - optional command router for the scripts above

## Output Policy

Do **not** write runtime artifacts into the skill's `docs/` directory.

- `docs/` is for protocol, usage, and reference files only
- runtime outputs belong in a task-local project directory
- if no target project directory is known, Claude must ask for one or ask for explicit output/runtime directories before running anything

See:
- `docs/output-layout.md`
- `docs/usage.md`

## Recommended Artifact Layout

```text
<output-dir>/
  page.png
  page.html
  capture.json
  local-page.png        # only for local compare
  assets/
    index-xxxx.js
    index-xxxx.css
    runtime-xxxx.js
    config-xxxx.js
```

## Recommended Workflow

### 1. Ensure the environment

Run once per project or whenever uncertain:

```powershell
node scripts/run-skill.ts ensure --projectDir "E:\work\target-project"
```

### 2. Capture the rendered page

```powershell
node scripts/run-skill.ts capture --url "https://example.com/page" --projectDir "E:\work\target-project"
```

Optional explicit directories:
- `--outputDir`
- `--workspaceDir`
- `--browserCacheDir`
- `--waitMs`
- `--timeoutMs`
- `--viewportWidth`
- `--viewportHeight`

### 3. Download entry assets if the recreation depends on shipped bundles

```powershell
node scripts/run-skill.ts download-assets --url "https://example.com/page" --html "E:\work\target-project\capture\playwright\2026-05-08-example\page.html"
```

If `--outputDir` is omitted here, assets default to the sibling `assets/` directory beside that `page.html`.

### 4. Rebuild strategy for implementation tasks

When the goal is page recreation in Vue/TS:
- capture the real runtime DOM first
- capture the screenshot second
- then decide whether to
  - rebuild section-by-section in Vue, or
  - use rendered body + captured CSS as a static iframe/srcdoc mirror for demo-only pages
- if using a static mirror, strip runtime scripts and keep the first rendered visual state

### 5. Compare the rebuilt local page

```powershell
node scripts/run-skill.ts compare-local --url "http://127.0.0.1:8091/path" --projectDir "E:\work\target-project"
```

### 6. Prune old capture directories

```powershell
node scripts/run-skill.ts prune --projectDir "E:\work\target-project" --confirm true --keep 3
```

### 7. Clean managed artifacts or runtime caches

```powershell
node scripts/run-skill.ts clean --projectDir "E:\work\target-project" --confirm true --scope all
```

Use `--scope captures` to remove only capture directories, or `--scope runtime` to remove only the managed Playwright runtime/cache tree.

## Runtime Data To Prefer

From `capture-page.ts`, the important capture files/fields are:
- `page.html`: full rendered DOM snapshot
- `capture.json.visibleText`: unique visible text
- `capture.json.images`: image URLs and dimensions
- `capture.json.svgs`: inline SVG markup
- `capture.json.backgrounds`: nodes using background images
- `capture.json.blocks`: visible nodes with rects + selected computed styles

This is the preferred base for high-fidelity reconstruction.

## Debug Notes

- If normal fetch returns a blank page, switch to Playwright immediately.
- If `capture.json` is too large, inspect targeted fields with small Node/PowerShell helpers instead of printing the full file.
- If a recreated page collapses into a long column, verify that the captured CSS is actually injected and that runtime CSS links were replaced properly.
- If the page is demo-only, iframe/srcdoc mirroring is an acceptable intermediate solution before hand-converting every block.
- If the managed directories are wrong, stop and fix the path inputs instead of allowing the command to write into a fallback cache.

## Minimal Reporting Checklist

When this skill is used, Claude should report:
1. which URL was captured
2. where artifacts were saved
3. which runtime workspace and browser cache directories were used
4. whether runtime DOM capture succeeded
5. whether entry assets were downloaded
6. whether the final result is a static mirror or a hand-rebuilt page
7. any remaining gap, especially animation, auth, or remote-only asset issues
