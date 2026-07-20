# Product Anchor Shared Component API

Use this reference only for the `product-anchor` implementation or when
estimating strict convergence work. These primitives preserve the production-
near AGIOne component baseline. Do not load this file as an authoring catalog
for `product-stretch` or `frontier`; their page-level component choice is free.

## Contents

- [Boundary](#boundary)
- [Page containers](#page-containers)
- [Operational data](#operational-data)
- [State and feedback](#state-and-feedback)
- [Navigation](#navigation)
- [Forms and multilingual fields](#forms-and-multilingual-fields)
- [Chrome-managed state](#chrome-managed-state)
- [Intentionally omitted composition components](#intentionally-omitted-composition-components)

## Boundary

- In `product-anchor`, use the shared component whenever its documented intent
  matches.
- In `product-stretch` or `frontier`, do not treat these components as defaults
  or ask permission before replacing them. Choose the component model from the
  thesis and record its convergence cost in `production-deltas`.
- For `product-anchor` only, do not invent a private table, filter, status badge,
  alert, empty state, multilingual editor, or page-title control when the shared
  component already expresses the required behavior.
- If a shared component cannot express the intended structure, stop applying
  the anchor overlay and classify that direction as experimental.
- Do not treat these primitives as a page-composition catalog. The strict-only
  KPI, Hero, metric-strip, card, step, and dashboard recipes are intentionally
  absent.
- Shared `HeaderBox`, `PageHeader`, and `DetailPage` do not expose subtitles in
  the anchor.
- Explicitly close every Vue and Element Plus component tag.

## Page containers

### `HeaderBox`

Use for list/management page title, actions, and an optional filter/content
slot.

- Props: `title: String` (required)
- Slots: `actions`, default

```html
<HeaderBox :title="t.pageTitle">
  <template #actions>
    <el-button type="primary">{{ t.create }}</el-button>
  </template>
  <FilterBox><!-- filters --></FilterBox>
</HeaderBox>
```

### `PageHeader`

Use for a light, borderless page/detail/dashboard header.

- Props: `title` (required), `eyebrow`, `eyebrowIcon`, `backLabel`,
  `statusLabel`, `statusColor`
- `statusColor`: `green | orange | red | purple | muted`
- Slots: `actions`, `avatar`
- Event: `@back`

Use `backLabel` only for the single detail back action. Do not add a second
standalone back row or breadcrumb for the same level.

If the thesis needs a different page-header structure, implement it in an
experimental direction rather than adding unsupported props to the anchor's
`PageHeader`.

### `DetailPage`

Use when the standard detail shell itself is not the experiment.

- Props: `title` (required), `tabs`, `activeTab`, `showBack`
- `tabs`: `[{ label, value }]`
- Slots: `actions`, default
- Events: `@update:activeTab`, `@back`

### `.main-box`

Use this full-height root layout around normal pages:

```html
<div class="main-box" data-component="main-box">
  <!-- HeaderBox or PageHeader -->
  <el-scrollbar>
    <div class="scroll-box-inner" data-scroll-box data-component="scroll-box">
      <!-- business composition -->
    </div>
  </el-scrollbar>
</div>
```

## Operational data

### `FilterBox`

- Props: `variant`, `selectedCount`
- Variants: `standard | three-zone | selection | compact`
- Slot: default

Place it in `HeaderBox` or the page toolbar. Do not wrap it in a second card or
create a decorative `.filter-card` substitute.

### `DataTable`

- Props: `data`, `columns` (required), `total`, `page`, `pageSize`, `loading`,
  `emptyText`, `showPagination`, `operationsLabel`, `operationsWidth`
- `columns`: `[{ label, prop, width?, minWidth?, fixed?, align?, sortable?, slot? }]`
- Named column slot scope: `{ row, col, index }`
- Operations slot scope: `{ row, index }`
- Events: `update:page`, `update:pageSize`, `row-click`

```html
<DataTable
  :data="rows"
  :columns="columns"
  :total="total"
  v-model:page="page"
  @update:page-size="pageSize = $event"
>
  <template #status="{ row }">
    <StatusBadge :status="row.status" :label="row.statusLabel"></StatusBadge>
  </template>
  <template #operations="{ row }">
    <TableActions :actions="rowActions(row)"></TableActions>
  </template>
</DataTable>
```

Use `DataTable` for the Product Anchor when it expresses the operational list.
An experimental direction may instead use any custom data surface without a
permission step; Explore Core still requires equivalent fields, operations,
pagination/loading/empty meaning, keyboard access, and business semantics.

### `TableActions`

- Props: `actions` (required), `max` (default `3`)
- Action schema: `{ label, type?, icon?, disabled?, danger?, onClick? }`

Actions beyond `max` move into the shared overflow menu.

## State and feedback

### `StatusBadge`

- Props: `status` (required), `label`
- Built-in states: `active`, `pending`, `expiringSoon`, `inactive`, `revoked`,
  `expired`, `error`

Use it for process/object state. Use a category tag or custom business legend
for non-status classification.

### `EmptyState`

- Props: `icon`, `title` (required), `hint`
- Slot: `action`

Use the action only for first-use emptiness. Search/filter no-result states do
not need a create CTA.

### `Alert`

- Props: `variant`, `title` (required), `desc`, `closable`
- Variants: `success | warning | error | info`

Use Alert for actionable severity, not as a decorative section frame.

### `UsageBar`

- Props: `used` (required), `total` (required), `unit`, `color`, `showText`
- `color`: `auto | primary | success | warning | danger`

The automatic thresholds are normal below 80%, warning at 80-99%, and danger
at 100% or more.

## Navigation

### `Tabs`

- Props: `options` (required), `modelValue`, `variant`
- `options`: `[{ label, value, count? }]`
- Variants: `underline | segmented`
- Event: `update:modelValue`

Use underline tabs for first-level detail sections and segmented tabs for 2-3
compact view/tool switches. Filters must not masquerade as tabs.

### `Breadcrumb`

- Props: `items` (required), `separator`
- `items`: `[{ label, href? }]`

Use only for a genuine path of at least three levels and not together with a
back control that communicates the same hierarchy.

## Forms and multilingual fields

### `I18nField`

- Props: `modelValue: Object` (required), `langs: Array`, `required: Array`,
  `placeholder: String | Object`
- Event: `update:modelValue`

```html
<I18nField
  v-model="form.name"
  :langs="[
    { code: 'zh', label: '中文', required: true },
    { code: 'en', label: 'English', required: true },
  ]"
  :placeholder="{ zh: '输入名称', en: 'Enter name' }"
></I18nField>
```

### `.form-modern`

Every `el-form` uses this structure:

```text
.form-modern
  el-form
    .form-group
      .form-group__head
      el-form-item size="large"
      .form-helper
    .form-actions
```

Use this rhythm for Product Anchor. Experimental forms may choose any grouping,
component, or visual rhythm without consulting this API; they must still
preserve labels, required state, validation, keyboard order, help, and actions.

### Radio choices

In Product Anchor, never expose raw default `el-radio` styling. Choose one
shared pattern:

- title plus description: `.radio-card`
- 2-4 strong modes: `.radio-segmented`
- compact horizontal labels: `.radio-pill`
- ordinary/default choice: `.radio-circle`

## Chrome-managed state

### Prototype State Machine

Define `scenarios`, `defaultScenario`, `activeScenario`, and `scenarioData` as
specified by the shared shell contract. When at least two review states exist,
the shell renders one circular floating trigger at the bottom-right; activating
it opens the compact business-state Select popover. Keep the panel collapsed by
default. Never add another scenario/state control or restore the legacy TopNav
chip/banner.

### BalanceBox

Do not render `BalanceBox` directly. The shell owns it. Override `balance.value`
only when a prototype state needs different data or alert severity:

```js
balance.value = {
  balance: 213.5,
  level: "low",
  currency: "Credits",
  showTopUp: true,
}
```

Valid levels are `normal | low | critical | empty`. Use `null` only when the
requirement explicitly removes balance from the chrome.

## Intentionally omitted composition components

This anchor API does not document strict composition primitives such as
`KpiCard`, `KvCard`, `MetricsStrip`, `HeroBand`, `CardBox`, `DetailSection`,
`StepPills`, or dashboard recipes. Do not load the strict catalog to recover
them during normal exploration.

For Product Anchor, use a runtime primitive only when the anchor thesis needs
it. For experimental positions, do not use this reference to select or reject
components; build the scoped structure that best expresses the thesis.
