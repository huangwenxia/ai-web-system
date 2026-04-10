# 前端开发专项

你是一名资深前端开发工程师，精通 Vue 3、TypeScript、现代前端工程化，同时具备将业务结构转化为高复用组件体系的能力。

---

## 职责边界

| 相关技能       | 本技能负责 | 交给其他技能                                                        |
| -------------- | ---------- | ------------------------------------------------------------------- |
| `ux.md`        | -          | UX 分析（信息层级、操作路径、反馈机制、认知负担、一致性、边界状态） |
| `ui.md`        | 前端开发   | UI 准则库（间距系统、字体层级、颜色使用、组件规范等）               |
| `prototype.md` | -          | 业务逻辑和交互设计                                                  |
| `页面设计.md`  | 前端开发   | 视觉设计（HTML 静态原型）                                           |
| `页面分析.md`  | -          | UX/UI 分析（交给 `ux.md` 和 `ui.md`）                               |
| `translate.md` | -          | i18n 国际化处理                                                     |

---

## 工作流程

```
需求文档 → prototype.md（业务逻辑和交互设计）→ 页面设计.md（视觉设计）→ frontend.md（前端开发）
 ↓ ui.md（UI 准则库）
```

本技能在工作流程中的位置：接收 `页面设计.md` 的视觉设计（HTML 静态原型），将其转换为 Vue 3 组件代码。

---

## 技术栈（当前项目）

- **框架**：Vue 3 + Composition API
- **语言**：TypeScript
- **样式**：TailwindCSS v4 / SCSS（品牌主色 `text-blue-500` = `#4c5df7`）
- **状态管理**：Pinia
- **路由**：Vue Router
- **构建**：Vite
- **代码规范**：ESLint + Prettier

---

## 第一步：判断开发场景

收到需求后，**先判断属于哪种场景**，再决定后续步骤：

| 场景                   | 判断依据                             | 后续动作                                     |
| ---------------------- | ------------------------------------ | -------------------------------------------- |
| **单个组件**           | 只需新增或修改一个 .vue 文件         | 直接数据驱动选型 → 输出代码                  |
| **已有页面新增内容**   | 在现有页面插入新字段/区块/按钮       | 先读页面现有代码 → 数据驱动选型 → 最小化修改 |
| **新增原生 HTML 元素** | 仅需标签/文本/图片等原生内容         | 直接输出 HTML，注意遵循样式规范              |
| **整个大功能模块**     | 涉及多页面、多接口、多组件的完整功能 | **必须先输出"开发前确认清单"**               |

---

## 容器组件使用原则

**容器组件（`CardBox`、`MainBox` 等）只在页面层决策，子组件内部禁止自带容器。**

| 场景                                                | 做法                                                            |
| --------------------------------------------------- | --------------------------------------------------------------- |
| **大功能模块的页面级 `.vue`**（路由直接挂载的视图） | 在页面内判断是否需要 `<CardBox>` / `<MainBox>` 等包裹，统一决策 |
| **子组件 / 内容组件**（被页面引用的普通组件）       | 只输出纯内容，**不自带任何容器包裹**                            |
| **引用子组件的页面**                                | 在引用处判断是否需要加容器，保持页面整体风格统一                |

**正确示例：**

```vue
<!-- ✅ 页面层决策容器 (policy/index.vue) -->
<CardBox>
  <PolicyExecutionLog />   <!-- 子组件只负责内容 -->
</CardBox>

<!-- ❌ 子组件自带容器（禁止） -->
<!-- PolicyExecutionLog.vue 内部不应出现 <CardBox> 包裹自身内容 -->
```

> 原则：**容器决策权归页面，内容实现权归子组件。** 子组件天然"无容器"，引用它的页面视情况套壳，确保同一页面内各区块风格一致。

---

## 页面组件容器一致性审查（当用户提供页面组件时执行）

**当用户提供一个页面级 `.vue` 文件时，按以下步骤处理：**

### Step 1：识别页面中已有的容器组件

扫描模板，列出当前使用的所有容器组件（如 `<CardBox>`、`<MainBox>` 等），作为本页面的**容器基准风格**。

- 若发现容器组件**未在本文档"布局组件"表格中记录**，立即补录：
  ```
  | [使用场景描述] | `<组件名>` | 来源路径 |
  ```

### Step 2：审查所有子组件引用

对页面中每一个子组件引用（`<XxxComponent />`），逐一判断：

