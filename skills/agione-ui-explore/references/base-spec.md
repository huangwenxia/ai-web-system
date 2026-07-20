# AGIOne Explore Core Spec

This is the non-negotiable runtime, business, and accessibility contract for
`agione-ui-explore`. It deliberately does not freeze the strict visual system.
Apply the separate Product Anchor overlay only to the `product-anchor` variant.

In commands below, `<skill-dir>` means the directory containing the active
skill's `SKILL.md`.

## Contents

- [1. Core and overlay boundary](#1-core-and-overlay-boundary)
- [2. Output and shell integrity](#2-output-and-shell-integrity)
- [3. Business truth and i18n](#3-business-truth-and-i18n)
- [4. Runtime health](#4-runtime-health)
- [5. Accessibility and interaction](#5-accessibility-and-interaction)
- [6. Customer and product semantics](#6-customer-and-product-semantics)
- [7. Experiment authoring](#7-experiment-authoring)
- [8. Validation](#8-validation)

## 1. Core and overlay boundary

Classify every rule before applying it:

| Layer | Examples | Can an experiment change it? |
|---|---|---|
| Explore Core | business truth, runtime, i18n meaning, Light/Dark, accessibility | No |
| Product Anchor | strict tokens, `.type-*`, shared visual components, subtitle and border conventions | Only outside `product-anchor` |
| Experiment Layer | page-level component model, type scale, spacing, surface, color, interaction, local motion | Yes, when it serves the thesis |
| Convergence | production component mapping and strict evaluator | Only after explicit convergence authorization |

Do not describe an accessibility, security, runtime, business, permission, or
state requirement as a visual experiment.

## 2. Output and shell integrity

- Produce browser-runnable single-file HTML with Vue 3 CDN Global Build,
  Element Plus, Lucide, bilingual Chinese/English content, and working Light/Dark
  themes.
- Start new files from `agione-console-shell-sample-v1.html` through the bundled
  scaffold. An already approved strict prototype may serve as the anchor.
- Preserve TopNav, Sidebar behavior, theme/language controls, Logo constants,
  and shell-managed prototype state-machine behavior. Explore page-level content chrome inside
  `<main>`; do not redesign the global console shell unless the user explicitly
  starts a separate shell-design task.
- Never replace, truncate, re-encode, or print `LOGO_DARK` and `LOGO_LIGHT`.
- Never read or rewrite the complete shell when anchor-driven edits suffice.

Use:

```bash
python3 "<skill-dir>/scripts/scaffold-prototype.py" \
  --slug usage-dashboard \
  --variants 3 \
  --positions product-anchor,product-stretch,frontier \
  --output-dir ./prototype
```

Locate anchors dynamically:

```bash
rg -n "AGIONE_EDIT_|AGIONE_LOGO_DANGER" target.html
```

Editable anchors:

| Anchor | Purpose |
|---|---|
| `AGIONE_EDIT_TITLE_*` | Browser title |
| `AGIONE_EDIT_THEME_VARS_*` | Business and experiment tokens |
| `AGIONE_EDIT_I18N_*` | Chinese and English keys |
| `AGIONE_EDIT_SIDEBAR_*` | Business navigation |
| `AGIONE_EDIT_MAIN_*` | Page-level content and composition |
| `AGIONE_EDIT_SETUP_DATA_*` | Business refs, reactive state, computed values, functions |
| `AGIONE_EDIT_SETUP_RETURN_*` | Values exposed to the template |

## 3. Business truth and i18n

Keep these identical across the comparison set:

- user role, menu, route, page, and object scope;
- field names, metrics, values, units, dates, and status definitions;
- operations, disabled behavior, permissions, validation, and destructive
  boundaries;
- normal, empty, loading, error, locked, threshold, and success semantics;
- Chinese/English meaning.

Presentation may differ; truth may not. Record a user-approved research question
before intentionally omitting a visible value or operation.

- Keep Chinese and English object structures aligned.
- Use nested keys that can map to production `vue-i18n` namespaces.
- Do not hide crowded English copy by shortening product meaning. Improve the
  layout or explicitly review the copy.
- Keep prototype rationale and variant labels out of customer-visible content.

## 4. Runtime health

- Use Vue template syntax, never React/JSX syntax.
- Preserve pinned CDN dependencies and full browser-build paths. Do not add
  Google Fonts or unpinned runtime dependencies.
- Explicitly close Vue, Element Plus, and icon component tags.
- Bind dynamic attributes with `:prop="expression"`; do not put mustache syntax
  inside attribute strings.
- Save the Vue app instance, register plugins and components, mount it, then call
  `lucide.createIcons()`.
- Re-run Lucide after conditional DOM changes, preferably through `nextTick`.
- Keep primary mock data deterministic. Do not use `Math.random()` for visible
  review values.
- Add `data-component` to meaningful custom boundaries so later convergence can
  recover the intended component tree.

## 5. Accessibility and interaction

- Preserve the shell's global `:focus-visible` ring. Never remove an outline
  without an equally visible replacement.
- Give custom clickable non-button elements keyboard semantics and `tabindex`.
- Communicate status through text or icon plus color, never color alone.
- Keep functional-control borders at WCAG 1.4.11 contrast. Decorative borders
  may be quieter.
- Respect `prefers-reduced-motion`. Use motion to explain change, not to decorate
  every surface.
- Keep dangerous actions explicit, confirmable, and visually distinguishable.
- Keep value and unit in one non-wrapping group.
- Verify readable hierarchy in both themes and at the target viewport. A visual
  experiment never permits clipped controls, unreadable text, or hidden focus.

Keep quota and usage thresholds consistent unless the business contract states
otherwise: below 80% normal, 80-99% warning, and 100% or more danger.

## 6. Customer and product semantics

- Anchor each variant to one primary business goal and at most one secondary
  goal.
- Keep one dominant reading entry per screen. Experimental density may add more
  information, but it must not create competing first-attention targets without
  making that competition the explicit research question.
- Keep view navigation semantically stronger than filters. Filters narrow one
  view; tabs or equivalent navigation switch business objects, schemas, or
  metric definitions.
- Give a visual block one functional boundary. Do not create accidental double
  table frames or nested borders that communicate no hierarchy.
- Use process status, category, and alert semantics consistently even when their
  visual treatment changes.
- Keep service/capability locked states explicit about the disabled subject,
  available value, boundary, and next action. Do not expose internal probes or
  implementation state machines.
- Keep shell-managed BalanceBox singular. Hide it only when the requirement
  explicitly removes balance from the product context.

## 7. Experiment authoring

Define experiments through scoped values rather than anonymous global changes:

- use `--biz-<feature>-<role>-*` for business-semantic values;
- use `--exp-<variant>-<role>-*` for experimental visual values;
- define theme-safe foreground/background pairs for Light and Dark;
- keep third-party brand colors scoped to the brand element and cite the source
  in a CSS comment;
- avoid inline hex colors in `<main>`; bind through scoped semantic variables;
- use scoped `<feature>-<part>` classes and `.is-*` state modifiers.

Experimental positions may author custom `font-size`, `font-weight`,
`line-height`, spacing, radius, shadow, gradients, and transitions inside their
scoped classes when those choices serve the thesis. Keep the shell font stack
unless typeface exploration is explicitly requested; never add a remote font
dependency silently.

Outside `product-anchor`, shared controls are optional. Choose any page-level
component model, custom DOM, visualization, or control structure without a
component-replacement permission step. Preserve required information,
states, operations, keyboard behavior, responsive capacity, and customer
meaning. Record the chosen `component-strategy` and material
`production-deltas` only to explain the later convergence cost.

## 8. Validation

Run Explore Core for every file:

```bash
bash "<skill-dir>/scripts/check-prototype.sh" target.html
```

Run the Product Anchor overlay only for the anchor:

```bash
bash "<skill-dir>/scripts/check-product-anchor.sh" anchor.html
```

Run the complete comparison contract:

```bash
bash "<skill-dir>/scripts/check-explore-variants.sh" \
  target-v1.html target-v2.html target-v3.html
```

Mechanical validation cannot prove that variants look meaningfully different.
Render the real files and report `visual review pending` until the comparison is
actually visible to the user.
