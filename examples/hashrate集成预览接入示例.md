# hashrate 集成预览接入示例

这份示例用于说明：

- 如何在 `apps/hashrate` 中挂本地 `__preview__`
- 如何通过 `previewRoutes` 增加额外预览入口
- 如何保持正式自动路由不受影响

---

## 当前最小实现
目前已接入：

- `apps/hashrate/src/__preview__/README.md`
- `apps/hashrate/src/__preview__/preview-routes.ts`
- `apps/hashrate/src/__preview__/pages/PreviewExampleCardPage.vue`
- `apps/hashrate/src/__preview__/components/ExampleCardPreview.vue`
- `apps/hashrate/src/router.ts` 中 DEV-only追加 `previewRoutes`

其中当前 `ExampleCardPreview.vue` 已可由知识库候选组件复制覆盖，说明这条链路已经可以从 `ai-web-system/assets` 映射到 `hashrate/__preview__`。

---

## 当前预览地址
启动 `hashrate` 本地开发后，可访问：

```text
/__preview__/components/example-card
/__preview__/pages/overview-draft
```

注意：
-这是额外预览入口
-不是正式业务入口
- 不会替代自动路由生成的正式页面

---

## 它验证了什么
这个最小示例验证了3 件事：

1. `hashrate` 可以作为真实项目集成预览宿主 app
2. 自动路由项目可以通过 router append 的方式接入 preview
3. 候选组件可以在真实项目壳中做加载态 / 空态 / 默认态验证

---

## 下一步怎么继续扩展
###1. 接知识库候选组件映射
当前 `ExampleCardPreview.vue` 已可以被知识库候选组件覆盖更新。

后续可以替换成：
- 用 `sync-candidate-to-hashrate-preview.mjs` 自动复制候选组件
- 或进一步做 manifest 驱动映射与批量同步

###2. 接候选页面预览
可以继续新增：
- `src/__preview__/pages/PreviewXxxPage.vue`
- `preview-routes.ts` 增加对应 `/__preview__/pages/...`

当前知识库侧已经补了页面草稿示例：
- `assets/pages/drafts/example-overview-page.vue`

并已提供页面草稿同步脚本：
- `sync-page-draft-to-hashrate-preview.mjs`

同时 `hashrate`侧已补一个页面级集成预览示例：
- `src/__preview__/pages/PreviewOverviewDraftPage.vue`
- 路由：`/__preview__/pages/overview-draft`

当前这条链也已经实际执行过复制，说明：

**知识库页面草稿 → hashrate 页面级 preview**这条链路现在同样成立。

###3. 接 approval 流程
当前只是 preview入口。

approval 后，才允许把候选实现同步到：
- 正式组件目录
- 正式页面目录

---

## 一句话结论
这份示例代表：

**你的 hashrate 已经拥有了第一版可运行的本地集成预览接入骨架。**
