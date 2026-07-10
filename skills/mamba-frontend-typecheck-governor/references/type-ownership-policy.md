# Type Ownership Policy

Use this policy when a project-mamba frontend type-check error needs an owner before any fix.

## Ownership Buckets

- `target-app`: Files under the requested app, for example `apps/hashrate/src/**`. Fix only if the code is active and the user has authorized implementation.
- `stale-target-app`: Files under the requested app that are not reached by imports, routes, or real component usage. Prefer report/delete decisions before type repair.
- `common-or-cross-app`: Files under `apps/common/src/**` or another app. Report separately unless the user explicitly expands scope.
- `generated-api`: Files under `packages/api/**`. Regenerate Swagger from the correct environment/module or report a generator/backend contract issue. Do not hand-edit.
- `request-public`: Files under `packages/request/**` or errors caused by the `@repo/request` public API. Report as public package contract/tooling work. Do not edit unless explicitly scoped by the owner.
- `dependency`: `node_modules` or external package types. Report separately and avoid local business-code workarounds unless the project already has a known pattern.
- `unknown`: Anything that cannot be confidently assigned. Read nearby imports, package scripts, generated types, and existing adapters before proposing a fix.

## Decision Rules

1. Fix app-owned active code first.
2. Delete or disconnect stale app-owned code only after user approval.
3. Regenerate generated API when the Swagger environment and target module are known.
4. Do not move a contract problem into app code by inventing fields, optional params, enum aliases, or broad casts.
5. Do not let a type-check run from one app force unrelated cross-app changes unless the user asked for repo-wide cleanup.

## Evidence To Collect

- File path and error code.
- Whether the file is imported by active app code.
- Whether the same component exists in `apps/common/src/components`.
- Whether the failing type is generated from `packages/api`.
- Whether the failing type touches `ApiRequestOptions`, request options, or request handler contracts.
- Whether the app branch and Swagger environment are aligned.
