# AGIOne UI Base Spec

This is the runtime contract shared by `agione-ui` and
`agione-ui-explore`. In commands below, `<skill-dir>` means the directory that
contains the active skill's `SKILL.md`; resolve it from the loaded skill path
instead of assuming the user's working directory is the skill directory.

## Contents

- [1. Output and shell integrity](#1-output-and-shell-integrity)
- [Code-side authority](#code-side-authority)
- [2. Base visual tokens](#2-base-visual-tokens)
- [3. Typography](#3-typography)
- [4. Vue, components, and i18n](#4-vue-components-and-i18n)
- [5. Shared chrome contracts](#5-shared-chrome-contracts)
- [6. Accessibility and interaction](#6-accessibility-and-interaction)
- [7. Shared product semantics](#7-shared-product-semantics)
- [8. Validation](#8-validation)

## 1. Output and shell integrity

### Code-side authority

Use the latest reviewed `project-mamba` code as the authority in this order:

1. Repository UI rules under `.codex/skills/ui-spec/`.
2. Shared shell integration and components under `apps/common/src/`.
3. The dependency versions resolved by the repository lockfile.
4. The matching installed `mamba-layout` dist only for implementation details
   already adopted by the code baseline.

Do not use npm, unpkg, jsDelivr, or another online `latest` result as the source
of truth. Online publication can lag behind code. The reviewed snapshot and
source hashes live in `references/mamba-code-baseline.json`; refresh them only
after inspecting the corresponding code-side changes.

- Produce browser-runnable single-file HTML with Vue 3 CDN Global Build,
  Element Plus, Lucide, bilingual Chinese/English content, and working
  Light/Dark themes.
- Start every new file from `agione-console-shell-sample-v1.html`. Never rebuild
  TopNav, Sidebar, theme state, Logo, or runtime components by hand.
- Prefer the deterministic scaffold command:

  ```bash
  python3 "<skill-dir>/scripts/scaffold-prototype.py" --output target.html
  ```

- For explore variants use:

  ```bash
  python3 "<skill-dir>/scripts/scaffold-prototype.py" \
    --slug usage-dashboard --variants 3 --output-dir ./prototype
  ```

- Never read the complete shell or a complete generated prototype. The Logo
  base64 lines alone consume substantial context.
- Find current anchors and the current Logo danger region dynamically:

  ```bash
  rg -n "AGIONE_EDIT_|AGIONE_LOGO_DANGER" target.html
  ```

- Read only 30-80 lines around the anchor being edited. The read window must
  contain the exact text used by the subsequent edit.
- Never replace, truncate, or re-encode `LOGO_DARK` and `LOGO_LIGHT`.
- Never rewrite a complete prototype when anchor-driven edits can express the
  change.

Editable anchors:

| Anchor | Purpose |
|---|---|
| `AGIONE_EDIT_TITLE_*` | Browser title |
| `AGIONE_EDIT_THEME_VARS_*` | Add business semantic tokens only |
| `AGIONE_EDIT_I18N_*` | Chinese and English keys |
| `AGIONE_EDIT_SIDEBAR_*` | Business navigation |
| `AGIONE_EDIT_MAIN_*` | Business page content |
| `AGIONE_EDIT_SETUP_DATA_*` | Business refs/reactive/computed/functions |
| `AGIONE_EDIT_SETUP_RETURN_*` | Expose business values to the template |

Treat all other shell regions as locked. If a locked region must change, update
the canonical shared shell and sync both skills; do not patch one prototype or
one skill copy.

## 2. Base visual tokens

Use mamba-native semantic tokens for every visual value that has a token:

- Color: `--ui-color-*`, `--ui-text-*`, `--ui-bg-*`, `--ui-border-*`
- Spacing: `--ui-space-*`
- Radius: `--ui-radius-*`
- Shadow: `--ui-shadow-*`
- Transition: `--ui-transition-fast`, `--ui-transition-base`

Treat `--ui-duration-*`, `--ui-ease-*`, `--ui-icon-*`, `--ui-z-*`, size-scale
radius aliases, and similar shell variables as prototype compatibility
extensions, not mamba-native tokens. Do not introduce them in new business
content when a native token, Tailwind utility, or component-local value covers
the intent. Keep `--ui-border-interactive` as the documented `project-mamba`
local accessibility extension until code-side `mamba-layout` adopts it.

Business-specific colors must use scoped semantic names such as
`--biz-<feature>-<role>-fg|bg|strong|subtle`. Do not add anonymous global color
tokens. Third-party brand colors are the only hard-coded color exception; scope
them to the brand element and document the official source in a CSS comment.

Keep theme-safe foreground/background pairs:

- primary/status solid fills use their documented on-color, normally
  `--ui-text-on-brand`;
- primary/status subtle backgrounds use the matching semantic foreground;
- page/card surfaces use `--ui-text-primary` or the documented muted text;
- TopNav uses `--ui-topnav-foreground`/`--ui-topnav-muted`, never light-theme
  text literals.

Pure layout values such as `flex: 1`, `min-width: 0`, grid column structure, or
a component's contractually fixed width may use literal values when no semantic
token exists.

The locked shell contains production-mirrored literals and prototype
compatibility aliases. They are not authoring precedent for business content;
preserve them unless the canonical shell is being upgraded from the code-side
baseline.

## 3. Typography

Use the prototype type adapters instead of writing scattered `font-size`,
`font-weight`, `font-family`, or `line-height` declarations in business content:

| Class | Intended use |
|---|---|
| `.type-hero-data` | 44px dashboard hero data |
| `.type-display` | largest marketing/hero value |
| `.type-display-sm` | primary card or detail metric |
| `.type-h1` | page title when a runtime component is not responsible |
| `.type-kpi` | 28px mono KPI value |
| `.type-h2` | section title |
| `.type-h3` | card/dialog title |
| `.type-body` | body copy |
| `.type-body-sm` | table or secondary content |
| `.type-caption` | helper/label text |
| `.type-data` | numbers, money, dates, IDs, code |
| `.type-table-header` | table header |

Runtime component and chrome classes already own their typography. Do not
override classes such as `.page-header__title`, `.header-box__title`,
`.kpi-card__value`, `.status-badge`, `.tag`, `.balance-pill`, TopNav, Sidebar,
or `.ds-*` dashboard classes.

These `.type-*` adapters are not exported by `mamba-layout`. During production
porting, map them to the code-side Tailwind typography utilities or owning
component styles; do not copy the class names into `project-mamba` unchanged.

## 4. Vue, components, and i18n

- Use Vue template syntax, never React/JSX syntax.
- Preserve the shell's exact-version CDN dependencies and full browser-build paths.
  Do not introduce Google Fonts domains or unpinned runtime dependencies.
- Explicitly close Element Plus and icon component tags.
- Bind dynamic attributes with `:prop="expression"`; do not put mustache syntax
  inside attribute strings.
- Save the Vue app instance, register plugins/components, mount it, then call
  `lucide.createIcons()`; do not chain the entire operation.
- Re-run Lucide after navigation or conditional DOM changes, preferably through
  `nextTick`.
- Use `html.dark` as the semantic theme switch. The shell's JavaScript token
  maps only emulate the code-side theme runtime for a standalone prototype; do
  not create a second theme mechanism when porting to production.
- Keep mock data deterministic. Do not use `Math.random()` for primary display
  values.
- Keep Chinese and English object structures aligned. Close each language block
  before starting the next one.
- Use nested keys that can map to production `vue-i18n` namespaces.
- Use `<I18nField>` for a single business field edited in multiple languages.
- Wrap every `<el-form>` in `.form-modern` and use the documented form grouping
  structure.
- Use the AGIOne radio variants; never expose raw default `<el-radio>` styling.
- Add `data-component` to custom component boundaries so later HTML-to-Vue work
  can recover the intended component tree.

## 5. Shared chrome contracts

### Prototype State Machine

Use the prototype state machine whenever a requirement contains two or more
reviewable scenarios/states, or explicitly asks to switch prototype state.

The only allowed UI is the shell-provided circular floating trigger at the
bottom-right of the viewport. It opens a compact popover containing the state
Select; the panel stays collapsed by default. Do not create a second switcher
in TopNav, Sidebar, PageHeader, Hero, or `<main>`, and do not restore the legacy
TopNav chip or review banner.

In `setup()` provide:

```js
const scenarios = reactive({
  normal: { label: { zh: "默认", en: "Default" }, data: { mode: "normal" } },
  empty: { label: { zh: "空态", en: "Empty" }, data: { mode: "empty" } },
  error: { label: { zh: "异常", en: "Error" }, data: { mode: "error" } },
})
const defaultScenario = "normal"
const activeScenario = ref(defaultScenario)
const scenarioData = computed(() => scenarios[activeScenario.value]?.data || {})
```

Expose all four values from `setup()`. Keep `normal` as the default key,
`label` as `{ zh, en }`, and the state discriminator in `data.mode`. The shell
shows the floating trigger only when `scenarios` contains at least two entries.
The shell owns `stateMachineOpen`, the trigger/panel focus handoff, Escape
handling, and Lucide refresh; business code must not replace those controls.

The canonical shell must retain fixed `.state-machine-control`, the circular
`.state-machine-trigger`, the `prototype-state-machine-panel` popover,
`v-model="activeScenario"`, and options sourced from `scenarios`. Any
`demo-mode-chip` or `demo-banner` remnant is legacy drift.

### BalanceBox

Keep one shell-managed BalanceBox in the TopNav `header-right` area. It may hide
when the code-side product context does not load balance, such as an operator
tenant or signed-out state. Change `balance.value` only when a prototype state needs
different money/credit data, loading, visibility, or alert severity. Do not
create a second balance pill, top-up button, or balance card elsewhere in the
chrome.

Preserve the code-side responsive shell contract: desktop chrome at 1024px and
above; mobile header, overlay, and drawer sidebar at 1023px and below. Business
content responsive rules do not substitute for responsive global chrome.

## 6. Accessibility and interaction

- Functional control borders use `--ui-border-interactive`; decorative borders
  use `--ui-border-default` or `--ui-border-soft`.
- Preserve the shell's global `:focus-visible` ring. Never remove outlines
  without an equally visible replacement.
- Give custom clickable non-button elements keyboard semantics and `tabindex`.
- Communicate status with text/icon plus color, never color alone.
- Keep quota/usage thresholds consistent: below 80% normal, 80-99% warning,
  and 100% or more danger. Use shared step/status primitives to distinguish
  completed, verified, current, and not-started states.
- Keep normal card and table-row hover feedback to color/shadow changes; do not
  use scale or translation.
- Use motion only when it clarifies a change, and respect the shared reduced
  motion behavior.
- Dangerous actions require explicit confirmation and destructive styling.

## 7. Shared product semantics

- Anchor each page to one primary business goal and at most one secondary goal.
- Before adding text, icons, borders, shadows, animation, or illustration, ask:
  1. What would the user lose if this element were removed?
  2. If it attracts first attention, does it serve the primary task?
- Keep one main attention target per screen.
- Give each visual block one boundary. Do not wrap `FilterBox`, `DataTable`,
  `KpiCard`, `MetricsStrip`, or another card in a second bordered card. A raw
  table inside a framed container must collapse borders and avoid a duplicate
  outer table border.
- Do not use colored left borders as generic card or heading decoration.
  Reserve a severity stripe for an actual Alert. Use `StatusBadge` for state
  and `Tag` for category rather than painting status onto a container edge.
- Customer-visible `<main>` content may explain business state, scope, values,
  risk, results, and available actions. Put prototype rationale, component
  labels, implementation logic, and design trade-offs in `<!--AI-NOTES-->` or
  the handoff message, never in customer UI.
- A control that changes the main content, table schema, metric definition, or
  business object is a view/section switch. Place it near the section title as
  a clear tab or equivalent navigation. Filters only narrow the same view.
- Page subtitles are not supported. Use title, status label, section-local
  context, or actions instead.
- A service/capability locked state must make the disabled subject explicit,
  preserve independently named services as independent choices, state the
  unlocked business value and boundary, and provide one primary contact/action.
  Do not expose deployment probes, internal state machines, or duplicate CTAs.
- `On-Prem Deployment Service` and `On-Cloud Deployment Service` are separate
  services, not model types or one hybrid service. A model already deployed
  outside AGIOne follows its supported external-key integration path rather
  than either deployment-service outcome.
- When English copy is crowded, improve layout capacity before silently changing
  product meaning.
- Low-saturation tokenized gradients are allowed only on a primary header/Hero
  card when they improve hierarchy. Never turn them into a page-wide neon or
  decorative background.

## 8. Validation

For every generated file run the skill-local hard gate:

```bash
bash "<skill-dir>/scripts/check-prototype.sh" target.html
```

The hard gate includes extracted JavaScript syntax validation with
`node --check`. A skill may add stricter overlay validation, but neither strict
nor explore may weaken this shared Base Spec at final delivery.

When maintaining the canonical shell or this Base Spec, also run the offline
code-baseline check:

```bash
bash "<skill-dir>/scripts/check-mamba-drift.sh"
```

When a `project-mamba` checkout is available, verify that the reviewed snapshot
still matches current code instead of querying an online package registry:

```bash
bash "<skill-dir>/scripts/check-mamba-drift.sh" \
  --project-mamba /absolute/path/to/project-mamba \
  --ref origin/test
```
