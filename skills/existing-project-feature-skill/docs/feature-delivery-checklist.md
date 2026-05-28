# 既有项目新功能交付检查清单

本文件补充 `existing-project-feature-skill` 在 A-1 新功能开发主链中的检查项。

## 任务识别检查
- 是否确认任务属于既有项目新功能开发，而不是 bug 修复、独立审查或翻译专项
- 是否判断清楚是页面、模块、组件，还是区块级增量开发
- 是否确认当前实施阶段建立在已确认原型之上
- 是否识别当前原型来源属于 `external_design` 还是 `agione_ui_generated`

## 原型前置检查
- 如果当前还没有原型，是否明确先转到 `agione-ui-skill`
- 是否确认原型已经过用户或业务方确认，而不是实施中临时猜测
- 是否确认原型中的页面骨架、区块职责和主任务已经清晰

## 上下文定位检查
- 是否找到目标模块、路由、相邻页面或参考实现
- 是否确认项目已有组件、布局模式、状态模式和目录结构
- 是否确认 `project-mamba` 中存在可复用组件或组合模式
- 如果命中 `project-mamba`，是否已先读取当前 app 的 `vite.config.ts` 与 `src/main.ts`
- 如果命中 `project-mamba`，是否已判定 app 拓扑与当前页面的 route ownership
- 如果命中 `project-mamba`，是否已用当前代码核对 `project-mamba-app-topology-matrix.md`；如矩阵冲突，是否以当前代码为准并列为回写候选
- 如果命中 `project-mamba` 新功能或 route ownership 不清楚，是否运行 topology 验证脚本；`unknown`、空 route source、运行目录错误或 drift 是否已阻断继续依赖旧矩阵

## 原型完整性检查
- 是否确认主操作、关键字段和信息层级已明确
- 是否确认 loading / empty / error / permission / disabled 状态已覆盖
- 是否只补齐实现必需的边界和约束，而不擅自篡改已确认主方向

## 实现检查
- 是否优先复用现有页面容器、表单、表格、卡片、状态和组合模式
- 是否把页面层、区块层和子组件层职责拆清
- 是否保证业务逻辑完整性与数据展示正确性同时成立
- 如果命中 `project-mamba`，是否已明确 bootstrap 来源是本地 / `@common` / 跨 app 复用
- 如果命中 `project-mamba` 新功能页面，是否把最终代码校验作为交付门禁，而不是可选建议
- 新增组件 / Hook 前，是否已检查 `easybill-ui`、`apps/common`、当前项目 `commons`、当前项目 `views/components`、`@repo/hooks`、当前项目 `utils`，并记录检索范围、命中候选和未复用原因
- 每个 `v-for` 是否已先查项目已有组件或同语义封装；原生标签上的 `v-for` 是否说明为什么不能复用 tag/badge 集合、选项渲染、字段 fragments、列表项或 `OverflowTag` 等已有能力
- 发生抽离前，是否已列出将抽离代码块、组件 / Hook 名称、目标目录、职责和抽离原因；最终是否对照抽离前预案与实际落地差异
- 发生组件拆分时，是否已明确不变量 / 可变量、复用半径、目录落点和 API 契约；是否避免把组件私有 hook / types / utils 散到上层目录

## 边界与细节检查
- 加载态
- 空态
- 错误态
- 权限态
- 禁用态
- 对齐、间距、层级、节奏、顺滑度和明显 1px 级细节问题

## `project-mamba` 最终代码校验
- 是否运行 `skills/frontend-implementer-skill/scripts/check-project-mamba-implementation.mjs`，且显式传入目标文件或列出 checked files；空检查是否被视为失败，或是否使用 `--allow-empty` 并说明原因
- 是否运行 `skills/frontend-implementer-skill/scripts/verify-encoding.mjs` 覆盖本次目标文件或目录；是否存在 UTF-8 BOM、常见乱码或空检查误判
- 涉及新增组件、Hook、types、utils、组件抽离或目录调整时，是否运行 `skills/frontend-implementer-skill/scripts/check-component-structure.mjs --strict`
- 新增 `.vue` 是否按物理总行数控制在 250 行以内
- 旧文件是否默认排除历史超限；若用户明确要求优化旧文件，或旧 `.vue` 是本次新功能主承载页面，是否使用 `--strict-vue-lines` 并纳入瘦身或拆分计划
- `locale`、`schema`、纯配置组件如被排除，是否说明排除原因
- 源码是否保持 UTF-8 且无明显乱码；中文文案、`zh-CN` / `zh-cn` locale value、枚举 label 和状态文案是否直接写可读中文；是否避免用 `\uXXXX` Unicode escape 作为防乱码手段；正则中的单个中文字符或中文标点是否直写；如为 Unicode 字符范围匹配等技术例外是否说明原因
- 函数是否 70 行以内为最佳，100 行为上限；超过 100 行是否已拆分
- 复杂且接近上限的函数顶部是否有一句功能说明，且没有废话注释
- 是否使用 Vue 3 `<script setup>`、TypeScript、`defineModel` 优先、`computed` 优先；`watch` 是否只用于副作用；`defineProps` 类型、`PropType` 和数组 / 对象默认值是否合规
- 布局样式是否优先 Tailwind；功能交互是否优先项目组件、Element Plus 或已有封装；原生 HTML 是否只用于合适的视觉结构或能力缺口
- 布局是否使用 flex；是否避免 Tailwind grid utility 和 CSS Grid 属性
- 页面或组件自身出现滚动容器时，是否使用 `el-scrollbar` 或项目已有内建滚动组件；是否避免原生 `overflow: auto/scroll`、Tailwind `overflow-*-auto/scroll` 和自定义 scrollbar 样式
- 最终输出是否给出达标 / 未达标检查表，并说明验证命令、整改结果或例外原因

## 叠加能力检查
- 是否需要叠加 `translate-terms-skill`
- 是否真的需要升级为独立 `page-review-skill`

## 输出前检查
- 是否说明了原型来源、原型确认状态和子 skill 链路
- 是否给出了最小验证建议
- 是否判断了是否值得回写
- 是否明确区分回写层级：`skills/` / `rules/` / Claude memory / 当前任务结论
- 是否检查了主 skill 或子 skill 是否需要同步升级
