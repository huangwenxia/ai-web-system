# Explore Strategy

Read this reference for every explore request.

## Contents

- [Explore a decision](#explore-a-decision)
- [Decision levels](#decision-levels)
- [Material decision inventory](#material-decision-inventory)
- [Design positions](#design-positions)
- [Exploration axes](#exploration-axes)
- [Component freedom and production deltas](#component-freedom-and-production-deltas)
- [Variant planning](#variant-planning)
- [Real and false diversity](#real-and-false-diversity)
- [Refine and fresh redesign](#refine-and-fresh-redesign)
- [Final comparison](#final-comparison)

## Explore a decision

Use variants to help the user choose how the product should explain and feel,
not merely to produce more files.

Start with one shared business contract. Name the decision in concrete terms:

- relationship-led versus person-led;
- quiet operations surface versus expressive editorial surface;
- dense direct scan versus progressive disclosure;
- static overview versus one inspectable interaction;
- production-near controls versus a domain-specific control model.

If the user cannot make a product decision from the comparison, the variants do
not justify their cost.

## Decision levels

Do not collapse a component choice, page completion, visual-style choice, and
production convergence into one event.

- A **material choice** locks only one named decision and its explicitly stated
  scope. A page-skeleton choice does not approve child components, information
  grouping, action placement, state treatment, or navigation containers.
- A **page blueprint** is complete only when every material decision is
  `selected`, explicitly `deferred-to-final-set`, or `not-applicable`.
- A **style choice** selects one of the fully rendered Explore artifacts. Mark
  that artifact `approved` and keep it available for more exploration or
  refinement.
- A **convergence command** is a separate explicit request to use `agione-ui`,
  align for production, or hand the result to PM/frontend.

Selection is not convergence. Never infer the convergence command from “choose
S2”, “use the second style”, or equivalent preference language.

## Material decision inventory

Inventory decisions page by page before planning final variants. Use stable IDs
and review the smallest meaningful question that can change the design:

- page skeleton and dominant reading entry;
- representation of each major content region, for example table, cards,
  document rows, timeline, or a domain-specific surface;
- information grouping and disclosure depth;
- primary, secondary, and destructive action placement;
- dialog, drawer, new page, inline expansion, or another interaction container;
- progress, status, exception, locked, empty, and destructive confirmation
  treatments when they change hierarchy or user confidence.

Treat a choice as material when it changes reading order, comparison behavior,
information persistence, screen transition, risk perception, or task completion.
Do not ask the user to choose ordinary button anatomy, input mechanics, focus,
pagination, or accessibility correctness unless the requirement makes it a real
product decision.

In guided mode, review one decision per round unless the user explicitly
requests batching. A choice locks only the named decision. Do not silently copy
it to sibling regions or infer whole-page approval. In `--direct`, let the model
select every inventory item without presenting intermediate candidates or
waiting for approval. Both paths reach
`unresolved-material-decisions=0` before final variant generation.

## Design positions

### `product-anchor`

Use one honest production-near baseline.

- Apply `references/product-anchor.md`.
- Set `component-strategy` to the shared AGIOne component approach and
  `production-deltas: none`.
- Prefer a user-authorized, annotated copy of the approved strict prototype when
  one already exists.
- Do not weaken the anchor merely to make experimental variants look bolder.
- When a page-skeleton decision is selected, express that named choice with
  shared AGIOne components without treating child decisions as already locked.

### `product-stretch`

Stretch the product language while remaining recognizably AGIOne.

- Choose the page-level component model freely; shared components are optional.
- Keep the global product shell and familiar business/control semantics.
- Use scoped experiment tokens and custom composition.
- Describe the component strategy and material production deltas.
- Make the benefit and convergence cost explicit.

### `frontier`

Test a meaningful boundary rather than an arbitrary style.

- Choose any page-level components, custom DOM, visualization, or interaction
  model that makes the boundary test meaningful.
- Change at least one visual-language dimension, not only DOM structure.
- Keep Explore Core, business truth, and accessibility intact.
- Record DS-external or custom structures as production deltas to evaluate,
  never as production replacements already approved.

Default sets:

| Count | Positions |
|---|---|
| 2 | `product-anchor`, `product-stretch` |
| 3 | `product-anchor`, `product-stretch`, `frontier` |

The user may request two experimental directions around an existing anchor. In
that case, copy the approved anchor with authorization, add only `AI-NOTES`, and
validate that copy as part of the 2-3 file comparison set.

After the page blueprint is complete, every final position must honor its
selected component families, grouping, action placement, and interaction
containers. Positions may vary a material component or interaction only when
that named decision was explicitly `deferred-to-final-set`. The positions
describe production distance, not permission to discard resolved choices.

## Exploration axes

Select one primary and at most one secondary axis.

| Axis | Useful decisions |
|---|---|
| `composition` | Hero, relationship map, timeline, split narrative, progressive drill-down |
| `visual-language` | quiet/expressive contrast, typography rhythm, surface and color character |
| `interaction` | direct scan, hover reveal, scrubber, expandable narrative, spatial selection |
| `density` | operations cockpit, balanced overview, guided low-density surface |
| `content-chrome` | page header, local tabs, contextual rail, content-level navigation |

Do not treat global TopNav/Sidebar branding as a normal page experiment. Start a
separate shell-design task when the user explicitly wants to redesign global
navigation or console chrome.

## Component freedom and production deltas

For `product-stretch` and `frontier`, component choice is free:

- Do not default to `HeaderBox`, `DataTable`, `FilterBox`, cards, or another
  shared component merely because it exists.
- Do not require a component-specific axis or approval before using custom DOM,
  domain-specific controls, unconventional data surfaces, or DS-external
  candidates.
- Choose the component model that best expresses the thesis. Keep it scoped and
  mark meaningful custom boundaries with `data-component`.
- Preserve the business and accessibility behavior contract regardless of the
  implementation structure.

This freedom applies while generating candidates and when `--direct` lets the
model make the decision. After a guided choice is selected, every final variant
must honor it unless that exact decision is `deferred-to-final-set`.

Use two descriptive `AI-NOTES` fields:

- `component-strategy`: a plain-language description of the actual component
  model. It is part of the comparison signature.
- `production-deltas`: comma-separated kebab-case notes describing material
  convergence work. They record cost; they do not grant permission.

Common production-delta examples include `custom-component-model`,
`custom-composition`, `typography-scale`, `spacing-rhythm`, `surface-shape`,
`elevation`, `color-expression`, `page-header`, `motion`, and
`content-chrome`. These examples are not an allowlist; a thesis may introduce a
new precise delta name.

Use `production-deltas: none` only for `product-anchor`. Never record business
fields, values, units, permissions, states, validation, runtime, Vue syntax,
i18n, Light/Dark, Logo integrity, keyboard access, focus, contrast,
destructive-action safety, or customer semantic accuracy as production deltas.

## Variant planning

Complete this matrix before creating files:

| Variant | Position | Axis | Focal point | Reading order | Component strategy | Visual language | Interaction | Trade-off |
|---|---|---|---|---|---|---|---|---|
| V1 | product-anchor | ... | ... | ... | ... | ... | ... | ... |
| V2 | product-stretch | ... | ... | ... | ... | ... | ... | ... |
| V3 | frontier | ... | ... | ... | ... | ... | ... | ... |

For every pair, normally differ meaningfully in at least two
comparison-signature fields:

- focal point;
- reading order;
- component strategy;
- visual language;
- interaction model.

The same interaction model may be kept when other fields carry the decision.
For a deliberate pure `visual-language` comparison, one real visual-language
difference is sufficient; keep the DOM, focal point, and interaction honest and
rely on equal-condition rendering instead of manufacturing fake metadata.

## Real and false diversity

Real diversity:

- identical content hierarchy rendered once as a quiet operational surface and
  once as an expressive editorial surface with a different type/surface rhythm;
- relationship map versus profile dossier;
- number-first overview versus event progression;
- dense operator cockpit versus progressive drill-down;
- shared table versus a domain-specific spatial control that changes how the
  user understands or acts on the same business truth.

False diversity:

- same card grid with different card counts;
- arbitrary purple, blue, and green skins with no semantic thesis;
- the same Hero moved left, center, and right;
- renamed `data-component` values that preserve the same reading path;
- “minimal,” “modern,” or “premium” labels without observable decisions;
- added animation or gradients that do not change comprehension.

Use this check: after hiding variant labels, can a reviewer describe a different
reading path, visual character, or interaction benefit and cost? If not, replace
the weaker direction.

## Refine and fresh redesign

For `--refine`, keep the selected prototype outside the named region unchanged.
Compare 2-3 region variants with a real structural, visual-language, or
interaction difference. Do not generate color swatches disguised as region
variants.

Treat “重新设计”, “重做”, “推翻重来”, “from scratch”, “fresh take”, and
equivalent language as a reset. Scaffold from a fresh shell. Read an older
prototype only for business truth and the user's dissatisfaction; do not reuse
its component tree or visual hierarchy as the default thesis.

## Final comparison

After mechanical validation, render the real files under identical conditions
and ask:

1. Is the first-attention target visibly different where intended?
2. Does the reading order match each note?
3. Is the visual language genuinely different, not only named differently?
4. Does each component strategy and production delta visibly serve the thesis?
5. Does each direction expose a concrete benefit and production cost?
6. Are business truth, Light/Dark, and accessibility still intact?

If any pair fails, revise or replace the weaker direction. Do not add more
decoration to rescue an undefined thesis.

When the user selects a final style, mark that artifact `approved`, keep the
comparison set intact, and wait for the next Explore instruction. Do not invoke
`agione-ui` until the user separately gives an explicit convergence command.
