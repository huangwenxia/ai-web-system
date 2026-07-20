---
name: agione-ui-explore
description: >
  AGIOne Console 引导式视觉探索 skill。用于在生产收敛前，逐页盘点关键设计
  决策，并逐个组件、信息区域和交互点比较可视化候选；所有关键选择完成后，再
  生成 2-3 种明显不同的最终视觉风格。product-stretch 与 frontier 可自由选择
  页面级组件；始终保持业务事实、可运行的中英双语 Light/Dark HTML 和可访问性。
  一次选择只锁定被点名的决策，不代表整页确认；选择最终风格也不会自动触发
  agione-ui 收敛，只有用户明确要求时才收敛。
---

# AGIOne UI Explore

## Contract

Explore both composition and visual language. Do not turn business uncertainty
into visual difference.

- Compare 2-3 final variants against one shared business contract.
- Include exactly one `product-anchor` direction. When an approved strict
  prototype exists, copy it into the comparison set with user authorization and
  add only the non-customer `AI-NOTES` contract; do not redesign it.
- Use `product-stretch` and `frontier` directions for declared experiments.
- Keep runtime health, business truth, bilingual meaning, Light/Dark behavior,
  accessibility, and customer-visible semantics as non-negotiable Core rules.
- Constrain shared components only in `product-anchor`. Let `product-stretch`
  and `frontier` choose any page-level component model that serves the thesis.
- Record each variant's component strategy and production deltas as convergence
  evidence, never as permission required before experimenting.
- Inventory every material page, component, and interaction decision before
  final implementation. In guided mode, review one named decision at a time
  unless the user explicitly requests a batch. In `--direct`, let the model
  select every item without pausing for approval.
- A choice locks only the named decision and its stated scope. Never infer that
  selecting a page skeleton also approves its child components, information
  grouping, action container, state treatment, or the whole page.
- Keep final variant generation blocked while
  `unresolved-material-decisions > 0`. Create the final multi-style comparison
  only after the ledger reaches `unresolved-material-decisions=0`.
- Invoke `agione-ui` only after an explicit convergence command or an explicit
  request for PM, frontend, or production delivery. Selection is not convergence.

Use `agione-ui` when the user wants one production-aligned result inside the
strict catalog. Do not loosen the strict skill to compensate for a weak explore
direction.

## Required reads

Read these references before acting:

| Signal | Read |
|---|---|
| Every explore request | `references/base-spec.md` and `references/explore-strategy.md` |
| Normal interactive exploration | `references/guided-exploration-workflow.md` |
| Product-anchor direction | `references/product-anchor.md` and `references/chrome-components.md` |
| User explicitly asks for strict convergence or PM/frontend/production delivery | `references/converge-to-strict.md` |

Treat the directory containing this `SKILL.md` as `<skill-dir>`. Invoke bundled
scripts through that absolute directory; do not assume the user's working
directory is the skill directory.

Do not load the strict catalog, gallery, recipes, or page partials during normal
exploration. The product-anchor reference is the complete strict-facing overlay
needed by this skill.

## Invocation forms

| Form | Meaning |
|---|---|
| `/agione-ui-explore --from <prototype-role.md>` | Guided comparison from one business specification |
| `/agione-ui-explore <description>` | Guided comparison from a direct request |
| `/agione-ui-explore --refine <existing.html> <region>` | Explore alternatives for one selected region |
| `/agione-ui-explore --direct ...` | Delegate every material design choice to the model and directly generate the final 2-3 Explore variants |

`--direct` skips all interactive candidate rounds. The model still builds the
per-page decision inventory for self-checking, chooses every pending item, and
reaches zero unresolved decisions before implementation. It does not weaken
Core, final rendering, or the strict convergence boundary.

## Workflow

### 1. Lock business truth

Extract one shared contract:

1. User role, primary task, menu, route, and page inventory.
2. Fields, metrics, values, units, dates, and definitions.
3. Operations, disabled behavior, permissions, and validation.
4. Required normal, empty, loading, error, locked, threshold, and destructive
   states.
