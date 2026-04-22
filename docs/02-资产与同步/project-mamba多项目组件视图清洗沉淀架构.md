# project-mamba 多项目组件视图清洗沉淀架构

## 目标
为 `<source-project-root>` 中多个业务 app 的组件视图建立一套可持续运行的“发现 -> 清洗 -> 沉淀 -> 预览 -> 评审 -> 晋升 -> 同步”架构，并与 `ai-web-system` 现有目录职责保持一致。

这套架构重点解决三件事：

1. 从多个业务项目中识别值得沉淀的组件视图，而不是无差别复制
2. 把页面私有实现清洗成可复用资产，而不是把业务耦合原样搬运
3. 让 `ai-front-workbench` 成为预览与评审承载层，而不是资产源头目录

---

## 先给结论
不要把“清洗后的组件视图源码”直接长期沉淀在 `apps/ai-front-workbench` 内。

更合理的职责分层是：

- `project-mamba`：真实来源项目
- `ai-web-system/assets`：资产源头与治理中心
- `ai-web-system/apps/ai-front-workbench`：资产预览、评审、发现与工作流承载层

一句话：

**资产沉淀在 `assets`，workbench 只消费资产。**

如果把沉淀结果直接放进 `ai-front-workbench/src/components`，后续很快会出现：

- workbench app 代码和资产源码混杂
- 资产版本、评审结论、来源关系难追踪
- 同一个组件既像业务代码又像资产代码，边界失真
- 后续同步回真实项目时缺少明确资产主记录

---

## 当前现实背景
`project-mamba` 不是单一 app，而是一个多业务 monorepo。

当前统计可见：

- `wanmore` 约 878 个 `*.vue`
- `zguan` 约 753 个 `*.vue`
- `hashrate` 约 631 个 `*.vue`
- `general` 约 592 个 `*.vue`
- `cbdp` 约 541 个 `*.vue`
- `gnosis` 约 480 个 `*.vue`

同时存在大量重复命名和大量 `views/**/components` 目录，这说明这项工作本质上不是“补一个组件库”，而是“多项目视图资产治理系统”。

因此，不能直接按“人工挑几个文件复制进 workbench”来设计，必须建立分层与门禁。

---

## 总体架构
推荐采用五层架构：

1. 来源层
2. 识别与清洗层
3. 资产治理层
4. 预览与评审层
5. 同步与回流层

```text
project-mamba
  ├─ packages/ui / packages/mamba-ui          <- 基础组件依赖基线
  ├─ apps/*/src/components                    <- app 级共享组件来源
  └─ apps/*/src/views/**/components           <- 页面级视图片区块来源
                |
                v
识别与清洗流水线
  ├─ 扫描
  ├─ 分类
  ├─ 依赖分析
  ├─ 耦合裁剪
  ├─ mock / adapter 生成
  └─ 候选资产输出
                |
                v
ai-web-system/assets
  ├─ components/candidates
  ├─ components/official
  ├─ pages/drafts
  ├─ patterns/*
  ├─ manifests
  └─ reviews
                |
                v
ai-front-workbench
  ├─ registry
  ├─ preview pages
  ├─ adapters
  ├─ mocks
  └─ review panels
                |
                v
hashrate/__preview__ or other host app preview
                |
                v
正式项目目录 + 回流知识库
```

---

## 一、来源层设计
来源层不是一个目录，而是一套“可识别来源集合”。

推荐把 `project-mamba` 中的组件视图来源分成四类：

### A. 基础依赖层
目录示例：

- `packages/ui/src/components`
- `packages/mamba-ui/src`

职责：

- 作为 workbench 与沉淀资产的依赖基线
- 不是本次“清洗沉淀”的主目标
- 主要用于说明资产依赖、适配成本和复用边界

### B. app 级共享组件层
目录示例：

- `apps/*/src/components`
- `apps/*/src/layout/components`

职责：

- 候选的共享视图组件来源
- 通常比页面私有组件复用潜力更高

