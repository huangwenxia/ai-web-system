---
name: ui-spec
description: Project UI rules for Vue + Element Plus + Tailwind in project-mamba. Use this skill whenever the user asks for a new page, page refactor, style-only change, visual cleanup, layout polish, dark mode work, responsive tuning, or shared theme/component updates in this repo — including requests like “新建页面”, “重构页面”, “改样式”, “改版”, “统一风格”, “暗黑模式”, and “优化布局”. Use it even if the user only names a specific view, dialog, table, form, card, header, or sidebar and does not explicitly say “UI”.
---

# UI Spec — project-mamba

This skill is the source of truth for UI work in this repo. The goal is not to generate a generic pretty page. The goal is to make new pages, refactored pages, and style updates feel native to project-mamba by reusing the existing token system, Element Plus behavior, shared resets, and the current light/dark theme model.

Prefer extending the repo’s existing UI language over inventing a new one.

## Use this skill when

- building a new page, modal, drawer, wizard, tab, detail panel, or shared UI component
- refactoring an existing page or component while keeping most behavior intact
- making style-only changes, visual cleanup, spacing/hierarchy polish, or consistency fixes
- redesigning or aligning forms, tables, cards, filters, toolbars, dropdowns, popovers, dialogs, header, sidebar, or layout chrome
- changing shared styles, semantic tokens, dark mode, responsive behavior, or theme-related files

Do not load this skill for purely data, API, routing, or business-logic changes unless the request also changes visible UI.

## Read first

1. `apps/common/src/assets/scss/main.scss`
2. `apps/common/src/assets/scss/vars.scss`
3. `apps/common/src/assets/scss/tailwindcss.css`
4. `apps/common/src/assets/scss/reset.scss`
5. `apps/common/src/layout/hooks/useTheme.ts`
6. `apps/common/src/layout/hooks/useSetting.ts`
7. the target page/component files
8. if the change affects theme bootstrapping or persistence:
   - `apps/common/src/main.ts`
   - `packages/utils/src/login.ts`

## Architecture

### 1. Theme sources and responsibility

There are four layers. Keep them separate.

- Layer 1: Project semantic tokens in `vars.scss` (`--ui-*`). This is the source of truth for repo-specific visual language.
- Layer 2: Tailwind theme exposure in `tailwindcss.css`. This only maps selected semantic tokens into Tailwind aliases such as `--color-*`, `--radius-*`, and `--spacing-*`.
- Layer 3: Element Plus base variables and shared adaptation. The repo imports `element-plus/theme-chalk/dark/css-vars.css` in `apps/common/src/assets/scss/main.scss`, and `reset.scss` centralizes shared Element Plus overrides.
- Layer 4: Component selectors that consume `--ui-*`, Tailwind theme aliases, and existing `--el-*` variables.

Rules:

- `vars.scss` defines project semantics. Do not turn `tailwindcss.css` or component styles into a second source of truth.
- `tailwindcss.css` is a mapping layer, not a place to redefine the whole design system.
- Keep Tailwind's `@theme inline` aliases pointed at semantic `--ui-*` tokens. Do not treat generated `--color-*` variables as a source of truth.
- `reset.scss` owns cross-app Element Plus adaptation and shared overrides.
- Component files should consume the system, not recreate it.

### 2. When to use `--ui-*` vs `--el-*`

This repo already depends on Element Plus light/dark styling. Treat that as the default foundation.

Prefer `--ui-*` for:

- app shell and project-specific chrome
- page backgrounds, section surfaces, custom cards, navigation, sidebar, topbar, badges, and custom panels
- repo-specific hierarchy, spacing rhythm, custom border language, and shared branded accents

Prefer existing `--el-*` variables or native Element Plus behavior for:

- form control internals
- placeholder, disabled, fill, overlay, and border states that are already part of Element Plus
- internal states of dialogs, poppers, selects, radios, inputs, tables, and other Element Plus components when the native library behavior already matches the need

Important:

- Do not create page-local `--el-*` overrides.
- Do not recreate a second neutral scale just to avoid using Element Plus defaults.
- Only extend root-level `--el-*` mappings when the change is truly cross-app or required to make Element Plus align with the repo’s semantic system.
- If the repo already defines a sanctioned `--el-*` bridge in `vars.scss` or `reset.scss`, reuse it instead of adding more one-off overrides.

A good default is: custom containers and shell use `--ui-*`; native Element Plus anatomy and control states lean on `--el-*`.

### 3. Tailwind vs scoped SCSS

Default stance: use Tailwind first for ordinary composition, and use scoped SCSS when the style needs selectors, complex state, Element Plus adaptation, or component-specific chrome.

