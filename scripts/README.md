# Scripts

这里放的是仓库内的同步和校验脚本。

## 官方文档要求

- 修改终端支持矩阵前，必须先查对应终端的最新官方文档。
- 修改 commands / skills / rules 的目标路径前，必须先查对应终端的最新官方文档。
- 不要只凭历史脚本或本地目录习惯推断终端支持情况。

## 当前同步脚本

| Script | Default assets | Notes |
| --- | --- | --- |
| `sync-all.mjs` | `commands + skills + rules` | 全量同步入口，可再用参数缩小范围 |
| `sync-commands-and-skills.mjs` | `commands + skills` | 适合同步 slash command 和 skill |
| `sync-project-rules.mjs` | `rules` | 只同步项目规则 |
| `sync-rules-to-cursor.mjs` | legacy | 旧脚本，保留兼容 |

## 支持的终端与资产

| Terminal | commands | skills | rules |
| --- | --- | --- | --- |
| `claude-code` | yes | yes | no |
| `codex` | no | yes | no |
| `cursor` | yes | yes | yes |
| `roo-code` | yes | no | no |
| `trae-cn` | yes | yes | yes |
| `cline` | yes | no | no |

## 通用参数

所有新的同步脚本都支持同一组过滤参数：

```powershell
--terminal=claude-code,cursor
--asset=commands,skills
--plugin=skill
--name=frontend-implementer,agione-ui-skill
--target-project=<target-project-root>
--dry-run
--list
--help
```

说明：

- `--terminal` 用来限制同步到哪些终端。
- `--asset` 或 `--plugin` 用来限制同步哪类资产。
- `commands` 也支持别名 `command`、`slash-command`、`slash-commands`。
- `skills` 也支持别名 `skill`。
- `rules` 也支持别名 `rule`、`project-rule`。
- `--name` 可以限制具体条目。
- `--target-project` 会把目标从用户目录切到指定项目根目录下的终端目录。
- `--dry-run` 只打印计划，不写文件。

## 目标路径规则

### 不传 `--target-project`

- `commands` / `skills` 默认同步到用户 home 下的终端目录。
- `rules` 默认同步到当前仓库自己的项目目录。

示例：

- Claude Code commands -> `~/.claude/commands`
- Claude Code skills -> `~/.claude/skills`
- Codex skills -> `~/.codex/skills`
- Cursor rules -> `<repo>/.cursor/rules`
- Trae rules -> `<repo>/.trae/rules`

### 传 `--target-project=<target-project-root>`

会同步到目标项目根目录下的终端目录，例如：

- Claude Code commands -> `<target-project-root>\.claude\commands`
- Claude Code skills -> `<target-project-root>\.claude\skills`
- Cursor commands -> `<target-project-root>\.cursor\commands`
- Cursor skills -> `<target-project-root>\.cursor\skills`
- Cursor rules -> `<target-project-root>\.cursor\rules`
- Trae rules -> `<target-project-root>\.trae\rules`

## 常用示例

### 只同步 Claude Code 的 skill 到 project-mamba

```powershell
node scripts/sync-commands-and-skills.mjs --terminal=claude-code --asset=skills --target-project=<target-project-root>
```

### 只同步 Claude Code 的 slash command 到 project-mamba

```powershell
node scripts/sync-commands-and-skills.mjs --terminal=claude-code --asset=slash-command --target-project=<target-project-root>
```

### 只同步一个 skill 到 project-mamba

```powershell
node scripts/sync-commands-and-skills.mjs --terminal=claude-code --asset=skills --name=agione-ui-skill --target-project=<target-project-root>
```

### 只同步 Cursor 和 Trae 的项目规则到 project-mamba

```powershell
node scripts/sync-project-rules.mjs --terminal=cursor,trae-cn --target-project=<target-project-root>
```

### 先看计划，不实际写入

```powershell
node scripts/sync-all.mjs --terminal=claude-code --asset=skills --target-project=<target-project-root> --dry-run
```

## 维护原则

- 源文件只维护在 `commands/`、`skills/`、`rules/`。
- 同步脚本只做复制和过滤，不反向改源。
- 默认不会删除目标目录里未选中的旧文件。
- 如果目标文件内容完全一致，会自动跳过。
