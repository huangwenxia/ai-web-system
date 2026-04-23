# Project Mamba Dark Mode Notes

## Read Order

1. Target page `.vue`
2. Visible child components under the same page directory
3. App `src/main.ts`
4. App `src/assets/scss/main.scss`
5. App `src/assets/scss/tailwindcss.css`
6. `apps/common/src/assets/scss/main.scss`
7. `apps/common/src/assets/scss/vars.scss`
8. `apps/common/src/assets/scss/tailwindcss.css`
9. `apps/common/src/layout/hooks/useTheme.ts`

## Theme Mechanism

- `apps/common/src/layout/hooks/useTheme.ts` toggles `document.documentElement.classList.toggle("dark", value === "dark")`.
- `apps/common/src/assets/scss/vars.scss` defines the light tokens on `:root` and the dark tokens on `html.dark`.
- `apps/common/src/assets/scss/tailwindcss.css` maps those CSS variables into Tailwind theme tokens.

Inference: page-local dark-mode fixes should usually consume the existing `--ui-*` and `--el-*` tokens instead of inventing a new palette.

## Override Placement

Prefer app-local removable files:

- `<app>/src/assets/scss/<page-slug>-theme-overrides.scss`
- `<app>/src/assets/scss/<page-slug>-theme.tailwind.css`

Import them here:

- `<app>/src/assets/scss/main.scss`
- `<app>/src/assets/scss/tailwindcss.css`

Keep the actual page/component markup changes small. Add hook classes only when the override file would otherwise depend on fragile utility-class chains.

## High-Risk Patterns

- Tailwind utilities such as `bg-white`, `border-gray-200`, `text-gray-400`, `placeholder:text-gray-300`
- Inline color styles such as `style="color: #4c5df7"`
- Scoped component styles with hard-coded `#fff`, `#f9fbfe`, `rgb(...)`, or pastel gradients
- `!bg-white` or similar utility rules that require a stronger override

## Tailwind Companion File

Use the page-local Tailwind companion file only when one of these is true:

- the page needs its own `@source` registration
- the page needs local `@theme` aliases
- the page needs `@utility` rules that should be removable with the page override

If none of those are needed, keep the companion file minimal and document why it exists.

## Review Standard

After implementing the fix:

1. Re-scan the touched directory with `scripts/audit_dark_mode.py`
2. Compare the report against the new override selectors
3. Call out any suspicious literals that remain intentionally as fallback styles
