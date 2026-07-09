---
name: agione-page-check
description: Check, review, or self-test AGIOne frontend pages through a browser with the correct localhost app, backend shost, quick-login role, route, DOM/style evidence, screenshots, and network/runtime sanity checks. Use when the user asks to "check a page", "用浏览器看页面", "自测 localhost:8000", verify light/dark or hover states, inspect computed styles, reproduce UI bugs, or validate AGIOne pages as operator/provider/enduser/admin on mtest or mdev.
---

# AGIOne Page Check

Use this skill to verify AGIOne frontend pages in the browser without accidentally testing the wrong backend, wrong account, wrong app, or stale route bundle.

This skill is intentionally platform-neutral. Codex should use the in-app Browser or Chrome browser skills available in the current session. Claude or another agent should use its equivalent browser automation while following the same checks.

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

### Environment gate — Step 0, before you read or trust ANY data

Determining the backend env (`mtest` vs `mdev`) is the FIRST action, not an afterthought. Do not log in (or read page data) and only afterward check which backend you are on — verify first, then act.

- The authoritative backend is the stored `SERVERURL` (the value actually sent as the `shost` header), NOT `ROOT_CONFIG.shost` (which defaults to `mdev-gateway.opr` on `localhost` and will mislead you):
  ```js
  JSON.parse(localStorage.getItem("SERVERURL") || "{}").value   // e.g. "mtest-gateway.opr"
  ```
- **This applies even when you are already logged in.** A new tab on the same `localhost` origin inherits the existing session (token + `SERVERURL` in localStorage), so you may land already authenticated — still verify `SERVERURL` equals the requested env (and the visible role is right) BEFORE trusting anything on screen.
- If `SERVERURL` does not match the requested env, treat all on-screen data as wrong-environment and re-login with the correct `shost` (see Backend Selection Rules) before continuing.

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
   - Style checks: read `getComputedStyle` for exact colors, z-index, layout, disabled state, hover state, dark-mode tokens, and transition properties.
   - Hover checks: move the mouse or trigger the state, then compare computed values before/after hover.
   - Light/dark checks: switch theme through visible UI when possible; after switching, re-read DOM and computed style.
   - Network checks: inspect request URLs/statuses only as needed; do not rely on memory.

8. Report with evidence:
   - Environment/shost used.
   - Role used.
   - Final URL.
   - Whether the expected page root or marker exists.
   - Key computed values or observed network responses.
   - Screenshots saved or emitted, if any.
   - Any uncertainty, especially if browser state or route bundle differs from the user's visible page.

## Console shell check (before hunting for a menu)

After login you may land on a public landing/chooser page (for example the "Public Model / Self Deploy Model" chooser) that has NO management navigation. Before looking for a specific menu (`设置`/Settings, `组织`/Organizations, etc.):

1. Confirm the console shell is actually on screen — a top nav (e.g. `Model Services / AI Infra / Trading Services / Billing / Settings`) or a left sidebar.
2. If the expected top menu is missing, FIRST suspect "I have not entered the console yet" (still on a landing / login / chooser page), NOT a route or permission bug. Enter the console from the landing page (e.g. click the user avatar / a console entry), then look again.
3. Only after you have confirmed the console shell is present should you treat a missing menu as a route/permission problem (next section).

## Route And App Checks

When a target page unexpectedly shows "开发中" or 404:

1. Confirm `shost`, backend target, and quick-login role first. Wrong `shost` or wrong role is more likely than a route bug.
2. Check whether the current user has the corresponding menu and permission before changing frontend route code:
   - If the page or network error explicitly says `缺少应用[...]的权限[...]` or `You do not have permission for app [...]`, switch to `$agione-permission-repair` for the database/cache repair workflow before changing frontend code.
   - Confirm the target `frontAppId` and menu path.
   - Confirm the menu exists and is visible/enabled for that app.
   - Confirm the menu is bound to the expected permission code, and that the role/user is granted that menu/permission.
   - If you are working in local/dev/test and the permission is missing, initialize or repair the menu/permission/role-grant data, clear menu/user/virtual-permission caches when needed, then log out and quick-login again before rechecking.
   - Do not patch frontend route whitelists, `router.beforeEach`, `handleMenuPermission`, route bases, or dynamic `addRoute` logic until permission data is proven correct.
3. Confirm the route exists in source, for example under `apps/common/src/views`, `apps/financial/src/views`, or `apps/gnosis/src/views`.
4. Confirm the running Vite app:
   - `lsof -nP -iTCP:8000 -sTCP:LISTEN`
   - `ps -wwp <pid> -o pid,ppid,command`
5. Confirm the app's Vite route plugin includes the module.
6. If a new route was recently added, restart the dev server and clear Vite cache only when needed:
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
