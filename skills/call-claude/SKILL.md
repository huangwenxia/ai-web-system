---
name: call-claude
description: Call local Claude CLI for adversarial review or explicit fix/edit delegation between Codex and Claude. Use for solution/design reviews, code reviews, UI audits, PR reviews, implementation plans, prototypes, architecture decisions, and cases where the user asks Claude to fix or modify code. Trigger when the user asks to call Claude, get Claude's opinion, compare Claude/Codex views, find gaps, challenge assumptions, reduce overengineering, or uses Chinese triggers such as 叫 Claude 看, 调 Claude, 和 Claude 协作, 互相评审, 找漏洞, 收敛过度设计, 让 Claude 修复, 让 Claude 改代码. When explicitly invoked as Call Claude or $call-claude, use scripts/claude_review.sh before falling back to a Claude Brief.
---

# Call Claude

## Overview

Use Codex as the coordinator and evidence checker for a two-reviewer workflow. The goal is not to average opinions; the goal is to expose weak assumptions, reject unnecessary complexity, and converge on the smallest defensible next action.

Never fabricate Claude's view. If Claude output is not available, create a concise brief that the user can give to Claude, then continue with the Codex review only where source evidence is available.

Always invoke Claude through `scripts/claude_review.sh` when the script is available. The script is the stable invocation core for local Claude CLI calls; do not hand-roll `claude -p` unless the script is missing or broken.

## Explicit Claude CLI Requirement

When the user explicitly invokes this skill by name, by `$call-claude`, or by clearly asking to use `Call Claude`, first attempt a real local Claude review before generating a brief.

Required sequence:

1. Use `scripts/claude_review.sh` as the first-choice invocation path.
2. For code review, run the scope-control rules below before deciding the Claude prompt shape.
3. Default to review mode: `scripts/claude_review.sh --cd <repo> --prompt-file <prompt-file>`.
4. Use full/fix mode only when the user explicitly asks Claude to modify, fix, scaffold, or apply changes: `scripts/claude_review.sh --full --cd <repo> --prompt-file <prompt-file>`.
5. Treat the CLI output as Claude's pass, then continue the normal cross-examination workflow.
6. Only fall back to `Claude Brief` when the CLI is missing, authentication fails, the command exits non-zero, times out, or returns unusable output.
7. When falling back, explicitly report the reason, such as `claude CLI not found`, `claude authentication failed`, `claude exited with code N`, `claude timed out`, or `claude output was empty/unusable`.

Do not silently skip the CLI on explicit invocation. Do not call a Codex subagent "Claude".

### Stable Invocation Core

`scripts/claude_review.sh` standardizes Claude CLI calls:

- Prompt input comes from a regular file or closed stdin.
- Output is captured with `--output-format json`, parsed into a final message, and empty final output is rejected with exit 13.
- A wall-clock timeout is enforced with `timeout`/`gtimeout`, or a process-group watchdog fallback.
- Timeout is not retried as the same prompt; shrink the slice or continue with a clear coverage gap.
- Auth and unusable-output failures are reported distinctly.
- Calls from the same Codex thread resume the same Claude conversation when `CODEX_THREAD_ID` is available; use `--fresh` to start a new Claude conversation or `--ephemeral` for a stateless one-off.
- Review mode exposes read/search tools only. This is Claude tool-gating, not an OS-level filesystem sandbox like Codex read-only mode; it is appropriate for review, but do not describe it as a hard kernel/filesystem sandbox.
- Full mode uses Claude's permission bypass and may edit files or run commands.

Canonical calls:

```sh
# Read-only adversarial review (default)
scripts/claude_review.sh --cd /path/to/repo --prompt-file /tmp/claude-review.md

# Longer deep review
scripts/claude_review.sh --timeout 2700 --cd /path/to/repo --prompt-file /tmp/claude-review.md

# Explicit fix / modify mode only
scripts/claude_review.sh --full --cd /path/to/repo --prompt-file /tmp/claude-fix.md

# Start fresh or run stateless
scripts/claude_review.sh --fresh --cd /path/to/repo --prompt-file /tmp/claude-review.md
scripts/claude_review.sh --ephemeral --cd /path/to/repo --prompt-file /tmp/claude-review.md
```

