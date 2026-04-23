---
name: mamba-dark-mode-override
description: Analyze and fix dark-mode styling for project-mamba Vue/Tailwind/SCSS pages when the user provides a screenshot, a page/component path, or a directory to audit. Use when Codex needs to trace an app's src/main.ts -> src/assets/scss/main.scss and tailwindcss.css -> apps/common token sources, create removable page-level override files under the app's src/assets/scss directory, import them through main.scss and tailwindcss.css, or scan a directory for hard-coded light colors and missed dark-mode coverage.
---

# Mamba Dark Mode Override

Fix dark-mode regressions without pushing temporary page fixes into shared common styles.

Treat screenshots as evidence of what is visually wrong, but treat the page/component/style import chain as the source of truth for the fix.

## Workflow

1. Read the page chain before writing styles.
2. Decide whether the fix belongs in page-local override files or in shared tokens.
3. Add removable override files under the target app's `src/assets/scss/`.
4. Import the override files from the app-local `main.scss` and `tailwindcss.css`.
5. Audit the touched directory for remaining hard-coded light colors.

## Read Order

Read the following files in this order unless the request is obviously narrower:

1. The target page `.vue`.
2. The child components that render the visible white surfaces.
3. The target app's `src/main.ts`.
4. The target app's `src/assets/scss/main.scss` and `src/assets/scss/tailwindcss.css`.
5. `apps/common/src/assets/scss/vars.scss`.
6. `apps/common/src/assets/scss/tailwindcss.css`.
7. `apps/common/src/layout/hooks/useTheme.ts`.

If the user provides an image path, inspect the image and map each white or bright surface to the DOM region that renders it.

## Trace the Style Chain Fully

- For any dark-mode regression, trace the full chain before writing CSS: target page, child components, the target app's `src/main.ts`, the target app's `src/assets/scss/main.scss` and `src/assets/scss/tailwindcss.css`, then `apps/common/src/assets/scss/vars.scss`, `apps/common/src/assets/scss/tailwindcss.css`, and `apps/common/src/layout/hooks/useTheme.ts`.
- Confirm the real dark-mode root in code before patching. In project-mamba the dark class is applied on `html`, so dark overrides must be scoped with `html.dark`.
- Treat the screenshot as evidence, not as the source of truth. Map each white area to the actual rendered DOM and identify whether it comes from the visible node, a parent surface, a skeleton wrapper, a skeleton item, a drawer body, or an inherited utility class.
- When business files must stay untouched, prefer app-local removable override files imported from the target app's `main.scss` and `tailwindcss.css` instead of editing the `.vue` source.
- Do not stop at the first visible white node. Continue tracing until every parent surface that can bleed through in dark mode has been identified.

## Override Rules

- Default to app-local removable overrides under `<app>/src/assets/scss/`.
- Create one SCSS override file for selector-based overrides imported by `main.scss`.
- Create one Tailwind companion file imported by `tailwindcss.css` when the page needs local `@source`, `@theme`, or `@utility` declarations.
- Keep rollback simple: make it possible to disable the fix by removing the two imports and the two override files.
- Preserve existing page utility classes when practical. Add semantic hook classes only when needed to make the override readable and stable.
- Prefer `html.dark` scope when the light theme should remain unchanged.
- Do not edit `apps/common` token files unless the user explicitly asks for a shared fix.

## Override Hard-coded Light Utilities Completely

- When a page already ships with `bg-white`, `!bg-white`, `border-gray-*`, `text-gray-*`, or Element Plus skeleton classes and the business source cannot change, override those exact existing classes under `html.dark`. Do not add new hook classes unless there is no stable existing selector.
- Replace white surfaces with semantic dark tokens. Do not turn them transparent unless the final design is intentionally transparent.
- Override `background`, `background-color`, and `background-image` together when neutralizing a light surface. `bg-none` only clears `background-image`; it does not remove `bg-white` or any other `background-color`.
- Prefer actual dark border tokens over transparent borders unless the design explicitly removes the boundary. Transparent borders often expose another light layer and make the regression harder to reason about.
- If the page uses Element Plus skeletons, override both the wrapper surface and `.el-skeleton__item`. White often comes from both the container and the skeleton fill variables.
- When multiple earlier overrides conflict, put one final high-specificity rule at the end of the app-local override file that targets the exact existing class chain rendered in DOM.
- For drawers, dialogs, side panels, skeleton cards, and nested list items, check the parent shell and body background as aggressively as the visible card itself. A transparent child on top of a light parent is still a light regression.

## Token Rules

- Write colors with existing tokens only.
- Prefer `--ui-bg-card`, `--ui-bg-muted`, `--ui-border-default`, `--ui-border-strong`, `--ui-text-primary`, `--ui-text-secondary`, `--ui-text-muted`, `--ui-text-on-brand`, `--el-color-primary`, and `--el-color-*-light-*`.
- Avoid raw hex, `white`, `black`, and new ad-hoc palette variables inside page override files.
- When existing templates contain `bg-white`, `border-gray-*`, `text-gray-*`, inline styles, or scoped hard-coded colors, override them from the page-local SCSS file with stronger specificity, and use `!important` only when the original rule already forces it.

## Case Pattern: Hashrate Model Cards And Skeletons

- The failed approach was making the dark-mode skeleton card transparent. That only exposed a lower white surface, so the page still looked white.
- The working approach was to trace the chain all the way through the page and its style imports, then replace every visible white layer with dark tokens rather than trying to hide the top layer.
- In the hashrate model store and deployment drawer case, the effective fix required overriding the existing `bg-white`, `!bg-white`, `border-gray-200`, `.el-skeleton__item`, `.el-drawer`, and `.m-drawer-body` layers together under `html.dark`.
- The successful dark override used app-local override files and existing class chains only. It did not require changing the business `.vue` files.
- The practical rule from this case is simple: when a dark card or skeleton still looks white, assume more than one layer is light and keep tracing until all parent and child surfaces are force-filled with dark tokens.

## File Naming

Prefer these removable filenames:

- `<page-slug>-theme-overrides.scss`
- `<page-slug>-theme.tailwind.css`

Choose a page slug from the route or page directory name. Keep the filenames app-local, not shared under `apps/common`.

## Audit

Run the audit script on the page directory or component directory:

```bash
python scripts/audit_dark_mode.py <target-dir>
```

Use `--suppress-if-line-contains <prefix>` after you add semantic hook classes so the report focuses on still-unhandled literals.

Treat the script output as a review queue, not as proof. Confirm each suspicious line against the override file and the rendered page.

## References

Read [references/project-mamba-dark-mode.md](./references/project-mamba-dark-mode.md) for the project-specific import chain, token sources, and removable override pattern.

## Output Checklist

- Explain the style import chain you used.
- Name the exact override files you created.
- Confirm where those files were imported.
- Confirm that every visible light surface in dark mode was replaced with a dark token rather than hidden with transparency.
- If a card, drawer, or skeleton still looks white, check parent shells, wrappers, and skeleton internals before adding more selectors.
- List the files that still need manual review after the audit, if any.
