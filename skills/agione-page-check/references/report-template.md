# Page Check Report Template

Use this template for Deep checks or Standard checks with multiple findings. Remove sections that do not apply, but do not hide untested coverage.

```text
Checked with:
- Depth: smoke | standard | deep
- Frontend: localhost:8000 / apps/all (or explicit app)
- Backend shost: ...
- Role / tenant: ...
- Final URL: ...
- Page marker: ...

Verdict: PASS | PARTIAL | FAIL | BLOCKED

Gate results:
- Environment and identity: PASS/FAIL - evidence
- Route and access: PASS/FAIL - evidence
- Runtime and network: PASS/FAIL - evidence
- Data contract: PASS/FAIL/NOT APPLICABLE - evidence
- Workflow, role, and state: PASS/FAIL/NOT APPLICABLE - evidence
- Visual, i18n, and extreme data: PASS/FAIL/NOT APPLICABLE - evidence
- Evidence restoration: PASS/FAIL - mock/interception status

Findings:
- P0/P1/P2 - concise issue, user impact, and evidence

Evidence:
- Request/status or response fields
- DOM marker/computed values
- Screenshot paths or emitted images

Coverage gaps / uncertainty:
- Untested roles, states, viewports, locales, or workflows
- Environment or browser-state limitations
- Whether database evidence was used and from which environment
```

## Verdict Rules

- `PASS`: all requested/applicable gates passed and temporary mocks/intercepts were removed.
- `PARTIAL`: tested coverage passed, but meaningful requested coverage remains untested.
- `FAIL`: one or more requested/applicable gates failed with reproducible evidence.
- `BLOCKED`: the requested page/state cannot be reached because of an external prerequisite, and safe diagnostics are exhausted.

Do not use `PASS` for a Smoke check to imply full workflow, data-contract, or visual acceptance. State "Smoke PASS" explicitly.
