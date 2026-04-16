# rules

这里存 `ai-web-system` 的项目级规则维护源。

## 这一层负责什么
- 维护仓库内稳定、可复用的项目级规则文件
- 作为 `.cursor/rules/` 的上游来源
- 让规则维护与工具适配分离
- 只表达约束，不承载技能复用

## 这一层不负责什么
- 不替代 `standards/` 成为规则权威来源
- 不替代 `commands/` 的任务入口
- 不替代 `skills/` 的执行协议
- 不替代 `agents/` 的角色边界与协作协议
- 不在规则里重写 workflow、步骤清单或 handoff 协议

## 与 `.cursor/rules` 的关系
- `rules/`：通用维护源
- `.cursor/rules/`：Cursor 项目规则投影

推荐做法：
1. 先在 `rules/` 维护规则正文
2. 再同步到 `.cursor/rules/`
3. 只在 `.cursor/README.md` 中补充 Cursor 特有说明

**同步脚本**：
修改 `rules/` 后，运行同步脚本更新 `.cursor/rules/`：

```powershell
node scripts/sync-rules-to-cursor.mjs
```

## 分层建议
当前建议按两层理解：

### 用户级全局 rule
- 放在 Cursor 的 `User Rule`
- 只放跨项目、跨仓库都成立的工程行为约束
- 维护入口：`.cursor/user-rule.template.md`

### 项目级 rule
- 放在本目录和 `.cursor/rules/`
- 只放当前仓库和当前工作方式稳定成立的项目约束

## 当前内容
- `00-global-task-scope.mdc`：任务范围与响应方式约束
- `10-existing-frontend-dev.mdc`：既有项目的前端开发约束
- `20-bugfix-and-optimization.mdc`：bug 修复与代码优化约束
- `30-markdown-docs.mdc`：文档约束
- `40-workbench.mdc`：workbench 约束
- `50-writeback-governance.mdc`：回写治理约束
