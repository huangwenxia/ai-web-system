# Cursor 规则分层与协同架构

## 目标

明确 `ai-web-system` 在 Cursor 中的规则分层，避免把 rule、skill 和 agent 混成一层。

## 分层

### 1. 用户级全局 rule

放在：

- Cursor `User Rule`
- `.cursor/user-rule.template.md`

职责：

- 约束跨项目都成立的工程行为
- 例如先确认任务类型、优先复用现有结构、修改前先看上下文

不负责：

- 某个仓库专属约束
- 某个任务流的详细步骤
- 某个技能的执行协议

### 2. 项目级 rule

放在：

- `rules/`
- `.cursor/rules/`

职责：

- 约束当前仓库内稳定成立的开发行为
- 例如既有项目开发约束、bug 修复约束、文档约束、回写治理约束

不负责：

- 承载完整 workflow
- 重写 skill 协议
- 充当独立入口层

## 其它层的职责

- `standards/`：定义标准正文
- `skills/`：定义执行协议与显式调用约定
- `agents/`：定义角色边界与协作方式
- `rules/`：维护项目级约束
- `.cursor/rules/`：把项目级约束投影到 Cursor

## 当前 rule 结构

- `00-global-task-scope.mdc`
- `10-existing-frontend-dev.mdc`
- `20-bugfix-and-optimization.mdc`
- `30-markdown-docs.mdc`
- `50-writeback-governance.mdc`

## 结论

rule 只做约束，skill 做协议，agent 做分工。边界清楚后，规则层才不会和执行层继续重叠。