Use Tailwind for:

- layout: flex, grid, width, height, min/max constraints
- display, positioning, overflow, responsive visibility/order, and alignment
- spacing and sizing when Tailwind defaults or semantic spacing aliases already fit
- simple typography utilities such as size, weight, line height, alignment, truncation, and wrapping
- simple radius choices through mapped aliases
- consuming mapped semantic tokens through `--color-*`, `--radius-*`, and related aliases
- common semantic aliases in templates, such as `bg-bg-card`, `bg-bg-muted`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-placeholder`, `text-text-disabled`, `border-border`, `border-border-soft`, `ring-ring`, `bg-primary`, and `text-primary-foreground`
- one-off mechanical declarations that would otherwise create a scoped class containing only `display`, `gap`, `padding`, `margin`, `width`, `height`, `border-radius`, `font-size`, `font-weight`, or `text-align`

Use scoped SCSS plus tokens for:

- component identity and reusable local class names
- color, background, border, radius, and shadow styling that cannot be expressed cleanly with existing semantic Tailwind aliases
- hover, active, focus, disabled, and selected states when they require selectors, pseudo-elements, nesting, or multiple coordinated properties
- dropdown, popover, card, panel, header, and sidebar chrome that is more than simple semantic utilities
- transitions tied to theme styling
- animations, pseudo-elements, chart or canvas wrappers, and non-trivial responsive rules
- refactors where the page currently mixes too many one-off utility colors and ad-hoc visual rules

Avoid in shared, common, and layout components:

- `bg-white`, `text-gray-*`, `border-gray-*`, `text-blue-*`
- ad-hoc `rgba(...)` values when an existing token already fits
- one-off classes that only duplicate Tailwind-equivalent layout, spacing, sizing, typography, or radius declarations
- duplicate light/dark selector trees for the same component when variables already solve it
- redefining Tailwind defaults unless the repo genuinely needs a semantic alias

Important:

- Do not duplicate Tailwind’s default spacing scale just to mirror existing numbers.
- If a spacing value is already well served by Tailwind defaults, use the utility directly.
- Prefer semantic Tailwind color aliases over generic Tailwind palette utilities in shared UI.
- Only expose extra spacing tokens in `tailwindcss.css` when they represent a design-system concept such as control, card, or section spacing.

## Dark mode strategy

- Single source of truth: `html.dark`
- Use `useTheme()` from `apps/common/src/layout/hooks/useTheme.ts`
- Initialize theme before app mount with `initTheme()` in `apps/common/src/main.ts`
- Persist manual preference in Storage key `theme`
- Preserve theme across logout in `packages/utils/src/login.ts`
- Let root variables and Element Plus dark css-vars do most of the work
- Prefer variable overrides in `:root` and `html.dark`; do not create a second theme store or per-component theme state
- Do not sprinkle separate `.dark ...` trees through components unless variable-based theming cannot express the need

When styling Element Plus components, assume light/dark support should come from the existing token bridge first, not from duplicated per-page overrides.

## Existing semantic families to reuse

- semantic color primitives: `--ui-color-*`
- page/card/muted/overlay surfaces: `--ui-bg-*`
- text: `--ui-text-*`
- border and ring: `--ui-border-*`, `--ui-ring`
- top navigation: `--ui-topnav-*`
- sidebar: `--ui-sidebar-*`
- badge palettes: `--ui-badge-*`
- table surfaces: `--ui-table-*`
- radius, shadow, and motion: `--ui-radius-*`, `--ui-shadow-*`, `--ui-transition-*`

If a needed value does not exist:

1. first ask whether the need is truly project-specific or already covered by Element Plus
2. if it is project-specific, add one semantic `--ui-*` token in `vars.scss`
3. define both light and dark values
4. only expose it in `tailwindcss.css` if utilities need it
5. only adapt it into `--el-*` in `reset.scss` or root variables if Element Plus truly needs it
6. then consume it from the component

Do not hardcode the same visual value in multiple components.

Default border rule:

- Default to `--ui-border-default` for card outlines, dividers, input-adjacent chrome, and most structural boundaries.
- Use `--ui-border-soft` only when the hierarchy intentionally calls for a lighter secondary edge.

## New page vs refactor vs style-only changes

Choose the lightest change that satisfies the request.

### If building a new page

- match the surrounding app’s structure, spacing, and shell patterns before introducing new layouts
- prefer existing Element Plus building blocks and current repo page patterns over novel compositions
- make surfaces, spacing, filters, cards, and tables feel consistent with nearby pages

### If refactoring an existing page

- preserve behavior, field order, data flow, validation, routing, and business logic unless the user asked to change them
- keep stable selectors, hooks, and integrations when possible
- remove noisy wrappers, repeated inline styles, and duplicated visual rules before rewriting structure
- do not rebuild the whole component tree just because the styling looks old

### If the request is mostly a style change

- avoid touching stores, APIs, and page logic unless the current structure prevents the visual change
- prefer token adoption, shared class cleanup, and scoped SCSS adjustments over broad template churn
- improve hierarchy with spacing, border, typography, and surface treatment before adding gradients or heavy shadows

## Component rules

### Shared/layout/header/sidebar components

- Keep templates structural; use Tailwind utilities for ordinary structure and semantic aliases, and move complex shared chrome into scoped SCSS.
- Header and aside actions should use `--ui-topnav-*` or `--ui-sidebar-*`, not raw light-theme colors.
- Shared icon buttons need visible hover and focus treatment.
- Icon-only buttons should have an accessible label when appropriate.

### Dropdowns, popovers, dialogs, and floating panels

- Floating overlay surfaces can use `--ui-bg-card`, `--ui-border-default`, and `--ui-shadow-pop`.
- Do not apply the floating-surface treatment to inline cards or section containers; those default to bordered, rounded, flat containers without background fill or shadow.
- Active states should use semantic or Element Plus state tokens, not guessed colors.
- Danger actions should prefer `--ui-color-destructive`; use `--el-color-danger` when matching native Element Plus component behavior is the better fit.

### Cards and section containers

- Default card and section-container styling should stay flat and framelike.
- Do not add background fill or shadow by default; prefer transparent or inherited background unless the request explicitly asks for a surfaced container.
- Default to `--ui-border-default` plus an existing `--ui-radius-*` token so cards read as bordered, rounded containers first.
- If hierarchy needs emphasis, prefer spacing, border weight, and typography before adding background or shadow.
- Do not introduce gradient-heavy or glossy containers unless the request clearly asks for that direction.

### Forms, tables, and filters

- Prefer Element Plus component capabilities first.
- Let native Element Plus states remain native unless the repo already centralizes an override.
- Use semantic tokens to align page/container surfaces, borders, and surrounding text hierarchy.
- Put repo-wide Element Plus overrides in `reset.scss` whenever feasible instead of repeating page-level fixes.
- Do not scatter hardcoded overrides for the same Element Plus subparts across multiple files.

## Interaction and accessibility

- Minimum touch target: 40x40 on desktop, 44x44 on mobile for primary and icon actions.
- Provide clear hover and keyboard focus states.
- Use 150–200ms transitions; prefer color, background, border, and opacity changes over transforms that shift layout.
- Maintain readable contrast in both light and dark modes.
- Avoid hover-only disclosure for essential mobile actions.

## Implementation workflow

1. Read the theme entry files and the target page/component.
2. Decide whether this is a new page, a refactor, or a style-only change.
3. Reuse an existing `--ui-*` token, existing `--el-*` token, or current Element Plus behavior before adding anything new.
4. Decide whether the change belongs in `vars.scss`, `tailwindcss.css`, `reset.scss`, or only in the component.
5. If a project-specific token is missing, add it in `vars.scss` with both light and dark values first.
6. Only expose it to Tailwind or Element Plus if there is an actual consumer.
7. Use Tailwind for ordinary composition and semantic aliases; use scoped SCSS for complex states, Element Plus adaptation, and component chrome.
8. Update adjacent shared components only when needed for visible consistency.
9. For UI changes, run the affected app and test the changed flow in a browser when the environment allows it.

## Review checklist

- The change follows the requested scope: new page, refactor, or style-only
- Behavior changed only if the user asked for behavior changes
- No new hardcoded `white`, `gray`, or `blue` styling in shared UI
- Ordinary layout, spacing, sizing, typography, and simple semantic colors use Tailwind before new scoped classes
- Shared colors use semantic Tailwind aliases or `--ui-*` variables, not generic palette utilities
- `vars.scss` remains the source of truth for project-specific semantics
- `tailwindcss.css` is only exposing useful semantic mappings
- `reset.scss` owns shared Element Plus adaptation
- No scattered page-level `--el-*` overrides
- Light and dark both work
- `html.dark` remains the only theme switch
- Hover, focus, and active states are visible
- Popovers, dropdowns, dialogs, and floating panels use shared overlay surfaces and borders
- Cards and section containers default to flat, bordered, rounded containers without default background fill or shadow
- Native Element Plus states still feel coherent after the change
- Changes stay within the requested scope
