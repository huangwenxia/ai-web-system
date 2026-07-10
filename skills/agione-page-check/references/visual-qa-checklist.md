# Visual QA Checklist

Use this checklist for Standard or Deep checks involving presentation, i18n, responsive layout, theme states, screenshots, or extreme values. Apply only the relevant items and report omitted coverage.

## Customer-Facing Copy And I18n

- No untranslated labels, raw locale keys, placeholder text, or mixed-language fragments.
- Follow the app-specific i18n convention. Do not add locale wiring to Wanmore areas that explicitly use hardcoded customer copy, but still check wording consistency and untranslated residue.
- English UI uses sentence case unless a product term requires otherwise.
- AGIOne terminology matches the current term base and real business semantics.
- Internal enum names, backend terms, implementation notes, and agent/prototype instructions are not shown to customers.
- Product name and support/contact values come from platform configuration when the page is designed to be branded dynamically.
- Button labels describe commands; status text does not masquerade as an action.
- Error, empty, loading, and locked copy explains the customer-visible state without leaking internal services or stack details.

## Layout Integrity

- No text, icon, badge, tooltip, dropdown, table header, or action column overlaps another element.
- No content is clipped by fixed height, overflow rules, sticky headers, drawers, dialogs, or page-shell containers.
- No unintended horizontal scroll at supported console widths.
- Table headers and rows remain aligned when data is dense.
- Long content uses an intentional strategy: wrap, ellipsis plus tooltip/copy, or a wider column.
- Amount/value and unit stay in one non-wrapping inline group.
- Fixed-format elements have stable dimensions so loading text, hover states, badges, or icons do not shift the layout.
- Dialogs and drawers keep primary actions visible without covering form content.

## Extreme-Data Matrix

Use live data when it already covers the case. Otherwise use temporary, clearly marked mock data without writing it into production code.

- Empty string, `null`, missing field, and empty list.
- Numeric zero and zero-value totals.
- Very large amount or usage value with grouping and expected precision.
- Negative value only when the business domain permits it.
- Long organization, model, provider, customer, member, and role names.
- Long slug, email address, URL, API identifier, voucher, or transaction reference.
- Many tags, roles, products, or badges in one cell.
- Dense pagination, large result count, and long translated labels.
- Missing date bucket in a trend or timeline.

Verify that extreme values do not:

- Resize or shift surrounding controls unexpectedly.
- Hide the value's unit, sign, currency, status, or copy action.
- Cover adjacent rows or action columns.
- Turn an empty/missing value into a misleading numeric zero.

## Viewports

Default AGIOne console checks:

- Primary desktop: `1440x900` or the closest practical viewport.
- Compact desktop: `1280x800`.
- Minimum supported console width when the product defines one.
- Mobile only when the page claims mobile support or the user explicitly requests it.

Before relying on a screenshot, ensure the viewport is wide/tall enough to show the intended state. A cropped automation preview is not proof of a page defect; compare DOM dimensions and the saved image size when necessary.

## Theme And Interaction States

- Light and dark backgrounds preserve readable contrast and component hierarchy.
- Icons and illustrations remain recognizable in dark mode without becoming the visual focus unintentionally.
- Hover, focus, selected, active, and disabled states are visible and semantically consistent.
- Use `getComputedStyle` for disputed colors, opacity, z-index, dimensions, overflow, cursor, visibility, or transitions.
- Trigger hover/focus through real interaction when possible, then compare before/after values.
- Theme switching does not leave stale tokens, invisible text, or mismatched overlays.

## Evidence

For each material finding, capture at least one of:

- Screenshot showing the complete affected container.
- DOM selector plus relevant dimensions/text.
- Computed-style values before and after the state change.
- Viewport size and scroll-width evidence for overflow.

Mark screenshots produced with mock/intercepted data. Restore real requests before using the page as runtime/backend evidence.