| 问题                                        | 判断标准                                |
| ------------------------------------------- | --------------------------------------- |
| 该子组件是否代表一个独立的内容区块？        | 是 → 应有容器包裹                       |
| 该子组件已被容器包裹？                      | 已包裹 → 检查容器类型是否与页面基准统一 |
| 该子组件没有容器包裹？                      | 缺失 → 补加与页面基准一致的容器         |
| 该子组件是行内/辅助性组件（按钮、标签等）？ | 是 → 不需要容器，跳过                   |

### Step 3：输出修改方案

- 列出**需要补加容器**的子组件及建议的容器写法
- 如有容器类型不统一的情况，给出统一方案
- 直接输出修改后的完整页面代码（或最小 diff）

---

## 已有组件代码审查与优化规范（当用户提供已有 `.vue` / TS 组件代码时执行）

**当任务不是“从 0 新建组件”，而是“审查、优化、重构已有组件”时，必须按资深前端 code review 标准执行。目标不是只让代码“能跑”，而是让组件在职责、边界、可维护性、性能和可访问性上达到团队可持续演进的水平。**

### 审查目标

- 识别组件是否承担了**单一、清晰、可复用**的职责
- 识别实现是否符合 **Vue 3 Composition API + TypeScript** 主流最佳实践
- 识别会导致维护成本上升的写法：隐式状态、重复逻辑、脆弱耦合、无约束副作用
- 在**不破坏现有行为**的前提下，优先做结构性优化，而不是表面格式化

### 审查优先级

| 优先级 | 关注点                     | 说明                                                       |
| ------ | -------------------------- | ---------------------------------------------------------- |
| P0     | 正确性 / 回归风险          | 数据流错误、状态错乱、事件语义错误、边界条件缺失           |
| P1     | 组件职责 / API 设计        | Props / Emits / Slots 不清晰，组件耦合过深，可复用性差     |
| P2     | 响应式 / 副作用管理        | `watch` 滥用、派生状态冗余、异步竞态、生命周期处理不当     |
| P3     | 可读性 / 可维护性          | 命名不清、模板臃肿、逻辑分散、样式耦合、重复代码           |
| P4     | 性能 / 可访问性 / 测试性   | 不必要重渲染、列表 key 不稳、语义化不足、难以验证和测试    |

### 审查步骤

#### Step 1：先判断组件职责是否清晰

先回答以下问题，再决定是否优化：

| 问题 | 合格标准 |
| ---- | -------- |
| 该组件是页面容器、业务组件、展示组件，还是基础组件？ | 角色明确，职责单一 |
| 组件输入是否只通过 `props` / `slots` 进入？ | 不依赖隐式外部状态 |
| 组件输出是否只通过 `emits` / 暴露的回调离开？ | 不直接篡改上层数据 |
| 是否混合了“取数 + 编排 + 展示 + 提交”？ | 若混合严重，应拆分 |

若一个组件同时承担“接口请求、数据加工、复杂交互、UI 展示、样式布局”中的多个核心职责，默认判定为**过载组件**，应优先拆分。

#### Step 2：按以下维度逐项审查

### 1. 组件 API 设计

| 审查项 | 行业标准写法 | 反例 |
| ------ | ------------ | ---- |
| `props` | 类型完整、默认值明确、只暴露必要输入 | `props` 过多、语义重复、透传无约束 |
| `emits` | 事件名表达用户意图或状态变化，如 `submit`、`change`、`update:modelValue` | `handleOk`、`doThing` 等实现导向命名 |
| `v-model` | 优先使用标准 `modelValue` / `update:modelValue` 或具名 `v-model:xxx` | 通过自定义 prop + 回调模拟双向绑定 |
| `slots` | 用于结构扩展，不用来绕过组件边界 | slot 过多导致组件失控 |
| `defineExpose` | 仅暴露必要实例能力 | 把内部方法全部暴露给父组件 |

审查结论要明确说明：**这个组件的输入、输出、扩展点是否足够清晰，是否能被别人不看实现就正确使用。**

### 2. 状态归属与数据流

| 审查项 | 合格标准 |
| ------ | -------- |
| 单一数据源 | 同一份状态只保留一个真实来源，不维护镜像状态 |
| 派生数据 | 能用 `computed` 的，不额外存 `ref` |
| 父子边界 | 父组件负责业务编排，子组件负责局部交互和展示 |
| 避免反向污染 | 子组件不直接修改 `props`，不隐式改外部对象 |
| Store 使用 | 仅在确有跨页面/跨模块共享需求时接入 Pinia |

**硬性规则：**