### C. 页面级视图片区块层
目录示例：

- `apps/*/src/views/**/components`

职责：

- 这是本次最关键的来源层
- 往往包含卡片区块、详情区块、图表区块、步骤视图、局部表单、局部列表等
- 复用潜力高，但业务耦合也最重

### D. 页面壳层
目录示例：

- `apps/*/src/views/**/*.vue`

职责：

- 用于提取页面骨架、布局模式、信息组织方式
- 不默认进入组件资产层
- 更适合进入 `assets/pages/drafts` 或 `assets/patterns`

---

## 二、识别与清洗层设计
这是整套系统最关键的一层。

目标不是“复制文件”，而是把真实项目中的视图实现，转换成适合知识库管理的候选资产。

推荐拆成六个子步骤：

### 1. 扫描
输入：

- `project-mamba/apps/*`
- `project-mamba/packages/ui`
- `project-mamba/packages/mamba-ui`

输出：

- `source-inventory.json`

记录字段建议：

- `sourceProject`
- `sourcePath`
- `sourceType`
- `fileName`
- `importCount`
- `localDependencyCount`
- `usesRouter`
- `usesStore`
- `usesRequest`
- `usesI18n`
- `usesPermission`
- `candidateScore`

### 2. 分类
把扫描结果归到以下类型之一：

- `base-ui`
- `shared-view-component`
- `page-block-component`
- `page-shell`
- `pattern-fragment`
- `not-eligible`

分类规则建议：

- `packages/ui`、`packages/mamba-ui` 默认标为 `base-ui`
- `apps/*/src/components` 默认优先标为 `shared-view-component`
- `views/**/components` 默认优先标为 `page-block-component`
- `views/**/index.vue`、`Detail.vue` 等默认先标为 `page-shell`

### 3. 依赖分析
对候选组件做 import 图分析，判断清洗难度。

依赖按四档处理：

- `direct-safe`：仅依赖 `vue`、`@repo/ui`、`@repo/utils`、样式文件
- `adapter-needed`：依赖 i18n、router、pinia、权限、请求等，需要注入适配器
- `mock-needed`：依赖接口数据、异步流、业务上下文，需要 mock
- `not-portable`：强耦合当前页面、目录、全局实例，不建议直接沉淀

### 4. 耦合裁剪
把候选组件从“业务页面私有实现”裁剪成“可沉淀候选资产”。

主要动作：

- 统一 props 输入
- 移除页面私有路由跳转
- 抽离页面私有 store 访问
- 抽离直接请求逻辑
- 把业务文案改成可配置或保留原文并标注上下文
- 用 mock 数据替代真实接口依赖
- 对权限态、空态、loading 态做显式补齐

### 5. 预览包装
每个候选资产不只要有组件源码，还要有 preview wrapper。

wrapper 职责：

- 注入 mock 数据
- 注入 router/store/i18n adapter
- 组织 default/empty/loading/error 四种状态
- 提供最小说明与来源信息

### 6. 候选资产输出
输出到 `ai-web-system/assets`，而不是直接输出到 workbench。

推荐输出：

- `assets/components/candidates/*.vue`
- `assets/pages/drafts/*.vue`
- `assets/patterns/*`
- 对应 manifest
- review 初稿

---

## 三、资产治理层设计
资产治理层仍以 `assets/` 为核心，不建议改变现有总体方向。

但要补一层“多项目来源治理”的字段。

### 1. 资产目录建议
保持现有主目录不变：

```text
assets/
  components/
    candidates/
    official/
    manifests/
  pages/
    drafts/
    reusable/
    manifests/
  patterns/
    visual/
    layout/
    interaction/
    manifests/
  reviews/
```

### 2. Manifest 字段补充建议
在现有 manifest 上新增以下字段：

