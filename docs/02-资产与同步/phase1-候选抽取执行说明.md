# Phase 1 候选抽取执行说明

## 目标

把 `E:\work\project-mamba\apps` 下的单个 Vue 视图文件，正式沉淀到 `ai-web-system/assets`，并进入 `ai-front-workbench` 的资产目录与审评链路。

这一步解决的问题不是“直接预览”，而是先把来源明确、状态明确、清洗责任明确。

---

## 当前脚本

```bash
pnpm extract-view-candidate --source=wanmore/src/components/ListTabBox/src/ListTabBox.vue
```

等价命令：

```bash
node scripts/asset-tools/extract-view-candidate.mjs \
  --source=wanmore/src/components/ListTabBox/src/ListTabBox.vue
```

---

## 输入与输出

输入：

- `project-mamba/apps/<project>/.../*.vue`

输出：

- `assets/components/candidates/<name>.vue`
- `assets/components/manifests/<name>.manifest.json`
- 或 `assets/pages/drafts/<name>.vue`
- 或 `assets/pages/manifests/<name>.manifest.json`
- 自动刷新 `apps/ai-front-workbench/src/registry/generated/asset-registry.generated.*`

---

## 默认规则

### 1. 类型推断

- `src/components/**` / `src/layout/components/**` -> `component`
- `src/views/**/components/**` -> `component`
- `src/views/**/*.vue` -> `page`

### 2. 状态推断

新抽取资产默认进入：

```text
raw-candidate
```

它表示：

- 已进入资产层
- 已建立来源追踪
- 尚未完成解耦清洗
- 尚未承诺可以直接在 workbench 独立预览

### 3. 自动补全的元数据

脚本会自动生成：

- `sourceProject`
- `sourceAppPath`
- `sourceKind`
- `analysis.importCount`
- `analysis.localDependencyCount`
- `analysis.candidateScore`
- `cleaning.adapterRequired`
- `cleaning.mockRequired`
- `cleaning.portabilityLevel`

---

## 推荐状态流转

```text
draft
  -> raw-candidate
  -> cleaned-candidate
  -> official
  -> integration-approved
  -> synced
```

说明：

- `raw-candidate`: 刚从源项目抽出，允许保留工程耦合痕迹
- `cleaned-candidate`: 已做最小解耦，可进入独立预览
- `official`: 进入知识库正式资产
- `integration-approved`: 允许进入真实宿主 `__preview__`
- `synced`: 已进入真实项目目录

---

## 推荐使用方式

### 共享组件候选

```bash
pnpm extract-view-candidate --source=wanmore/src/components/ListTabBox/src/ListTabBox.vue
```

### 页面局部区块候选

```bash
pnpm extract-view-candidate \
  --source=hashrate/src/views/index/user/model/deployment/components/OverviewCard.vue \
  --pagePath=apps/hashrate/src/views/index/user/model/deployment/index.vue \
  --contextType=overview-page
```

### 只做预演，不落盘

```bash
pnpm extract-view-candidate \
  --source=wanmore/src/components/ListTabBox/src/ListTabBox.vue \
  --dryRun=true
```

---

## 当前边界

当前 Phase 1 脚本只负责：

- 抽取
- 登记
- 建 manifest
- 刷新 workbench registry

当前 Phase 1 脚本暂不负责：

- 自动改写 `@/` 等别名
- 自动抽离 store/router/request
- 自动生成 preview wrapper
- 自动生成 mock
- 自动接入宿主项目 `__preview__`

这四项属于下一阶段的“清洗与适配”流水线。