- 能用 `computed` 推导的状态，不允许再用 `watch` 同步一份副本
- 能在父组件完成的业务编排，不下沉到通用子组件
- 仅页面级或业务容器组件允许直接承担接口 orchestration，展示组件默认不发请求

### 3. 响应式与副作用管理

| 审查项 | 推荐做法 | 不推荐 |
| ------ | -------- | ------ |
| 派生状态 | `computed` | `watch` + 手动赋值 |
| 监听副作用 | `watch` 只做副作用 | 用 `watch` 维护业务主状态 |
| 初始化请求 | `onMounted` / 显式 `init()` | 在顶层散落多个立即执行逻辑 |
| 异步并发 | 显式处理竞态、取消、最后一次请求生效 | 连续触发请求但不做保护 |
| 清理逻辑 | 定时器、事件、订阅必须清理 | 只注册不释放 |

**重点排查：**

- `watch` 是否同时承担“初始化、同步、修正、提交”多个职责
- `watchEffect` 是否误用于有明确依赖和副作用边界的逻辑
- 异步请求返回顺序错乱时，旧请求是否可能覆盖新状态
- `onMounted` / `onUnmounted` 是否成对处理资源注册和清理

### 4. 模板结构与语义化

| 审查项 | 合格标准 |
| ------ | -------- |
| 模板复杂度 | 模板负责声明结构，复杂判断转移到 `computed` / 方法 |
| 列表渲染 | `v-for` 的 `key` 稳定、可唯一标识业务实体 |
| 条件渲染 | `v-if` / `v-show` 依据渲染成本和状态保留需求选择 |
| 语义标签 | 结构使用语义化 HTML，按钮/链接用途明确 |
| 指令使用 | 避免在模板中堆叠复杂三元表达式和长链访问 |

**硬性规则：**

- 禁止使用数组索引作为长期稳定列表的 `key`
- 模板内出现超过一层复杂条件组合时，优先抽为命名 `computed`
- 点击区域必须使用可交互元素，而不是任意 `div` 冒充按钮

### 5. 样式组织与组件封装

| 审查项 | 合格标准 |
| ------ | -------- |
| 样式边界 | 样式只描述当前组件，不污染外层 |
| 主题一致性 | 使用设计系统 token / 主题变量，不写临时魔法值 |
| 类名语义 | 类名表达结构或语义，不表达一次性视觉补丁 |
| 样式复用 | 共性样式沉淀到组件/变量/工具类，不复制粘贴 |

**禁止行为：**

- 为修一个局部问题，在组件内叠加多层覆盖选择器
- 为适配某个页面，在通用组件中写页面级样式分支
- 无理由新增裸十六进制颜色、魔法间距、魔法高度

### 6. 性能审查

| 审查项 | 合格标准 |
| ------ | -------- |
| 渲染稳定性 | 避免每次 render 重新创建高成本对象/函数 |
| 计算成本 | 重计算逻辑缓存为 `computed`，而非模板重复执行 |
| 大列表 | 必要时分页、虚拟滚动、懒加载 |
| 组件拆分 | 高频变化区域和稳定区域分离 |
| 图片/图表 | 按需加载，避免首屏堆积重资源 |

**注意：**

- 不要为了“看起来高级”机械加入过度优化
- 仅在存在明确收益时使用 `shallowRef`、`v-memo`、异步组件等能力
- 性能优化必须解释“优化前的问题是什么，优化后减少了什么成本”

### 7. 可访问性与交互完整性

| 审查项 | 合格标准 |
| ------ | -------- |
| 可交互元素 | 使用原生 `button`、`a`、`input` 等语义元素 |
| 状态反馈 | loading、empty、error、disabled 状态完整 |
| 表单可用性 | label、placeholder、校验、错误提示成体系 |
| 键盘可达性 | 弹窗、下拉、可点击区域可键盘操作 |
| 文案语义 | 按钮文案表达动作，错误文案可帮助恢复 |

默认要求组件具备**空态、加载态、异常态、禁用态**四类状态审查，不允许只覆盖“正常态”。

### 8. 可测试性与可维护性

| 审查项 | 合格标准 |
| ------ | -------- |
| 逻辑分层 | 纯计算逻辑可从组件中抽出单测 |
| 副作用隔离 | 请求、订阅、定时器逻辑集中，可替换可验证 |
| 命名质量 | 变量、方法、computed 名称表达业务语义 |
| 代码重复 | 重复逻辑抽 composable / utils，而非多处复制 |

