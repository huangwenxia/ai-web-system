# rules

这里存放 `ai-web-system` 的项目级规则维护源。

## 作用

- 维护仓库内稳定、可复用的项目级约束
- 作为 `.cursor/rules/` 的上游来源
- 与 `standards/`、`commands/`、`skills/`、`agents/` 保持职责分离

## 当前内容

- `00-global-task-scope.mdc`：任务范围与响应方式约束
- `10-existing-frontend-dev.mdc`：既有项目的前端开发约束
- `20-bugfix-and-optimization.mdc`：bug 修复与代码优化约束
- `30-markdown-docs.mdc`：文档约束
- `50-writeback-governance.mdc`：回写治理约束

## 维护方式

先改 `rules/`，再同步到 `.cursor/rules/`：

```powershell
node scripts/sync-rules-to-cursor.mjs
```
