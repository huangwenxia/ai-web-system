---
name: backoffice-prototype-builder
description: "Generic back-office/admin system prototype generator with IA-first design review and two explicit profiles: generic back-office or AGIOne strict. Use when Codex needs to think through page subject, user task, API responsibilities, content pruning, information hierarchy, profile selection, and then generate a production-aligned standalone HTML prototype for admin/console pages such as lists, details, forms, settings, dashboards, operation pages, and troubleshooting pages."
---

# Backoffice Prototype Builder

Build back-office/admin system prototypes by thinking clearly first, selecting either a generic profile or AGIOne strict profile, then producing a restrained, production-aligned single-file HTML prototype.

This skill is independent. It has no AGIOne-compatible middle mode. Use exactly one of:

- `generic-backoffice`: generic admin shell and self-contained generic tokens.
- `agione-strict`: strict AGIOne product shell, logo, chrome, and PM-review parity.

Generic binding:

- `design-system`: `generic-backoffice`
- `design-profile`: `generic-backoffice`
- `product-identity`: `generic-backoffice`
- template: `assets/backoffice-shell-template.html`
- validator: `scripts/validate_prototype.mjs`

Strict AGIOne binding:

- `design-system`: `agione-strict`
- `design-profile`: `agione-strict`
- `product-identity`: `agione-console`
- template: `assets/agione-product-shell-template.html`
- validator: `scripts/validate_agione_strict.mjs`

Use this when the user asks for strict AGIOne product shell, AGIOne logo, PM-review parity, or pixel-level consistency.

## How To Use The Two Profiles

Use one of these forms when invoking the skill:

- Generic: `Use $backoffice-prototype-builder with profile=generic-backoffice to design a generic admin/back-office prototype for ...`
- AGIOne strict: `Use $backoffice-prototype-builder with profile=agione-strict to design a strict AGIOne Console prototype with product shell, logo, and PM-review parity for ...`
- 中文通用：`用 $backoffice-prototype-builder，profile=generic-backoffice，生成通用后台系统原型：...`
- 中文 AGIOne 严格：`用 $backoffice-prototype-builder，profile=agione-strict，生成严格 AGIOne 产品壳原型：...`

If the user omits `profile`, infer it from the product request:

- Mentions AGIOne, AGIOne logo, AGIOne Console, PM review, pixel parity, production AGIOne chrome, or "和 agione-ui 一样严格" -> `agione-strict`.
- Mentions ordinary admin, console, SaaS back office, management system, CMS, CRM, operation platform, settings, list, form, dashboard, or detail page without AGIOne identity -> `generic-backoffice`.
- Mentions another existing product or design system -> inspect that project's shell and use `target-project`.

Keep the boundary crisp: `agione-strict` is real AGIOne identity and shell discipline; `generic-backoffice` is not AGIOne and must not carry AGIOne logo, chrome, names, or product-specific styling.

## Relationship To Strict UI Skills

Borrow these ideas:

- Strict profile: use `design-system/agione-strict/AI-USAGE.md`, `catalog.md`, `selection-rules.md`, and `api-cheatsheet.md` as AGIOne's component and visual discipline.
- Shell-first generation: start from a reusable HTML shell instead of hand-writing every page from zero.
- Anchor-based editing: change business regions while preserving shared chrome, tokens, and layout discipline.
- IA preflight: decide the page subject, user task, API semantics, and content hierarchy before visual composition.
- Data accountability: every number is real, derived, or explicitly marked as placeholder/assumption.
- Validation: run a deterministic script before delivery.

Keep these differences:

- This skill is generic for back-office/admin systems, not AGIOne-specific.
- The generic template is not AGIOne-derived; it is the non-AGIOne fallback.
- Production consistency means "align with the selected profile"; do not mix generic and AGIOne strict assets in one prototype.
- The output must combine product judgment and prototype generation. Do not skip either half.

## AGIOne Strict Creation

When the user wants AGIOne page design, use strict mode. Do not use a compatible/adapted mode.

Strict behavior:

