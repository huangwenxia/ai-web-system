# Clerk Contract

Read this file before delegating OnePro DevOps transactions to `onepro_devops_clerk`.

## Session Contract

- Key one Clerk session by `deliveryRunId` and reuse it until `COMPLETED` or factual `BLOCKED`.
- Give it only the current Run ID, intended deterministic operation, main-Agent decision, and relevant prepared structured JSON.
- Require every response to contain `operation`, `runId`, `versionBefore`, `versionAfter`, `persistedPhase`, `targetStatus`, `receiptVerified`, and `errors`.
- Reject a success response without an atomic Transition receipt or an exact API object ID.

## Allowed Operations

- `run`, `gate-context`, `changes`, and paged `history` reads;
- safe writes of main-Agent-prepared structured evidence;
- checkpoint/transition preview;
- managed approval after the main Agent supplies its evidence-based decision;
- transition execution and `verify-receipt`;
- version-conflict refresh and one deterministic retry with the same command idempotency key.

## Forbidden Operations

- write or review source code;
- invent Markdown facts, tests, commits, acceptance results, IDs, or status;
- choose project, scope, solution, implementation, test strategy, rework type, or acceptance conclusion;
- change the main Agent model, create nested Clerks, or broaden permissions.

## Compact Commands

```bash
python3 scripts/onepro_devops.py run RUN_ID
python3 scripts/onepro_devops.py gate-context RUN_ID
python3 scripts/onepro_devops.py changes RUN_ID SINCE_VERSION
python3 scripts/onepro_devops.py history RUN_ID artifacts --page 1 --page-size 20
python3 scripts/onepro_devops.py clerk-context RUN_ID --since-version VERSION
python3 scripts/onepro_devops.py verify-receipt < transition-response.json
```

Use `run --view FULL` only for a deliberate audit. Normal workflow must use compact, gate context, changes, and paged history.
