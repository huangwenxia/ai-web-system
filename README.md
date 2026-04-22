# ai-web-system

AI Web 协作体系工作区，用于维护标准、规则、协议、示例和自动化脚本。

## 目录说明

- `standards/`：标准本体
- `commands/`：跨工具可复用的任务入口
- `skills/`：任务执行协议
- `agents/`：Agent 职责与协作说明
- `rules/`：项目规则源文件
- `.cursor/`：Cursor 规则投影与模板
- `scripts/`：校验与同步脚本
- `docs/`：总览与治理文档
- `examples/`：示例任务与写法参考

## 常用命令

```powershell
node scripts/verify-encoding.mjs .
node scripts/check-absolute-paths.mjs .
node scripts/sync-rules-to-cursor.mjs
```

## 原则

1. 标准正文只写在 `standards/`。
2. `rules/` 是维护源，`.cursor/rules/` 是投影。
3. `commands/`、`skills/`、`agents/` 各管入口、执行协议和角色边界，不重复定义标准正文。
4. 文本文件统一使用 UTF-8。
