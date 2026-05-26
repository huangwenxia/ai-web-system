# Output Layout

This skill keeps **runtime artifacts out of the skill source tree** and out of the user-profile fallback cache.

## Project-derived defaults

When `--projectDir` is provided, the scripts derive these locations automatically:

```text
<projectDir>/capture/playwright/<timestamp>-<slug>/
<projectDir>/.playwright-capture/runtime/
<projectDir>/.playwright-capture/ms-playwright/
```

The scripts fail fast if they do not have either a project directory or explicit managed directory flags.

## Recommended artifact structure

```text
<output-dir>/
  page.png
  page.html
  capture.json
  local-page.png              # only when compare-local runs
  assets/
    index-xxxx.js
    index-xxxx.css
    runtime-xxxx.js
    config-xxxx.js
```

`page.html` stores the full rendered DOM snapshot.

`capture.json` stores the structured analysis data only:
- visible text
- images
- svgs
- background-image nodes
- visible blocks with rects and selected computed styles
- body dimensions

## Why not store outputs in `docs/`

`docs/` belongs to versioned references only:
- usage rules
- examples
- output conventions

Actual screenshots, HTML snapshots, JSON captures, and downloaded bundles are runtime data. Storing them in `docs/` would pollute the skill source and make syncing noisy.

## Override behavior

If the caller already has a target project directory, prefer the project-derived defaults.

If the caller needs a different layout, pass explicit directories such as:
- `--outputDir`
- `--workspaceDir`
- `--browserCacheDir`

Choose those locations deliberately. The skill does not fall back to `~/.tmp/playwright-capture` or `%LOCALAPPDATA%\ms-playwright`.

## Cleanup workflow

Use the managed cleanup commands to control disk usage without deleting unrelated files:
- `prune --projectDir <dir> --confirm true --keep 3`
- `clean --projectDir <dir> --confirm true --scope captures`
- `clean --projectDir <dir> --confirm true --scope runtime`
- `clean --projectDir <dir> --confirm true --scope all`

These commands only target the managed project-local directories under:
- `<projectDir>/capture/playwright/`
- `<projectDir>/.playwright-capture/`
