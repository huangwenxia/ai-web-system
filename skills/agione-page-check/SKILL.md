---
name: agione-page-check
description: Check, review, or self-test AGIOne frontend pages through a browser with the correct localhost app, backend shost, quick-login role, route, DOM/style evidence, screenshots, and network/runtime sanity checks. Use when the user asks to "check a page", "用浏览器看页面", "自测 localhost:8000", verify light/dark or hover states, inspect computed styles, reproduce UI bugs, or validate AGIOne pages as operator/provider/enduser/admin on mtest or mdev.
---

# AGIOne Page Check

Use this skill to verify AGIOne frontend pages in the browser without accidentally testing the wrong backend, wrong account, wrong app, or stale route bundle.

This skill is intentionally platform-neutral. Codex should use the in-app Browser or Chrome browser skills available in the current session. Claude or another agent should use its equivalent browser automation while following the same checks.

## Visual Review Mode

- When the user asks to confirm visual quality, for example “视觉效果怎么样”, “帮我看下页面”, “页面好不好看”, “哪里不舒服”, “UI 审查”, or “视觉审查”, first collect the browser evidence needed by this skill, then read and follow `../page-review-skill/docs/agione-visual-review-protocol.md`.
- In this mode, default to review-only: do not change code, do not edit HTML, and do not add/remove page structure unless the user explicitly asks to modify after the review.
- Use screenshots, visible DOM, computed styles, theme state, final URL, role, and backend shost as evidence for the protocol. Do not replace the full protocol with a brief visual impression.
- Judge the page from the current target user's first visit: identify the role, page task, first-screen object/scope, key state/result/context, next focus/action, and expected action result.
- Check visible text for unrelated internal evidence such as `Api.general.xxx`, `result.total`, `hasXxx`, `currentStep`, `AI-NOTES`, `data-source`, `mock`, frontend routes, source API client names, state expressions, or prototype-note labels like “数据来源 / 状态判断来源 / 根据规则推导”. Developer/API/debug/log pages may show task-relevant technical material, but not frontend source client names or AI/prototype notes; sensitive values must be masked.

## Defaults

- Default frontend app: `project-mamba/apps/all` at `http://localhost:8000`.
- Default backend target: ask or infer from the user; do not assume the login page's current `shost` is correct.
- Default role: use the role implied by the task; ask only if the page behavior depends on role and the user did not say one.
- Default browser: use the in-app browser for local page checks. Use Chrome only when the user explicitly needs an existing Chrome login/profile state.

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

## Critical Pitfall

`apps/all/public/config.js` may default `ROOT_CONFIG.shost` to `mdev-gateway.opr` on `localhost`:

```js
shost: location.origin.includes("test") ? "mtest-gateway.opr" : "mdev-gateway.opr"
```

The login page is flexible by design: the `shost` field chooses the backend. Quick login stores that value as `Storage.serverUrl`, and later requests send it as the `shost` header. Therefore:

- Always inspect the login page `shost` before quick login.
- If the user wants `mtest`, set `shost` to `mtest-gateway.opr` before clicking the account.
- If the user wants `mdev`, set `shost` to `mdev-gateway.opr` before clicking the account.
- If the page looks wrong, first suspect stale `serverUrl`/wrong `shost`, not only route code.

Do not inspect cookies, passwords, or browser profile data. Reading visible page text, DOM, computed styles, console logs, and network status is fine.

## Workflow

1. Confirm the target:
   - URL or route to verify.
   - Backend target (`mtest`, `mdev`, or explicit shost).
   - Role (`operator`, `admin`, `provider`, `enduser`) when role matters.
   - Required checks: visual, light/dark, hover, computed style, network, screenshot, form workflow, etc.

2. Confirm the frontend app:
   - Prefer `http://localhost:8000` / `apps/all` unless the user explicitly asks for a single app.
   - Use a single app dev server only when validating app-specific deployment/base-route/HMR behavior or when `all` cannot reproduce a single-app bug.
   - If a route is unexpectedly 404, verify which app is running and whether its route bundle includes the page.

3. Open or claim the browser page:
   - Keep the browser visible when the user wants to watch.
   - Prefer claiming an existing relevant tab if present.
   - Otherwise open the requested localhost URL directly.

4. If redirected to login, use quick login correctly:
   - Select the quick-login tab if needed.
   - Read the `shost` input.
   - Set it to the requested backend shost.
   - Click the requested role's quick-login button.
   - Wait for redirect completion.

5. Verify identity and environment from visible signals:
   - Check the current URL.
   - Check visible user/role text such as `Operator`.
   - Do not treat left-side menu group labels like `个人` as account identity.
   - If possible, verify the page reflects the requested environment by menu/routes/data freshness.

6. Navigate to the target route:
   - Use the exact URL provided by the user.
   - If the page redirects or becomes 404, collect the visible page text and current URL.
   - If the page exists, record a stable page marker such as a unique heading, route-specific class, or expected button text.

7. Run the requested checks:
   - Visual checks: take screenshots when the user asks or when the issue is visual.
   - DOM checks: use selectors for page roots, target buttons, dialogs, tables, or chips.
   - Visible-text checks: collect headings, labels, helper text, buttons, table headers, status chips, empty/error text, and obvious code-like/internal evidence before judging visual quality.
   - Style checks: read `getComputedStyle` for exact colors, z-index, layout, disabled state, hover state, dark-mode tokens, and transition properties.
   - Hover checks: move the mouse or trigger the state, then compare computed values before/after hover.
   - Light/dark checks: switch theme through visible UI when possible; after switching, re-read DOM and computed style.
   - Network checks: inspect request URLs/statuses only as needed; do not rely on memory.

8. Report with evidence:
   - Environment/shost used.
   - Role used.
   - Final URL.
   - Whether the expected page root or marker exists.
   - Target-user 5-second self-check: whether the page purpose, current state, next focus/action, and action result are understandable from the first screen.
   - Whether visible internal evidence was present, and where.
   - Key computed values or observed network responses.
   - Screenshots saved or emitted, if any.
   - Any uncertainty, especially if browser state or route bundle differs from the user's visible page.

## Route And App Checks

When a target page unexpectedly shows "开发中" or 404:

1. Confirm `shost` and role first.
2. Confirm the route exists in source, for example under `apps/common/src/views`, `apps/financial/src/views`, or `apps/gnosis/src/views`.
3. Confirm the running Vite app:
   - `lsof -nP -iTCP:8000 -sTCP:LISTEN`
   - `ps -wwp <pid> -o pid,ppid,command`
4. Confirm the app's Vite route plugin includes the module.
5. If a new route was recently added, restart the dev server and clear Vite cache only when needed:
   - `apps/all/node_modules/.vite`
   - app-specific `node_modules/.vite`

## Backend Selection Rules

Do not edit `.env` or `config.js` just to switch backend for a page check. Use login `shost` unless the user asks to change defaults.

If already logged in with the wrong backend:

1. Navigate to `/user/login`; if it redirects away due to active session, use the UI logout path when visible.
2. If logout is not easily available, ask before clearing local storage or tokens.
3. Re-login through quick login with the requested `shost`.

Never assume `localhost` means mtest. `localhost` may default to mdev depending on `ROOT_CONFIG.shost` and saved `serverUrl`.

## Final Response Shape

Keep the final report concise:

```text
Checked with:
- Frontend: localhost:8000 / apps/all
- Backend shost: mtest-gateway.opr
- Role: operator
- Final URL: ...

Result: ...
Evidence: ...
```

If the task was only diagnosis, do not make code changes. If the user asked to fix and verify, implement the fix after reproducing and then re-run the relevant browser checks.
