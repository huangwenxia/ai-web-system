# Delivery Evidence Contract

Use this reference to structure evidence and dialogue. Check the 24-hour Agent Docs cache before each task; refresh only when it is expired, explicitly requested, or invalidated by a contract error.

## Checkpoint Conversation

| Checkpoint | Show before asking | Approved next action |
| --- | --- | --- |
| `INTAKE_CREATE` | requirement/defect intake preview, duplicates, project, owner | create and assign the business object with its Delivery Run |
| `START_DEVELOPMENT` | fit, frontend ownership, code targets, detailed plan, tests, acceptance draft | approve and enter development |
| `FINALIZE_EVIDENCE` | implementation, full commit IDs, executed tests, browser proposal, risks | approve finalization work |
| `TRANSITION_READY_FOR_TEST` | deviations, final commit IDs, final acceptance, test evidence, risks | approve and hand off to testing |

At each prompt, offer exactly two paths: reply `可以`, or describe changes. A new request to modify content is not approval.

This prompt rule applies only to `SUPERVISED`. In explicitly authorized `FULLY_MANAGED`, do not prompt. Each checkpoint still needs an `APPROVED` row bound to the latest digest, but its source must be `MANAGED_POLICY`, its Markdown feedback must explain the evidence-based decision, and an active goal-level authorization must include `DELIVERY`.

`START_DEVELOPMENT` approval authorizes the transition, not immediate source edits. Persist `DEVELOPMENT`, then GET the Run and target and verify the mapped status before writing source. After implementation and test cases are prepared, persist `SELF_TEST` before executing final tests.

Requirement intake must return and verify three persisted objects in one transaction: the Requirement, an initial Backlog Work Item linked by `requirementId`, and a `WORK_ITEM` Delivery Run targeting that Work Item. Existing Requirements also need an exact child Work Item before Run creation. A `REQUIREMENT` target is not a coding delivery target.

When `FINALIZE_EVIDENCE` receives source-changing feedback, persist `CHANGES_REQUESTED`, transition back to `SOLUTION_DESIGN`, revise evidence, and obtain a new `START_DEVELOPMENT` approval before any additional source write.

## Defect Intake Minimums

Use defect intake only after querying DevOps and confirming that the Bug is absent. The preview request needs:

```text
title description affectedUsers reproductionSteps actualResult expectedResult
impactScope environment constraints requiredRoleCodes
```

Send known `devProjectId`, `gitProjectId`, `requirementId`, `workItemId`, and `codeTargets`; do not invent them. Project resolution follows deterministic facts only: explicit project, related requirement/work item, code target, Git linkage, or one sole responsible project. When the server returns more than one candidate or none, ask the user to select/input the project and preview again.

Duplicate candidates block creation. Continue with an existing defect only after the human identifies it as the same Bug. A successful defect intake must return the new defect and a `DEFECT` Delivery Run in the same command; all later evidence and code work use that run.

## Structured Artifact Minimums

- `INTAKE_ANALYSIS`: `background`, `targetUsers`, `currentProblem`, `expectedResult`, `unexpectedResult`, `scope`, `constraints`.
- `IMPACT_ANALYSIS`: `frontend`, `backend`, `permissions`, `stateFlow`, `regression`, `browserVisible`, `testChanges`.
- `FRONTEND_DECISION`: `frontendRequired`, `deliveryMode`, `reason`, `scope`; `FRONTEND_TEAM` also contains `routedToRole=DEV_FRONTEND` and must come from the routing endpoint.
- `SOLUTION_PLAN`: `understanding`, `technicalSolution`, `plannedChanges`, `risks`, `regression`.
- `TEST_PLAN`: `normal`, `exception`, `boundary`, `permission`, `state`, `data`, `regression`.
- `IMPLEMENTATION_LOG`: `implementation`, `actualChanges`, `testChanges`, `testCommands`, `testResults`.
- `GIT_COMMIT_EVIDENCE`: top-level `verification` plus `commits[]`; every approved code target needs at least one matching full commit SHA.
- `DEVIATION_LOG`: `comparisonSummary`, `deviationConclusion`.
- `UNCOVERED_RISK`: `summary`; use an explicit no-known-risk statement when appropriate.
- `TEST_FAILURE`: `failedStage`, `reason`, `nextAction`.
- `ACCEPTANCE_RESULT`: `summary`, `testerConclusion`.
- `FINAL_CONCLUSION`: exact positive conclusion, or exact negative conclusion plus `reason`.

Git commit evidence uses a full snapshot, not a patch:

