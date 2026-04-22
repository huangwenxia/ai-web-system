# Git协作规范

## 目标

给 `ai-web-system` 建立一套轻量、稳定、便于回看的 Git 管理方式。

## 默认策略

- 长期主分支：`main`
- 小步提交
- 每次提交只做一类事情
- 先本地校验，再提交

## 什么时候新开分支

以下情况建议开分支：

- 做较大结构调整
- 做一轮持续几天的规则重构
- 做实验性方案，暂不确定是否保留

推荐命名：

- `docs/structure-update`
- `refactor/rule-cleanup`
- `chore/encoding-guard`
- `feat/new-skill-flow`

## 提交粒度

推荐拆分：

- 文档一类提交
- 脚本一类提交
- 规则一类提交
- 协议或示例一类提交

不推荐：

- 一次提交同时改标准、脚本、规则和大量文档
- 先大面积格式化，再混入真实逻辑修改

## 提交信息

推荐格式：

```text
<type>: <summary>
```

常用 `type`：

- `docs`
- `feat`
- `fix`
- `refactor`
- `chore`
- `style`

示例：

- `docs: 更新规则分层说明`
- `fix: 修复绝对路径检查脚本`
- `refactor: 收敛项目级 rule 结构`

## 提交前检查

```powershell
git status
node scripts/verify-encoding.mjs .
node scripts/check-absolute-paths.mjs .
```

如果本次修改了 `rules/`，再执行：

```powershell
node scripts/sync-rules-to-cursor.mjs
```

## 目录维度建议

### `standards/`

- 说明为什么改
- 避免把临时结论直接升格为正式标准

### `docs/`

- 一次围绕一个主题改
- 保证导航和链接可读

### `scripts/`

- 说明脚本目的和影响范围
- 避免顺手混改大量脚本

### `rules/`

- 只提交稳定约束
- 与 `.cursor/rules/` 保持同步

## 结论

这个仓库的 Git 管理重点不是复杂流程，而是让历史清楚、问题可定位、规则演进可回看。
