# Fully Managed Delivery

Read this file completely when the user explicitly selects `FULLY_MANAGED`.

## Authorization Semantics

Treat `/onepro-devops --managed <goal>`, `全托管完成…`, or equally explicit wording as one goal-level authorization. It authorizes autonomous decisions only inside the persisted project, repositories, branches, paths, action scopes, and policy. It does not grant new RBAC, Access Key scopes, project membership, credentials, or Owner status.

Do not ask follow-up confirmation questions. Send concise progress updates, but continue working. End only at `COMPLETED` or a factual terminal blocker.

All managed evidence writes may contain Markdown. Send request bodies only through `onepro_devops.py --data -`, `--data-file`, or `--data-base64`. Never embed JSON or Markdown directly in a shell command: backticks and `$()` may execute before the helper starts. The helper rejects inline bodies and validates decoded UTF-8 JSON.

## Enable the Mode

1. Check the 24-hour Agent Docs cache and read the profile; refresh docs only when the cache is expired, explicitly requested, or invalidated by a contract error. Resolve the business object, project, code targets, and branch from facts.
2. For absent work, run intake preview. If allowed, unique, and deterministic, create the Requirement/Work Item/Run or Defect/Run without a second question. If project selection or duplicate identity is ambiguous, do not guess; persist a blocker when possible and stop.
3. Claim the Run and require `FIT`.
4. Call `POST /delivery-runs/{runId}/managed-mode-preview` with:

```json
{
  "goalMarkdown": "## 目标\n\n...",
  "actionScopes": ["BUSINESS_OBJECTS", "CODE", "TESTS", "BROWSER", "GIT", "DELIVERY"],
  "policyJson": "{\"maxReworkRounds\":3,\"preserveFailedEvidence\":true,\"blockOnScopeExpansion\":true,\"requireRealAcceptanceEvidence\":true}",
  "conversationRef": "current explicit managed goal"
}
```

Include `DEPLOYMENT` only when deployment is part of the goal or required repository delivery and the initial authorization covers the target environment. A managed grant does not bypass an independent platform preview gate.

5. If allowed, call `POST /delivery-runs/{runId}/managed-mode` with the same fields plus `expectedVersion` and `previewDigest`, using a stable `Idempotency-Key`.
6. GET the Run and verify `executionMode=FULLY_MANAGED`, `managedAuthorization.status=ACTIVE`, `interactionRequired=false`, and exact action scopes.

## Autonomous Loop

For every phase:

1. Read `next-action`; use `view=MINIMAL` or `changes?sinceVersion=` only when the action response or a concurrent writer requires it. Use COMPACT only for a human summary and FULL only for deliberate audit.
2. Perform only actions appropriate to the persisted phase.
3. Save Markdown artifacts, tests, Git evidence, failures, risks, and acceptance facts.
   - Preserve the exact body through stdin, a file, or base64; do not build shell-quoted inline JSON.
4. Prefer deterministic `action-bundle` when evidence, Test Session/Attempt, approvals, or a phase change belong to one external action. It must return one actionId and consume one Run version. Use `advance` only for a transition with no sibling evidence/test write.
5. Use separate preview/approval calls only for contract recovery or supervised diagnostics. If required, call `/approvals` with:
   - `decision=APPROVED`
   - `approvalSource=MANAGED_POLICY`
   - the latest `expectedVersion` and `gateDigest`
   - non-empty Markdown `feedback` explaining the evidence-based automatic decision
   - the managed-goal `conversationRef`
6. Pass Markdown transition reasons through `advance --reason-file <path>`; reserve `--reason` for short plain text without shell-significant content. Verify the compact atomic receipt returned by `advance`. Follow with `changes` only when another writer may have changed the Run.
7. Continue immediately without asking the user.

The Agent may choose implementation details, frontend `SELF`, test commands, repair strategy, acceptance automation, and state transitions when they stay inside the goal and persisted scopes. Prefer `SELF` when an exact frontend target is accessible; route to a frontend team only when the goal explicitly requires that handoff.

When managed browser verification needs a local full backend connected to shared data, apply the four-flag local safety gate from `SKILL.md` before launch. Managed authorization does not authorize scheduled inspection, startup recovery, chat bots, notifications, releases, service actions, or other unrelated side effects. Verify the startup log is quiet before Chrome opens; stop and record a failed attempt if the guard is incomplete or a background action starts.

## Failures and Rework

- Preserve every failed execution.
- Diagnose and repair while a new evidence-backed path exists and the policy budget permits.
- For source-changing feedback or failed finalization, transition back to `SOLUTION_DESIGN`, revise evidence, record a fresh managed `START_DEVELOPMENT` decision, and enter `DEVELOPMENT` before editing.
- For test failure after handoff, save `TEST_FAILURE` and use `RETURNED_TO_DEVELOPMENT` before repair.
- Never mark manual or browser acceptance `PASS` without real execution evidence.

## Stop Conditions

Stop without asking a question when any condition is factual and cannot be resolved autonomously:

- no deterministic project, business object, repository, branch, or path;
- a duplicate cannot be proven identical or distinct;
- RBAC, Access Key scope, project membership, claim, credential, or Owner fact is missing;
- the next action expands beyond the managed goal or action scopes;
- tests repeatedly fail without a new repair path;
- acceptance depends on unavailable facts or a person outside the authorized project relationship;
- an external side effect lacks its required target or preview authorization.

Persist `BLOCKED` with a Markdown reason when the phase transition allows it. Otherwise leave the Run at the last truthful phase, save the blocker evidence, and report the exact terminal condition.

## Revocation

An authorization may be revoked by its authorizer or target-project Owner through `/managed-mode/revoke`. After revocation, verify `executionMode=SUPERVISED` and `interactionRequired=true`. Preserve all prior `MANAGED_POLICY` decisions and transitions; never rewrite history.
