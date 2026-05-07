---
name: playwright-capture
description: Capture JS-rendered webpages with Playwright through reusable TypeScript scripts and a persistent local workspace under ~/.tmp/playwright-capture. Use when a provided URL needs real rendered DOM, screenshots, asset URLs, visible text, or CSS for high-fidelity recreation and normal fetch returns blank or incomplete content.
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
- Keep the local Playwright workspace and browser binaries after successful setup unless the user explicitly asks to remove them.
- Prefer a stable rendered state first. If animation is hard to preserve, capture the static visual state before attempting anything dynamic.
- For authenticated/private pages, do not assume access. Ask before any interactive login flow.

## Persistent Runtime Workspace

### Workspace

Windows default:

```text
C:\Users\<user>\.tmp\playwright-capture
```

### Browser cache

Windows default Playwright cache:

```text
C:\Users\<user>\AppData\Local\ms-playwright
```

This skill is designed so later calls reuse that environment instead of rebuilding it.

## Executable Scripts

All scripts are **Node + TypeScript**.

```text
scripts/
  ensure-playwright.ts
  capture-page.ts
  download-assets.ts
  compare-local.ts
  run-skill.ts
  shared.ts
```

### Script responsibilities

- `ensure-playwright.ts`
  - checks the persistent workspace
  - installs Playwright if missing
  - installs Chromium if missing
- `capture-page.ts`
  - opens the real page in Playwright
  - waits for runtime rendering
  - saves screenshot + rendered HTML + structured capture JSON
- `download-assets.ts`
  - downloads entry js/css/image assets referenced by the page shell or captured HTML
- `compare-local.ts`
  - opens a rebuilt local page and saves a local comparison screenshot
- `run-skill.ts`
  - optional command router for the scripts above

## Output Policy

Do **not** write runtime artifacts into the skill's `docs/` directory.

- `docs/` is for protocol, usage, and reference files only
- runtime outputs go to the persistent capture workspace by default
- if the task already has a target project directory, prefer a task-local `capture/` folder there

See:
- `docs/output-layout.md`
- `docs/usage.md`

## Default Output Layout

Without `--outputDir`, the scripts write to:

```text
C:\Users\<user>\.tmp\playwright-capture\captures\<timestamp>-<slug>\
```

Recommended artifact set:

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

Run once or whenever uncertain:

```powershell
node scripts/run-skill.ts ensure
```

### 2. Capture the rendered page

```powershell
node scripts/run-skill.ts capture --url "https://example.com/page"
```

Optional:
- `--outputDir`
- `--waitMs`
- `--timeoutMs`
- `--viewportWidth`
- `--viewportHeight`

### 3. Download entry assets if the recreation depends on shipped bundles

```powershell
node scripts/run-skill.ts download-assets --url "https://example.com/page" --html "<capture-dir>\page.html" --outputDir "<capture-dir>\assets"
```

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
node scripts/run-skill.ts compare-local --url "http://127.0.0.1:8091/path" --outputDir "<capture-dir>"
```

## Runtime Data To Prefer

From `capture-page.ts`, the important capture JSON fields are:
- `html`: full rendered DOM snapshot
- `visibleText`: unique visible text
- `images`: image URLs and dimensions
- `svgs`: inline SVG markup
- `backgrounds`: nodes using background images
- `blocks`: visible nodes with rects + selected computed styles

This is the preferred base for high-fidelity reconstruction.

## Debug Notes

- If normal fetch returns a blank page, switch to Playwright immediately.
- If `capture.json` is too large, inspect targeted fields with small Node/PowerShell helpers instead of printing the full file.
- If a recreated page collapses into a long column, verify that the captured CSS is actually injected and that runtime CSS links were replaced properly.
- If the page is demo-only, iframe/srcdoc mirroring is an acceptable intermediate solution before hand-converting every block.

## Minimal Reporting Checklist

When this skill is used, Claude should report:
1. which URL was captured
2. where artifacts were saved
3. whether runtime DOM capture succeeded
4. whether entry assets were downloaded
5. whether the final result is a static mirror or a hand-rebuilt page
6. any remaining gap, especially animation, auth, or remote-only asset issues
