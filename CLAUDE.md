# ai-web-system

AI Web 协作体系工作区，用于维护标准、规则、协议、示例和自动化脚本。

## 目录

- `standards/` - 标准本体
- `commands/` - 跨工具可复用的任务入口
- `skills/` - 任务执行协议
- `agents/` - Agent 职责与协作说明
- `rules/` - 通用规则源文件
- `.cursor/rules/` - Cursor 项目规则投影
- `docs/` - 体系说明与治理文档
- `scripts/` - 自动化脚本

## 约束

- 标准正文只写在 `standards/`
- `rules/` 是维护源，`.cursor/rules/` 是投影
- `commands/`、`skills/`、`agents/` 不重复定义标准正文
- 文本文件统一使用 UTF-8
