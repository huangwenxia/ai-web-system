# Strict Components and Forms

Use this reference for component selection, lists/tables, forms, radio choices,
multilingual fields, dialogs, and L1/L2/L3 decisions.

## Contents

- [Component decision order](#component-decision-order)
- [Component boundaries](#component-boundaries)
- [Standard list page](#standard-list-page)
- [Forms](#forms)
- [Multilingual fields](#multilingual-fields)
- [Radio and choice controls](#radio-and-choice-controls)
- [Dialogs, drawers, and confirmations](#dialogs-drawers-and-confirmations)
- [Tables and data formatting](#tables-and-data-formatting)
- [Custom components](#custom-components)

## Component decision order

1. Select a page skeleton through selection tree ⓪.
2. Apply the strict invariants in `SKILL.md` and `references/base-spec.md`.
3. Search `design-system/catalog.md` by user intent.
4. Follow the catalog signal:
   - `STOP`: inspect the component signature and use it.
   - `TREE-N`: read only tree N in `selection-rules.md`, then use its result.
   - `READ`: read the referenced component example only when implementation
     detail is genuinely needed.
5. Read the chosen component's props/slots in `api-cheatsheet.md`.

Do not read the entire component library. Do not replace a catalog component
with private DOM because its API was not checked.

## Component boundaries

Runtime Vue components already establish their own boundary. Add
`data-component="<semantic-name>"` to custom DOM components and page skeleton
boundaries so HTML-to-Vue conversion can recover the intended tree.

Use semantic feature-part names for custom L3 classes and `.is-*` state
modifiers. Do not create global generic classes such as `.card2` or `.box-new`.

## Standard list page

Use the standard list partial. Its intended structure is:

1. `MainBox`/full-height column.
2. `HeaderBox` or `PageHeader` with primary action.
3. `FilterBox` without a second wrapper card.
4. Scrollable business area.
5. `DataTable` with `StatusBadge` and `TableActions` slots as needed.

Do not downgrade to a raw Element Plus table when `DataTable` can express the
requirement. Do not wrap filters or the table in decorative cards.

## Forms

Every Element Plus form uses `.form-modern` and the documented structure:

```text
.form-modern
  el-form
    .form-group
      .form-group__head
      el-form-item
      .form-helper
    .form-actions
```

- Use large form controls for the documented 40px control rhythm.
- Keep helpers adjacent to the field they explain.
- Put destructive and primary actions in predictable footer/action areas.
- Preserve validation and disabled/loading behavior from the requirement.
- Use action-specific button text rather than “确定/Confirm/Submit”.

## Multilingual fields

Use `I18nField` whenever one business field has multiple localized values. Do
not create parallel Chinese/English inputs manually. Keep non-localized fields
as normal controls.

## Radio and choice controls

Do not expose raw default `<el-radio>` styling. Choose by data shape:

- Choice has title plus description → radio card.
- 2-4 mutually exclusive strong modes → segmented radio.
- Compact horizontal choices → radio pill.
- Ordinary/default selection → radio circle.

Functional borders must use `--ui-border-interactive`. Preserve keyboard focus
and selection semantics.

## Dialogs, drawers, and confirmations

- Use drawers for dense editing/detail workflows that benefit from retained
  page context.
- Use modal dialogs for focused decisions or short forms.
- Use popconfirm/confirmation for destructive actions.
- Keep one primary action and one clear cancellation path.
- Do not use a modal to hide the primary explanation of a locked service; that
  information belongs on the page.

## Tables and data formatting

- Use deterministic mock rows that cover important states.
- Put numbers, amounts, dates, IDs, and code in `.type-data`.
- Keep value and unit in one non-wrapping inline group.
- Extract repeated date/money/percent formatting into setup functions rather
  than complex inline template expressions.
- Use short copy/copy-success feedback for vouchers, IDs, keys, and links.

## Custom components

Use L3 only after confirming the catalog lacks the required business form. L3
must follow the base tokens, typography, accessibility, semantic-content, and
page-architecture rules. If the same pattern is approved and reused repeatedly,
promote it to L2 and update shell/catalog/API documentation together.
