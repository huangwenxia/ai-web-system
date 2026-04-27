# ai-web-system

AI Web 协作体系工作区，用于维护规则、技能协议和同步脚本。

## 目录说明

- `skills/`：可复用的任务执行协议
- `agents/`：多角色协作边界与交接协议
- `rules/`：项目级规则源文件
- `.cursor/`：Cursor 规则投影与模板
- `scripts/`：校验与同步脚本
- `docs/`：总览与治理文档

## 常用命令

```powershell
node scripts/verify-encoding.mjs .
node scripts/check-absolute-paths.mjs .
node scripts/sync-all.mjs
```

## 原则

1. `rules/` 维护长期默认约束，`skills/*/SKILL.md` 维护任务执行协议与内嵌约束。
2. `rules/` 是维护源，`.cursor/rules/` 和 `.trae/rules/` 是仓库内投影。
3. `skills/`、`agents/` 负责执行协议和协作边界，避免在多个 skill 间重复复制同一套约束。
4. 仓库不再维护独立 `commands/` 层；需要显式触发时，直接使用对应 skill 名称和 `SKILL.md` 协议。
5. 终端或插件的项目级目录不再由本仓库外部注入维护；项目级终端文件应来自目标仓库自身的 clone / pull。
6. 文本文件统一使用 UTF-8。
