---
name: agione-ui
description: >
  AGIOne Console UI guided strict prototype generator. Use for PM review,
  production-aligned list, form, detail, overview, dashboard, locked-service,
  and shell/chrome prototype requests. Every from-zero design and structural
  redesign first inventories material decisions page by page, then visually
  confirms one named component, region, interaction, or critical state at a
  time before producing one bilingual Light/Dark single-file HTML aligned with
  mamba-layout. One choice never approves the whole page. Use --direct to let
  the model resolve the same inventory without interactive rounds. Do not use
  for broad visual exploration, whole-page variants, or design-system
  experiments; use agione-ui-explore there.
---

# AGIOne UI Guided Strict Prototype

## Contract

This skill is **100% strict** and **strict-only** at final delivery:

- Produce exactly one production-aligned prototype.
- Default new designs and structural redesigns to guided strict review.
- Treat temporary choice previews as review surfaces, not prototype outputs.
- Preserve the shared AGIOne chrome and Base Spec.
- Treat the reviewed `project-mamba` code baseline as the shell and token
  authority; never infer alignment from npm or CDN `latest` metadata.
- Use the strict component catalog and page-selection rules before inventing UI.
- Keep business data, fields, states, permissions, and copy faithful to the
  supplied requirement.
- For every from-zero page, inventory all material architecture, content-region,
  grouping, action, interaction-container, and critical-state decisions before
  rendering the first candidate.
- In guided strict, review one named decision at a time. A choice locks only the named decision and its stated scope; never infer approval of child components,
  sibling regions, other interactions, critical states, or the whole page.
- Keep target generation blocked until the current page reaches
  `unresolved-material-decisions=0`. In `--direct`, let the model resolve the
  inventory internally instead of asking the user.
- Deliver a browser-runnable bilingual Light/Dark HTML file that passes the
  strict evaluator.

Guided strict may compare 2-3 valid strict choices for one material decision. It
must not create whole-page variants, test DS-external directions, or loosen the
strict contract. Route those requests to `agione-ui-explore`.

## Required first read

Read `references/base-spec.md` completely before presenting choice previews or
generating or editing any prototype. It owns the shared shell, token,
typography, Vue/i18n, prototype state machine, BalanceBox, accessibility, and customer-visible
semantic rules.

Treat the directory containing this `SKILL.md` as `<skill-dir>`. Invoke bundled
scripts through that absolute directory; do not assume the user's cwd is the
skill directory.

Then read only the references selected by this routing table:

| Signal | Read |
|---|---|
| New design, structural redesign, unresolved page/component decisions, multi-page guided review | `references/guided-design-workflow.md` |
| Shared shell, mamba token, responsive chrome, BalanceBox, or dependency-baseline maintenance | `references/mamba-code-baseline.json`; run `scripts/check-mamba-drift.sh` |
| New file, `--from`, `--edit`, redesign, multi-page, shell-only | `references/strict-workflows.md` |
| Any page composition or visual hierarchy decision | `references/page-architecture.md` |
| Forms, tables, list pages, component selection, L1/L2/L3 | `references/components-and-forms.md` |
| Customer copy, business fidelity, locked service/capability | `references/content-and-service-boundaries.md` |
| Dashboard/analytics/monitoring/large-screen page | `design-system/dashboard.md` and decision tree ⑪ |
| Component intent is not obvious | `design-system/catalog.md` |
| Catalog signal is `TREE-N` | Only section N of `design-system/selection-rules.md` |
| A component was selected and props/slots are needed | Relevant section of `design-system/api-cheatsheet.md` |
| StatusBadge/Tag wording or state-color mapping is needed | `design-system/foundations/badge-vocab.html` |

Never read the complete shell or `agione-design-system.html`. Never read every
component example “for context”.

## Invocation forms

| Form | Meaning |
|---|---|
| `/agione-ui <description>` | Guided strict review, then one final prototype |
| `/agione-ui --from <prototype-role.md>` | Guided strict review unless UI decisions are explicitly locked |
| `/agione-ui --direct <description>` | Delegate every material choice to the model and directly generate one strict prototype |
| `/agione-ui --direct --from <prototype-role.md>` | Generate from locked decisions or let the model resolve any remaining material inventory |
| `/agione-ui --edit <existing.html> <change>` | Direct incremental edit for a non-structural change |
| `/agione-ui --direct --edit <existing.html> <change>` | Explicitly bypass guided review for a structural/convergence edit |

All forms remain strict. `--direct` skips interactive candidate rounds, but the
model still builds and resolves the material decision inventory before creating
the target. It changes the review path, not the design rules or validation bar.

## Execution workflow

### 1. Lock the business truth

Before drawing, identify:

1. The user role.
2. The primary business task and at most one secondary task.
3. The required pages, fields, states, operations, units, and permissions.
4. The page type for each page.
5. Whether any scenario or state switching requires the prototype state machine.

Do not invent missing business decisions. Use a neutral placeholder only when
the requirement explicitly permits it; otherwise ask one focused question.

Do not use visual choices to invent missing fields, states, permissions,
operations, thresholds, security behavior, or copy. Ask one focused business
question when a material fact is missing.

### 2. Choose the execution path

- Use guided strict by default for a new design, `--from` with unresolved UI
  decisions, multi-page generation, or structural redesign.
- Use direct strict with `--direct` or when the supplied specification explicitly
  locks the relevant UI decisions. For a from-zero direct request, let the model
  select every inventory item without stopping for user approval.