- Start from `assets/agione-product-shell-template.html`, not the generic shell.
- Preserve AGIOne product chrome, logo base64, theme switcher, language switcher, scenario switcher, and shell runtime.
- Use AGIOne anchors (`AGIONE_EDIT_TITLE`, `AGIONE_EDIT_NAV`, `AGIONE_EDIT_I18N`, `AGIONE_EDIT_MAIN`, `AGIONE_EDIT_SETUP_DATA`, `AGIONE_EDIT_SETUP_RETURN`, `AGIONE_EDIT_THEME_VARS`) exactly as the shell provides them.
- Never read or edit the `AGIONE_LOGO_DANGER` base64 region.
- Follow `design-system/agione-strict/AI-USAGE.md` and component routing strictly.
- Run `node scripts/validate_agione_strict.mjs <target.html>`.
- Also run `python -X utf8 scripts/agione-strict/evaluate-prototype.py <target.html>` for the original AGIOne bash-based gates. The wrapper resolves Git Bash from PATH, `GIT_BASH`, `D:\Program Files\Git\bin\bash.exe`, `D:\Program Files\Git\usr\bin\bash.exe`, and common `C:\Program Files\Git\...` paths.
- Record strict mode in `AI-NOTES`:
  - `design-system: agione-strict`
  - `design-profile: agione-strict`
  - `product-identity: agione-console`
  - `strict-shell: assets/agione-product-shell-template.html`

## Required Resources

- Use `assets/backoffice-shell-template.html` as the default prototype base.
- Use `assets/agione-product-shell-template.html` only for AGIOne strict mode.
- Use `design-system/agione-strict/` only for AGIOne strict mode.
- Run `scripts/validate_prototype.mjs <target.html>` before delivery.
- Do not read or copy another skill's shell template unless the user explicitly asks to build for that product's design system.

## Design System Selection

Select a design system before generating HTML:

1. If the user asks for AGIOne, strict AGIOne shell, Logo, PM review, pixel parity, production AGIOne chrome, or says "像 agione-ui 一样严格", use `agione-strict`.
2. If the user names a project or provides existing frontend code, inspect that project's design system, shared components, tokens, page shell, forms, tables, dialogs, and dark mode. Use it as `target-project`.
3. If the user explicitly asks for another design system, use that system and record it in `AI-NOTES.project-alignment`.
4. Otherwise use `generic-backoffice`.

AGIOne strict files:

- Read `design-system/agione-strict/AI-USAGE.md` for the AGIOne strict generation protocol.
- Read `design-system/agione-strict/catalog.md` when choosing components.
- Read `design-system/agione-strict/selection-rules.md` when deciding page pattern or component alternatives.
- Read `design-system/agione-strict/api-cheatsheet.md` after choosing components.
- Read dashboard files only for dashboard/overview tasks.

Do not use these files in generic mode.

## Operating Modes

Choose one mode from the request:

- `generate`: create a new standalone HTML prototype. This is the default for design/prototype requests.
- `edit`: modify an existing HTML only when the user explicitly asks to edit that file.
- `review`: give IA/design recommendations without producing HTML when the user asks only for review.
- `production-alignment`: inspect an existing project design system and make the prototype visually consistent with it.

When working in an existing project, save new prototypes under the project root `xia_doc/` directory unless the user specifies another path. Create `xia_doc/` if needed.

## Workflow

### 0. Thinking Gate

Do not create, copy, or edit prototype code until the IA decision is clear enough to proceed.

Use this evidence rule before generation:

- If evidence exists, judge from evidence: API definitions, screenshots, existing code, routes, fields, user roles, current page objects, requirement docs, or explicit user instructions.
- If evidence is incomplete but not direction-changing, proceed only with visible assumptions. Record assumptions in `AI-NOTES` and mark unknown business values as placeholders.
- If missing information changes the page subject, user role, primary workflow, metric meaning, risk/status judgment, or action consequence, ask concise blocking questions before generation.

The page is ready for code only when these are known from evidence or explicitly recorded as assumptions:

- Page subject and user role.
- Top user confirmation, decision, or action.
- Page type and primary page pattern.
- API responsibility split or stated data-source limitation.
- Strong business expression decision.
- Content to keep, delete, collapse, or de-emphasize.

Never invent the primary business subject, user role, workflow status, metric meaning, risk judgment, or action consequence. "Think clearly first" means separate facts, assumptions, and blockers; it does not mean fabricate business context.

