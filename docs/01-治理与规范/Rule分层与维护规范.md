# Rule分层与维护规范

## 目标

明确哪些内容应该进入项目级 rule，哪些内容不应该进入。

## 适合写进 rule 的内容

- 当前仓库长期稳定成立的开发约束
- 与具体工具环境强相关的默认行为
- 可以被重复复用的项目级判断口径

## 不适合写进 rule 的内容

- 一次任务的完整 workflow
- 某个 skill 的详细执行步骤
- 某个 agent 的具体职责描述
- 临时实验方案和未验证结论

## 当前建议分层

### 用户级全局 rule

- 放在 Cursor `User Rule`
- 只保留跨项目都成立的工程行为

### 项目级 rule

- 放在 `rules/` 与 `.cursor/rules/`
- 只保留当前仓库稳定成立的约束

## 当前项目 rule 列表

- `00-global-task-scope.mdc`
- `10-existing-frontend-dev.mdc`
- `20-bugfix-and-optimization.mdc`
- `30-markdown-docs.mdc`
- `50-writeback-governance.mdc`

## 维护原则

1. 先改 `rules/`，再同步到 `.cursor/rules/`。
2. rule 只表达约束，不承载教程。
3. 如果内容更适合解释，写到 `docs/`。
4. 如果内容更适合示例，写到 `examples/`。
