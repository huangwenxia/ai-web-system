# Guided Visual Exploration Workflow

Use this workflow for normal Explore requests. With `--direct`, delegate every
material page, component, and interaction choice to the model. Skip all interactive candidate rounds and directly produce the final 2-3 Explore variants. The model
still uses the decision inventory and zero-unresolved gate as an internal
completeness check.

## Contents

- [Scope](#scope)
- [Decision levels](#decision-levels)
- [Gate 0: lock business truth](#gate-0-lock-business-truth)
- [Gate 1: build the material decision inventory](#gate-1-build-the-material-decision-inventory)
- [Gate 2: review one material decision](#gate-2-review-one-material-decision)
- [Gate 3: audit blueprint completion](#gate-3-audit-blueprint-completion)
- [Gate 4: plan final multi-style directions](#gate-4-plan-final-multi-style-directions)
- [Candidate contract](#candidate-contract)
- [Review surfaces](#review-surfaces)
- [Decision ledger](#decision-ledger)
- [Implementation and real rendering](#implementation-and-real-rendering)
- [File hygiene](#file-hygiene)

## Scope

Use guided exploration to move material UI choices into the design process
before paying the cost of complete HTML variants. Work page by page and at the
level of meaningful content regions, components, and interaction containers.

Do not use this workflow to:

- re-open known business facts;
- choose between a correct and broken accessibility treatment;
- make the user approve every icon, button atom, input mechanic, or pagination
  detail when those do not change the product decision;
- produce decorative moodboards detached from the product task;
- generate persistent candidate files while decisions remain unresolved;
- declare a selected component, page, or final style production-ready.

## Decision levels

Keep four levels separate:

1. **Material decision selection** chooses one named page, component, or
   interaction decision and records its exact scope.
2. **Page blueprint completion** occurs only after every material decision is
   `selected`, explicitly `deferred-to-final-set`, or `not-applicable`.
3. **Final style selection** records which fully rendered Explore artifact the
   user prefers after comparing the final multi-style files.
4. **Convergence authorization** exists only when the user explicitly asks to
   use `agione-ui`, align for production, or hand the result to PM/frontend.

A choice locks only the named decision. It never approves sibling regions,
child components, other interactions, the whole page, a final style, or strict
convergence unless those scopes were explicitly part of the named decision.

## Gate 0: lock business truth

Confirm one shared contract:

1. Role, route, page inventory, and primary task.
2. Fields, values, units, states, operations, and permissions.
3. Required empty, loading, error, locked, threshold, and destructive behavior.
4. Chinese/English meaning and conditional logic.

Ask a focused question only when a missing business answer changes every visual
candidate. Keep design choices out of this gate.

## Gate 1: build the material decision inventory

Read the complete requirement and inventory every material design choice for
each page before rendering the first candidate. Include:

1. **Page skeleton** — dominant entry, major regions, and primary reading order.
2. **Content representation** — table, cards, document rows, list, timeline,
   canvas, chart, or another domain-specific component for every major region.
3. **Information grouping** — section boundaries, comparison layout, density,
   and persistent versus progressive detail.
4. **Action strategy** — placement and priority of primary, secondary, and
   destructive actions.
5. **Interaction container** — dialog, drawer, new route, inline expansion,
   popover, or another transition for detail, edit, and task flows.
6. **Critical states** — progress, success, error, exception, empty, locked,
   threshold, and destructive confirmation when treatment changes hierarchy or
   user confidence.
7. **Cross-page flow** — return path, context persistence, and handoff between
   pages when those are not already fixed business facts.

A decision is material when it changes reading order, comparison behavior,
information persistence, screen transition, risk perception, or task
completion. Do not turn ordinary implementation details into approval fatigue.

Assign stable IDs such as `D1`, `D2`, and `D3`. Record page/region, decision
question, useful candidate space, dependencies, and status. Present the compact
inventory before the first choice so the user can add, remove, or reorder items.
Do not silently batch similar decisions or propagate one answer to another.

Set `unresolved-material-decisions` to the count of `pending` items. Keep
`final-variant-generation=blocked` while the count is greater than zero.

In `--direct`, do not present this inventory or ask for approval. Set
`decision-source=model-direct`, select the best option for every item using the
business contract and stated exploration thesis, resolve dependencies, and move
directly to Gate 3 when no pending item remains.

## Gate 2: review one material decision

This gate applies to guided mode. Review one material decision per round unless
the user explicitly requests a batch. Skip the entire gate in `--direct`.

For the active decision:

1. Show its ID, page/region, exact question, dependencies, and already selected
   parent context.
2. Render 2-3 useful alternatives in the same realistic business context. Two
   are enough when they cover the meaningful space.
3. Let component and interaction candidates range freely; do not reduce the
   choice to components already available in the strict catalog.
4. Use enough fidelity to judge the active question. A table-versus-card choice
   needs realistic rows and scan behavior; a dialog-versus-drawer-versus-page
   choice needs visible context, capacity, and return behavior.
5. State one concise benefit, cost, and capacity limit for each candidate.
6. Wait for the user to select, combine, reject, or request another option.

After the response, update only the active decision. Explicitly report:

- what is now locked;
- the exact scope of that lock;
- what it does not lock;
- which dependent decisions were reopened, if any;
- the next unresolved decision and the updated count.

Do not infer whole-page approval and do not create final HTML at this gate.

## Gate 3: audit blueprint completion

After the apparent last choice, re-read the requirement page by page and verify
that every major region, cross-page transition, destructive flow, and critical
state has a ledger entry or a justified `not-applicable` status.

- A `pending` item keeps final generation blocked.
- `deferred-to-final-set` is valid only when the user explicitly wants that
  named choice to vary across final designs.
- If an upstream selection changes a dependency, reopen only the affected
  downstream decisions and update the count.
- Never convert silence, a page-skeleton selection, or “这个不错” into approval
  of unresolved decisions.

Continue only when the ledger states both:

```text
unresolved-material-decisions=0
final-variant-generation=ready
```

## Gate 4: plan final multi-style directions

After the blueprint is ready, define one primary final exploration axis and at
most one secondary axis. Plan 2-3 positions with concrete visual-language
theses, including exactly one Product Anchor.

Every final direction must honor all `selected` decisions. It may vary a
component family, grouping, action placement, or interaction container only
when that exact decision is `deferred-to-final-set`. Product Anchor may map a
chosen family to its shared implementation, but it may not silently turn a
selected table into cards or a selected drawer into a new page.

Use visual-language differences such as typography rhythm, density, surface,
boundary, color expression, and motion to explore range without reopening the
resolved blueprint. Do not manufacture structural difference merely to make the
files look less similar.

## Candidate contract

For every material decision round:

1. Preserve the shared business contract.
2. Use decision-scoped stable IDs such as `D2-A`, `D2-B`, and `D2-C`.
3. Offer two candidates when two cover the useful space; never force a third.
4. Label the component or interaction strategy and material production deltas.
5. Show observable differences, not adjective-only names.
6. State one concise benefit, cost, and capacity boundary.
7. Keep rationale outside customer-visible sample UI.
8. Use selection language such as `D2=D2-B`; never call one answer “page
   approved.”
9. Keep convergence unauthorized.

In guided mode, when `visualize` or an equivalent conversation-native surface
is available, use it for every material choice. Presenting only a prose list is
a workflow defect.

## Review surfaces

Use the smallest inspectable surface that answers the current question:

1. Prefer conversation-native `visualize` candidates.
2. Show the active region in enough surrounding page context to judge fit.
3. Use an operating-system temporary directory for scratch HTML only when no
   inline visual surface exists.
4. Delete scratch candidates and screenshots after the decision round.
5. Never write candidate boards or screenshots into the user's project by
   default.
6. Treat generic candidate visuals as decision aids, not AGIOne fidelity proof.

The final visual comparison must render the real shell-based HTML files.

## Decision ledger

Keep a compact ledger in task context, not in a project file:

```text
page=offline-recharge-user
decision-source=guided-user
D1-page-skeleton=selected:S2 transfer-handoff
D1-lock-scope=entry composition + primary reading order only
D2-bank-information=selected:D2-B grouped-information
D3-recharge-entry=pending
D4-payment-reference=pending
D5-task-progress=pending
D6-order-details=pending
D7-cancel-container=pending
D8-exception-treatment=pending
D9-completion-and-supplement=pending
unresolved-material-decisions=7
final-variant-generation=blocked
final-style=pending
convergence=not-requested
```

Include the current ledger whenever asking for another decision. If an upstream
choice changes, reopen only affected downstream choices. Never persist this
ledger unless the user explicitly asks for it.

## Implementation and real rendering

Only after `unresolved-material-decisions=0`:

1. Plan and scaffold the final 2-3 multi-style comparison files, including
   exactly one Product Anchor.
2. Complete `AI-NOTES` before page implementation.
3. Implement the resolved decision ledger consistently in every variant, except
   for decisions explicitly marked `deferred-to-final-set`.
4. Run Explore Core and position-aware set validation.
5. Render all files at identical viewport, language, theme, scenario, and data.
6. Present a side-by-side Light comparison; inspect Dark and the most sensitive
   state.
7. Mark shown files `visual-review: presented`, rerun the set checker with
   `--require-visual-review`, and reserve `approved` for explicit user approval.
8. Revise a direction when the render violates a selected decision or its
   declared style thesis.
9. When the user selects a final style, record it as `approved`, preserve the
   chosen artifact, and remain in Explore.
10. Switch to strict convergence only after a separate explicit command.

If real rendering is unavailable, do not claim visual approval. Report the
pending review and provide exact paths.

## File hygiene

- Keep candidate previews and the decision ledger ephemeral.
- Persist only final comparison HTML and explicitly requested evidence.
- Do not create a compare page, archive directory, or design-lock file by
  default.
- Do not overwrite an earlier round; use a date suffix or ask permission.
- Do not automatically delete an existing final variant after selection.
- Delete every scratch path before delivery and report cleanup failures.