5. Chinese/English meaning and conditional behavior.

Ask one focused business question when a missing answer would change that
contract. Do not invent business rules to make variants look different.

### 2. Inventory material decisions page by page

For each page, derive a decision ledger from the business contract. Include
every choice that can materially change comprehension or task completion:

1. Page skeleton, dominant entry, and reading order.
2. Representation of each major content region, such as table, cards, rows,
   timeline, document, or a domain-specific surface.
3. Information grouping, density, and persistent versus progressive detail.
4. Placement and priority of primary, secondary, and destructive actions.
5. Interaction containers and transitions, such as dialog, drawer, inline
   expansion, or a new page.
6. Material progress, status, exception, empty, locked, and confirmation
   treatments.

Assign stable IDs such as `D1`, `D2`, and `D3`. Record dependencies and mark
every item `pending`, `selected`, `deferred-to-final-set`, or `not-applicable`.
Do not silently batch independent choices or propagate one answer to another.

### 3. Resolve material decisions

In guided mode, follow `references/guided-exploration-workflow.md`. For the
current decision, render 2-3 inspectable alternatives with realistic business
content when `visualize` or an equivalent conversation-native surface is
available. A component candidate may use any model that serves the task; do not
constrain experimental options to the strict catalog.

After each response, update only that decision and explicitly list what remains
unresolved. If an upstream choice invalidates a dependent choice, reopen only
that dependency. Do not scaffold final HTML while any material decision is
pending.

In `--direct`, do not render intermediate candidates or wait for the user. Let
the model choose every item, record `decision-source=model-direct`, resolve
dependencies, and continue directly to final style planning.

### 4. Plan final style positions after the blueprint is complete

Require `unresolved-material-decisions=0`, then select one primary final axis
and at most one secondary axis from `composition`, `visual-language`,
`interaction`, `density`, and `content-chrome`. Build a comparison matrix with
2-3 directions:

| Variant | Position | Thesis | Focal point | Component strategy | Visual language | Trade-off |
|---|---|---|---|---|---|---|
| V1 | product-anchor | ... | ... | shared AGIOne controls | AGIOne strict-near | ... |
| V2 | product-stretch | ... | ... | ledger-aligned or explicitly deferred | scoped stretch | ... |
| V3 | frontier | ... | ... | ledger-aligned or explicitly deferred | boundary test | ... |

Use a user-authorized copy of an existing approved strict prototype as V1 when
available; do not recreate it merely to satisfy the matrix. Keep the comparison
set at 2-3 files. Every direction must honor all `selected` decisions. Vary a
material component or interaction only when its ledger status is explicitly
`deferred-to-final-set`; never reopen it merely to make variants look different.

### 5. Scaffold the approved comparison set

Use the deterministic scaffold:

```bash
python3 "<skill-dir>/scripts/scaffold-prototype.py" \
  --slug usage-dashboard \
  --variants 3 \
  --positions product-anchor,product-stretch,frontier \
  --output-dir ./prototype
```

The scaffold adds an `AI-NOTES` contract to every file. Complete every field
before implementing the page. Preserve the resolved page blueprint—including
the chosen component families and interaction containers—while producing 2-3
final visual styles across the design positions. Never overwrite an existing
round without the user's approval.

### 6. Implement through anchors

For every variant:

1. Locate current anchors with `rg -n "AGIONE_EDIT_|AGIONE_LOGO_DANGER"`.
2. Read only the small region being edited.
3. Edit title, optional experiment tokens, i18n, sidebar, `<main>`, setup data,
   and returned values.
4. Keep Logo data and unrelated shell regions intact.
5. Use `--exp-*` for scoped experimental visual tokens and `--biz-*` for scoped
   business semantics. Define Light/Dark pairs.
6. Add `data-component` to meaningful custom boundaries.

For `product-anchor`, follow `references/product-anchor.md` and its component
API. For experimental positions, choose components, custom DOM, visualization,
and interaction structures freely. Shared runtime components are optional
implementation assets, not defaults. Do not load `chrome-components.md` as an
authoring catalog for experimental variants. Preserve the business and
accessibility contract, then record the chosen `component-strategy` and material
`production-deltas`; neither field is a permission gate.