### Code Review Scope Control

Do not equate "large" with "less important". Large or complex changes need more careful review, not a shallower review. Use size only to decide whether a single Claude prompt is likely to dilute attention, lose context, or produce generic findings.

Before invoking Claude for code review, estimate review shape with read-only commands such as `git diff --stat`, `git diff --numstat`, `git diff --name-only`, staged equivalents, PR metadata, or explicit file lists.

Judge scope with three signals:

- **Volume**: changed files, changed lines, unusually large files, generated output, lockfiles, vendored code, or snapshots.
- **Heterogeneity**: multiple repositories/apps, backend plus frontend plus generated clients, schema/API changes plus UI changes, migrations plus business logic, or unrelated feature clusters.
- **Risk density**: auth, permissions, money/billing, data migration, distributed state, concurrency, public APIs, generated clients, compatibility paths, feature flags, or user-visible workflow changes.

If risk density is high, review deeply regardless of line count. If volume or heterogeneity is high, split the review so each pass has enough local context; do not reduce the review to a summary-only pass.

Use these modes:

- **Small diff**: about 20 files or fewer and 1,500 changed lines or fewer. Run one Claude pass with the relevant diff and a 15 minute default wait budget.
- **Medium diff**: about 50 files or fewer and 5,000 changed lines or fewer. Prefer one Claude pass only if the change is cohesive. Otherwise split by module or risk area. Use a 20-30 minute per-pass hard budget when needed.
- **Large or mixed diff**: more than 50 files, more than 5,000 changed lines, multiple repositories/apps, generated-client churn, lockfile/vendor churn, or broad migration work. Do not run a single full-diff Claude pass as the only review. First build a manifest and risk map, then run focused deep passes on each material risk slice.

Large or mixed diff workflow:

1. Build a manifest: changed files, added/deleted line counts, modules touched, generated/vendor/lockfile files, migrations, API contracts, auth/security-sensitive paths, tests, and UI routes.
2. Create a coverage ledger with planned slices, such as backend state changes, migration/data model, API contract, generated client source-of-truth, frontend behavior, tests, and rollout/compatibility.
3. Run Claude pass 1 on the manifest plus concise Codex risk notes. Ask Claude to challenge the slicing, identify missing risk areas, and point out where a full-file/hunk deep dive is required. This pass is for review planning, not a substitute for code review.
4. Independently review the highest-risk files in Codex while Claude runs.
5. Run focused Claude passes on material risk slices until the coverage ledger is complete or remaining gaps are explicitly reported. Each focused pass should include the relevant files/hunks, nearby context, contracts/tests, and a concrete question.
6. For "quality over speed", "不怕等", "深度 review", "细致 review", or similar instructions, use deep mode: prefer additional focused passes over early fallback; allow 45-60 minutes total by default and 90-120 minutes when the task value justifies it and the user is waiting for a thorough review.
7. If a Claude pass exceeds its per-pass hard budget with no output, do not assume the review is done. Stop that pass only if the execution environment requires it, then rerun a smaller prompt for the same slice or continue reviewing that slice in Codex. Mark the exact slice as `Claude coverage gap` if Claude never reviews it.

For generated files, lockfiles, formatting churn, or mechanical migrations, review source-of-truth changes and representative generated output first. Verify generated artifacts enough to catch stale generation, wrong schema mapping, or compatibility breaks, but do not spend the entire budget line-reading generated noise.

Final synthesis for large reviews must include coverage: which slices were reviewed by Codex, which by Claude, which by both, and which remain unreviewed or only spot-checked.

### Long-Running Claude CLI Handling

Treat Claude as a slow external reviewer, not a quick command.

