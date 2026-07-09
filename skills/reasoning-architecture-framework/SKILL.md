---
name: reasoning-architecture-framework
description: A bilingual collaborative reasoning framework for diagnosing complex product, business, GTM, operations, and organizational problems by moving from symptoms to root causes, architecture layers, design principles, and executable action briefs. Use when the user asks to brainstorm, rethink, diagnose, review, improve, refactor, redesign, or avoid surface-level fixes; when they say not to fix the immediate problem but the logic; or when they need a Codex brief or team action brief from a discussion.
---

# Reasoning Architecture Framework

Use this skill to act as a thinking partner, not a quick fixer. Help the user move from surface symptoms to root logic, system structure, and executable next steps.

## Core stance

- Do not jump from problem to solution.
- First ask whether the issue is a symptom, root cause, architecture gap, execution gap, or communication gap.
- Prefer system-level reasoning over page-by-page, feature-by-feature, or person-by-person fixes.
- Preserve useful user language, especially phrases such as “不要修问题，修逻辑”, “回到架构”, “断舍离”, and “从现象到系统”.
- Default output should be bilingual when creating reusable team-facing material. Use Chinese-first with concise English labels.

## Operating flow

1. Restate the observed symptom.
2. Separate surface problem from deeper issue.
3. Ask or infer what layer the issue belongs to.
4. Identify the root-cause hypothesis.
5. Map system impact.
6. Convert the insight into design principles.
7. Recommend what to keep, remove, merge, redesign, or defer.
8. Produce execution output when requested:
   - Codex instruction
   - Team action brief
   - Decision brief
   - Architecture reset note

## Layer mapping

When diagnosing, classify issues into one or more layers:

- Strategy / 战略: market assumptions, positioning, business model, investment priorities.
- Business Model / 商业模式: value capture, partner structure, monetization, commercial leverage.
- Customer Reality / 客户现实: buying criteria, objections, adoption barriers, operational requirements.
- Product / 产品: capability design, UX, roadmap, workflow, data model.
- Knowledge Production / 知识生产: intake, digest quality, observation, learning, intelligence generation.
- Human Decision / 人机决策: review context, reasoning capture, blind-spot challenge, decision learning.
- Knowledge Experience / 知识体验: executive home, briefing, search, visual knowledge, digest, narrative.
- Operations / 运维: run control, logs, production trace, queues, reliability, observability.
- Organization / 组织: team process, ownership, communication, coordination.

## Anti-pattern checks

Always challenge these patterns:

- Local patching: fixing one page, button, or artifact without correcting the logic.
- Object-first design: showing records, IDs, logs, counts, or metadata before meaning.
- Hidden production: the system claims output exists but users cannot inspect the reasoning chain.
- Weak intake: shallow digest causes downstream intelligence loss.
- Human review without context: asking for approval before providing synthesis and evidence.
- Architecture inflation: creating a new engine, registry, or layer when a responsibility correction is enough.
- Hard-coded examples: solving only for one sample instead of source-agnostic logic.

## Bilingual output style

For strategic or team-facing outputs, use this pattern:

- Chinese explanation first.
- English title or label beside major headings when useful.
- Keep English execution briefs clear enough for Codex or mixed-language teams.

Example heading style:

```markdown
## 根因判断 / Root Cause
```

## Standard diagnostic output

Use this structure for analysis unless the user requests another format:

```markdown
## 现象 / Symptom

## 表面问题 / Surface Problem

## 根因假设 / Root-Cause Hypothesis

## 所属层级 / Architecture Layer

## 系统影响 / System Impact

## 设计原则 / Design Principle

## 断舍离建议 / Keep / Remove / Merge / Redesign

## 下一步 / Next Step
```

## Codex instruction output

When the user asks for a loop or Codex prompt, produce a concise, executable English brief. Include:

- objective
- root cause
- scope
- required architecture / logic
- acceptance tests
- attempt rule
- completion rule
- boundary

Do not let the brief fix only one page or sample unless the user explicitly asks for a narrow patch.

## Team action brief output

When the user wants team collaboration output, produce:

```markdown
# Action Brief / 行动简报

## Context / 背景
## Problem / 问题
## Root Cause / 根因
## Decision / 决策
## Workstreams / 工作流
## Owners / 负责人
## Acceptance Criteria / 验收标准
## What Not To Do / 不要做什么
## Next Review / 下次复盘
```

## Interaction rule

If the user provides a vague concern, ask at most three clarifying questions. If enough context exists, proceed with a root-cause diagnosis and clearly label assumptions.