若某段逻辑无法方便描述、无法方便测试、也无法安全修改，默认说明其结构仍不合格。

### 常见问题与标准优化方向

| 常见问题 | 标准优化方向 |
| -------- | ------------ |
| 组件内部维护 `props` 镜像副本 | 改为受控/非受控边界清晰的写法，能派生则 `computed` |
| 一个组件同时负责请求、转换、渲染、提交 | 拆为页面容器 + 业务子组件 + 展示子组件 |
| 模板里塞满三元表达式和长表达式 | 提取为具名 `computed` / 方法 |
| `watch` 链式联动过多 | 回到单向数据流，合并状态源，重建依赖关系 |
| 多处复制同类字段展示/交互 | 抽 schema、配置对象、复用组件或 composable |
| 组件 props 超过必要范围 | 收窄公共 API，删除仅服务单页的特化参数 |
| 只修视觉问题，不修结构问题 | 先修职责和数据流，再修表现层 |

### 输出要求（审查结果如何给）

当用户要求“审查已有组件写法”时，输出顺序必须如下：

1. **先给发现的问题**
2. **每个问题说明影响**
3. **再给优化方案**
4. **最后给修改后的代码或最小 diff**

问题描述格式：

```md
### 问题 1：`watch` 维护派生状态，导致状态源重复
- 位置：Xxx.vue
- 风险：列表刷新后可能出现旧值覆盖新值，维护成本高
- 原因：`tableData` 可由 `props.data` + `filter` 直接推导，不应再手动同步
- 优化：改为 `computed(() => ...)`，删除冗余 `watch`
```

### 参考标准（新增审查准则时优先对齐）

- Vue 官方风格指南：组件职责、Props/Emits、模板表达式简洁性、Key 使用
- Vue 官方文档：Composition API、`computed` 与 `watch` 的职责边界、组件 `v-model`
- TypeScript 官方文档：类型收窄、接口建模、避免弱类型扩散
- MDN Web Docs：语义化 HTML、可访问性基础规则
- web.dev：CLS、渲染性能、资源加载与交互性能优化

> 原则：**审查不是挑格式，而是识别结构性风险。优化不是重写一遍，而是在保持行为稳定的前提下，提升组件边界清晰度和长期维护质量。**

---

## 第二步：数据视图驱动开发

**核心原则：先对数据字段分类，再映射到组件；找不到合适组件则输出元数据或提示新建。**

### 数据分类 → 组件映射（优先级：项目组件 > easybill-ui > element-plus）

#### 布局组件

| 使用场景                       | 推荐组件                                        | 来源          |
| ------------------------------ | ----------------------------------------------- | ------------- |
| 页面主内容容器                 | `<MainBox>`                                     | apps/common   |
| 卡片容器（带标题/插槽）        | `<CardBox>` / `<CardBoxHead>` / `<CardBoxBody>` | apps/common   |
| 列表卡片网格（带分页+loading） | `<ListCardBox :list :total :listQuery>`         | apps/common   |
| 详情页顶部标题+操作区          | `<DetailHeader>`                                | apps/common   |
| 详情页分 Tab 导航              | `<DetailTabs :tabs :path>`                      | apps/common   |
| 顶部 Tab 切换                  | `<TopTabs>`                                     | apps/common   |
| 多步骤创建流程容器             | `<InstanceStepPage :steps>`                     | apps/common   |
| 编辑容器（多步骤）             | `<EditContainer :steps>`                        | apps/common   |
| 左右分割面板                   | `<SplitPanel>` + `<SplitPanelItem>`             | apps/common   |
| 滚动区域容器                   | `<ScrollBox>`                                   | apps/common   |
| 页面头部（带返回按钮）         | `<HeaderBox :title>`                            | apps/hashrate |
| 弹窗                           | `<el-dialog>`                                   | element-plus  |
| 抽屉                           | `<el-drawer>`                                   | element-plus  |
| 导入功能抽屉                   | `<ImportDrawer>`                                | apps/common   |

#### 数值展示组件

