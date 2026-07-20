---
name: onepro-devops
description: Run OnePro DevOps requirement, defect, implementation, testing, acceptance, deployment, and audited rework in supervised or explicitly fully managed mode.
---

# OnePro DevOps Delivery

One-Agent is the source of truth for the Requirement → Work Item/Defect → Delivery Run → Git/Test/Acceptance graph. Code changes are permitted only inside the claimed Run's exact repository, branch, path, and work scopes.

## Bootstrap

1. Run python3 scripts/onepro_devops.py docs. Use the fresh 24-hour cache; refresh only when expired, explicitly requested, or invalidated by a contract error. Inspect only changed documents.
2. Read repository AGENTS.md and task-relevant files.
3. Read credentials from ONEPRO_DEVOPS_KEY; accept historical ONEPRO-DEVOPS-KEY only through printenv. Never print credentials.
4. Use run with MINIMAL, then next-action, changes, compact receipts, and paged history. Use FULL or --raw only for deliberate audit.
5. Use the helper for exact transactions. Send bodies only through stdin, --data-file, or base64; never inline JSON/Markdown in shell commands.

The helper treats ApiResponse.code != 0 as failure. One external business action consumes one Run version. Prefer:

    next-action → step --bundle-file → compact atomic receipt

step obtains the live input Schema, validates prepared facts locally, fills the expected version/action, and submits one action bundle. It must never invent evidence. Record actual runtime Token usage with cost-record; unknown Token values stay absent and are never estimated.

## Mode

- Default is SUPERVISED.
- Use FULLY_MANAGED only when the user explicitly requests managed/full-auto delivery. The goal is one authorization inside persisted scopes; it removes repeated questions, not evidence or gates.
- For managed work, read [references/managed-mode.md](references/managed-mode.md) completely and continue until COMPLETED or a factual terminal blocker.
- For evidence, tests, commits, and acceptance, read [references/evidence-contract.md](references/evidence-contract.md).
- For rework, read [references/rework.md](references/rework.md).
- For low-cost routing or subagents, read [references/model-routing.md](references/model-routing.md) and [references/clerk-contract.md](references/clerk-contract.md). Use deterministic scripts first and at most one reusable Clerk per Run.

## Resolve the Business Graph

- New requirements use intake preview and atomically create Requirement + child Work Item + WORK_ITEM Run.
- New defects use defect preview and atomically create Defect + DEFECT Run. Never backfill after coding.
- Duplicate or ambiguous project/target/repository/branch facts are blockers; never select by title similarity.
- Coding never targets a Requirement directly.
- Verify the target graph after intake and phase changes.

## Claim and Scope

1. Read /me/developer-profile.
2. Resolve project, Git project, branch ID/name, checkout, path scopes, and work scopes from API/database facts.
3. Claim with a stable agentRunId and idempotency key.
4. Require FIT; satisfy a CONDITIONAL result without broadening scope.
5. Verify the local branch and cleanly preserve unrelated user changes.

A user-requested branch correction inside the same repository, local path, allowed paths, work scopes,
solution, and acceptance scope is `BRANCH_CONTEXT_CHANGE`, not rework. Replace the code target, keep
the persisted phase, re-read `next-action`, and refresh only branch-bound downstream evidence. Never
record `CHANGES_REQUESTED`, roll back to `SOLUTION_DESIGN`, or create a Workflow Incident for this case.

Engineering direction roles are advisory. Project membership/ownership, claim, repository/branch/path, RBAC, evidence, and approvals are hard facts.

## Phase Contract

The persisted phase is a prerequisite for the next real action:

1. ANALYSIS: persist intake/impact evidence.
2. SOLUTION_DESIGN: persist frontend decision, solution, test plan, and browser draft.
3. Enter DEVELOPMENT before task source writes.
4. Prepare implementation log and seven-category coverage once; keep all categories, using risk-profile recommendations and concrete NOT_APPLICABLE reasons.
5. Enter SELF_TEST before final commands/browser runs.
6. Record one physical command/browser run as one Test Session; retries are Attempts. Preserve failures.
7. Commit with the real target code, Markdown body, exact full SHA, branch, subject, and message.
8. Freeze final evidence before READY_FOR_TEST.
9. Real acceptance precedes ACCEPTED; target-project Owner is required for COMPLETED.

Frontend decision must be NOT_REQUIRED, SELF, or FRONTEND_TEAM. SELF requires a frontend work scope/path. A routed frontend Run is handed off and the current coding flow stops.

Every transition must atomically synchronize the target and Requirement rollup. Trust a verified atomic receipt; do not use direct status edits as shortcuts.

## Evidence and Cost Discipline

- Main model owns requirement meaning, architecture, implementation, test strategy, rework classification, acceptance, and final truth.
- Deterministic scripts own IDs, schemas, versions, idempotency, request serialization, receipts, compact reads, and transaction retries.
- Return only deltas, blockers, IDs, digests, and compact receipts to model context.
- Do not repeat unchanged Requirement/Run/artifact history.
- Token events distinguish MAINLINE from ORCHESTRATION; record only runtime-reported input/cached/output values.
- Heatmap engineering activity is separate from collaboration and workflow audit; workflow automation must not be presented as personal engineering output.

## Browser and Deployment Safety

Do not start a local full backend unless browser verification is necessary. When it connects to shared data, start with all four flags:

    --one-agent.scheduling.enabled=false
    --one-agent.runtime.recover-interrupted-tasks=false
    --one-agent.dev-collab.feishu-bot.enabled=false
    --one-agent.notification.feishu.enabled=false

Stop immediately if background actions start. Managed authorization never bypasses independent deployment previews, credentials, environment scope, or production safety gates.

## Stop Conditions

Stop at the last truthful phase when project/target/repository/branch/path is ambiguous, permissions or ownership are missing, scope expansion is required, real evidence is unavailable, tests repeatedly fail without a repair path, or deployment lacks an authorized target. Persist a blocker when possible; never fabricate evidence or status.
