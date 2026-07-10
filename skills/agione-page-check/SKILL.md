---
name: agione-page-check
description: Browser-based acceptance checking for AGIOne frontend pages. Verify the real frontend app, backend shost, login role, route and permission chain, runtime requests, page data contract, workflow states, i18n, visual integrity, extreme-data behavior, and reproducible evidence. Use for requests such as "check a page", "用浏览器看页面", "自测 localhost:8000", page acceptance, UI bug reproduction, light/dark or hover checks, untranslated text, overflow, role validation, 404/permission diagnosis, and operator/provider/enduser/admin checks on mtest or mdev.
---

# AGIOne Page Check

Use this skill to verify an AGIOne page as a real user would experience it. A page check is not only a screenshot review. It establishes that the agent tested the correct environment and identity, reached the intended route, observed real runtime behavior, checked applicable data and workflow semantics, and can support the verdict with browser evidence.

This skill is platform-neutral. Use the in-app Browser by default for localhost checks. Use Chrome only when the user explicitly needs an existing Chrome profile, login, or extension state. Other agents should use equivalent browser automation while following the same gates.

## Operating Principles

- Verify context before trusting any page content.
- Prefer observable browser, network, source, and data evidence over assumptions.
- Treat mock/intercepted responses as visual-state evidence only, never as backend truth.
- Keep diagnosis separate from implementation. Do not edit code for a review-only request.
- Check only applicable dimensions, but state clearly what was not exercised.
- A smoke check proves reachability, not full page correctness.

## Check Depth

Choose the lightest depth that satisfies the request. State the selected depth in the final report.

### Smoke

Use when the user asks whether a page opens, a route exists, or a recent change is reachable.

Required coverage:

- Environment and identity.
- Frontend app, route, and page marker.
- Blocking console or network errors.
- One screenshot or equivalent DOM evidence when useful.

### Standard (default)

Use for ordinary "check this page", browser self-test, or post-fix verification.

Required coverage:

- All seven acceptance gates below.
- Main happy-path workflow.
- Applicable loading, empty, disabled, locked, or error states.
- Applicable i18n, layout, and overflow checks.
- Real API verification for data that affects the verdict.

Read the applicable reference checklists before running the checks:

- Visual, i18n, responsive, or extreme-data work: `references/visual-qa-checklist.md`.
- Field semantics, totals, filters, or API/data mismatch: `references/data-contract-checklist.md`.
- Role, permission, form, dialog, batch action, or async state work: `references/workflow-state-checklist.md`.

### Deep

Use when the user asks for full acceptance, comprehensive testing, cross-role validation, or a field-level review.

In addition to Standard:

- Exercise all applicable roles and state branches.
- Trace important displayed fields through the generated API type and backend implementation.
- Use read-only database evidence only when API/source evidence cannot resolve a data contradiction.
- Use `references/report-template.md` and list coverage gaps explicitly.

## Defaults

- Frontend app: `project-mamba/apps/all` at `http://localhost:8000`.
- Backend target: infer from the task or ask when the result depends on it. Never trust the login page's current value without verification.
- "Default environment": interpret as `mtest`, state the assumption, and still verify the stored value.
- Role: use the role implied by the task. Ask only when role changes the result and cannot be inferred safely.
- Browser: in-app Browser for localhost; Chrome only for required existing Chrome state.

Common backend shost values:

| Target | Login `shost` |
| --- | --- |
| `mtest` | `mtest-gateway.opr` |
| `mdev` | `mdev-gateway.opr` |

Common quick-login users:

| Role | Button text / username |
| --- | --- |
| operator | `运营 operator` |
| admin | `管理员 admin` |
| provider | `创作者 provider_onepro` |
| end user / EU | `普通用户 enduser_onepro` |

## Acceptance Gates

### Gate 0 - Environment And Identity

The login page may default localhost to `mdev-gateway.opr`:

```js
shost: location.origin.includes("test") ? "mtest-gateway.opr" : "mdev-gateway.opr"
```

Quick login stores the selected backend as `Storage.serverUrl`, and later requests send it as the `shost` header. The authoritative browser value is the stored `SERVERURL`, not `ROOT_CONFIG.shost`:

```js
JSON.parse(localStorage.getItem("SERVERURL") || "{}").value
```

Before reading or trusting page data:

1. Confirm the requested backend, role, tenant context when relevant, target URL, and check depth.
2. Read `SERVERURL`, including when the page opens already authenticated.
3. Confirm the visible account/role. Do not treat menu labels such as `个人` as identity evidence.
4. If the backend or role is wrong, treat existing on-screen data as invalid evidence and re-login correctly.
5. If logout is not readily available, ask before clearing tokens or local storage.

Do not inspect cookies, passwords, browser profile data, or unrelated secrets. Visible text, DOM, computed styles, console output, and request metadata/status are acceptable.

### Gate 1 - Target, App, Route, And Access

- Confirm the exact URL or route.
- Prefer `apps/all` unless the task explicitly requires a single app or deployment/base-route/HMR behavior.
- Confirm the console shell is present before diagnosing a missing menu. A landing or chooser page is not the management console.
- Record the current URL after redirects and a stable page marker such as a heading, root selector, or expected action.
- For 404, "开发中", or missing-menu behavior, follow the route and permission diagnostics below.

