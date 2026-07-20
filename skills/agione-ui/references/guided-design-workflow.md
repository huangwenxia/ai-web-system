# Guided Strict Design Workflow

Use this reference for every from-zero strict design, multi-page generation,
structural redesign, or strict task whose material UI decisions are not already
approved. `--direct` uses the same inventory as an internal model-selection
check but skips interactive candidate rounds.

## Contents

- [Scope](#scope)
- [Mode selection](#mode-selection)
- [Decision levels](#decision-levels)
- [Gate 0: lock business truth](#gate-0-lock-business-truth)
- [Gate 1: build the material decision inventory](#gate-1-build-the-material-decision-inventory)
- [Gate 2: review one material decision](#gate-2-review-one-material-decision)
- [Gate 3: audit blueprint completion](#gate-3-audit-blueprint-completion)
- [Candidate contract](#candidate-contract)
- [Review surfaces](#review-surfaces)
- [Decision ledger](#decision-ledger)
- [Direct strict resolution](#direct-strict-resolution)
- [File hygiene](#file-hygiene)
- [Multi-page loop](#multi-page-loop)
- [Integrated review and delivery](#integrated-review-and-delivery)

## Scope

Use guided strict to make one production-aligned result through progressive,
decision-scoped approval. Compare only choices allowed by the strict catalog,
decision trees, page architecture, Base Spec, and requirement.

Do not use guided strict for:

- whole-page variants with different information-architecture theses;
- DS-external experiments or new visual-system directions;
- color, font, spacing, or decorative style exploration;
- keeping rejected prototypes as design evidence.

Route those requests to `agione-ui-explore`.

## Mode selection

| Request | Mode |
|---|---|
| New design from a description | Guided strict material decisions |
| `--from` with fields/functions but no approved UI decisions | Guided strict material decisions |
| Multi-page generation | Guided strict, page by page |
| Structural redesign or fresh take | Guided strict from a fresh shell |
| From-zero `--direct` | Model resolves the complete inventory, then direct strict |
| `--from` whose UI decisions are explicitly locked | Direct strict with locked inventory |
| Non-structural `--edit` | Direct incremental edit; no new inventory |
| Selected explore variant converging to strict | Direct convergence edit |

`--direct` changes only who selects and whether intermediate candidates are
shown. It never relaxes strict rules, business fidelity, explicitly requested
rendering, or final validation.

## Decision levels

Keep these levels separate:

1. **Material decision selection** chooses one named page, component, region,
   interaction, transition, or critical-state decision and records its exact
   scope.
2. **Page blueprint completion** occurs only when all material decisions for
   that page are `selected`, `auto-selected`, or `not-applicable`.
3. **Integrated page approval** happens only after the real strict target has
   been rendered with the completed blueprint.

A choice locks only the named decision. It never approves sibling regions,
child components, other interactions, critical states, the whole page, or the
integrated target unless those scopes were explicitly part of that decision.

## Gate 0: lock business truth

Before showing UI choices, confirm:

1. Role, menu, page inventory, and review order.
2. Primary task and at most one secondary task for each page.
3. Fields, values, units, states, operations, permissions, and validations.
4. Required empty, loading, error, risk, locked, destructive, and success
   behavior.
5. Security or irreversible behavior such as one-time secrets, revocation,
   deletion, settlement, or permission changes.

Do not turn an unknown business rule into a visual option. Ask one focused
business question instead. Keep neutral placeholders only when the requirement
explicitly permits them.

## Gate 1: build the material decision inventory

Read the complete requirement and inventory every material design choice for
the current page before rendering its first candidate:

1. **Page skeleton** — page type, dominant entry, major regions, and reading
   order.
2. **Content representation** — table, cards, compact rows, detail groups,
   timeline, chart, or strict-valid L3 visualization for each major region.
3. **Information grouping** — section boundaries, comparison layout, density,
   and persistent versus progressive detail.
4. **Action strategy** — placement and priority of primary, secondary, row, and
   destructive actions.
5. **Interaction container** — dialog, drawer, new page, inline expansion,
   step flow, or another strict-valid transition.
6. **Critical states** — progress, success, error, exception, empty, locked,
   threshold, one-time disclosure, and destructive confirmation when their
   treatment changes hierarchy or user confidence.
7. **Cross-page flow** — return path and context persistence when not already a
   locked business fact.

A decision is material when it changes reading order, comparison behavior,
information persistence, screen transition, risk perception, or task
completion. Do not ask the user to approve ordinary button anatomy, inputs,
pagination, tokens, spacing, typography, focus, or accessibility correctness.

Assign page-scoped IDs such as `P1-D1`, `P1-D2`, and `P1-D3`. Record the
page/region, exact question, candidate space, dependencies, and status. Use only
`pending`, `selected`, `auto-selected`, or `not-applicable`.

Auto-select a material decision only when the catalog, page type, or requirement
leaves one strict-valid answer. Record the reason; never manufacture a choice
between the correct shared component and a private substitute.

Present the compact inventory before the first guided choice so the user can
add, remove, or reorder decisions. Set `unresolved-material-decisions` to the
number of `pending` items and keep `target-generation=blocked` while it is above
zero.

## Gate 2: review one material decision

Review one pending material decision per round unless the user explicitly asks
to batch decisions.

For the active decision:

1. Show its ID, page/region, exact question, dependencies, and selected parent
   context.
2. Render 2-3 strict-valid alternatives in the same realistic business context.
   Two are enough when they cover the useful space.
3. Use enough fidelity to judge the active question. A table-versus-card choice
   needs realistic scan behavior; a dialog-versus-drawer-versus-page choice
   needs visible capacity, context, and return behavior.
4. Recommend one option when the strict rules and task evidence support it.
5. State one concise benefit, cost, and capacity limit for each candidate.
6. Wait for the user to select, combine compatible parts, reject, or request
   another strict-valid option.

After the response, update only the active decision. Explicitly state:

- what is now locked and its exact scope;
- what the choice does not lock;
- which dependent decisions were reopened, if any;
- the next unresolved decision and updated count.

Do not infer whole-page approval and do not create the target at this gate.

## Gate 3: audit blueprint completion

After the apparent last choice, re-read the requirement and verify that every
major region, cross-page transition, destructive flow, critical state, and
layout-sensitive capacity concern has a ledger entry or justified
`not-applicable` status.

- A `pending` item keeps target generation blocked.
- Silence, a page-skeleton selection, “这个不错”, or a component choice cannot
  approve unresolved decisions.
- If an upstream selection invalidates a dependency, reopen only the affected
  downstream decisions and update the count.
- A deterministic catalog result must be `auto-selected` with a reason, not
  silently omitted when it materially affects the page blueprint.

Continue only when the current page ledger states:

```text
unresolved-material-decisions=0
target-generation=ready
```

## Candidate contract

For every guided choice round:

1. Preserve one shared business contract across all candidates.
2. Use decision-scoped IDs such as `P1-D2-A`, `P1-D2-B`, and `P1-D2-C`.
3. Offer two candidates when two cover the useful decision space; never force a
   third candidate.
4. Skip the round when only one strict-valid solution exists and record it as
   `auto-selected`.
5. Differentiate candidates by hierarchy, density, interaction, disclosure, or
   capacity, not color or decoration.
6. Mark one recommendation when evidence supports it.
7. State one concise benefit, cost, and capacity boundary.
8. Use selection language such as `P1-D2=P1-D2-B`; never call one answer “page
   approved.”

## Review surfaces

Use the smallest inspectable surface that lets the user decide:

1. When the `visualize` skill or an equivalent conversation-native interactive
   surface is available, load and use it for every material choice round. Do not
   present that choice as prose only.
2. Show the active region in enough surrounding page context to judge fit.
3. Use low-fidelity structure for page-skeleton choices and realistic controls
   for component or interaction decisions.
4. Keep candidate reasoning outside customer-visible sample UI.
5. Only when no inline surface exists, render scratch strict snippets from an
   operating-system temporary directory and delete them after selection.
6. Never write candidate previews, screenshots, or comparison files into the
   user's project.

A generic inline preview is a decision aid, not the AGIOne fidelity authority.
The integrated review must render the real target generated from the shared
AGIOne shell and components.

## Decision ledger

Keep a compact cumulative ledger in task context:

```text
page=offline-recharge-user
decision-source=guided-user
P1-D1-page-skeleton=selected:S2 transfer-handoff
P1-D1-lock-scope=entry composition + primary reading order only
P1-D2-bank-information=selected:D2-B grouped-information
P1-D3-recharge-entry=pending
P1-D4-payment-reference=pending
P1-D5-progress=pending
P1-D6-order-details=pending
P1-D7-cancel-container=pending
P1-D8-exception-treatment=pending
P1-D9-completion-and-supplement=pending
unresolved-material-decisions=7
target-generation=blocked
```

Include the complete current ledger in every interactive follow-up request.
Restate the newly selected item and its scope before moving to the next decision.
If an upstream decision changes, reopen only affected downstream decisions.
Never persist the ledger unless the user explicitly requests it.

## Direct strict resolution

For a from-zero `--direct` request:

1. Build the same page-scoped material decision inventory.
2. Set `decision-source=model-direct`.
3. Select every item using requirement fidelity, strict page architecture,
   catalog intent, decision trees, capacity, and accessibility.
4. Record deterministic items as `auto-selected` and model judgments as
   `selected`.
5. Resolve dependencies and reach `unresolved-material-decisions=0`.
6. Do not present intermediate candidates or pause for approval.
7. Continue directly to the one strict target and final validation.

## File hygiene

- Do not create a design-lock file by default.
- Do not create `v1`, `v2`, `v3`, per-page, or per-component prototype files.
- Keep pre-target decisions in the conversation and cumulative follow-up ledger.
- Create exactly one target HTML after the current page reaches
  `unresolved-material-decisions=0`.
- Reuse the same target for every page, correction, and integrated review.
- Keep rejected candidates ephemeral.
- Track every scratch path and delete it before the next gate or final delivery;
  report any cleanup failure instead of silently leaving files behind.
- Create persistent resume state only when the user explicitly requests it and
  approves its location and retention.

## Multi-page loop

1. Confirm the full page inventory and review order once.
2. Build a separate material decision inventory for every page.
3. Resolve the first page to zero unresolved decisions.
4. Scaffold the single target and implement the completed first-page blueprint.
5. Render the real page and obtain integrated approval.
6. Resolve the next page to zero before adding it to the same target.
7. Preserve approved pages, data, navigation keys, and shared chrome.
8. After all pages pass, review cross-page hierarchy, terminology, navigation,
   states, and repeated component consistency.

Never deliver the target while any page still has unresolved material decisions.

## Integrated review and delivery

Render the real AGIOne target after assembling each completed page blueprint.
Let the user:

- approve the integrated page;
- return to a named decision without reopening unrelated decisions;
- request a local adjustment to the same target.

Apply changes to the same target and render again. After all page ledgers and
integrated reviews are complete, run the hard gate, strict evaluator, and
business checklist. Deliver only the target path, validation result, compact
decision summary, Rule Gaps, and remaining human checks. If real rendering is
unavailable, do not claim visual approval; ask the user to open the target or
provide a rendered review surface.
