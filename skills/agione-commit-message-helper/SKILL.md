---
name: agione-commit-message-helper
description: Generate and validate AGIOne commit messages from staged git diffs. Use when the user asks to commit, push, git commit, git push, submit code, 提交, 提交代码, 帮我提交, 推送代码, 提交并推送, 生成提交信息, 写 commit, 检查提交信息, AI commit, prepare commit, or create a conventional commit; especially for AGIOne repos such as project-mamba, prod/metis, metis-* and frontend/backend multi-repo changes.
---

# AGIOne Commit Message Helper

## Overview

Use this skill at the final step before `git commit`. Its job is to turn the staged diff into a useful commit message that explains what changed, why it changed, what user or system behavior is affected, and what should be tested.

## When To Use

Use this skill after:

1. Code changes are complete.
2. Basic local checks or self-test are done.
3. The intended files are staged with `git add`.
4. The user asks AI to generate the commit message.

Do not generate a commit message from memory or unstaged assumptions. Use the staged diff as the source of truth.
## Invocation Modes

- Generate message: when the user asks for a commit message, inspect the staged diff and output exactly one commit message.
- Commit code: when the user asks to commit code, inspect staged changes, infer context, generate and validate the message, then run `git commit` only if the repository state and project rules allow it.
- Push code: when the user asks to push code, ensure the relevant commit exists or create it if requested, verify branch and remote, then run `git push` only when safe and allowed by project rules.
- Validate message: when the user provides an existing message, validate its format, scope, body evidence, and test value.

For normal message generation, output only the commit message: no markdown fence, no explanation, no alternatives, no validation logs, and no command output.

## Commit and Push Requests

When the user asks to commit or push code, use this skill before running `git commit` or `git push`:

1. Inspect staged changes and the working tree.
2. If nothing is staged, inspect unstaged changes and stage only files that match the user's intent; ask before staging broad or ambiguous changes.
3. Generate or validate the commit message from the staged diff.
4. Run the validator with `commit-context.json` when available.
5. Proceed with `git commit` only if validation errors are resolved.
6. Proceed with `git push` only if the user requested push and branch/remote policy allows it.

Do not push to `main`, `master`, or the default branch unless the user explicitly asks and project rules allow it. Do not use `--force`, rewrite history, or bypass hooks unless the user explicitly approves.

## Repository Context

When the staged diff comes from the current AGIOne GitLab projects, use this repository role context to infer scope and frontend/backend linkage:

- `huyijin/project-mamba`: frontend code.
- `prod/metis`: backend core service.
- `prod/metis-gnosis`: backend service.
- `prod/metis-xcloud`: backend service.
- `prod/metis-hashrate`: backend service.
- `prod/metis-wanmore`: backend service.
- `prod/metis-cbdp`: backend service.
- `prod/metis-influx-sync`: backend service.

If a commit touches frontend and backend repos together, call out the linkage explicitly in the body, including the affected page/API boundary and the regression path.

## Scope and Context Inference

Before generating a message, run the bundled context inference script when possible. It reads only staged diffs and emits structured evidence for scope selection, frontend/backend linkage, changed file areas, API/config/page/test clues, and low-confidence cases.

Single repository:

```powershell
python "<path-to-this-skill>\scripts\infer_commit_context.py" "." > commit-context.json
```

```bash
python3 "$skillRoot/scripts/infer_commit_context.py" "." > commit-context.json
```

Multiple linked repositories:

```powershell
python "<path-to-this-skill>\scripts\infer_commit_context.py" "<frontend-repo>" "<backend-repo>" > commit-context.json
```

```bash
python3 "$skillRoot/scripts/infer_commit_context.py" "$frontendRepo" "$backendRepo" > commit-context.json
```

Use `references/scope-map.json` as the editable source of truth for repository fallback scopes and path-based scope rules.

Scope selection priority:

1. Prefer the inferred business/domain scope when path, API, config, or diff evidence is clear.
2. If no clearer business/domain scope exists, use the repository fallback scope from `references/scope-map.json`.
3. For frontend/backend linked changes, choose the scope of the user-visible outcome and describe all touched repositories in the body.
4. If context inference reports low or no confidence, ask one concise business-intent question before generating the message.

## Required Workflow

1. Inspect staged changes.
   - On Windows, run `python "<path-to-this-skill>\scripts\infer_commit_context.py" "." > commit-context.json` for a single repo.
   - On macOS/Linux, run `python3 "$skillRoot/scripts/infer_commit_context.py" "." > commit-context.json` for a single repo.
   - For linked changes, pass every touched repo path to `infer_commit_context.py`.
   - Run `git diff --cached --stat`.
   - Run `git diff --cached`.
   - If there is no staged diff, tell the user to stage files first.

2. Infer the business intent.
   - Identify changed modules, user-facing flows, API/config/data changes, permissions, billing, model invocation, deployment, dashboards, tests, and docs.
   - Use repository names, file paths, API routes, config keys, UI text, tests, and migration files as evidence.
   - Use `commit-context.json` to choose the scope and to detect frontend/backend linkage.
   - If the staged diff is too small or too technical to infer purpose, ask one concise question before generating the commit message.

3. Generate one commit message only.
   - Output only the commit message unless the user asks for explanation.
   - Prefer Chinese. Keep module names, API names, config keys, repository names, and product names in English when clearer.
   - Do not include markdown fences around the commit message when the user will paste it into Git.

4. Validate the result.
   - Mentally check that the title is specific and the body explains change, reason, impact, and regression focus.
   - Run `scripts/Test-CommitMessage.ps1` or `scripts/test_commit_message.py` when checking an existing message or wiring a hook.
   - Pass `--context-file commit-context.json` when a context file exists; context warnings should be investigated before committing.