### Gate 2 - Runtime And Network

- Check for blocking console errors, unhandled rejections, failed resources, and requests stuck pending.
- Inspect the request URL, method, parameters, status, and relevant response fields for data that affects the verdict.
- Check for duplicate requests, endless loading, stale SPA state, or a response that does not update the page.
- Reload after disabling temporary interception when real runtime truth matters.
- Do not call a mock screenshot proof of real backend behavior.

### Gate 3 - Data Contract And Semantics

- Verify that displayed fields represent the correct backend concepts, not merely values that render.
- Check time, status, cycle, amount sign, unit, ID-versus-name, and filter semantics.
- Compare overview, detail, chart, and table totals when they should reconcile.
- Distinguish `null`, blank, zero, and missing time buckets.
- If the page contradicts its API or business requirement, read `references/data-contract-checklist.md` and trace the real consumer path before proposing a frontend-only fix.

### Gate 4 - Workflow, Role, And State

- Exercise the main user command, not only initial rendering.
- Check applicable search, filter, reset, sort, pagination, copy, export, form, dialog, confirmation, cancel, and batch actions.
- Verify role and tenant boundaries for operator, admin, provider, and EU where relevant.
- Distinguish `checking`, `normal`, `empty`, `locked`, `forbidden`, `disabled`, and `error` states. Pending data must not reuse locked/error semantics.
- When shared hooks or components change, check all known consuming pages that can regress.
- Read `references/workflow-state-checklist.md` for Standard or Deep workflow checks.

### Gate 5 - Visual, I18n, And Extreme Data

- Check untranslated text, raw locale keys, mixed-language copy, internal terminology, and configured product/support values.
- Check overlap, clipping, horizontal overflow, unstable dimensions, and amount/unit wrapping.
- Exercise applicable long text, large values, zero/null values, and dense table content.
- Verify light/dark, hover, focus, selected, and disabled states when relevant.
- Use screenshots plus DOM/computed-style evidence for issues that cannot be judged reliably from one image.
- Read `references/visual-qa-checklist.md` before Standard or Deep visual acceptance.

### Gate 6 - Evidence And Restoration

- Record frontend app, backend shost, role/tenant context, final URL, page marker, and check depth.
- Record key request/status or computed-style evidence that supports the verdict.
- Save or emit screenshots for visual findings and important state branches.
- Mark all mock/intercepted evidence as mock.
- Remove temporary interception, restore the real page, and verify the final browser state before reporting completion.
- List anything not tested or uncertain.

## Route And Permission Diagnostics

When a target page shows 404, "开发中", redirects unexpectedly, or lacks a menu:

1. Confirm `SERVERURL`, backend target, role, tenant, and that the console shell is actually open.
2. Check menu and permission data before changing frontend route logic:
   - Confirm the target `frontAppId` and menu path.
   - Confirm the menu exists, is visible/enabled, and is bound to the expected permission.
   - Confirm the role/user is granted the required menu/permission.
3. If the error explicitly says `缺少应用[...]的权限[...]` or `You do not have permission for app [...]`, hand off to `$agione-permission-repair`.
4. For any permission data write, first confirm the environment and target user/role. A diagnosis-only page check must remain read-only.
5. After an authorized repair, clear only the required permission cache families, log out, quick-login again, and recheck.
6. Only after permission data is proven correct should you inspect frontend route whitelists, `router.beforeEach`, `handleMenuPermission`, route bases, or dynamic `addRoute` behavior.
7. Confirm the route exists in source and the running Vite app includes its route bundle.
8. Confirm the process when needed:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
ps -wwp <pid> -o pid,ppid,command
```

9. Restart the dev server or clear app-specific Vite cache only when source/app evidence points to a stale bundle.

## Backend Selection Rules

- Do not edit `.env` or `config.js` only to switch backend for a page check. Use the login `shost`.
- If already logged in to the wrong backend, use the visible logout path and quick-login again with the requested shost.
- Never assume localhost means mtest.
- Never use data seen under the wrong `SERVERURL` as evidence for the requested environment.

## Handoff And Mutation Rules

- Review or diagnosis request: report findings; do not modify code, permissions, data, or configuration.
- Fix-and-verify request: reproduce first, implement the scoped fix, then rerun the same failed gates.
- Permission/menu data issue: use `$agione-permission-repair` after confirming environment and user/role.
- Prototype-to-production fidelity issue: use `$agione-prototype-to-production`, then return here for runtime acceptance.
- API/data mismatch: trace the page consumer, generated API type, backend VO/service/mapper, and relevant data before masking the mismatch in frontend formatting.
- External or destructive data changes require explicit user authorization; page checking alone does not authorize them.

## Completion Criteria

Do not report a Standard or Deep page check as passed unless:

- Environment and identity were verified before trusting data.
- The requested route and stable page marker were reached.
- Relevant runtime requests completed without unexplained blocking errors.
- Applicable workflow, state, data-contract, visual, and i18n checks were exercised.
- Mock/interception state was removed or clearly left as an explicit limitation.
- Evidence and untested areas are reported.

Use `references/report-template.md` for multi-finding or Deep reports. Keep simple Smoke reports concise.

If the user asked only for diagnosis, stop after the evidence-backed report. If the user asked to fix and verify, finish only after the implementation and the relevant browser checks both pass.