- Use `scripts/claude_review.sh --timeout <seconds>` instead of ad hoc shell timeout wrappers.
- Use a generous per-pass wait budget: default 20 minutes in the script; use 20-30 minutes for medium diffs, UI audits with many artifacts, architecture reviews, or when the user explicitly asks for thorough review.
- Removing "background polling" does **not** mean abandoning long tasks. It means do not detach Claude with shell `&` and hope temp files appear later. Run the wrapper as the foreground command, let `timeout`/`gtimeout` own the wall-clock budget, and use the surrounding tool/session polling to wait for that foreground process.
- For long full/fix tasks or deep reviews, explicitly raise the wrapper budget, for example `--timeout 5400` for 90 minutes or `--timeout 7200` for 120 minutes when the user says quality matters more than waiting.
- Lack of streamed output during the run is not failure. The script waits for the final JSON result.
- Never background with `&` and poll temp files in a managed shell. Background children can be reaped when the parent exits, leaving no result.
- While Claude runs, continue non-overlapping Codex work: inspect source files, collect evidence, run read-only checks, or prepare the independent Codex pass.
- If a Claude pass times out, do not rerun the same oversized prompt. Shrink the same slice, rerun a focused prompt, or report the exact `Claude coverage gap`.
- Distinguish timeout from failure: `no output yet` means still waiting; non-zero exit, auth error text, empty output exit 13, or hard timeout are fallback reasons.

## Operating Modes

- **Claude output provided**: Treat the Claude response, thread excerpt, screenshot, or pasted notes as Reviewer B. Verify each material claim against the actual artifact before accepting it.
- **Claude not yet consulted**: If invocation is explicit, follow `Explicit Claude CLI Requirement` first. Otherwise, produce a Claude brief and ask the user to bring back the result. Do not block if a useful Codex-only review can proceed from local files, screenshots, requirements, or code.
- **Claude full/fix requested**: Use `scripts/claude_review.sh --full` only when the user explicitly asks Claude to modify, fix, scaffold, or apply changes. Give Claude a tight scope, then inspect the resulting diff yourself before reporting success.
- **New target or very different task**: Use `--fresh` or `--ephemeral` when old Claude conversation context could contaminate the next review, especially across unrelated repos, products, or high-risk full/fix tasks.
- **Another AI reviewer provided**: Apply the same workflow and label the source accurately.
- **Codex subagents requested explicitly**: Use available subagent tooling only when the user explicitly asks for subagents, parallel agents, or delegation. Do not call a Codex subagent "Claude".

## Workflow

1. **Define the review target**
   - Identify the artifact: proposal, architecture note, PR/diff, code path, UI page, screenshot, prototype, requirement, or implementation plan.
   - State the intended outcome: approve, block, simplify, choose an option, produce fixes, or prepare a review memo.
   - Collect concrete sources before judging. For code, inspect files and diffs. For UI, inspect the running page or screenshots when possible. For plans, identify constraints, owners, deadlines, and non-goals.

2. **Run an independent Codex pass**
   - Review from first principles before reading Claude's critique when possible.
   - Prioritize correctness, user impact, maintainability, operational risk, and reversibility.
   - Record evidence as file/line references, UI observations, requirement quotes, logs, screenshots, or explicit assumptions.
   - Separate confirmed issues from hypotheses.

3. **Create or consume Claude's pass**
   - If Claude's pass exists, extract claims into concise bullets.
   - If Claude's pass is missing, provide a prompt under `Claude Brief` using the template below.
   - Ask Claude for adversarial review, not agreement: missed failure modes, overdesign, simpler alternatives, hidden costs, and places Codex may be overconfident.

4. **Cross-examine**
   - For each Claude claim, mark it `confirmed`, `rejected`, or `needs evidence`.
   - For each Codex claim, ask whether Claude's critique exposes a blind spot, a simpler path, or a false assumption.
   - Prefer source evidence over model confidence. Disagreements are resolved by code, product constraints, user workflow evidence, or explicit tradeoff reasoning.

5. **Converge**
   - Decide, do not merely summarize.
   - Keep only actions that materially reduce risk or improve the outcome.
   - Collapse overlapping recommendations.
   - Reject speculative refactors, generic abstractions, and broad rewrites unless they are required by current evidence.

