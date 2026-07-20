# Strict Page Architecture

Use this reference for page composition, visual hierarchy, page headers,
metrics, tables, drawers, view switches, or custom L3 business UI.

## Contents

- [Primary task and attention](#primary-task-and-attention)
- [Page header](#page-header)
- [Metrics and hierarchy](#metrics-and-hierarchy)
- [One visual boundary per block](#one-visual-boundary-per-block)
- [View navigation versus filter](#view-navigation-versus-filter)
- [Hero and gradients](#hero-and-gradients)
- [Motion](#motion)
- [Common layout patterns](#common-layout-patterns)
- [L3 business UI](#l3-business-ui)

## Primary task and attention

Give each page one primary business task and at most one secondary task. Each
main section must have one focal element: a primary metric, Hero, chart, table,
or decision/action area.

Attention is a shared budget. Color, border, shadow, size, icon, illustration,
and motion all consume it. Remove elements that do not help users understand
state or take the next action. Weaken elements that attract more attention than
their business importance warrants.

Do not add icons merely to decorate every heading/card. Keep affordance icons
for copy, external link, expand, status, warning, or other interaction meaning.

## Page header

Use `HeaderBox` for list/management page titles with actions and filters. Use
`PageHeader` for detail, dashboard, and other light borderless headers. Do not
invent a decorative page-title card around either component.

- Keep the page header to one title line.
- Page subtitles are unsupported.
- Put a detail-page back action at the title's left edge through the documented
  `back-label`/`@back` contract.
- Use a status label for object state or identifier disambiguation.
- Use eyebrow text only in a genuine overview/detail Hero and only when it adds
  entity, batch, billing-cycle, or other context not already stated by
  navigation/title.
- Put 4+ first-level detail sections in the documented underline page tabs.
  Use segmented controls for 2-3 tool/display switches, not page navigation.

Do not create standalone breadcrumb/back rows, repeated descriptions, or page
title cards merely to fill vertical space.

## Metrics and hierarchy

| Metric shape | Strict default |
|---|---|
| One primary metric | Hero with context, not a lone KPI tile |
| 2-3 peer metrics | 2-3 `KpiCard` components |
| 4-6 compact metrics | `MetricsStrip` or compact key-value layout |
| 6-10 facts | `KvCard`/key-value groups |
| Large/sortable/filterable data | `DataTable` |

Never use four or more equal `KpiCard` tiles as a default page composition.
For paired business concepts such as credit/quota, income/expense, or
used/available, prefer two or three semantic Hero cards with primary values and
supporting breakdowns.

Use scoped `--biz-*` tokens so opposing business concepts remain visually and
semantically distinct. Do not color every concept with primary purple.

Dashboard pages follow `design-system/dashboard.md`; normal page exceptions do
not override the dashboard-specific section/chart contracts.

## One visual boundary per block

- Do not wrap `FilterBox`, `DataTable`, `KpiCard`, or `MetricsStrip` in a second
  bordered/card container.
- Do not nest `CardBox` inside `CardBox`, or wrap `KpiCard` in `CardBox`.
- A table inside a custom card needs one outer frame, `overflow: hidden`, no
  table outer border, collapsed cell borders, and one header divider.
- Do not use colored left borders as card or section-title decoration. Severity
  bars belong to Alert only.

## View navigation versus filter

A control is navigation when it changes the main content, schema, metric
definition, or business object. Present it as a clear tab/section switch near
the section title and align it with the content below.

A control is a filter when it narrows the same data structure by status, owner,
time, or another condition. Put it in `FilterBox` or the toolbar.

List/Grid, 7d/30d, and Compact/Comfortable may use segmented controls because
they change presentation or a compact context, not the page's business object.

Keep refresh, export, sort, time context, and secondary actions in the tool
area; do not hide primary view navigation there.

## Hero and gradients

Overview and detail Hero areas may use eyebrow → title → body/context → points
when all layers add information. List, table, form, settings, and operational
pages normally need only the page title.

A low-saturation tokenized gradient is allowed on the main header/Hero card
when it strengthens hierarchy. It must remain readable in both themes and must
not spread to the whole page, every KPI, tables, or filters. Avoid neon,
high-saturation purple-blue, decorative orbs, bokeh, and texture noise.

## Motion

Use the shell's `anim-*` presets for strict entrance and transition behavior.
Choose duration and easing by meaning: ease-out for entry/hover, ease-in for
exit, ease-in-out for reversible switches, and spring only for a primary
attention response.

Do not stack multiple entrance presets on the same subtree. Normal cards and
table rows never translate or scale on hover. A Hero/primary CTA may use a
single subtle emphasis only when it serves the primary task. Preserve the
shell's reduced-motion behavior.

## Common layout patterns

- Drawer: 480-560px normally, up to 640px for dense data; sticky header/footer;
  summary first, actions last.
- Filter row: search and conditions left, flexible spacer, sort/view/export and
  secondary actions right.
- Progress thresholds: below 80% normal, 80-99% warning, 100%+ danger.
- Dense technical facts: prefer one `MetricsStrip` frame over five independent
  cards.
- Flow status: visually distinguish done, verified, current, and todo through
  the shared status/step components.

## L3 business UI

L3 is allowed when the catalog has no correct representation, for example a
domain-specific flow, Sankey, event stream, quota grid, product/SKU card, or
specialized technical visualization.

L3 still must:

1. Use shared and scoped business tokens.
2. Use `.type-*` utilities.
3. Keep peer-card typography consistent.
4. Give the primary number or visualization appropriate focal weight.
5. Extract genuinely repeated style blocks instead of accumulating dozens of
   duplicate inline declarations.

Custom structure is not a Rule Gap when it follows these extension rules. A
reusable pattern seen repeatedly should be proposed for promotion to L2 rather
than copied indefinitely.