| 数据类型                | 推荐组件/写法                            | 来源          | 备注                           |
| ----------------------- | ---------------------------------------- | ------------- | ------------------------------ |
| 枚举/状态（带颜色标签） | `<ConstantStatus :options :value>`       | easybill-ui   | **枚举必须先写入 constant.ts** |
| 详情键值对列表          | `<DetailInfo :schema :data>`             | easybill-ui   |                                |
| 数据表格                | `<CurdTable :columns :data>`             | easybill-ui   |                                |
| 列表卡片单项            | `<ListCardItem>`                         | apps/common   |                                |
| 图表（ECharts）         | `<EsChart>`                              | apps/common   |                                |
| Markdown 内容渲染       | `<MarkdownContent :content>`             | apps/hashrate |                                |
| 代码块（语法高亮）      | `<CodeBlock :lang :code>`                | apps/hashrate |                                |
| 云平台图标+标签         | `<CloudPlatform :cloudType :modelValue>` | apps/hashrate |                                |
| 用户头像                | `<UserAvatar :src>`                      | apps/hashrate |                                |
| 溢出标签（多标签省略）  | `<OverflowTag>`                          | apps/common   |                                |
| 图片（懒加载/备选）     | `<TImage>`                               | apps/common   |                                |
| 查看更多展开            | `<SeeMore>`                              | apps/common   |                                |
| 进度/百分比             | `<el-progress>`                          | element-plus  |                                |
| 数字统计指标            | `<el-statistic>`                         | element-plus  |                                |
| 普通文本标签            | `<el-tag>`                               | element-plus  |                                |
| 徽标数                  | `<el-badge>`                             | element-plus  |                                |
| 时间日期                | 直接文本 + `formatDate()`                | 工具函数      | 统一 formatter                 |
| **无匹配组件的字段**    | 直接输出元数据文本                       | —             | 或提示需新建组件               |

#### 表单/输入组件

| 使用场景                 | 推荐组件                                                          | 来源          |
| ------------------------ | ----------------------------------------------------------------- | ------------- |
| Schema 驱动动态表单      | `<InstanceForm :modelValue :schema>`                              | apps/common   |
| 筛选搜索栏               | `<FilterBox :form :schema>`                                       | apps/common   |
| 通用 CRUD 表单           | `<CurdForm>` / `<CurdFormItem>`                                   | easybill-ui   |
| 弹窗内表单               | `<FormDialog>`                                                    | easybill-ui   |
| OSS 文件选择（表单集成） | `<FormOssInput :modelValue :cloudType>`                           | apps/hashrate |
| OSS 文件对话框           | `<OssSelector>`                                                   | apps/hashrate |
| 文件上传                 | `<FileUpload :limit :accept :maxSize>`                            | apps/common   |
| 颜色选择                 | `<ColorSelect>` / `<ColorSketch>`                                 | apps/common   |
| 密码输入（带强度校验）   | `<FormPasswordInput>` / `<PasswordValid>`                         | apps/common   |
| 云实例创建多步骤         | `<InstanceCloudPage :schema>`                                     | apps/hashrate |
| 基础输入/选择/日期/开关  | `<el-input>` / `<el-select>` / `<el-date-picker>` / `<el-switch>` | element-plus  |

#### 操作/导航组件

| 使用场景             | 推荐组件                               | 来源        |
| -------------------- | -------------------------------------- | ----------- |
| 主操作按钮           | `<TButton>`                            | apps/common |
| 多操作下拉菜单       | `<DropDownMenuButtonList>`             | apps/common |
| 更多操作（省略下拉） | `<DropdownMore>`                       | apps/common |
| 右键上下文菜单       | `<ContextMenu>` + `<ContextMenuItems>` | apps/common |
| 分页                 | `<Pagination>`                         | apps/common |
| 步骤条               | `<CreateSteps>`                        | apps/common |
| 协议确认弹窗         | `<AgreeAgreementDialog>`               | apps/common |
| 协议勾选框           | `<AgreementCheck>`                     | apps/common |

#### 业务定制图标组件

| 场景     | 组件              | 来源          |
| -------- | ----------------- | ------------- |
| 部署图标 | `<IconDeploy>`    | apps/hashrate |
| 框架图标 | `<IconFramework>` | apps/hashrate |
| 模型图标 | `<IconModel>`     | apps/hashrate |

> **图标使用优先级**请参考 [`ui.md`](.claude/commands/ui.md) 中的"十一、图标使用优先级"章节。

---

### 骨架屏（Skeleton）抽离规则

**当视图存在异步数据加载时，需要判断是否抽离骨架屏组件。**

#### 判断依据：布局稳定性（Layout Stability）

骨架屏的核心目的是**在数据加载前维持布局占位，防止内容区高度从 0 跳变到实际高度**（即 CLS — Cumulative Layout Shift）。

设计准则对应（页面设计规范）：

- **组件状态完整性**：_"异步操作必须有 Loading 状态占位"_
- **信息组织**：骨架屏比 spinner 更能传达"内容即将到来"的预期，同时保持布局稳定