```json
{
  "sourceProject": "hashrate",
  "sourceAppPath": "apps/hashrate/src/views/index/user/model/deployment/components/Xxx.vue",
  "sourceKind": "page-block-component",
  "extractedFrom": {
    "pagePath": "apps/hashrate/src/views/index/user/model/deployment/index.vue",
    "contextType": "list-page"
  },
  "cleaning": {
    "adapterRequired": ["i18n", "router"],
    "mockRequired": true,
    "removedCouplings": ["request", "page-store"],
    "portabilityLevel": "medium"
  },
  "preview": {
    "workbenchEntry": true,
    "integrationPreview": false
  }
}
```

### 3. 资产等级建议
沿用现有成熟度思路，但补一个“来源清洗状态”：

- `raw-candidate`
- `cleaned-candidate`
- `official`
- `integration-approved`
- `synced`

说明：

- `raw-candidate`：刚从项目中抽出，尚未脱耦
- `cleaned-candidate`：已经完成最小清洗，可进 workbench
- `official`：在知识库内可稳定复用
- `integration-approved`：允许进入真实项目 preview
- `synced`：已进入真实项目正式目录

---

## 四、ai-front-workbench 架构设计
`ai-front-workbench` 的职责不是存资产源码，而是承接：

- 资产发现
- 资产预览
- 状态矩阵验证
- 评审记录
- 依赖检查结果展示
- 后续同步操作入口

### 1. workbench 内部模块建议
推荐在 `apps/ai-front-workbench/src` 内补以下结构：

```text
src/
  adapters/
    i18n/
    router/
    store/
    request/
  registry/
    asset-registry.ts
    asset-groups.ts
  loaders/
    load-asset-meta.ts
    load-preview-module.ts
  mocks/
    generated/
    manual/
  preview/
    pages/
    components/
    shells/
  reviews/
    review-panels/
  pages/
    WorkbenchHomePage.vue
    AssetCatalogPage.vue
    AssetPreviewPage.vue
    ReviewQueuePage.vue
    SourceTracePage.vue
```

### 2. workbench 页面建议
至少需要四个页面：

#### Asset Catalog
用于按以下维度浏览候选资产：

- 来源 app
- 资产类型
- 成熟度等级
- 是否需要 adapter
- 是否已进入集成预览

#### Asset Preview
用于展示单个资产：

- default
- empty
- loading
- error
- dark/light 或不同容器宽度

#### Review Queue
用于处理待评审资产：

- 复用价值
- API 稳定性
- 边界完整性
- 工程兼容性
- 是否允许进入集成预览

#### Source Trace
用于查看来源关系：

- 来源项目
- 来源页面
- 来源组件路径
- 清洗动作
- 被移除的耦合
- 当前同步状态

### 3. workbench 运行原则
- workbench 只读取 `assets` 与 manifest
- workbench 不直接把资产源码作为“手工维护主目录”
- workbench 的 preview wrapper 可以在 app 内部维护
- 资产升级后，workbench 自动发现

---

## 五、同步与回流层设计
清洗沉淀不是终点，必须接到真实项目验证与回流。

### 1. 三段式验证链路
推荐固定成三段：

1. `project-mamba` 原始组件视图
2. `ai-front-workbench` 独立预览
3. `project-mamba/__preview__` 集成预览

说明：

- 第 1 段看真实来源
- 第 2 段看脱耦后的资产是否成立
- 第 3 段看放回真实项目壳中是否成立

### 2. 集成预览规则
仍建议沿用当前 `__preview__` 方案：

- 资产源头在 `ai-web-system/assets`
- 通过脚本复制到 `project-mamba/apps/<host>/src/__preview__`
- 走 `/__preview__/...` 路由
- approval 前不替换正式引用链

### 3. 回流内容
资产进入真实项目验证后，要回流：

- 适配失败原因
- 真实依赖补充
- 新的禁用模式
- 可提炼的 pattern
- 是否可晋升为 official

---

## 六、推荐的自动化脚本体系
建议新增一组“来源清洗脚本”，但不要把判断完全黑盒交给 Agent。