## Review Lenses

### Solution Or Architecture Review

Check:

- Problem statement: Is the real user/business problem stated, or only an implementation preference?
- Constraints: Are security, latency, compatibility, rollout, migration, ownership, and support constraints explicit?
- Data and state: Are source of truth, lifecycle, idempotency, failure recovery, and consistency boundaries clear?
- API and integration contracts: Are request/response shapes, error semantics, permissions, and versioning handled?
- Operational risk: Are observability, rollback, partial failure, and support playbooks covered where needed?
- Simpler path: Can the solution remove a service, abstraction, generic framework, queue, cache, or workflow step without losing the core outcome?

### Code Review

Use a code-review stance: findings first, ordered by severity, with file/line evidence. Focus on:

- Correctness, edge cases, race conditions, concurrency, state leaks, and error handling.
- Security, authorization, data exposure, validation, and unsafe defaults.
- API compatibility, migrations, backward compatibility, and generated-client impacts.
- Test coverage proportional to risk.
- Existing codebase patterns and local helpers over new abstractions.
- Minimal diffs. Do not broaden formatting or refactor unrelated code.

### UI Audit

Review the actual user workflow, not just visual taste:

- Task clarity, information hierarchy, density, scanning, and repeated-use efficiency.
- Design-system alignment, component choice, spacing, typography, states, copy, and accessibility.
- Responsive behavior, text overflow, non-wrapping numeric units, empty/loading/error states, and light/dark states when relevant.
- Interaction feedback, hover/focus/disabled states, navigation consistency, and destructive-action safety.
- Evidence from screenshots, browser inspection, computed styles, or DOM/network/runtime observations when available.

## Anti-Overdesign Gate

Challenge any recommendation that introduces:

- A new abstraction before at least two concrete callers or a clear ownership boundary exists.
- A new service, queue, cache, event bus, schema layer, or state machine without a demonstrated failure mode it solves.
- A generic framework where a local helper or direct implementation would be clearer.
- A migration, rewrite, or broad normalization that is not necessary for the current review goal.
- Extra UI surfaces, copy, steps, cards, or dashboards that do not support the user's primary task.

When rejecting overdesign, provide the smaller alternative and the risk it still accepts.

## Claude Brief Template

Use this when Claude has not reviewed the artifact yet:

```text
请作为独立审查员审查下面的材料。不要默认同意 Codex 或用户方案，重点找真实风险和过度设计。

审查对象：
- 类型：方案 / 代码 / UI / PR / 原型 / 其他
- 目标：
- 约束：
- 非目标：

材料：
[粘贴需求、方案、diff、文件路径摘要、截图观察、链接或关键代码]

请输出：
1. 必须阻塞的问题：按严重度排序，说明证据。
2. 可能被忽略的边界条件或失败模式。
3. 哪些地方过度设计，能否删掉或缩小。
4. 更小的替代方案及其代价。
5. 你不同意或不确定的点，需要什么证据才能判断。
```

## Output Format

Default to the user's language. For Chinese threads, answer in Chinese.

For final synthesis, prefer:

- **结论**: approve / block / simplify / need more evidence / implement specific fixes.
- **必须处理**: confirmed high-impact findings with evidence.
- **可以收敛**: overdesigned or optional parts to remove, defer, or narrow.
- **Claude 交叉审查**: confirmed/rejected/needs-evidence claims from Claude.
- **Claude 调用状态**: ran review / ran full / fallback; include timeout/auth/empty-output reason when relevant.
- **Full 模式改动**: files changed, verification run, remaining risks. Include only when `--full` was used.
- **下一步**: the smallest concrete action set.

Keep the response short unless the user asks for a formal review memo.

## Files in This Skill

- `scripts/claude_review.sh` — stable Claude CLI invocation wrapper. Use it for every local Claude call.
- `templates/review-prompt.md` — adversarial review/fix prompt template to fill and pass to the script.
