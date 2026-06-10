# Browser Readonly Diagnostics

Use this protocol when frontend verification needs an authorized browser session, a real logged-in page, external controlled Chrome, or browser-side DOM/style/network evidence after implementation or review.

## Role

Act as a read-only diagnostics agent. The browser is used to observe and compare page behavior, not to operate the business system on the user's behalf.

## Authorization Template

Before using external controlled Chrome on a logged-in or authenticated page, confirm the allowed scope in this shape:

```text
本次允许使用外部受控 Chrome。
范围：仅访问 <URL>。
权限：只读 DOM、样式、控制台、网络状态；允许滚动、hover、分页、查询、展开收起。
禁止：保存、提交、删除、审批、发布、导入、导出、上传、下载、重置密码、读取 token/cookie/密码。
如遇到任何可能改变数据的操作，必须先停下来询问。
```

If the user already granted equivalent scope in the task, stay inside that scope and repeat it in the final report.

## Allowed Read-Only Actions

- Read DOM nodes, classes, visible text, table columns, button visibility/disabled state, selected rows, and current filters.
- Inspect computed styles, element size and position, scroll containers, overflow, hover/focus styles, and responsive wrapping or clipping.
- Read console errors and warnings.
- Read network summaries: request URL, status, duration, failed status such as 401/403/500, and response field shape. Do not print token, cookie, password, phone, private ID, or other sensitive values.
- Perform read-only interactions: scroll, hover, switch tabs, paginate, type a query, run a search/filter that only refreshes the visible result, and expand/collapse sections.
- Compare before/after evidence with screenshots, DOM indicators, style values, or visible state.
- Diagnose table issues with header DOM, scrollbar state, `scrollLeft`, group header position, active class, and DOM update timing.
- Inject temporary CSS or JavaScript only inside the browser for diagnostics. Do not persist it to the app and do not use it to submit forms or mutate backend data.
- Resize the viewport to check overflow, wrapping, clipping, and core content visibility.
- Check permission state by observing whether actions are visible, disabled, hidden, or guarded. Do not click dangerous actions.

## Forbidden Actions

- Do not perform write operations: save, submit, delete, approve, publish, import, export, upload, download, reset password, or any operation that changes business records or backend state.
- Do not read, print, copy, or summarize token, cookie, password, session, private ID, phone, or other sensitive values.
- Do not automate outside the authorized URL or page range.
- Do not bypass product permission, confirmation, captcha, or security boundaries.

## Reporting Requirements

When browser diagnostics are used, report:

- Authorization scope and target URL or route.
- What was inspected: DOM, style, console, network summary, screenshots, viewport, or interaction state.
- Evidence that supports the conclusion, such as selectors, visible text, style values, console/network summaries, or screenshots when useful.
- Confirmation that no write operation was performed.
- If blocked, state the concrete reason: missing URL, unavailable dev server, no auth/session, permission boundary, or unsafe operation requiring user confirmation.

## Relationship To Implementation Verification

Browser diagnostics complement but do not replace implementation checks. Continue to run the appropriate lightweight non-build checks such as typecheck, lint, encoding checks, component structure checks, targeted validation scripts, and `git diff --check` when they apply. Do not run build commands unless the user explicitly requests a build in the current task.