### 应优先脚本化
- 扫描 `*.vue` 来源文件
- 建立 import 图
- 统计依赖复杂度
- 生成来源清单
- 生成候选 manifest
- 复制候选组件到 `assets/components/candidates`
- 生成 workbench registry
- 生成集成 preview registry

### 更适合 Agent 辅助
- 判断某个页面块是否值得抽象
- 给组件命名去业务化
- 识别哪些依赖应适配、哪些依赖应删除
- 判断是组件资产还是页面模式资产
- 产出 review 结论

### 推荐新增脚本
```text
scripts/asset-tools/
  scan-project-mamba-views.mjs
  classify-view-assets.mjs
  extract-view-candidate.mjs
  build-workbench-registry.mjs
  build-preview-registry.mjs
  generate-view-mock.mjs
```

---

## 七、分阶段实施建议
### Phase 1：打通最小链路
目标：

- 只选 1 个宿主 app
- 只选 1 类组件视图
- 能完成扫描 -> 清洗 -> workbench 预览

建议范围：

- 宿主 app：`hashrate`
- 目标类型：`views/**/components` 中的信息卡片、状态区块、详情区块

输出：

- 来源清单
- 3 到 5 个 cleaned-candidate
- workbench 资产目录页
- 单资产 preview 页

### Phase 2：补治理与评审
目标：

- 接 manifest 扩展字段
- 接 review queue
- 接 maturity 评审动作
- 接 `integrationPreview` 标记

输出：

- 候选资产晋升机制
- review 记录
- build-workbench-registry 脚本

### Phase 3：接 project-mamba 集成预览
目标：

- 将 cleaned-candidate 复制到 `hashrate/__preview__`
- 自动生成 preview registry 和路由
- 建立 workbench -> host preview 跳转链

输出：

- 独立预览与集成预览双链路
- 集成预览通过率记录

### Phase 4：扩到多 app
目标：

- 扩到 `wanmore`、`zguan`、`gnosis`
- 建立多项目来源分类
- 建立资产跨项目复用标记

输出：

- 多项目来源地图
- 复用热度统计
- 稳定资产正式入库

---

## 八、最重要的边界判断
这套架构里最容易出错的点有三个：

### 1. 不要把所有 `views/**/components` 都当组件资产
很多只是页面私有拼装。

判断标准：

- 是否能脱离当前页面存在
- 是否有明确输入输出
- 是否能补齐边界态
- 是否不依赖当前页面私有 store / route / request

### 2. 不要让 workbench 成为资产主目录
否则预览 app 和资产库会混成一层。

### 3. 不要跳过清洗直接做同步
原项目组件视图往往强耦合当前上下文。

必须先经过：

- 分类
- 依赖分析
- 耦合裁剪
- mock 与 adapter 补齐
- 独立预览

---

## 九、对你当前目标的最小建议
如果你现在就要开始做，最小可执行方案建议是：

1. 先只处理 `hashrate` 和 `wanmore`
2. 先只处理 `views/**/components` 下的“信息卡片 / 统计卡片 / 详情摘要区块 / 状态区块”
3. 资产源码先进入 `assets/components/candidates`
4. `ai-front-workbench` 只负责：
   - 列出候选资产
   - 展示四种状态
   - 显示来源与依赖
   - 记录评审结论
5. 暂时不要直接做“全量多项目自动抽取”

这是因为：

- 当前 `project-mamba` 规模已经很大
- 文件同名与结构相似度很高
- 先做全量只会得到大量低质量候选

你当前最需要的是：

**先证明这条链能稳定产出 5 到 10 个高质量 cleaned-candidate。**

---

## 一句话结论
针对 `project-mamba` 多项目组件视图清洗沉淀，最合理的系统架构不是“把组件搬进 workbench”，而是：

**以 `project-mamba` 为来源，以 `assets` 为资产主仓，以 `ai-front-workbench` 为预览评审层，以 `__preview__` 为真实项目集成验证层，建立一条受控的多项目视图资产治理流水线。**
