# 前端实现输出模板

```md
## 主任务类型

## 输入前提

## 接收参数归一化
- 目标范围：
- 来源材料：
- 约束条件：
- 修改范围：

## 使用的标准
- 读取的 rules / skills / docs：
- 是否命中 project-mamba profile：是 / 否

## 实现前复用校验表（命中 project-mamba 时）
- 当前目标项目：
- app 拓扑：T1 common-shell source / T2 common-view mixed / T3 multi-source route / T4 standalone route
- route ownership：本地 `src/views` / `~common` / `~cbdp` / 其他
- 拓扑验证：已核对 `vite.config.ts` / `src/main.ts` / router 入口；topology 脚本结果；矩阵是否需回写：
- 页面类型：
- 页面壳：
- 组件层级判断：
- 字段映射：
- 常量来源：
- 工具来源：
- 加载策略：
- bootstrap 来源：本地 / `@common` / 跨 app 复用

## 实现 / 修复 / 重构结果

## 边界状态处理
- 加载态：
- 空态：
- 错误态：
- 权限态：
- 禁用态：

## 最终代码校验（命中 project-mamba 新功能时）
- topology 验证命令：
- topology 验证结果：通过 / 未通过 / 未运行（说明原因）
- 自动检查命令：
- encoding 验证命令：
- 自动检查结果：通过 / 未通过 / 未运行（说明原因）
- checked files：
- `.vue <= 250`：达标 / 未达标 / 排除（locale / schema / 纯配置 / 旧文件历史超限）
- 首要校验：页面入口结构清晰 / 冗杂抽离审视：达标 / 已抽离（列出组件）/ 保留但已说明原因
- UTF-8 / 中文直写 / Unicode escape：达标 / 未达标 / 技术例外（仅 Unicode 字符范围匹配等，说明原因）
- 复用检查证据：检索范围 / 检索关键词 / 命中候选 / 采用或未复用原因
- 浮层表单复用检查：未涉及 / 已查现成弹窗表单、抽屉表单、Schema 表单、InstanceForm、模块封装（列出候选、采用或未复用原因）/ 未达标
- 表格复用检查：未涉及 / 已查 CurdTable、DataTable、ColumnFactory、useCurdTable、模块表格配置；导入导出场景已查 common utils 的 genericExportImport（列出候选、采用或未复用原因）/ 未达标
- `v-for` 复用检查：未涉及 / 已查可复用组件（列出范围、候选、未复用原因）/ 未达标
- 状态分支抽离：未涉及 / 已抽离（列出组件）/ 保留在页面（说明原因）
- 新增组件 / Hook 抽离预案：将抽离代码块 / 不变量 / 可变量 / 复用半径 / 目录落点 / API 契约
- 抽离实际落地：与预案一致 / 不一致（说明原因）
- 递归三轮抽离复查：脚本 3 轮覆盖结果；第 1 轮入口文件 / 第 2 轮一级子组件 / 第 3 轮子组件内部文件；每轮 AI 语义结论：结构清晰、复用检查、进一步抽离、Tailwind 样式、胶囊目录；未达标则列整改轮次
- 组件结构检查：`check-component-structure.mjs --strict` 结果 / 非 strict 或 `--allow-empty` 原因
- 函数长度：达标 / 未达标
- Vue 3 语法：`<script setup>` / TypeScript / `defineModel` 优先 / `computed` 优先 / `watch` 仅副作用 / `defineProps` 类型与默认值合规 / 外部业务类型 props 使用 `PropType`
- Tailwind utility / Element Plus / 原生 HTML 使用：达标 / 未达标（如保留简单 scoped 样式，说明原因）
- flex 布局 / 禁用 grid：达标 / 未达标
- 容器自适应：达标 / 未达标
- 滚动容器 / scrollbar：使用 `el-scrollbar` 或项目内建滚动能力 / 未涉及 / 未达标（说明整改）
- 未达标整改或例外原因：

## 风险与影响范围

## 最小验证建议

## 是否需要后续独立审查
- page-review-skill：

## 回写候选
- 是否回写标准：
- 目标目录：
- 解决问题：
- 适用场景：
- 不适用场景 / 边界：
- 证据来源等级：
- 回写层级：`skills/` / `rules/` / Claude memory / 仅当前任务结论

## Skill 同步升级
- 是否需要更新当前 skill：
- 需更新文件：
- 需更新内容：执行前先读 / docs / templates / handoff / guardrails / 相关子 skill 衔接约束
```
