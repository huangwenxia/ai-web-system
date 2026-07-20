# Product Anchor Overlay

Apply this overlay only to the `product-anchor` variant. It provides an honest
AGIOne strict-near baseline without constraining `product-stretch` or `frontier`.

## Contents

- [Purpose](#purpose)
- [Visual tokens](#visual-tokens)
- [Typography](#typography)
- [Shared components](#shared-components)
- [Composition and surfaces](#composition-and-surfaces)
- [Validation](#validation)

## Purpose

Use the anchor to answer:

- What would ship with the lowest design-system and frontend cost?
- Which benefits of an experimental direction justify its convergence cost?
- Which product semantics should remain familiar even if presentation changes?

Describe the shared component approach in `component-strategy` and set
`production-deltas: none`. If the anchor needs a production delta, it is a
`product-stretch` direction instead.

## Visual tokens

Use AGIOne/mamba semantic tokens for every value with a documented token:

- color: `--ui-color-*`, `--ui-text-*`, `--ui-bg-*`, `--ui-border-*`;
- spacing: `--ui-space-*`;
- radius: `--ui-radius-*`;
- shadow: `--ui-shadow-*`;
- duration and easing: `--ui-duration-*`, `--ui-ease-*`;
- icon size and z-index: `--ui-icon-*`, `--ui-z-*`.

Use scoped `--biz-*` values only for business semantics. Do not add `--exp-*`
tokens to the anchor.

Keep primary/status solid fills paired with their documented on-color. Keep
subtle backgrounds paired with the matching semantic foreground. Use literal
layout values only when no semantic token exists.

## Typography

Use shared utilities instead of authoring `font-size`, `font-weight`,
`font-family`, or `line-height` in business content:

| Class | Intended use |
|---|---|
| `.type-hero-data` | 44px dashboard hero data |
| `.type-display` | largest Hero value |
| `.type-display-sm` | primary card/detail metric |
| `.type-h1` | page title when no runtime component owns it |
| `.type-kpi` | 28px mono KPI value |
| `.type-h2` | section title |
| `.type-h3` | card/dialog title |
| `.type-body` | body copy |
| `.type-body-sm` | table or secondary content |
| `.type-caption` | helper or label text |
| `.type-data` | number, money, date, ID, code |
| `.type-table-header` | table header |

Do not override typography already owned by runtime component or chrome classes.

## Shared components

Use the shared component when its documented intent matches:

- `HeaderBox`, `PageHeader`, or `DetailPage` for page structure;
- `FilterBox`, `DataTable`, and `TableActions` for operational lists;
- `StatusBadge`, `Tag`, `Alert`, `EmptyState`, and `UsageBar` for state;
- `Tabs` and `Breadcrumb` for navigation;
- `I18nField`, `.form-modern`, and shared radio variants for forms.

Do not manufacture a visual substitute for a correct shared component. Load
`references/chrome-components.md` for APIs.

Page subtitles are unsupported in the anchor. Put context in a status label,
section-local content, or a customer-relevant body block.

## Composition and surfaces

- Keep one primary attention target per screen.
- Prefer no more than three equal KPI cards.
- Avoid wrapping a bordered component in another bordered card.
- Avoid a raw table when `DataTable` expresses the same operational structure.
- Keep raw tables collapsed and free of duplicate outer/table borders.
- Do not use colored left borders as generic card or heading decoration. Use an
  Alert stripe only for actual alert severity.
- Keep normal card and row hover to color/shadow changes; do not translate or
  scale ordinary operational surfaces.
- Keep HeaderBox/PageHeader title treatment, filters, forms, and common controls
  visually aligned with the product shell.
- Use low-saturation tokenized gradients only for a primary Hero when they
  improve hierarchy. Do not use page-wide decorative backgrounds.

## Validation

Run:

```bash
bash "<skill-dir>/scripts/check-product-anchor.sh" anchor.html
```

The overlay runs Explore Core first, then strict typography, border, and subtitle
checks. It does not validate the business contract or visual comparison by
itself; run the complete set validator afterward.
