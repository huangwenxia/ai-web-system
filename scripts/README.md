# Scripts

这里放的是仓库内的同步和校验脚本。

## 官方文档要求

- 修改终端支持矩阵前，必须先查对应终端的最新官方文档。
- 修改 skills / rules 的目标路径前，必须先查对应终端的最新官方文档。
- 不要只凭历史脚本或本地目录习惯推断终端支持情况。

## 当前同步脚本

| Script | Default assets | Notes |
| --- | --- | --- |
| `sync-all.mjs` | `skills + user-memory` | 全量同步入口，可再用参数缩小范围 |
| `sync-skills.mjs` | `skills` | 只同步技能协议 |
| `sync-project-rules.mjs` | `rules` | 从 `rules/*.mdc` 同步到显式指定的目标项目 |
| `sync-user-memory.mjs` | `user-memory` | 同步 `rules/user-rule.md` 到终端用户级长期规则位置 |

## 支持的终端与资产

| Terminal | skills | project rules | user memory | Notes |
| --- | --- | --- | --- | --- |
| `claude-code` | yes | no | yes | skills 到 `~/.claude/skills`，user memory 到 `~/.claude/CLAUDE.md` |
| `codex` | yes | no | yes | skills 到 `~/.agents/skills`，user memory 到 `~/.codex/AGENTS.md` |
| `cursor` | yes | yes | no maintained target | skills 到用户目录，rules 只写入显式 `--target-project` 的 `.cursor/rules` |
| `trae-cn` | yes | yes | no maintained target | skills 到用户目录，rules 只写入显式 `--target-project` 的 `.trae/rules` |
| `roo-code` | no maintained assets | no | no | 仅清理历史 commands 残留 |
| `cline` | no maintained assets | no | no | 仅清理历史 commands 残留 |

## 通用参数

```powershell
--terminal=claude-code,cursor
--asset=skills,rules,user-memory
--target-project=E:\work\project-mamba
--plugin=skill
--name=existing-project-feature-skill
--name=agione-*
--dry-run
--list
--help
```

说明：

- `--terminal` 用来限制同步到哪些终端
- `--asset` 或 `--plugin` 用来限制同步哪类资产
- `--target-project` 仅在同步项目级 `rules` 时使用，必须显式指定；不会默认写入 `ai-web-system`
- `skills` 支持别名 `skill`
- `rules` 支持别名 `rule`、`project-rule`
- `user-memory` 支持别名 `memory`、`user-rule`、`user-rules`、`terminal-memory`
- `--name` 可以限制具体 skill / rule 名称；支持 `*` 通配，例如 `--name=agione-*`
- `--dry-run` 只打印计划，不写文件

## 目标路径规则

默认行为：

- `skills` 同步到用户目录下的终端目录
- `rules` 从 `rules/*.mdc` 同步到显式指定目标项目的终端规则目录
- `user-memory` 从 `rules/user-rule.md` 同步到终端自己的用户级长期规则位置

示例：

- Claude Code skills -> `~/.claude/skills`
- Claude Code user memory -> `~/.claude/CLAUDE.md`
- Codex skills -> `~/.agents/skills`
- Codex user memory -> `~/.codex/AGENTS.md`
- Cursor skills -> `~/.cursor/skills`
- Cursor project rules -> `<target-project>/.cursor/rules`
- Trae skills -> `~/.trae/skills`
- Trae project rules -> `<target-project>/.trae/rules`

## 历史 commands 清理

仓库已经不再维护独立 `commands/` 层。

同步时会顺带清理这些历史全局目录中的非隐藏残留：

- `~/.claude/commands`
- `~/.cursor/commands`
- `~/.roo/commands`
- `~/.trae/commands`
- `~/.cline/commands`

隐藏项和系统自带项不会被删。

## 常用示例

### 全量同步

```powershell
node scripts/sync-all.mjs
```

### 只同步 skills

```powershell
node scripts/sync-skills.mjs --terminal=claude-code,codex
```

### 只同步一个 skill

```powershell
node scripts/sync-skills.mjs --terminal=cursor --name=agione-ui
```

### 只同步一组 skill

```powershell
node scripts/sync-skills.mjs --terminal=codex --name=agione-*
```

### 只同步项目级 rules 到目标项目

```powershell
node scripts/sync-project-rules.mjs --terminal=cursor,trae-cn --target-project=E:\work\project-mamba
```

### 只同步终端用户长期规则

```powershell
node scripts/sync-user-memory.mjs
```

### 先看计划，不实际写入

```powershell
node scripts/sync-all.mjs --terminal=claude-code --asset=skills --dry-run
```

## 维护原则

- 源文件只维护在 `skills/`、`rules/`
- `agent.md`、`AGENTS.md`、`CLAUDE.md` 或 `rules` 只是终端目标文件名，不是仓库内源目录
- 本仓库不维护 `.cursor/rules/`、`.trae/rules/` 或类似终端规则投影副本
- 同步脚本只做复制、过滤和历史残留清理，不反向改源
- 默认不会删除隐藏系统项
- 如果目标文件内容完全一致，会自动跳过
- 项目级规则同步必须显式指定目标项目，并直接从本系统源 `rules/` 写入
