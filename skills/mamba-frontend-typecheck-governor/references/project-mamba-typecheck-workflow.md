# Project-Mamba Typecheck Workflow

This is the compact runbook for project-mamba frontend type-check cleanup.

## Preflight

Run from the project-mamba root:

```bash
git branch --show-current
git status --short
```

Identify:

- target app path, such as `apps/hashrate`
- package script to run, such as `type-check` or `tsc`
- Swagger environment, only if the user explicitly specified or the task already established it
- generated API module path, only if needed and known

## Swagger Gate

The repo exposes Swagger generation through the root `swagger` script, typically:

```bash
pnpm swagger -- dev
pnpm swagger -- test
```

Some repo versions require a target module/path unless `--all` is used. Inspect `package.json`, `scripts/swagger/**`, and existing generated module names before running a targeted sync.

Rules:

- Do not run Swagger sync with a guessed `dev` or `test` environment.
- Do not hand-edit `packages/api`.
- If only generated API files fail after sync, report a generator/backend contract issue.
- If the user asked to "update related hashrate Swagger first", perform this gate before type-check once the environment/module is known.

## Dead Component Gate

Before fixing TypeScript in component files:

```bash
node <skill>/scripts/find-dead-components.mjs --app apps/hashrate
```

Review candidates:

- no inbound imports or template references
- only barrel exports or install registration
- duplicate local component when `apps/common/src/components` has the corresponding component
- route files that are not actual components should not be deleted by this script alone

If a component is stale, ask for or use existing user approval to delete it before TS repair.

## Type-Check Classification

Run with either a command:

```bash
node <skill>/scripts/run-typecheck-and-classify.mjs --app apps/hashrate --command "pnpm --filter hashrate type-check"
```

Or classify an existing log:

```bash
node <skill>/scripts/run-typecheck-and-classify.mjs --app apps/hashrate --log .tmp/hashrate-typecheck.log
```

Use the output as the work queue:

- `target-app`: can fix if active and in scope
- `generated-api`: regenerate/report, do not edit
- `request-public`: report, do not edit `@repo/request`
- `common-or-cross-app`: report unless in scope
- `dependency` or `unknown`: investigate before changing app code

## Validation

After approved changes:

```bash
node <skill>/scripts/run-typecheck-and-classify.mjs --app apps/hashrate --command "pnpm --filter hashrate type-check"
git diff --check
```

Do not run `pnpm build`, `vite build`, or app build scripts unless explicitly requested.