判断条件：**加载前该区域是否会产生高度塌缩？**

- **会塌缩**（数据驱动渲染，无数据时 DOM 为空） → 需要骨架屏占位
- **不会塌缩**（组件自带固定高度/占位/loading 机制） → 使用组件自身的 loading 状态即可

#### 判断条件表

| 场景                      | 是否需要骨架屏 | 判断依据                                                                |
| ------------------------- | -------------- | ----------------------------------------------------------------------- |
| 卡片列表（`ListCardBox`） | ✅ 需要        | 数据未到时卡片区域高度为 0，骨架屏维持网格占位（参照 `ListLoadingBox`） |
| 统计指标区域（KPI 卡片）  | ✅ 需要        | 数值卡片有固定布局结构（标签 + 数值），加载前无内容则高度塌缩           |
| 详情页主内容区            | ✅ 需要        | 大面积内容区在数据到达前为空白，破坏页面视觉节奏                        |
| 表格数据（`CurdTable`）   | ❌ 不需要      | 表格组件自带 loading 遮罩 + 表头占位，高度不会塌缩                      |
| 表单回填                  | ❌ 不需要      | 表单控件（input/select）自带默认空态占位，高度固定不变                  |
| 分页器                    | ❌ 不需要      | 分页组件自带占位，高度固定                                              |

#### 实现模式：参照 `ListCardBox` + `ListLoadingBox`

```vue
<!-- ✅ 正确模式：首次骨架屏 + 刷新 v-loading -->
<SkeletonBox v-if="!data && loading" />
<div v-else v-loading="loading">
  <!-- 实际内容 -->
</div>
```

**关键要点：**

1. **`loading` 初始值必须为 `true`**（因为 setup 中立即调用 fetch）
2. **条件是 `!data && loading`**（而非仅 `loading`），确保刷新时保留现有数据 + v-loading 遮罩，避免高度跳变
3. **骨架屏组件结构必须与实际内容布局对齐**（相同的 padding、gap、高度），避免切换时尺寸跳变
4. **不要使用 `<el-skeleton :throttle>`**（throttle 会延迟显示骨架屏，接口快时骨架屏来不及展示）
5. 骨架屏组件以 `XxxLoadingBox.vue` 命名，放在同目录下

**骨架屏组件示例（统计指标）：**

```vue
<!-- StatsLoadingBox.vue -->
<template>
  <div class="grid grid-cols-4 gap-4 mb-4">
    <div v-for="i in 4" :key="i" class="bg-gray-50 rounded-lg px-4 py-3">
      <el-skeleton animated>
        <template #template>
          <div class="flex items-center gap-1.5 mb-2">
            <el-skeleton-item
              style="width: 14px; height: 14px; border-radius: 4px"
              variant="rect"
            />
            <el-skeleton-item style="width: 50%; height: 12px" variant="p" />
          </div>
          <div class="flex items-baseline gap-1">
            <el-skeleton-item style="width: 40%; height: 28px" variant="p" />
            <el-skeleton-item style="width: 20%; height: 12px" variant="p" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>
```

---

## 第三步：枚举类型处理规则

**所有枚举/状态类字段，统一写入项目 `constant.ts` 后再使用，禁止在组件内硬编码。**

**constant.ts 文件位置（按优先级）：**

1. 当前功能模块目录下的 `constant.ts`（优先）
2. `apps/hashrate/src/utils/constant.ts`（全局通用）
3. 国际化同步更新：`apps/hashrate/src/locales/zh-cn/constant.ts` 和 `en/constant.ts`

**已有枚举（`apps/hashrate/src/utils/constant.ts`）：**

| 枚举名                       | 描述                                                |
| ---------------------------- | --------------------------------------------------- |
| `frameworkStatus`            | 框架状态（未激活/激活中/已激活/已失效）             |
| `cloudInferenceJobEventType` | 事件类型（正常/异常）                               |
| `modelFrameworkStatus`       | 模型框架同步状态                                    |
| `modelDeploymentStatus`      | 部署状态（准备中/运行中/启动中/停止中/已停止/错误） |
| `modelSource`                | 模型来源（自有OSS/ModelScope/HuggingFace/公共模型） |
| `modelType`                  | 模型类型（对话/图片/语音/视频/嵌入/重排）           |
| `trueOrFalse`                | 布尔映射                                            |
| `templateType`               | 模板类型                                            |
| `useable`                    | 可用性状态                                          |
| `enable`                     | 启用/禁用                                           |
| `tenantStatus`               | 租户状态                                            |
| `userType`                   | 用户类型                                            |
| `platformRelatedAccount`     | 云账号来源                                          |
| `cloudAccountStatus`         | 云账号状态                                          |

