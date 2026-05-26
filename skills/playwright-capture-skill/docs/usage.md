# Usage

## Directory rules

Before running any command, provide either:
- `--projectDir` so the skill can derive project-local directories, or
- explicit directory flags such as `--outputDir`, `--workspaceDir`, and `--browserCacheDir`

If neither is available, the command should fail fast instead of writing into the user profile.

Each command prints a `Preflight summary (...)` block first, listing the directories it is about to read from or write to.

## One-time environment check

```powershell
node scripts/run-skill.ts ensure --projectDir "E:\work\target-project"
```

This ensures:
- `<projectDir>\.playwright-capture\runtime\node_modules\playwright`
- `<projectDir>\.playwright-capture\ms-playwright\` browser binaries

## Capture a rendered page

```powershell
node scripts/run-skill.ts capture --url "https://example.com/page" --projectDir "E:\work\target-project"
```

Optional explicit directories:

```powershell
node scripts/run-skill.ts capture --url "https://example.com/page" --outputDir "E:\work\target-project\capture\playwright\custom-run" --workspaceDir "E:\work\target-project\.playwright-capture\runtime" --browserCacheDir "E:\work\target-project\.playwright-capture\ms-playwright" --waitMs 5000
```

## Download entry assets

```powershell
node scripts/run-skill.ts download-assets --url "https://example.com/page" --html "E:\work\target-project\capture\playwright\2026-05-08-example\page.html"
```

If `--outputDir` is omitted and `--html` points to a captured page, assets default to the sibling `assets\` directory.

## Compare a local rebuilt page

```powershell
node scripts/run-skill.ts compare-local --url "http://127.0.0.1:8091/zg/dashboard-demo/infrastructure-operator" --projectDir "E:\work\target-project"
```

## Prune old capture directories

```powershell
node scripts/run-skill.ts prune --projectDir "E:\work\target-project" --confirm true --keep 3
```

This keeps the newest 3 capture directories and removes older managed capture folders.

## Clean managed artifacts

```powershell
node scripts/run-skill.ts clean --projectDir "E:\work\target-project" --confirm true --scope all
```

Available scopes:
- `all`
- `captures`
- `runtime`

Set `--updateGitignore true` if you want the command to append `.playwright-capture/` and `capture/playwright/` to the project's `.gitignore`.

## Direct script entrypoints

The command router is optional. Each script can also run directly:

- `node scripts/ensure-playwright.ts --projectDir ...`
- `node scripts/capture-page.ts --url ... --projectDir ...`
- `node scripts/download-assets.ts --url ... --html ...`
- `node scripts/compare-local.ts --url ... --projectDir ...`
