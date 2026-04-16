# Scripts

这里存放用于自动化部署和同步的脚本。

---

## 终端适配核心规则

**在通过脚本同步到不同终端之前，必须先查阅各终端的最新官方文档。**

### 各终端格式要求

| 终端 | Commands | Skills | Rules | 官方文档 |
|------|----------|--------|-------|----------|
| Claude Code | ✅ `.md` | ❌ | ❌ | [docs](https://docs.anthropic.com/en/docs/claude-code) |
| Codex | ❌ | ✅ `.md` | ❌ | [docs](https://docs.codex.org) |
| Cursor | ✅ `.md` | ✅ `.md` | ✅ `.mdc` | [docs](https://cursor.com/docs/rules) |
| Roo Code | ✅ `.md` | ❌ | ❌ | [docs](https://roocode.com/docs) |
| Trae-CN | ✅ `.md` | ✅ `.md` | ✅ `.mdc` | [docs](https://trae.ai) |
| Cline | ✅ | ❌ | ❌ | [docs](https://github.com/cline/cline) |

### 同步策略

```
commands/  --> ~/.claude/commands/   (Claude Code)
            --> ~/.cursor/commands/   (Cursor)
            --> ~/.roo/commands/     (Roo Code)

skills/    --> ~/.codex/skills/     (Codex)
            --> ~/.cursor/skills/     (Cursor)

rules/     --> .cursor/rules/       (Cursor)
            --> .trae/rules/        (Trae-CN)
```

---

## 同步脚本

| 脚本 | 同步内容 | 目标终端 |
|------|----------|----------|
| `sync-all.mjs` | Commands + Skills + Rules | 全部可用终端 |
| `sync-commands-and-skills.mjs` | Commands + Skills | Claude Code, Codex, Cursor, Roo Code |
| `sync-project-rules.mjs` | Rules (.mdc) | Cursor, Trae-CN |
| `verify-encoding.mjs` | 编码检查 | - |
| `check-absolute-paths.mjs` | 绝对路径检查 | - |

### 使用方法

```powershell
# 统一同步（推荐）
node scripts/sync-all.mjs

# 单独同步 Commands 和 Skills
node scripts/sync-commands-and-skills.mjs

# 单独同步 Project Rules
node scripts/sync-project-rules.mjs

# 编码检查
node scripts/verify-encoding.mjs .

# 绝对路径检查
node scripts/check-absolute-paths.mjs .
```

---

## 各脚本详细说明

### sync-all.mjs

统一同步入口，一键同步所有资源到各终端。

**终端支持情况**：

| 终端 | Commands | Skills | Rules |
|------|----------|--------|-------|
| Claude Code | ✅ | ❌ | ❌ |
| Codex | ❌ | ✅ | ❌ |
| Cursor | ✅ | ✅ | ✅ |
| Roo Code | ✅ | ❌ | ❌ |
| Trae-CN | ✅ | ✅ | ✅ |
| Cline | ✅ | ❌ | ❌ |

---

### sync-commands-and-skills.mjs

单独同步 Commands 和 Skills 到各终端。

**终端支持情况**：

| 终端 | Commands | Skills |
|------|----------|--------|
| Claude Code | ✅ | ❌ |
| Codex | ❌ | ✅ |
| Cursor | ✅ | ✅ |
| Roo Code | ✅ | ❌ |
| Trae-CN | ✅ | ✅ |
| Cline | ✅ | ❌ |

---

### sync-project-rules.mjs

同步 Project Rules (.mdc) 到支持该功能的终端。

**终端支持情况**：

| 终端 | Rules | 说明 |
|------|-------|------|
| Cursor | ✅ | https://cursor.com/docs/rules |
| Trae-CN | ✅ | https://trae.ai (兼容 Cursor 格式) |
| Claude Code | ❌ | 不支持 Project Rules |
| Codex | ❌ | 不支持 Project Rules |
| Roo Code | ❌ | 不支持 Project Rules |
| Cline | ❌ | 不支持 Project Rules |

---

### verify-encoding.mjs

巡检仓库中的文本文件是否出现编码风险。

```powershell
node scripts/verify-encoding.mjs .
```

**检查内容**：
- UTF-8 BOM
- 已知乱码特征字符

### check-absolute-paths.mjs

巡检 Markdown 文档中是否残留本机绝对路径。

```powershell
node scripts/check-absolute-paths.mjs .
```

**检查内容**：
- `*.md`, `*.mdc` 文件
- Windows 盘符绝对路径

**默认忽略**：
- `docs/原始准则来源/`
- `docs/90-归档/`

---

## 维护原则

- 脚本只负责同步或校验，不隐式改写源文件内容
- 源文件始终在 ai-web-system 目录中维护
- 不允许只改全局目录、不回写 ai-web-system
- 涉及文本写入时，优先明确指定 UTF-8
- 新增同步目标前，必须先查阅该终端的最新官方文档
- 每个脚本开头都标注了终端支持情况

---

## 相关文档

- `docs/02-资产与同步/终端适配矩阵.md` - 各终端支持情况详细对比
