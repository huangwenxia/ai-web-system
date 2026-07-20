# Strict Workflows

Read this reference for new generation, `--from`, `--edit`, redesign,
multi-page, or shell-only work.

## Contents

- [Mode selection](#mode-selection)
- [Guided new generation](#guided-new-generation)
- [Direct new generation](#direct-new-generation)
- [`--from` a prototype specification](#--from-a-prototype-specification)
- [Incremental `--edit`](#incremental---edit)
- [Explicit redesign](#explicit-redesign)
- [Page partials](#page-partials)
- [Multi-page navigation](#multi-page-navigation)
- [Shell-only requests](#shell-only-requests)
- [Responsive contract](#responsive-contract)
- [Review handoff](#review-handoff)

## Mode selection

- Use guided strict by default for new designs, `--from` with unresolved UI
  decisions, multi-page generation, and structural redesign.
- Use direct strict for `--direct`, explicitly locked UI decisions, and
  non-structural `--edit`. A from-zero `--direct` request still builds the
  material decision inventory internally and lets the model resolve it.
- Treat a selected `agione-ui-explore` variant as a locked visual direction and
  converge it through `--direct --edit`.

Read `references/guided-design-workflow.md` before a guided run.

## Guided new generation

1. Establish the business contract before presenting visual choices.
2. Confirm the page inventory and review order.
3. Before the first choice, build the complete material decision inventory for
   the current page.
4. Review one pending named decision per round; one answer locks only that decision and its stated scope.
5. Re-read the requirement after the apparent last choice and require
   `unresolved-material-decisions=0`.
6. Do not write candidate previews or decision-state files into the project.
7. After the current page reaches zero unresolved decisions, scaffold exactly
   one target:

   ```bash
   python3 "<skill-dir>/scripts/scaffold-prototype.py" --output target.html
   ```

8. Insert the selected strict partial and implement only the resolved blueprint.
9. Render the real AGIOne target for integrated approval.
10. Apply adjustments to the same target; never create guided prototype
   versions.
11. For multi-page work, repeat the inventory and decision gates before adding each page to the
   same target.
12. Run `python3 "<skill-dir>/scripts/evaluate-prototype.py" target.html` after
    final integrated approval.

Conversation-native previews or temporary snippets help the user choose; they
are not deliverables and do not replace rendering the real AGIOne target.

## Direct new generation

1. Read the requirement and establish one business contract before creating
   files.
2. For every from-zero page, build the same material decision inventory used by
   guided strict.
3. Set `decision-source=model-direct`, select every item under the strict
   catalog, resolve dependencies, and reach
   `unresolved-material-decisions=0` without presenting intermediate choices.
4. Scaffold from the shared shell:

   ```bash
   python3 "<skill-dir>/scripts/scaffold-prototype.py" --output target.html
   ```

5. Use the page type already resolved through selection tree ⓪ in the inventory
   and insert its matching inner partial when available.
6. Implement the model-resolved blueprint through business anchors only; do not reselect a component or interaction during implementation.
7. Run `python3 "<skill-dir>/scripts/evaluate-prototype.py" target.html`.

Never start from `agione-design-system.html` or a preview template. Those files
contain review/demo context and are not runtime shells.

## `--from` a prototype specification

- Treat the specification's menu/page/function tables as a contract.
- Preserve role, page names, fields, states, operations, units, and explicitly
  required mock values.
- Map every menu item to one stable lowercase key.
- Keep all pages in one HTML document and switch them with `activeNav` plus
  `v-show`; do not add a router, iframe, or dynamic module loader.
- Reinitialize Lucide after page switches.
- Default to guided strict when fields and functions are complete but material
  UI decisions remain unresolved.
- Use direct strict when the specification explicitly locks the relevant UI
  decisions or the invocation includes `--direct`. When some decisions are not
  locked under `--direct`, let the model resolve them through the internal
  inventory instead of asking the user.
- For later functions in the same requirement, prefer `--edit` so existing
  chrome, pages, and data remain stable.

## Incremental `--edit`

Keep a non-structural edit direct. If the request changes page architecture,
primary hierarchy, or a material interaction model, re-enter guided strict
unless the invocation includes `--direct`.

1. Find all current anchors and the requested page section with `rg -n`.
2. Read only the small windows that contain the exact old text.
3. Edit the smallest possible region.
4. Preserve all unrelated pages, mock data, translations, and setup values.
5. Re-run the full evaluator, not only a grep for the changed element.

Do not replace a complete `<main>` merely to change one page. Do not rewrite the
complete file. Never read a window that crosses the dynamically discovered Logo
danger region.

## Explicit redesign

Treat “重新设计”, “重做”, “推翻重来”, “start over”, “from scratch”, “fresh
take”, or equivalent language as a structural reset:

- Scaffold a new shell.
- Use the previous prototype only to identify the user's dissatisfaction and
  required business facts.
- Build a fresh material decision inventory. Enter guided strict before writing
  the new structure unless `--direct` was explicitly requested; with `--direct`,
  let the model resolve the fresh inventory internally.
- Recompute information groups, focal point, component tree, and visual rhythm.
- Do not carry over the old card grid or hierarchy merely because it is cheaper.

Record a short note:

```html
<!--AI-NOTES
redesign:
  old-version: <path>
  reason-for-redesign: <observed problem>
  new-approach: <new hierarchy>
AI-NOTES-->
```

## Page partials

| Page type | Partial | Extra reference |
|---|---|---|
| List/management | `design-system/partials/standard-list-page.partial.html` | components/forms reference |
| Detail | `design-system/partials/detail-page.partial.html` | page architecture reference |
| Overview | `design-system/partials/overview-page.partial.html` | page architecture reference |
| Dashboard | `design-system/partials/dashboard.partial.html` | `design-system/dashboard.md` |
| Wizard/marketing/special | No forced partial | build from catalog + strict rules |

Read only the chosen partial. Partials are business-area fragments and must be
inserted inside the shell's `AGIONE_EDIT_MAIN_*` region.

## Multi-page navigation

Use one unique English lowercase key per menu/page. Keep every page section in
the DOM so state survives navigation:

```html
<section v-show="activeNav === 'overview'">...</section>
<section v-show="activeNav === 'api-keys'">...</section>
```

Expose `activeNav` and the navigation handler from `setup()`. Call Lucide after
the page becomes visible.

## Shell-only requests

Keep TopNav, Sidebar, themes, language switch, Logo, state-machine/Balance chrome,
and runtime interactions intact. Leave `<main>` as a quiet stage with minimal
placeholder content; do not invent a sample business dashboard.

## Responsive contract

- Design baseline: 1440px.
- Minimum supported desktop width: 1280px.
- At narrower widths, reduce card columns and allow the shell's Sidebar/top
  navigation collapse behavior.
- Prevent value+unit pairs from wrapping independently.
- Avoid fixed-width text containers except where a stable ID/code column needs
  one.

## Review handoff

Reference files by path; never paste a complete generated HTML into a review
prompt. In guided strict, render the real target before handoff and let the user
return to a named decision gate. Then review in two passes:

1. Engineering: shell integrity, Vue syntax, tokens, themes, accessibility,
   evaluator result.
2. Business: page/function coverage, fields, states, operations, permission,
   error copy, amounts, and units.
