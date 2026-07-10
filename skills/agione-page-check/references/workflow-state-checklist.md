# Workflow And State Checklist

Use this checklist for role-aware pages, forms, dialogs, batch actions, permission behavior, and asynchronous state transitions.

## Role And Tenant Matrix

Check only roles relevant to the page, but do not infer one role's behavior from another.

| Role | Typical review lens |
| --- | --- |
| operator | Cross-tenant control, batch safety, auditability, platform-only actions |
| admin | Organization/member management, delegated authority, self-edit boundaries |
| provider | Own earnings, customers, resources, and provider-scoped actions |
| end user / EU | Own tenant data, consumption, billing, and permitted self-service |

For each applicable role, verify:

- Menu visibility and route reachability.
- Data scope and tenant isolation.
- Action visibility, disabled state, and API authorization.
- Customer-facing wording appropriate to that role.
- No platform/internal roles, services, tags, or identifiers leak into ordinary tenant workflows.

## State Matrix

Exercise applicable states independently:

| State | Expected behavior |
| --- | --- |
| checking/loading | Neutral progress; no premature empty, locked, or error meaning |
| normal | Real data and enabled commands render correctly |
| empty | Deliberate empty state with valid next action when applicable |
| locked/unavailable | Explains the unavailable capability without pretending it is loading |
| forbidden | Permission-specific response; no partial protected data |
| disabled | Visible but clearly unavailable when product semantics require it |
| error | Actionable customer message and retry/recovery path when possible |

Pause or delay a request only when needed to observe loading. Resume it and verify the final real state before completion.

## Interaction Coverage

For relevant controls, verify both command execution and resulting state:

- Search input and clear behavior.
- Filters, dependent filters, and reset.
- Sorting and pagination, including leaving page 1.
- Row actions and overflow menus.
- Copy actions and tooltips.
- Form defaults, required/optional fields, validation, submit, and cancel.
- Dialog/drawer open, close, escape/cancel, and focus behavior.
- Confirmation accept and cancel; cancel must not produce an unhandled rejection.
- Batch selection, select-all scope, destructive-action summary, and clear selection.
- Export/download scope and feedback.
- Refresh after create/update/delete/action completion.

## Operational Pages

For admin/operator pages, explicitly review:

- Findability: can a frequent operator locate the target quickly?
- Batch safety: is the selection scope visible and reversible before commit?
- Permission clarity: is it obvious which role/app/tenant an action affects?
- Operational traceability: can the user identify who/what/when after an action?
- Density: is key information scannable without hiding fields required for decisions?

## Permission Consistency

Compare three layers:

1. Menu/route visibility.
2. Button/action visibility or disabled state.
3. API permission response.

These layers should express the same authorization model. If a permission is missing, diagnose/repair menu and permission data before weakening route or frontend guards.

## Shared Components And Regression

- Identify other pages consuming any changed shared hook, table factory, dialog helper, route guard, or component.
- Recheck the old and new page when both intentionally coexist.
- Verify state is reset when switching routes, roles, tabs, or filters.
- Verify a rejected/canceled async action does not leave loading flags or selections stuck.
