#资产到 hashrate预览映射机制

##目标
定义如何把 `ai-web-system/assets` 中的候选组件 / 页面，映射到 `project-mamba/apps/hashrate/src/__preview__`，用于真实项目集成预览。

---

## 当前原则
###1. 知识库是源头
候选资产长期保存在：
- `ai-web-system/assets/components/candidates`
- `ai-web-system/assets/pages/drafts`

###2. hashrate preview只是验证层
`apps/hashrate/src/__preview__`只是本地集成预览壳，不是正式资产主目录。

###3. preview 映射不等于正式同步
映射到 `__preview__`仅表示允许在真实项目壳下验证，不表示允许正式进入业务目录。

---

## 当前最小映射方式
现阶段先采用最简单且最稳的策略：

###组件映射
将候选组件从：

```text
ai-web-system/assets/components/candidates/*.vue
```

复制到：

```text
project-mamba/apps/hashrate/src/__preview__/components/*.vue
```

### 页面映射
未来同理可以从：

```text
ai-web-system/assets/pages/drafts/*.vue
```

复制到：

```text
project-mamba/apps/hashrate/src/__preview__/pages/*.vue
```

---

## 当前已提供的第一版脚本
已提供：

- `scripts/asset-tools/sync-candidate-to-hashrate-preview.mjs`
- `scripts/asset-tools/sync-page-draft-to-hashrate-preview.mjs`

用途：
- 把知识库候选组件复制到 `hashrate` 的本地 preview组件目录
- 把知识库候选页面草稿复制到 `hashrate` 的本地 preview页面目录

示例：

```powershell
node scripts/asset-tools/sync-candidate-to-hashrate-preview.mjs --source=assets/components/candidates/example-card.vue --name=ExampleCardPreview
```

当前这条链已经用于覆盖 `apps/hashrate/src/__preview__/components/ExampleCardPreview.vue`，说明知识库候选组件已能进入 hashrate 本地集成预览。

页面级示例则可使用：

```powershell
node scripts/asset-tools/sync-page-draft-to-hashrate-preview.mjs --source=assets/pages/drafts/example-overview-page.vue --name=PreviewOverviewDraftPage.vue
```

当前 `hashrate`侧已预留页面级 preview入口：

- `apps/hashrate/src/__preview__/pages/PreviewOverviewDraftPage.vue`
- `apps/hashrate/src/__preview__/preview-routes.ts` 中的 `/__preview__/pages/overview-draft`

并且当前已执行过一次页面草稿复制覆盖，说明页面级映射链路也已经从“文档方案”进入“实际可执行”状态。

---

## 当前真实可执行链路
###组件级
1. 候选组件保存在 `assets/components/candidates`
2. 用 `sync-candidate-to-hashrate-preview.mjs`复制到 `hashrate/src/__preview__/components`
3.通过 `/__preview__/components/example-card` 做集成预览

### 页面级
1. 页面草稿保存在 `assets/pages/drafts`
2. 用 `sync-page-draft-to-hashrate-preview.mjs`复制到 `hashrate/src/__preview__/pages`
3.通过 `/__preview__/pages/overview-draft` 做集成预览

---

## 为什么当前先用复制，不做复杂链接
因为你当前阶段是个人试验，优先目标是：

- 快速可用
- 足够稳定
-容易理解
- 不引入额外环境依赖

所以现阶段复制是最合适的。

后续如果机制成熟，再考虑：
- 自动生成映射
- manifest 驱动映射
- 多资产批量同步到 preview

---

## 推荐后续升级方向
1.让 manifest 增加 `integrationPreview` 字段
2. 增加页面级映射脚本
3.增加 preview registry 自动更新脚本
4. 增加 preview 路由自动注册脚本

---

## 一句话结论
当前阶段，`assets -> hashrate/__preview__` 的最优策略是：

**知识库候选资产作为源头，先通过简单复制脚本映射进 hashrate 本地 preview 区，用于同步前集成验证。**
