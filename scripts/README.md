# Scripts

这里放的是仓库内的同步和校验脚本。

## 官方文档要求

- 修改终端支持矩阵前，必须先查对应终端的最新官方文档。
- 修改 skills / rules 的目标路径前，必须先查对应终端的最新官方文档。
- 不要只凭历史脚本或本地目录习惯推断终端支持情况。

## 当前同步脚本

| Script | Default assets | Notes |
| --- | --- | --- |
| `sync-all.mjs` | `skills + rules` | 全量同步入口，可再用参数缩小范围 |
| `sync-skills.mjs` | `skills` | 只同步技能协议 |
| `sync-project-rules.mjs` | `rules` | 只同步当前仓库的规则投影 |
| `sync-agent.mjs` | `agent.md` | 同步终端用户级规则到 Codex home |
| `sync-rules-to-cursor.mjs` | legacy | 旧脚本，保留兼容 |

## 支持的终端与资产

| Terminal | skills | rules | Notes |
| --- | --- | --- | --- |
| `claude-code` | yes | no | 同步到 `~/.claude/skills` |
| `codex` | yes | no | 同步到 `~/.agents/skills` |
| `cursor` | yes | yes | skills 到用户目录，rules 到当前仓库 `.cursor/rules` |
| `trae-cn` | yes | yes | skills 到用户目录，rules 到当前仓库 `.trae/rules` |
| `roo-code` | no maintained assets | no | 仅清理历史 commands 残留 |
| `cline` | no maintained assets | no | 仅清理历史 commands 残留 |

## 通用参数

```powershell
--terminal=claude-code,cursor
--asset=skills,rules
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
- `skills` 支持别名 `skill`
- `rules` 支持别名 `rule`、`project-rule`
- `--name` 可以限制具体 skill / rule 名称；支持 `*` 通配，例如 `--name=agione-*`
- `--dry-run` 只打印计划，不写文件

## 目标路径规则

默认行为：

- `skills` 同步到用户目录下的终端目录
- `rules` 同步到当前仓库自己的项目目录

示例：

- Claude Code skills -> `~/.claude/skills`
- Codex skills -> `~/.agents/skills`
- Codex user agent -> `~/.codex/agent.md` and `~/.codex/AGENTS.md`
- Cursor skills -> `~/.cursor/skills`
- Cursor rules -> `<repo>/.cursor/rules`
- Trae skills -> `~/.trae/skills`
- Trae rules -> `<repo>/.trae/rules`

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

### 只同步仓库内 rules 投影

```powershell
node scripts/sync-project-rules.mjs --terminal=cursor,trae-cn
```

### 只同步终端 agent.md

```powershell
node scripts/sync-agent.mjs
```

### 先看计划，不实际写入

```powershell
node scripts/sync-all.mjs --terminal=claude-code --asset=skills --dry-run
```

## 维护原则

- 源文件只维护在 `skills/`、`rules/`、`agents/`
- 同步脚本只做复制、过滤和历史残留清理，不反向改源
- 默认不会删除隐藏系统项
- 如果目标文件内容完全一致，会自动跳过
- 外部项目的终端 / 插件目录不再由本仓库注入维护；项目级文件应来自目标仓库自身
