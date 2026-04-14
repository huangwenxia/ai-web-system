# Cursor 配置说明

这里存放 `ai-web-system` 面向 Cursor 的项目级规则投影与辅助模板。

## 目录说明
- `rules/`
  存从仓库级 `rules/` 同步过来的 Cursor Project Rules（`.mdc`）
- `user-rule.template.md`
  存推荐粘贴到 Cursor Settings > Rules > User Rule 的全局短版规则

通用规则的主维护目录在：
- `rules/`

## 使用方式
### 1. 项目级规则
Cursor 会自动识别仓库中的 `.cursor/rules/*.mdc`。

这些规则适合：
- 当前仓库的项目级开发约束
- 既有项目前端开发约束
- bug 修复与代码优化约束
- Markdown 文档规范
- workbench 开发约束
- 资产回写与治理约束

### 2. 全局 User Rule
`user-rule.template.md` 不会自动生效。

你需要手动复制其中内容，粘贴到：
- `Cursor Settings > Rules, Skills, Subagents > User Rule`

## 当前原则
- User Rule 只放跨项目工程行为
- `rules/` 是通用维护源，`.cursor/rules` 是 Cursor 投影层
- `.cursor/rules` 只放当前仓库或当前领域稳定规则，并尽量保持与 `rules/` 同步
- 项目特化限制优先放 Project Rules，不放 User Rule
- rule 只表达约束，不承载 skill workflow、任务步骤或 handoff
