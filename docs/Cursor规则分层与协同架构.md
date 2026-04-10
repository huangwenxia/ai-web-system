# Cursor 规则分层与协同架构

## 为什么要补这份文档
`ai-web-system` 之前已经有：
- `standards/`
- `commands/`
- `skills/`
- `agents/`
- `assets/`
- `apps/`
- `scripts/`

这套结构方向是对的，但放到 Cursor 之后，还缺一层“项目级 Rule 编排层”。

如果没有这层，会出现两个问题：
- 很多本该长期生效的环境约束，只停留在 command / skill 文本里
- 全局习惯、前端领域规则、项目特化限制容易混在一起

所以这一版补的是“分层”，不是推翻。

## 最终推荐分层
建议以后始终按三层理解规则：

1. 全局层
2. 领域层
3. 项目层

### 1. 全局层
全局层只放跨项目、跨技术栈都成立的工程行为。

适合内容：
- 先识别任务类型再行动
- 优先复用现有规则和目录结构
- 输出优先可执行，不空谈
- 修改前先判断影响范围
- 文档和代码都要考虑可维护性

当前落点：
- Cursor `User Rule`
- `.cursor/user-rule.template.md`

### 2. 领域层
领域层放“前端领域方法论”，而不是某一个公司项目约束。

适合内容：
- 从接口到页面的前端闭环
- schema 到 UI
- 页面原型、视觉、实现、审查的衔接
- 组件复用与边界态补全
- 回写标准、案例、资产的原则

当前落点：
- `standards/`
- `docs/`
- `.cursor/rules/10-frontend-domain.mdc`
- 相关 task rules

### 3. 项目层
项目层才放当前仓库或当前项目的具体约束。

适合内容：
- `apps/ai-front-workbench` 的开发约束
- Markdown 文档路径规范
- 资产同步、回写与治理策略
- 某个真实项目的依赖与目录结构限制

当前落点：
- `.cursor/rules/*.mdc`
- `docs/文档链接与路径规范.md`
- `docs/Git协作规范.md`

## 现有目录应该如何理解
### `standards/`
规则来源。

负责回答：什么叫对，什么叫稳定，什么叫符合规范。

### `commands/`
跨工具任务入口。

负责回答：用户怎样触发一类任务。

### `skills/`
执行协议层。

负责回答：模型拿到任务后，按什么步骤执行。

### `agents/`
角色边界层。

负责回答：谁负责什么，不负责什么。

### `.cursor/rules/`
Cursor 项目级环境规则层。

负责回答：在 Cursor 环境里，哪些约束应该默认生效，哪些任务协议应该按需调起。

### `docs/原始准则来源/`
来源档案层。

负责回答：这套方法论最初从哪里来。

它不是现行权威规则，也不应直接作为 Cursor Rule 本体。

## 哪些现有文档适合转为 Cursor Rule
### 适合直接抽成 Rule 的
- `agents/Agent协作原则.md`
- `docs/前端开发闭环总流程.md`
- `docs/文档链接与路径规范.md`
- `docs/Git协作规范.md` 中与日常执行直接相关的部分
- `commands/*.md` 中稳定的任务路由和执行步骤

### 不适合直接变成 Rule 的
- `standards/**`
- `docs/体系总览.md`
- `docs/四层关系.md`
- `docs/原始准则来源/**`
- 角色说明性很强的 `agents/*.md`

这些内容更适合作为：
- 规则来源
- 体系说明
- 角色定义
- 原始证据

## 为什么 command / skill / agent 还要保留
因为 Cursor Rule 不是为了替代它们，而是补充环境层。

推荐关系：
- Rule：环境级默认约束与路由
- Command：用户触发入口
- Skill：执行协议
- Agent：角色边界
- Standards：规则来源

如果把五者混成一个层，后面会越来越难维护。

## 重新梳理后的闭环
### 第 0 层：环境层
- User Rule
- `.cursor/rules/*.mdc`

作用：让 Agent 进入任务前先带上稳定约束。

### 第 1 层：任务识别
先判断任务属于：
- 原型推导
- schema-to-ui
- 前端实现
- 页面审查
- 文档整理
- 资产治理
- workbench 开发

### 第 2 层：入口选择
根据任务类型，调用：
- command
- task rule
- skill

### 第 3 层：专项执行
由对应 agent / role 承担：
- prototype
- schema
- frontend-implementer
- page-review
- doc / translate

### 第 4 层：规则引用
回到：
- `standards/`
- `docs/`
- `examples/`
- `assets/`

### 第 5 层：产物落地
落到：
- `apps/ai-front-workbench/`
- `assets/`
- `examples/`
- `docs/`
- 真实项目

### 第 6 层：回写与治理
判断是否要回写：
- 标准
- 案例
- 资产
- 规则
- 文档

## 当前第一版规则文件的定位
本仓库当前已补的第一版 Cursor Rules：
- `00-core-workflow.mdc`
- `10-frontend-domain.mdc`
- `20-markdown-docs.mdc`
- `30-workbench.mdc`
- `40-writeback-governance.mdc`
- `50-prototype-workflow.mdc`
- `51-schema-to-ui-workflow.mdc`
- `52-frontend-implementer-workflow.mdc`
- `53-page-review-workflow.mdc`

它们的目标不是覆盖所有内容，而是把“最稳定、最适合 Cursor 环境层”的部分先抽出来。

## 这次调整后，文档放置上哪些更准确了
### 保持不动但重新定位的
- `docs/原始准则来源/`：继续只做来源档案
- `agents/`：继续主要做角色边界说明
- `commands/`：继续做跨工具入口
- `skills/`：继续做执行协议

### 新增补位的
- `.cursor/`：补 Cursor 项目级规则层
- `docs/Cursor规则分层与协同架构.md`：补规则分层总说明

## 结论
`ai-web-system` 现在应明确定位为：
- 当前以“前端领域工作流系统”为主
- 不是全局通用规则库
- 也不是单一项目配置目录

未来如果你做后端或别的个人项目，不是推翻这套结构，而是继续复用同样的三层思路：
- 全局层
- 领域层
- 项目层