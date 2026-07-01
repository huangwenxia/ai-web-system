# ai-web-system

AI Web 协作体系工作区，用于维护规则、技能协议和同步脚本。

## 目录说明

- `skills/`：可复用的任务执行协议
- `rules/`：规则源文件（含用户级长期规则与项目规则）
- `scripts/`：校验与同步脚本
- `docs/`：总览与治理文档

## 常用命令

```powershell
node scripts/verify-encoding.mjs .
node scripts/check-absolute-paths.mjs .
node scripts/sync-all.mjs
node scripts/sync-user-memory.mjs
```

## 原则

1. `rules/` 维护长期默认约束，`skills/*/SKILL.md` 维护任务执行协议与内嵌约束。
2. `rules/user-rule.md` 是用户级长期规则源；`agent.md`、`AGENTS.md`、`CLAUDE.md` 或 `rules` 只是不同终端的目标文件名，不在仓库中新建 `agents/` 源目录。
3. `rules/*.mdc` 是项目规则源；本仓库不维护 `.cursor/rules/` 或 `.trae/rules/` 投影副本，需要时由同步脚本从 `rules/` 直接写入显式指定的目标项目。
4. `skills/` 负责可复用任务执行协议，避免在多个 skill 间重复复制同一套约束。
5. 仓库不再维护独立 `commands/` 层；需要显式触发时，直接使用对应 skill 名称和 `SKILL.md` 协议。
6. 项目级终端规则同步必须显式指定目标项目，且只从本系统源 `rules/` 写入，不在 `ai-web-system` 内保留终端投影目录。
7. 文本文件统一使用 UTF-8。
