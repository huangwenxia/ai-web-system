---
name: mamba-prototype-implementation
description: Convert confirmed prototypes, screenshots, design drafts, HTML prototypes, or interaction specs into high-fidelity project-mamba Vue 3 frontend code, then verify the implementation with the skill's bundled project-mamba docs and validation scripts. Use when Codex needs to implement new or changed project-mamba pages, route views, dialogs, forms, tables, cards, detail pages, or page-local components from an approved prototype for frontend or non-frontend requesters.
---

# Mamba Prototype Implementation

## Mission

Implement approved prototypes in project-mamba frontend code with high fidelity, project-native reuse, and explicit validation. Treat this skill as the execution gate from prototype to code: understand the prototype, locate the owning app/route, reuse the platform component system, implement in Vue 3, then run automated and semantic checks before delivery.

This skill only covers prototype implementation and validation. Do not use it to invent product decisions, perform unrelated maintenance, or hand off to other company-specific skills.

## Source Order

Use this order when constraints conflict:

1. User-confirmed prototype, screenshot, HTML file, design draft, interaction spec, or acceptance notes.
2. Current target repository code: `AGENTS.md`, target app routes, nearby pages, components, APIs, constants, locales, and styles.
3. Target repository public project skills under `.codex/skills`, especially `ui-spec` when present.
4. This skill's bundled docs and scripts.

If the target repository has additional public skills such as `mamba-page-development` or `easybill-ui-component-manual`, read them only when present and relevant. Do not require them when the repository does not provide them.

## Bundled Resources

Read these files progressively from this skill directory:

- `docs/project-mamba-implementation-profile.md`: read for every project-mamba implementation. It defines app topology, route ownership, page-shell selection, validation gates, and final checklist requirements.
- `docs/project-mamba-app-topology-matrix.md`: use only as a facts cache; verify it with current `vite.config.ts`, `src/main.ts`, router entries, and `scripts/verify-project-mamba-topology.mjs`.
- `docs/implementation-review-checklist.md`: read before final delivery and when doing strict pre-implementation review.
- `docs/component-extraction-policy.md`: read when creating or extracting page-local components, hooks, types, constants, or utility capsules.
- `docs/token-and-style-policy.md`: read for visible UI, style, token, Tailwind, Element Plus, popper, scrollbar, or theme decisions.
- `docs/semantic-display-patterns.md`: read for field chips, status fragments, non-tag badges, metrics, and compact semantic displays.
- `docs/implementation-anti-patterns.md`: read when the implementation starts drifting into custom UI, oversized pages, weak reuse evidence, or unclear validation.

Run these scripts from the target project root:

```bash
node <skill-dir>/scripts/verify-project-mamba-topology.mjs --app=<app> --suggest
node <skill-dir>/scripts/check-project-mamba-implementation.mjs <target-files...>
node <skill-dir>/scripts/check-component-structure.mjs --strict <component-or-page-paths...>
node <skill-dir>/scripts/verify-encoding.mjs <target-files-or-dirs...>
git diff --check
```

Use `--all` for topology when changing `apps/*/vite.config.ts` or `apps/*/src/main.ts`. Use `--strict-vue-lines` when an older Vue file is the main carrier of the new prototype work. Use `--allow-empty` only when a scope truly has no matching files, and explain that in the final validation report.

## Intake Contract

Before editing code, establish:

- Prototype source and confirmation status.
- Target app, route, view folder, page name, or enough business wording to infer them from code.
- Page kind: table list, card list, detail, tabbed detail, create/edit form, dialog action, dashboard-like composition, or page-local component.
- Required states: default, loading, empty, error, disabled, permission, create/edit/detail modes, and dark-mode parity when visible.
- Data contract: generated API, existing mock, local sample data, fields, dictionaries, status mapping, query behavior, and submit behavior.
- Acceptance points: layout density, section order, field order, action behavior, icon meaning, responsive expectations, and any known deviations.

If a non-frontend requester gives business wording only, translate it into the contract above by reading code first. Ask only for blocking decisions that change fields, actions, data behavior, or layout.

## Workflow

1. Normalize the prototype into a compact implementation map: sections, controls, fields, actions, states, data, visual details, and acceptance points.
2. Identify app topology and route ownership from current code. Run topology verification when the app or route source is unclear.
3. Scan for reuse before creating UI: target app components, `apps/common`, EasyBill UI when installed, generated API types, constants, locale helpers, utilities, and nearby pages.
4. Choose the page shell and component layer from current project code and `docs/project-mamba-implementation-profile.md`.
5. Design the page split before writing code: page entry, business container components, pure display components, local hooks, types, constants, and component capsules.
6. Implement in the correct layer:
   - Page entry wires route, shared state, and high-level composition.
   - Business containers own data loading, mutations, refresh, and local interactions.
   - Pure display components receive typed props and emit user intent.
   - Component-private hooks/types/constants stay in the same-named capsule.
7. Match the prototype first, then adapt through project tokens and shared components. Preserve observable layout, density, labels, grouping, icon intent, and interaction behavior unless a project rule forces a specific substitution.
8. Run validation scripts and the closest app/package typecheck command available in the target repository. Do not run build commands unless the user explicitly asks for a build in this task; frontend owners manually inspect the page and submit the build after approval.
9. For visible UI, run the app and inspect the route in the browser. Check relevant viewport sizes and light/dark modes when the change touches surfaces, colors, or layout chrome.

## Fidelity And Validation

Compare the implementation with the prototype:

- Structure: shell, section order, route/dialog ownership, grouping, and hierarchy.
- Content: titles, labels, helper text, field order, table columns, card metadata, options, status values, and action names.
- Interaction: search, pagination, create/edit/detail, submit, cancel, destructive confirmation, refresh, disabled, permission, loading, empty, and error states.
- Visuals: spacing, alignment, typography scale, radius, border strength, color semantics, icon mapping, density, responsive behavior, and dark-mode parity.
- Data: API mapping, payloads, response adaptation, formatters, dictionary/status fallback, route query persistence, and refresh behavior.
- Reuse: every custom table/form/detail/card/filter/status/icon pattern has a reuse scan result and a reason if a local implementation remains necessary.

If a mismatch is intentional because project standards override the prototype, record the exact rule and the practical impact.

## Final Report

End with:

- Prototype source, target app, and route/view ownership.
- Files changed.
- Project skills/docs loaded.
- Reuse decisions and local component decisions.
- Validation commands and results, including checked files.
- Browser verification notes for visible UI.
- Fidelity notes: matched points, adapted points, blockers, and residual risks.

Do not mark a check as passed when it did not run. State the reason and the smallest useful fallback check.
