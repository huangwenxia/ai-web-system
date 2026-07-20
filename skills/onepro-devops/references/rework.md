# Rework Classification

Read this file after a post-development Bug or failed test requires code changes. A user-requested
branch correction is handled by the context-change rule below before choosing a rework type.

## BRANCH_CONTEXT_CHANGE (not rework)

When only the selected branch changes while the approved project, repository, local path, allowed
paths, work scopes, solution, permissions, data meaning, acceptance scope, and business behavior all
stay unchanged, treat it as an execution-context correction rather than `PATCH_REWORK` or
`SCOPE_REWORK`.

1. Verify the requested branch from Git/DevOps facts and replace the code target with the latest Run version.
2. Preserve the current Delivery phase. Do not record `CHANGES_REQUESTED`, do not transition to
   `SOLUTION_DESIGN`, and do not create a Workflow Incident.
3. Read `next-action` again and continue from the persisted phase.
4. Preserve the historical `START_DEVELOPMENT.validAtDecision` fact. Its `reusableNow` may become false
   because the branch-bound digest changed, but that is not a rollback trigger after the Run has entered
   `DEVELOPMENT`. Commit evidence, test evidence, and downstream approvals must still match the final
   branch; refresh them when they already exist.

Use `SCOPE_REWORK` only when the branch request also changes the approved repository/path/work scope,
solution, permission, data meaning, frontend ownership, acceptance scope, or business behavior.

## PATCH_REWORK

Use only when all facts stay inside the last approved requirement, solution, repositories, paths,
permissions, data contract, and acceptance scope. A branch-only correction is not rework.

1. Preserve `TEST_FAILURE` and failed test executions.
2. Transition `TESTING -> RETURNED_TO_DEVELOPMENT` with `reworkType=PATCH_REWORK`.
3. Transition to `DEVELOPMENT`, repair, prepare updated tests, then enter `SELF_TEST` before final execution.
4. Refresh Git evidence and downstream approvals.

Do not create a child task for a small in-scope patch.

## SCOPE_REWORK

Use when the repair changes solution, permissions, schema/data meaning, repository/path/work scope,
frontend ownership, acceptance scope, or business behavior. A branch-only correction is excluded.

1. Preserve failure evidence.
2. Transition with `reworkType=SCOPE_REWORK`.
3. Enter `SOLUTION_DESIGN`, revise impact/solution/test/acceptance evidence, and obtain a fresh `START_DEVELOPMENT` decision.
4. Enter `DEVELOPMENT` before source changes.

Create a linked Defect and separate Run only when the Bug needs independent scheduling, owner, SLA, release batch, or lies outside the approved work item. Never create an orphan task.
