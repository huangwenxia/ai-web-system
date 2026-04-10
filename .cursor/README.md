# Cursor 配置说明

这里存放 `ai-web-system` 面向 Cursor 的项目级规则与辅助模板。

## 目录说明
- `rules/`
  存 Cursor Project Rules（`.mdc`）
- `user-rule.template.md`
  存推荐粘贴到 Cursor Settings > Rules > User Rule 的全局短版规则

## 使用方式
### 1. 项目级规则
Cursor 会自动识别仓库中的 `.cursor/rules/*.mdc`。

这些规则适合：
- 当前仓库的前端领域工作流
- 任务类型分流与路由
- Markdown 文档规范
- workbench 开发约束
- 资产回写与治理约束

### 2. 全局 User Rule
`user-rule.template.md` 不会自动生效。

你需要手动复制其中内容，粘贴到：
- `Cursor Settings > Rules, Skills, Subagents > User Rule`

## 当前原则
- User Rule 只放跨项目工程行为
- `.cursor/rules` 只放当前仓库或当前领域稳定规则
- 项目特化限制优先放 Project Rules，不放 User Rule
- 复杂任务优先通过 `01-task-routing.mdc` 先做工作流分流，再进入具体执行规则