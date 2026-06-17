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

## 新页面开发顺序闭环（新增页面 / 新功能模块时）
- 原型确认：已确认 / 不足，已回退补原型
- 上下文与复用扫描：已完成 / 未完成（说明）
- 页面结构拆分设计：已完成 / 未完成（说明）
- 数据归属设计：已完成 / 未完成（说明）
- 胶囊目录落位：已完成 / 未完成（说明）
- 业务容器组件实现：已完成 / 未涉及
- 纯视觉组件实现：已完成 / 未涉及
- `index.vue` 组装：只做编排 / 未达标（说明）
- 页面纯工具函数整理：已抽离到 `utils/index.ts` / 未涉及 / 未达标（说明）
- 自动校验：已运行 / 未运行（说明）
- 浏览器刷新：已刷新目标页面且核心内容未丢失 / 未运行（说明原因）
- 语义复查：已完成 / 未完成（说明）

## 严格复查先行输出（用户要求严格复查 / frontend-implementer + ui-spec / 先不要改代码时）
### 1. 现有组件 / 工具 / 目录复用校验表
| 检查对象 | 当前实现位置 | 可复用候选 / 目录 | 搜索命令与关键词 | 结论 | 采用或未复用原因 |
| --- | --- | --- | --- | --- | --- |
| 自定义 UI |  |  |  |  |  |
| `v-for` |  |  |  |  |  |
| tag / badge / status |  |  |  |  |  |
| dialog / form / table / filter |  |  |  |  |  |
| icon / 图标体系 |  |  |  |  |  |

### 2. 原型对比表
| 区块 | 原型要求 | 当前实现 | 差异 | 影响 | 最小修改 |
| --- | --- | --- | --- | --- | --- |
| 头部 |  |  |  |  |  |
| 筛选区 |  |  |  |  |  |
| 卡片区 |  |  |  |  |  |
| 弹窗 |  |  |  |  |  |
| 空 / 加载 / 错误态 |  |  |  |  |  |
| 图标语义 / 图标体系 |  |  |  |  |  |

### 3. Vue 结构自检
| 检查项 | 结论 | 证据 | 处理 |
| --- | --- | --- | --- |
| 页面是否过重 |  |  |  |
| 组件拆分是否合理 |  |  |  |
| 单次使用 UI 的独立职责边界 |  |  |  |
| 状态 / 接口 / 常量目录归属 |  |  |  |
| `index.vue` / 同目录主 `.vue` 可扫读性 |  |  |  |

### 4. 自动检查结果
| 检查项 | 命令 | 结果 | 备注 |
| --- | --- | --- | --- |
| 类型检查 |  |  |  |
| 实现检查 |  |  |  |
| 结构检查 |  |  |  |
| 编码检查 |  |  |  |
| diff check |  |  |  |

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
- 类型检查命令：
- build：未运行（按规则由前端负责人手动查看页面并确认后提交 build；若用户本次明确要求运行，写明命令和结果）
- 实现检查命令：
- 结构检查命令：
- 编码检查命令：
- diff check 命令：
- 自动检查结果：类型检查 / 实现检查 / 结构检查 / 编码检查 / diff check：通过 / 未通过 / 未运行（逐项说明原因）
- 浏览器刷新结果：目标页面 URL；正常渲染 / 异常；核心内容未丢失 / 有缺失（说明）
- checked files：
- `.vue <= 250`：达标 / 未达标 / 排除（locale / schema / 纯配置 / 旧文件历史超限）
- 首要校验：页面入口结构清晰 / 冗杂抽离审视：达标 / 已抽离（列出组件）/ 保留但已说明原因
- 独立职责边界抽离判断：单次使用但具备业务语义、输入输出、交互状态、组件组合或样式族的 UI 区块：已抽离（列出组件）/ 保留并说明原因 / 未涉及
- 数据归属组件 / hook 拆分：业务组件自取数并闭环 loading-empty-error / 页面根只保留共享状态和流程编排 / 纯视觉组件只接 props / `usePage` 返回值和 index.vue 解构未过长：达标 / 未达标（说明整改或例外）
- 页面纯工具函数抽离：`valueOrEmpty` / `normalizeText` / 格式化 / 解析 / 兜底展示等纯函数进入当前目录 `utils/index.ts`；必要类型进入 `types/index.ts`；本地引用使用 `./utils/index` / `./types/index`；未改变接口、字段来源和业务行为：达标 / 未涉及 / 未达标
- 胶囊目录强校验：components 根目录同功能前缀平铺 / hook-type-constants 跟随胶囊 / 胶囊入口 index.vue 或 index.ts / 组件胶囊禁用 Foo.vue / 页面根 index.vue 只做编排：达标 / 未达标（说明整改）
- UTF-8 / 中文直写 / Unicode escape：达标 / 未达标 / 技术例外（仅 Unicode 字符范围匹配等，说明原因）
- 复用检查证据：检索范围 / 检索关键词 / 命中候选 / 采用或未复用原因
- 图标语义 / 图标体系复查：未涉及 / 已查原型图标体系与具体图标名、当前 app 已安装图标库、共享 UI 图标封装、当前实现图标映射、依赖来源、采用或偏离原因 / 未达标
- 浮层表单复用检查：未涉及 / 已使用 `FormDialog.show` / 已查 `FormDialog.show`、现成弹窗表单、Schema 表单、InstanceForm、模块封装（列出候选、采用或例外原因）/ 未达标（存在手写 `el-dialog` / `el-drawer` / `el-popover` + `el-form`）
- 表格复用检查：未涉及 / 已查 CurdTable、DataTable、ColumnFactory、useCurdTable、模块表格配置；导入导出场景已查 common utils 的 genericExportImport（列出候选、采用或未复用原因）/ 未达标
- `v-for` 复用检查：未涉及 / 已查可复用组件（列出范围、候选、未复用原因）/ 未达标
- 状态分支抽离：未涉及 / 已抽离（列出组件）/ 保留在页面（说明原因）
- 路由工具选择：未涉及 / 已查当前 app、当前模块和相邻页面；当前 app 内部跳转使用项目内封装，跨 app / 公共跳转使用 `@repo/utils` 封装（说明实际 import 和原因）/ 未达标
- 新增组件 / Hook 抽离预案：将抽离代码块 / 不变量 / 可变量 / 复用半径 / 目录落点 / API 契约
- 抽离实际落地：与预案一致 / 不一致（说明原因）
- 递归三轮抽离复查：脚本 3 轮覆盖结果；第 1 轮入口文件 / 第 2 轮一级子组件 / 第 3 轮子组件内部文件；每轮 AI 语义结论：结构清晰、复用检查、进一步抽离、Tailwind 样式、胶囊目录；未达标则列整改轮次
- 组件结构检查：`check-component-structure.mjs --strict` 结果；是否出现 component boundary candidate；非 strict 或 `--allow-empty` 原因
- 函数长度：达标 / 未达标
- Vue 3 语法：`<script setup>` / TypeScript / `defineModel` 优先 / `computed` 优先 / `watch` 仅副作用 / `defineProps` 类型与默认值合规 / 外部业务类型 props 使用 `PropType`
- Tailwind utility / Element Plus / 原生 HTML 使用：达标 / 未达标（如保留简单 scoped 样式，说明原因）
- `:global` 全局污染禁用检查：未涉及 / 达标（无 `:global(...)` / `:global (...)` 逃逸）/ 未达标（列出位置、整改为局部类 / props / wrapper class / `popper-class` / `FormDialog.show` 参数 / 共享样式入口）
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