### 7. Validate mechanics and position contracts

Run:

```bash
bash "<skill-dir>/scripts/check-explore-variants.sh" \
  usage-dashboard-v1.html usage-dashboard-v2.html usage-dashboard-v3.html
```

The set validator:

- runs Explore Core on every file;
- runs the Product Anchor overlay on the anchor file;
- validates position, axis, component strategy, production delta, and
  comparison-signature metadata;
- reports structural similarity as evidence, not proof of visual difference;
- returns `VISUAL_REVIEW_REQUIRED` while final renders remain unreviewed.

Fix all mechanical failures. Do not rename `data-component` values merely to
lower a similarity score.

### 8. Render the real variants

Render every final HTML at the same viewport, scenario, language, and theme.
Show a side-by-side Light comparison and inspect Dark plus the most
layout-sensitive state. Use a browser or equivalent real rendering surface when
available.

After the real variants have been shown under equal conditions, change
`visual-review: pending` to `visual-review: presented` and rerun the set checker
with `--require-visual-review`. Use `approved` only after the user explicitly
approves that final style. `approved` records an Explore preference; it does not
invoke strict convergence.

Do not claim visual diversity, approval, or completion from metadata or Jaccard
alone. If rendering is unavailable, report `visual review pending` and give the
user exact file paths to open.

## AI-NOTES contract

Keep this block at the top of every final variant:

```html
<!--AI-NOTES
variant: 1 of 3
design-position: product-anchor
explore-axis: composition
approach: relationship-led account identity map
focal-point: account-to-organization relationship
reading-order: account > organization > identities > actions
visual-language: AGIOne strict-near operational
interaction-model: direct scan with explicit actions
component-strategy: shared AGIOne operational components
tradeoff: fastest production convergence; lower expressive range
production-deltas: none
visual-review: pending
AI-NOTES-->
```

For `product-stretch` or `frontier`, describe the chosen component model and
list comma-separated production deltas. These are free-form convergence notes,
not an allowlist. Never list a Core requirement as a production delta.

## Invariants

### EXPLORE-CORE · Never relax

- Business truth, permission, state, and validation semantics.
- Runnable Vue/HTML, deterministic data, i18n meaning, and Light/Dark behavior.
- Logo integrity, safe dependencies, keyboard access, focus, contrast, reduced
  motion, and non-color-only status communication.
- Customer-visible content boundaries and destructive-action clarity.

### PRODUCT-ANCHOR · Keep one honest baseline

The anchor follows the strict token, typography, component, subtitle, and border
overlay. It exists to show the production-near cost and benefit, not to force
experimental variants back into the same visual language.

### EXPERIMENT-LAYER · Declare the stretch

Experimental positions may freely vary page-level components, DOM structure,
type scale, spacing rhythm, surface shape, elevation, color expression,
page-header composition, visualization, and interaction or motion. Component
choice is a normal design variable and does not need a component-specific
exploration axis. Keep every choice coherent with the stated thesis and Core
semantics.

### EXPLICIT CONVERGENCE · Preserve intent only on command

Selecting a candidate structure or a final visual style does not invoke
`agione-ui`. Preserve the selected file and its focal hierarchy, reading order,
visual signature, component strategy, and interaction model inside Explore.
Hand it to `agione-ui --direct --edit` only after the user explicitly commands
convergence or requests PM, frontend, or production delivery.

## File hygiene and delivery

- Keep candidate boards, scratch snippets, screenshots, and design ledgers out
  of the user's project unless explicitly requested.
- Persist only the 2-3 final comparison files and requested deliverables.
- Do not create a compare page automatically.
- Do not delete or overwrite pre-existing variants without approval.
- Return all final paths, positions, theses, component strategies, production
  deltas, mechanical validation, visual-review status, and the next Explore or
  explicitly authorized convergence step.
- Do not paste complete HTML into the response.