- Keep a non-structural `--edit` direct and incremental.
- Re-enter guided strict for structural `--edit` or redesign unless `--direct`
  explicitly bypasses it.

### 3. Run guided decision gates when required

Read `references/guided-design-workflow.md` and:

1. Confirm the page inventory and review order.
2. Before the first choice for a page, inventory every material page skeleton,
   content representation, information grouping, action strategy, interaction
   container, cross-page transition, and critical-state decision.
3. Assign stable decision IDs and mark each item `pending`, `selected`,
   `auto-selected`, or `not-applicable`. Include dependencies and the unresolved
   count.
4. Review one pending named decision at a time. Show only genuine alternatives
   allowed by strict rules; auto-select a deterministic component instead of
   manufacturing a choice.
5. Render every material choice through an inspectable visual surface. When the
   `visualize` skill is available, load and use it; do not present prose-only
   alternatives. Use the fallback defined in the guided workflow only when an
   inline visual surface is unavailable.
6. After a selection, update only that decision and state its lock scope, what
   remains unlocked, any reopened dependencies, the next decision, and the new
   unresolved count.
7. Carry the cumulative decision ledger in every follow-up request so the
   workflow remains resumable without a design-lock file.
8. Keep candidate previews outside the project and never retain rejected strict
   candidates as prototype versions.

### 4. Build exactly one target prototype

Scaffold only after the current page reaches
`unresolved-material-decisions=0`:

```bash
python3 "<skill-dir>/scripts/scaffold-prototype.py" --output target.html
```

Reuse that target for every approved page and later adjustment. Do not create
`v1`, `v2`, or per-decision prototype files in guided strict.

For a from-zero `--direct` request, first set `decision-source=model-direct`,
resolve every material decision internally under the strict catalog, and reach
the same zero-unresolved gate without presenting intermediate candidates.

Use the four-layer decision order:

1. Page skeleton.
2. Strict hard rules.
3. Catalog intent and signal.
4. The referenced decision tree and component API.

Use the matching strict partial for list, detail, overview, or dashboard pages.
If the catalog already has the component, use it. Create L3 business UI only
when the catalog genuinely lacks the required visual or business structure.

Use `rg -n "AGIONE_EDIT_|AGIONE_LOGO_DANGER" target.html`, read a small window
covering the exact edit, then edit the title, sidebar, i18n, business setup data,
setup return, optional business tokens, and `<main>`.

For incremental edits, preserve unrelated pages, mock data, translations,
setup values, chrome, and shared runtime components.

### 5. Review the integrated result

- In guided strict, render the real AGIOne target after assembling the approved
  decisions. A generic inline choice preview is never the fidelity authority.
- Let the user approve the page or return to a named decision gate.
- Apply adjustments to the same target file and render it again.
- In direct strict, keep browser rendering optional unless the user explicitly
  requests screenshots, visual validation, or inspection.

### 6. Validate before delivery

Run the strict evaluator:

```bash
python3 "<skill-dir>/scripts/evaluate-prototype.py" target.html
```

Fix every hard failure. Review every warning. Then confirm the business
checklist: pages, fields, operations, states, permissions, amounts, units, and
state-machine coverage. Do not output the complete HTML in chat.

## Strict invariants

### AGUI-STRICT-001 · Requirement fidelity

- Implement every explicitly required field, state, validation, operation, and
  conditional element.
- Do not add decorative badges, fields, hover affordances, or explanatory blocks
  that the requirement does not justify.
- Requirement values win unless they make the shell unusable or inaccessible;
  record any necessary override through Rule Gap.

### AGUI-STRICT-002 · Information hierarchy

- Give every primary section one clear focal point.
- Use at most three parallel `KpiCard` components on normal pages.
- For 4-6 metrics prefer `MetricsStrip`; for larger or sortable data prefer
  compact key-value structures or a table.
- Do not nest `CardBox` around `CardBox`, `KpiCard`, or `FilterBox`.
- Treat view navigation as navigation, not as a weak filter.

Read `references/page-architecture.md` for the complete strict composition
contract and allowed L3 extension rules.

### AGUI-STRICT-003 · Shared components

- Use `I18nField`, `.form-modern`, the four radio variants, `DataTable`,
  `FilterBox`, page-header components, status components, and table actions when
  their documented intent matches.
- Do not create a private substitute for shared chrome or a catalog component.
- Mark custom L3 boundaries with `data-component`.

### AGUI-STRICT-004 · Customer-visible content

- Keep design rationale and implementation logic out of customer UI.
- Use explicit business nouns, especially for service/capability locked states.
- Keep button text action-specific and errors actionable.
- Do not expose `prototype`, `demo`, internal state probes, or component labels
  in `<main>`.

### AGUI-STRICT-005 · Rule Gap

Use Rule Gap only when following a strict rule would clearly produce an
incorrect or unusable result. L3 UI that already follows its documented
extension rules is not a gap.

Record gaps at the top of the output:

```html
<!--AI-NOTES
rule-gap:
  - rule: AGUI-STRICT-002
    scene: <specific conflict>
    decision: skip | ds-override | partial-comply
    reason: <why the strict default is worse here>
AI-NOTES-->
```

Never silently break a rule. Review every Rule Gap before delivery so it can be
accepted, rejected, or promoted into an explicit exception.

## Delivery

Return the output path and validation result. Summarize material Rule Gaps or
remaining human business checks. In guided strict, include a compact decision
summary. Do not keep a separate design-lock file, rejected candidate files, or
temporary review files in the project. Do not paste the complete generated HTML
into the response.