```json
{
  "verification": "git rev-parse HEAD && git log -1 --format=%s && git log -1 --format=%B",
  "commits": [
    {
      "gitProjectId": 20,
      "branchName": "devops",
      "commitId": "0123456789abcdef0123456789abcdef01234567",
      "subject": "fix(dev-collab): [BUG-88] bind missing defects to delivery runs",
      "message": "fix(dev-collab): [BUG-88] bind missing defects to delivery runs\n\n## 变更\n- 缺陷与 Delivery Run 原子关联\n\n## 验证\n- `mvn test`"
    }
  ]
}
```

Use only 40-character SHA-1 or 64-character SHA-256 IDs. Branch and Git project must exactly match a Delivery Run code target. Every actual commit subject must contain the target object's real DevOps code (`REQ-*`, `WI-*`, `BUG-*`) or the explicit typed fallback (`REQUIREMENT#id`, `WORK_ITEM#id`, `DEFECT#id`). Every full commit message must preserve that subject, a blank line, and a non-empty Markdown body. This makes Git searchable from DevOps and DevOps traceable from Git. A new commit invalidates current reuse of the previous approval, but never changes whether that approval was legal at decision time; UI/API must expose `validAtDecision` separately from `reusableNow`.

Code targets describe actual work with `workScopes` (`BACKEND`, `FRONTEND`, `TEST`, `DOCS`, `DEVOPS`) and matching scoped path lists. `targetRole` is advisory compatibility metadata only. One repository/branch target may cover full-stack and test work; never create duplicate targets for the same branch.

Frontend delivery modes:

```text
NOT_REQUIRED  no frontend target; record why
SELF          workScopes includes FRONTEND with non-empty frontendPathScopes; direction tags are advisory
FRONTEND_TEAM human confirms route-to-frontend; current Agent stops after persisted handoff
```

Split independent backend and frontend work into separate work items and Delivery Runs before routing. A routed run must contain only the frontend workstream and must not overwrite pending backend targets.

Browser acceptance draft and final use `criteria[]`. Every item needs:

```json
{
  "item": "",
  "role": "",
  "entry": "",
  "preconditions": "",
  "steps": "",
  "input": "",
  "expected": ""
}
```

## Test Matrix

Read the server-provided riskProfile before preparing the matrix. All seven categories remain present for audit comparability, but only recommended/actually applicable categories require execution. Use NOT_APPLICABLE with a concrete reason instead of manufacturing commands or result rows. One physical command remains one Session regardless of how many scenarios it covers.

Include one unique case for each category:

```text
NORMAL EXCEPTION BOUNDARY PERMISSION STATE DATA REGRESSION
```

Every case needs a title, input/action, expected result, risk level, applicability, and coverage type. `REQUIRED` automated cases need a runnable command; `REQUIRED` manual cases need executable steps. `NOT_APPLICABLE` needs a concrete reason and no execution. Existing execution evidence locks the matrix. Group executions by physical Test Session and Attempt: one command/browser run is one Session, repair retries are new Attempts, and `TEST_FAILURE` must cite the failed Session/Attempt rather than duplicate its facts.

## Acceptance Table

Present final browser criteria as:

| 验收项 | 使用角色 | 页面/入口 | 前置条件 | 操作步骤 | 输入数据 | 预期结果 |
| --- | --- | --- | --- | --- | --- | --- |

## Participation Boundary

```text
Claim owner: ANALYSIS -> SOLUTION_DESIGN -> DEVELOPMENT -> SELF_TEST -> READY_FOR_TEST
Rework: SELF_TEST + FINALIZE CHANGES_REQUESTED -> SOLUTION_DESIGN -> fresh START approval -> DEVELOPMENT
Claimant or target-project participant: READY_FOR_TEST -> TESTING -> ACCEPTED or RETURNED_TO_DEVELOPMENT
Target-project Owner: ACCEPTED -> COMPLETED
```

`DEV_FRONTEND`, `DEV_BACKEND`, `DEV_UI_DESIGNER`, `DEV_ARCHITECT`, `DEV_TESTER`, and `DEV_PROJECT_DIRECTOR` are advisory direction tags only. They never grant or deny implementation, test, acceptance, or completion. Use the Run's `canTest` and `canComplete` results; preserve RBAC, Access Key scopes, project boundaries, claims, evidence, and human approvals.

## Managed Authorization Evidence

Managed authorization is not an Artifact. It is a dedicated Run-level authorization containing:

```text
goalMarkdown actionScopes policyJson policyDigest status
authorizedBy authorizationSource conversationRef authorizedAt expiresAt
revokedBy revokeReason revokedAt
```

`FULLY_MANAGED` is valid only when the Run exposes an `ACTIVE` authorization. `MANAGED_POLICY` approvals never count without that authorization and a matching action scope. Revocation changes future interaction back to supervised but never deletes prior decisions.