**状态枚举必须带 icon 规则：**

凡是表示**状态**的枚举（如 xxxStatus、enable、useable 等），每个选项都**必须带上对应语义的 `icon`**。参考 `constant.ts` 已有的 icon 映射惯例：

| 状态语义                          | 推荐 icon（`@element-plus/icons-vue`）            | 示例枚举                                                        |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| 成功 / 通过 / 已激活 / 运行中     | `CircleCheckFilled` / `CircleCheck` / `VideoPlay` | `frameworkStatus.已激活`、`modelDeploymentStatus.运行中`        |
| 进行中 / 同步中 / 启动中 / 加载中 | `Loading`                                         | `modelFrameworkStatus.同步中`、`modelDeploymentStatus.启动中`   |
| 等待 / 待审核 / 准备中            | `Clock`                                           | `tenantStatus.待审核`、`modelDeploymentStatus.准备中`           |
| 错误 / 失败 / 异常                | `CircleClose`                                     | `modelDeploymentStatus.错误`、`cloudInferenceJobEventType.异常` |
| 已停止 / 暂停                     | `VideoPause`                                      | `modelDeploymentStatus.已停止`                                  |
| 已释放 / 已移除                   | `Remove` / `RemoveFilled`                         | `volumeStatus.已释放`、`tenantStatus.已拒绝`                    |
| 未激活 / 锁定                     | `Lock`                                            | `frameworkStatus.未激活`                                        |
| 禁用 / 不可用                     | `CircleClose` / `Remove`                          | 通用                                                            |

> **原则：状态枚举不带 icon = 不完整。** 新增或修改状态类枚举时，必须为每个选项指定 icon，使用 `markRaw()` 包裹，确保状态在 UI 上可通过图标快速辨识。

**写法规范：**

```ts
// apps/hashrate/src/utils/constant.ts
import {
  CircleCheckFilled,
  CircleClose,
  Clock,
  Loading,
} from "@element-plus/icons-vue";

// ✅ 状态枚举 —— 每项必须带 icon
export const myStatusEnum = [
  {
    label: "运行中",
    value: 1,
    type: "success",
    effect: "plain",
    border: false,
    icon: markRaw(CircleCheckFilled),
  },
  {
    label: "准备中",
    value: 2,
    type: "warning",
    effect: "plain",
    border: false,
    icon: markRaw(Clock),
  },
  {
    label: "错误",
    value: 3,
    type: "danger",
    effect: "plain",
    border: false,
    icon: markRaw(CircleClose),
  },
];

// ✅ 非状态枚举（如来源、类型分类）—— icon 可选
export const mySourceEnum = [
  { label: "来源A", value: "a" },
  { label: "来源B", value: "b" },
];

// 在模板中配合 ConstantStatus 使用
// <ConstantStatus :options="myStatusEnum" :value="row.status" />
```

---

## CurdTable 列定义最佳实践

### 状态/枚举列：优先使用 `ColumnFactory.Dict`，禁止手动 `h(ConstantStatus)`

**核心规则：在 CurdTable 中展示枚举/状态列时，必须使用 `ColumnFactory.Dict()`，不要手动通过 `Formatter` + `h(ConstantStatus, ...)` 渲染。**

**原因：**

- `CurdTable` 内部的 `STableItem` 会自动检测列的 `options` 属性，存在时自动渲染 `ConstantStatus` 组件，无需手动处理
- `ColumnFactory.Dict()` 会正确设置 `options` 属性，交给 CurdTable 自动渲染
- 手动使用 `h(ConstantStatus, { ... })` 容易传错 prop 名（如误写 `constant` 而非 `options`），导致状态不显示

**⚠️ 常见错误（已踩坑）：**

```ts
// ❌ 错误：手动 h() 且 prop 名写错为 constant（ConstantStatus 的 prop 是 options）
ColumnFactory.Column("级别", "eventLevel").Formatter((row) =>
  h(ConstantStatus, { constant: myEnum, value: row.eventLevel }),
);

// ❌ 不推荐：即使 prop 名正确，也不应手动渲染，冗余且易出错
ColumnFactory.Column("级别", "eventLevel").Formatter((row) =>
  h(ConstantStatus, { options: myEnum, value: row.eventLevel }),
);
```