## Commit Format

Use this format for business, API, frontend/backend, permission, billing, model invocation, deployment, or data changes:

```text
<type>(<scope>): <一句话说明本次变更目的>

- 变更内容：改了哪些功能、页面、接口、配置或数据口径
- 变更原因：解决了什么问题，或为什么需要这次修改
- 影响范围：影响哪些用户操作路径、系统流程或上下游模块
- 测试建议：建议重点回归哪些功能、边界条件或联动流程
- 风险点：需要关注的兼容性、权限、配置、数据或前后端契约风险
```

Keep the commit message change-first: `变更内容` and `变更原因` describe the actual code or behavior change; `测试建议` and `风险点` supplement the message for QA and release review. For small `docs`, `test`, or `chore` commits, use 2-3 focused bullets and omit risk details when there is no meaningful user-facing or system risk.

Allowed `type` values:

- `feat`: 新增功能
- `fix`: 修复问题
- `refactor`: 重构，不改变预期业务行为
- `perf`: 性能优化
- `config`: 配置调整
- `docs`: 文档变更
- `test`: 测试相关
- `chore`: 构建、依赖、清理等非业务改动

Choose `scope` from the affected area. Examples:

- `account-recovery`
- `menu`
- `billing`
- `model-service`
- `metis`
- `gnosis`
- `xcloud`
- `hashrate`
- `mamba`
- `wanmore`
- `cbdp`
- `influx`
- `frontend`
- `api`
- `auth`
- `dashboard`
- `permission`
- `deployment`

## Quality Rules

The title must answer both:

- What changed?
- Why or for what purpose?

Avoid titles like:

- `优化`
- `bug fix`
- `调整`
- `修复问题`
- `提交代码`
- `修改`
- `更新`

The body must make the commit useful for code review, release notes, and testing. For business-impacting changes, cover these in order of importance:

- Change summary: what functionality, page, API, config, or data behavior changed.
- Change reason: what problem this solves or why the change is needed.
- Impact scope: affected user paths, system flows, APIs, permissions, or upstream/downstream modules.
- Test suggestion: key regression paths, boundary cases, compatibility checks, or integration checks.
- Risk note: compatibility, permission, config, data, billing, model invocation, deployment, or frontend/backend contract risks.

Do not let the testing information replace the core change description. A good message first explains the change itself, then adds QA-facing test and risk notes when they are relevant.

## Examples

Good feature commit:

```text
feat(account-recovery): 新增邮箱找回密码流程

- 变更内容：新增账号恢复页面和邮箱验证码重置密码流程
- 变更原因：补齐用户忘记密码后的自助恢复入口，减少人工处理成本
- 影响范围：登录、注册、忘记密码页面，以及账号恢复 API 白名单
- 测试建议：回归验证码发送、验证码校验、密码重置和登录流程
- 风险点：涉及公共路由白名单和验证码有效期，需关注未登录访问边界
```

Good fix commit:

```text
fix(menu): 修复菜单更新后前端无法获取菜单ID的问题

- 变更内容：后端菜单更新接口返回更新成功的菜单ID，前端保存后使用返回ID刷新权限菜单
- 变更原因：避免菜单编辑后缺少 ID 导致权限菜单刷新失败
- 影响范围：菜单编辑、菜单导入和权限菜单配置流程
- 测试建议：回归管理员菜单编辑、导入和权限配置后的菜单刷新
- 风险点：涉及前后端菜单 ID 契约，需关注旧菜单数据和无 ID 返回场景
```

Good frontend/backend linkage commit:

```text
fix(mamba): 对齐项目列表页与 metis 查询接口的状态筛选

- 变更内容：前端项目列表页提交 status 参数时过滤空值，后端统一处理缺省状态和多状态筛选
- 变更原因：避免空状态参数覆盖默认查询条件，导致列表结果和导出数据不一致
- 影响范围：项目列表筛选、分页刷新和导出前的数据查询结果
- 测试建议：回归全部/单状态/多状态筛选，以及分页后筛选条件保持
- 风险点：涉及 project-mamba 与 metis 查询参数联动，需关注旧链接和默认查询兼容性
```

Good refactor commit:

```text
refactor(model-service): 重构模型代理参数转换逻辑

- 变更内容：抽取模型代理参数转换逻辑，减少不同协议处理重复代码
- 变更原因：降低模型调用协议适配的维护成本，保持转换入口一致
- 影响范围：模型调用、连通性测试和协议适配流程
- 测试建议：回归 ChatCompletions、图片、视频和通用协议调用
- 风险点：重构应保持现有入参和响应行为不变，需关注协议兼容性
```

## Validation Script

Use the bundled validator for existing messages or hook integration:

```powershell
$skillRoot = "<path-to-this-skill>"
& "$skillRoot\scripts\Test-CommitMessage.ps1" -MessageFile ".git\COMMIT_EDITMSG" -ContextFile "commit-context.json"
```

For macOS/Linux, use the Python validator:

```bash
python3 "$skillRoot/scripts/test_commit_message.py" --message-file ".git/COMMIT_EDITMSG" --context-file "commit-context.json"
```

When running from this skill directory, use:

```powershell
& ".\scripts\Test-CommitMessage.ps1" -Message "feat(menu): 新增菜单权限配置入口`n`n- 新增权限菜单配置入口`n- 影响管理员菜单管理流程`n- 建议回归菜单编辑和权限配置"
```

```bash
python3 "./scripts/test_commit_message.py" --message "feat(menu): 新增菜单权限配置入口

- 新增权限菜单配置入口
- 影响管理员菜单管理流程
- 建议回归菜单编辑和权限配置"
```

The script is intended for a future `commit-msg` hook. This skill itself should generate the message; the hook should only block obviously low-quality messages.
