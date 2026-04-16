# ai-web-system

AI Web 协作体系的工作区，用于规范和标准化 AI 辅助前端开发流程。

## 项目结构

- `standards/` - 标准本体（视觉、布局、数据映射、组件、文档、治理）
- `commands/` - 跨工具可复用的命令提示词模板
- `skills/` - 任务执行协议（prototype、page-design、schema-to-ui 等）
- `agents/` - 专项 Agent 职责说明与协作协议
- `rules/` - 通用规则源文件（单一来源）
- `.cursor/rules/` - Cursor 项目规则投影（由 `rules/` 同步）
- `apps/ai-front-workbench/` - Vue 3 预览工作台
- `docs/` - 体系说明、路线图、架构文档
- `scripts/` - 自动化脚本

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发前端工作台
pnpm dev

# 验证前端构建
pnpm check

# 检查文档编码
node scripts/verify-encoding.mjs .

# 检查绝对路径
node scripts/check-absolute-paths.mjs .

# 统一同步所有资源到各终端（推荐）
node scripts/sync-all.mjs

# 单独同步 Project Rules
node scripts/sync-project-rules.mjs
```

## 设计原则

1. **标准单一来源**：`standards/` 是标准本体，其他目录只调用不复写
2. **rules 是维护源**：`.cursor/rules/` 由 `rules/` 同步，不直接编辑
3. **职责分离**：agents 管角色，skills 管执行，rules 管约束
4. **UTF-8 编码**：所有文本文件使用 UTF-8，无 BOM

## 建议阅读顺序

1. `standards/README.md` - 标准体系
2. `docs/00-总览/体系总览.md` - 整体架构
3. `skills/README.md` - 任务执行协议
4. `agents/README.md` - Agent 协作

## 提交前检查

修改文档后：
```bash
node scripts/verify-encoding.mjs .
node scripts/check-absolute-paths.mjs .
```

修改 rules/ 后：
```bash
node scripts/sync-project-rules.mjs
```