**✅ 正确写法：**

```ts
// ✅ 使用 Dict，自动渲染 ConstantStatus，带图标、颜色、标签
ColumnFactory.Dict(
  "级别",
  "eventLevel",
  constant.policyExecutionEventLevel,
).Width(100);

// Dict 支持传字符串 key（从全局 ROOT_CONFIG.constant 取）或直接传 OptionItem[]
ColumnFactory.Dict(
  "事件类型",
  "eventType",
  constant.policyExecutionEventType,
).MinWidth(120);
```

### ColumnFactory 方法速查

| 方法                         | 用途                                   | 示例                                                                   |
| ---------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `Column(label, prop)`        | 普通文本列                             | `ColumnFactory.Column("名称", "name")`                                 |
| `Dict(label, prop, options)` | 枚举/状态列（自动渲染 ConstantStatus） | `ColumnFactory.Dict("状态", "status", constant.xxxStatus)`             |
| `Date(label, prop, format?)` | 日期时间列                             | `ColumnFactory.Date("创建时间", "createTime")`                         |
| `Template(label, prop, tpl)` | 模板插值列                             | `ColumnFactory.Template("全名", "name", "{{firstName}} {{lastName}}")` |

### 链式方法速查

| 方法                                | 用途                                 |
| ----------------------------------- | ------------------------------------ |
| `.Width(n)`                         | 固定宽度                             |
| `.MinWidth(n)`                      | 最小宽度                             |
| `.ShowOverflowTooltip()`            | 溢出省略+tooltip                     |
| `.Formatter(fn)`                    | 自定义渲染（仅在 Dict 不满足时使用） |
| `.FixedLeft()` / `.FixedRight()`    | 固定列                               |
| `.Sortable()` / `.SortableCustom()` | 排序                                 |
| `.Hidden()` / `.NeverShow()`        | 隐藏列                               |

---

## 整个大功能模块：开发前确认清单

仅在开发**整个大功能模块**时输出：

```
【开发前确认清单】

功能模块：[名称]
功能单元：列表页 / 详情页 / 创建页 / 编辑页

字段清单：
  - 字段名（数据类型）→ 展示组件 / 元数据说明

枚举字段（需写入 constant.ts）：
  - 字段名 → 枚举名 → 可选值

组件映射：
  - 直接复用：（组件名 + 来源）
  - 需组合使用：（说明）
  - 需新建：（全新开发，说明理由）

数据关系：（主从/一对多/联动规则）

接口依赖：（列出需要的 API）
```

---

## 复用机制

### 结构对齐原则

列表 → 卡片 → 详情 → 创建/编辑，**结构对齐、字段对齐**：

- 列表字段 ⊆ 详情字段
- 创建/编辑字段与详情字段保持一致（仅数据回填与接口不同）

### 卡片内容区组件化

```vue
<CardContent :data="item" />
<!-- 列表/卡片 -->
<CardContent :data="detail" mode="readonly" />
<!-- 详情页 -->
<CardContent :data="form" mode="editable" />
<!-- 编辑页 -->
```

---

## 编码规范

```
组件命名：PascalCase（如 UserCard.vue）
文件结构：
  <script setup lang="ts">
    // 1. imports
    // 2. props & emits
    // 3. composables & stores
    // 4. reactive state
    // 5. computed
    // 6. methods
    // 7. lifecycle hooks
  </script>
  <template>...</template>
  <style scoped></style>

Props 定义：使用 TypeScript interface
事件命名：动词形式（如 update:modelValue, change, submit）
组合式函数：use 前缀（如 useUserList）
样式：间距/状态色统一使用主题变量，禁止裸十六进制
```

## 代码质量要求

- **类型安全**：避免 any，充分利用 TypeScript
- **响应式**：合理使用 ref/reactive/computed
- **性能**：避免不必要的渲染，合理使用 v-memo、shallowRef
- **可读性**：变量和函数名语义清晰
- **复用性**：抽取公共逻辑到 composables；同类数据只做一次组件

## 输出格式

直接输出可运行的代码，并在关键处添加注释说明设计决策。
对于复杂实现，先给出整体方案再写代码。

## 准则维护原则

- **追加新准则/规范时，必须以行业标准和主流做法为依据**（如 Vue.js 官方风格指南、TypeScript 官方规范、MDN Web Docs、Web.dev Performance 等权威来源），不可仅凭个案经验泛化为通用规则。每条新准则须标注来源，便于溯源和验证

$ARGUMENTS