### 1. Collect Evidence

Inspect available paths, screenshots, routes, API definitions, components, mocks, tables, forms, and current page objects before proposing a layout.

Use `rg` first for local discovery. Capture:

- Page/module name, route, user role, and entry point.
- API calls, response objects, derived values, and action contracts.
- Current or requested modules: header, nav, filters, table/list, form, cards, charts, tabs, drawers, dialogs, detail panels, actions.
- Target project design-system evidence: tokens, page shell, shared components, typography, status badges, tables, forms, dialogs, dark mode.
- Chosen profile: `generic-backoffice`, `agione-strict`, `target-project`, or user-specified.

If evidence is incomplete, write assumptions in the prototype `AI-NOTES` and mark placeholder data visibly in code comments or labels.

Required `AI-NOTES` evidence keys for generated prototypes:

- `evidence-status`: `evidence-based`, `assumption-based`, or `blocked-before-generation`.
- `evidence-used`: concrete files, screenshots, APIs, route names, user instructions, or `none provided`.
- `assumptions`: assumptions used to continue; use `none` when there are no assumptions.
- `blocking-questions`: questions that would change page direction; use `none` only when safe to proceed.
- `ia-readiness`: `ready` only when the Thinking Gate is satisfied.
- `strong-expression-decision`: whether strong business expression is needed and why.

### 2. IA Preflight

Before designing, answer:

- What is the page's primary subject: object, collection, workflow, configuration area, operational task, monitoring question, or diagnostic problem?
- What are the user's top 3 confirmations, decisions, or actions?
- What page type is it: `configuration/profile`, `collection management`, `form workflow`, `business overview`, `business decision`, `operation execution`, or `troubleshooting analysis`?
- Is strong business expression necessary? Why?

Use the answer to prune content. Do not make a simple list, config, or form page feel like a dashboard unless real data and user task justify it.

### 3. Split API Responsibilities

Classify every interface:

- `primary subject`: the page's main object, collection, workflow, or question.
- `collection/list`: rows, children, bindings, records, members, rules, logs, or instances.
- `configuration`: settings, policy, template, permission, quota, or versioned config.
- `aggregate/metric`: counts, sums, rates, distributions, trends, or chart inputs.
- `record/detail`: event, execution, audit, diagnostic, or row expansion evidence.
- `action contract`: create, edit, delete, submit, retry, approve, revoke, export, or operation result.
- `derived display`: calculated values; record the formula or business rule.

Never merge different API subjects into one false page story. Show relationships explicitly: parent/child, collection/item, policy/binding, template/instance, task/log, config/runtime, metric/drilldown, or action/precondition.

### 4. Select A Page Pattern

Map the IA result to a structure:

- List page: scope/header, filters, row identity, row status, primary row action, bulk action rules, empty/search states.
- Detail/profile page: object identity, key status, direct configuration, related lists, advanced technical detail.
- Form page: submit intent, required fields, dependencies, validation, consequence hints, sticky action footer.
- Dashboard/overview: defensible question, time/scope, metric definitions, trend/comparison, drill-down path.
- Operation page: preconditions, impact, execution path, disabled reasons, confirmation, result state.
- Troubleshooting page: symptom, evidence, affected scope, timeline/logs, next diagnostic action.

Use three visual layers:

- Layer 1: page subject, scope, key status, current priority.
- Layer 2: primary work surface: table, form, configuration group, chart set, operation panel, or diagnostic evidence.
- Layer 3: secondary evidence and advanced details: technical parameters, commands, environment variables, raw identifiers, audits, extension fields.

### 5. Generate The Prototype

For a new prototype:

1. Choose the shell:
   - `agione-strict`: copy `assets/agione-product-shell-template.html`.
   - all other profiles: copy `assets/backoffice-shell-template.html`.
2. Save it to `xia_doc/<meaningful-slug>.html`.
3. Read references only when the chosen profile needs them:
   - `agione-strict`: read `design-system/agione-strict/AI-USAGE.md` plus `catalog.md` and only the extra files needed by the page type.
   - `generic-backoffice`: use the self-contained shell tokens and this SKILL.md workflow.
