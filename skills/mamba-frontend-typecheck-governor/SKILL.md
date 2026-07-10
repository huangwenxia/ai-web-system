---
name: mamba-frontend-typecheck-governor
description: Project-mamba frontend TypeScript type-check governance and cleanup workflow. Use when Codex needs to run, analyze, or fix type-check issues for apps/hashrate or other project-mamba Vue apps; classify TypeScript errors by ownership; check branch, swagger/generated API freshness, and stale/unreached components before repairs; avoid business logic changes, guessed API parameters, @repo/request edits, and generated packages/api edits; organize app-local types into component types.ts or apiBridge.ts instead of piling casts into primary pages.
---

# Mamba Frontend Typecheck Governor

## Overview

Use this skill to turn project-mamba frontend type-check work into a governed diagnosis, not a patch scramble. Always preserve business behavior, keep public/generated contracts separate from app code, and prove whether an error belongs to the target app before fixing it.

## Hard Boundaries

- Do not change business logic to satisfy TypeScript.
- Do not guess API parameters, response shapes, enum values, or compatibility aliases.
- Do not edit `@repo/request` or generated `packages/api` files.
- Do not add `@ts-ignore`, broad `any`, catch-all response probing, or hidden fallback parsing.
- Do not run build commands unless the user explicitly asks. Type-check, lint, scripts, and `git diff --check` are allowed.

## Workflow

1. Run the branch and Swagger gate.
   - Identify the current branch and dirty files with `git branch --show-current` and `git status --short`.
   - Identify the target app, such as `apps/hashrate`, from the user request or local code context.
   - Check whether the user explicitly requested Swagger sync and which environment (`dev` or `test`) is valid. Never choose the environment by guessing.
   - If a type error is in generated API code, regenerate the relevant Swagger target after the environment/module is known; never hand-edit generated files.

2. Run stale component and reachability checks before type-check repair.
   - Check target app components for real imports, route exposure, barrel exports, install registration, and duplicate common components.
   - If a component is unreached or only registered through a barrel/global install path, report it as a deletion/reconnection decision before spending time on TS repair.
   - Prefer deleting stale app-local components when the user approves, especially when `@common/components` already has the corresponding component.

3. Run or parse type-check and classify errors by owner.
   - Use the app's existing script (`type-check`, `tsc`, or the closest local command).
   - Group errors into target app code, cross-app/common code, generated API contract, public request package, dependencies, and other.
   - Fix only active code owned by the requested app unless the user expands scope.

4. Propose or apply fixes only after ownership is clear.
   - App-owned active component/page errors may be fixed.
   - Cross-app/common errors should be reported separately unless they are explicitly in scope.
   - Generated API and `@repo/request` errors are contract/tooling issues; report them or regenerate contracts, but do not patch those files.
   - If the user asked for "analyze first", stop after classification and plan.

5. Validate and report.
   - Re-run the same classification after changes.
   - Run `git diff --check`.
   - Report remaining errors by owner and explicitly name out-of-scope contract/public-package issues.

## Resource Guide

- Read `references/project-mamba-typecheck-workflow.md` when you need command details, Swagger sequencing, or a compact runbook.
- Read `references/type-ownership-policy.md` when classification or "who owns this error" is unclear.
- Read `references/api-bridge-policy.md` before introducing app-local bridge types, casts, or adapters.
- Run `scripts/find-dead-components.mjs --app apps/hashrate` before type repair for hashrate or replace the app path for another app.
- Run `scripts/run-typecheck-and-classify.mjs --app apps/hashrate --command "pnpm --filter hashrate type-check"` or pass `--log <file>` to classify an existing log.

## Fix Organization

- Keep component-private types in the component file only when they are truly private and small.
- Move types shared inside one component capsule to a sibling `types.ts`.
- Put endpoint-specific generated-contract gaps in a module-local `apiBridge.ts`.
- Put app-wide generated-contract bridge types in an app-local utility bridge only when more than one module needs them.
- Keep bridge files narrow, named after the API/contract they bridge, and delete them when generated contracts catch up.

## Common Lessons From Hashrate

- `ApiRequestOptions` errors inside `packages/api` are generator/public contract issues, not hashrate component issues.
- Dynamic API access such as `Api[cloudType]...` should become a narrow app bridge only if the code is active and the contract is proven.
- Components like `InstanceCloudPage`, `PriceBox`, `BatchExtAlert`, `IconDeploy`, or local `UserAvatar` must first be checked for real reachability; stale code should not receive cosmetic TS fixes.
- A local component duplicated by `@common/components` should be removed or replaced only after verifying actual imports and user approval.

## Final Response Shape

Report in this order: branch/swagger status, stale component decisions, type-check counts by owner, app-owned fixes or proposed fixes, remaining out-of-scope issues, validation commands. Keep the distinction between "fixed", "reported", and "requires user/backend/generator decision" explicit.