4. Preserve the shell, CSS tokens, layout regions, and validation markers.
5. Edit only the anchored regions unless a clear project design-system requirement demands a shell change:
   - `BACKOFFICE_EDIT_TITLE`
   - `BACKOFFICE_EDIT_NAV`
   - `BACKOFFICE_EDIT_MAIN`
   - `BACKOFFICE_EDIT_DATA`
   - `BACKOFFICE_EDIT_NOTES`
   For `agione-strict`, use the AGIOne `AGIONE_EDIT_*` anchors instead.
6. Replace demo content with task-specific content.
7. Add `data-source` to every metric, status, table, form group, and derived display when practical.
8. Keep `AI-NOTES` accurate: evidence status, evidence used, assumptions, blocking questions, IA readiness, strong expression decision, selected design system, design profile, product identity, page subject, page type, API responsibilities, derived formulas, placeholders, project alignment, and rule gaps.
9. Run the validation script.

If the target project has an existing design system, first mirror its tokens/components/page shell. Do not use AGIOne strict assets unless the selected profile is `agione-strict`.

### 6. Visual And Production Consistency

Generic visual rules:

- Quiet admin interface, dense but readable, no marketing hero for routine work.
- Tokenized CSS variables for color, spacing, radius, shadow, typography, z-index, and transitions.
- Generic component grammar uses PageHeader, panel, filters, metric strip, data table, status badge, detail section, tabs, drawer/dialog, empty state, and step indicators without AGIOne product identity.
- One dominant attention target per screen.
- No cards inside cards; repeated cards are allowed for repeated items only.
- Icons must indicate object type, status, affordance, or action. No decorative icons.
- Tables and forms should feel production-ready: stable row height, clear headers, visible focus, predictable action placement.
- Low-frequency technical details should be collapsed, subdued, or placed inside row/detail panels.
- Every number must be real, derived, or clearly placeholder.

### 7. Validate

Run:

```bash
node <skill-dir>/scripts/validate_prototype.mjs <target.html>
```

For strict AGIOne shell, run:

```bash
node <skill-dir>/scripts/validate_agione_strict.mjs <target.html>
```

Additionally run the original AGIOne bash-based gates through the bundled Python wrapper. On Windows it auto-detects Git Bash, including `D:\Program Files\Git\bin\bash.exe`:

```bash
python -X utf8 <skill-dir>/scripts/agione-strict/evaluate-prototype.py <target.html>
```

Fix failures before delivery. Warnings may be delivered only if explained in the final response or `AI-NOTES`.

Do not run project build commands unless the user explicitly requests them.

## Output Contract

For prototype generation, include:

- The created HTML path.
- A short IA summary: page subject, page type, top user task, strong expression decision.
- Validation result.
- Any remaining assumptions or placeholders.

For review-only mode, output in Chinese:

```markdown
**一句话表达**
这个页面表达的是：...

**不应该表达**
- ...

**页面主语**
- 核心主语/任务：...
- 用户最该确认/完成的 3 件事：...
- 页面类型：configuration/profile / collection management / form workflow / business overview / business decision / operation execution / troubleshooting analysis
- 强业务表达：需要 / 不需要；原因：...

**接口职责**
| 接口 | 返回对象 | 职责 | 页面位置 |
|---|---|---|---|
| ... | ... | primary subject / collection-list / configuration / aggregate-metric / record-detail / action-contract / derived-display | ... |

**内容收敛**
- 保留：字段/模块 -> 原因 -> 数据来源
- 删除/降权：字段/模块 -> 删除或降权原因

**页面结构**
- 主区：...
- 工作区：...
- 辅助区：...
- 明细区：...
```

## Guardrails

- Do not invent business rules, risk levels, health scores, counts, revenue, success rates, timelines, or impact ranges.
- Do not add tabs merely to create structure. Add a tab only when it represents a distinct first-level user task.
- Do not use dashboards/charts to decorate a page. Use them only for monitoring, comparison, or decision tasks.
- Do not let low-frequency technical fields occupy first-screen attention.
- Do not write vague advice such as "make it more advanced" or "add richer visuals"; translate recommendations into concrete placement, deletion, grouping, or hierarchy.
- Do not overwrite an existing HTML prototype unless the user explicitly asks to edit it.
