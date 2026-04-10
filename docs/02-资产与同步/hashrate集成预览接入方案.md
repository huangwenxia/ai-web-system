# hashrate 集成预览接入方案

##目标
明确 `project-mamba/apps/hashrate`作为真实项目集成预览宿主 app 时，应该如何接入本地 `__preview__`机制，同时兼容当前自动路由体系，并保持“preview只新增入口、不替代正式入口”的原则。

---

## 当前 hashrate 的关键现状
根据当前代码结构：

- 路由由 `vite-plugin-pages` 自动扫描生成
- `src/router.ts` 中已经通过 `routes from "~pages"` 和 `commonRoutes from "~common"`组装自动路由
- `src/views` 是 hashrate 主扫描目录
- `../common/src/views` 是 common 路由扫描目录
- router 最终是 `createRouter({ routes: [...] })` 显式创建

这意味着：

1. hashrate **具备一个非常好的插入点**：`src/router.ts`
2. 不需要改动自动路由生成机制本身
3. 最适合通过“**路由生成后追加 previewRoutes**”的方式接入

---

## 推荐方案
###方案结论
`hashrate`作为宿主 app 时，推荐采用：

**本地 `__preview__`目录 + DEV 环境下追加 previewRoutes + preview 独立路径前缀**

即：

- preview 文件只放在 `apps/hashrate/src/__preview__/`
- 不放入 `src/views`
- 不让 `vite-plugin-pages` 扫描 preview 文件
- 在 `src/router.ts` 手动 append 一组 `previewRoutes`

这就是当前阶段最稳的最小接入方案。

---

## 推荐目录结构
在 `apps/hashrate/src` 下建议预留：

```text
src/
 __preview__/
 components/
 pages/
 mocks/
 preview-routes.ts
 preview-registry.ts
 README.md
```

### 各目录职责
- `components/`：候选组件在真实项目壳中的集成预览入口
- `pages/`：候选页面在真实项目壳中的集成预览入口
- `mocks/`：本地集成预览使用的 mock 数据
- `preview-routes.ts`：定义 `/__preview__/...` 路由
- `preview-registry.ts`：登记当前有哪些候选资产可集成预览

---

## 为什么不让 preview参与自动路由扫描
因为 hashrate 当前已经通过：

- `pages({ dirs: [{ dir: "src/views", ... }] })`

明确规定了自动扫描目录。

如果让 `__preview__`也进自动扫描，会带来问题：

1. preview 和正式视图规则耦合
2. 更容易误进入正式路由表
3. git ignore 本地目录与自动扫描耦合后，维护复杂度增加
4. 后续 approval 前后容易混淆 preview 与正式页面

因此，对你当前阶段，**最好的方式不是改 pages 插件配置，而是完全绕开它**。

---

## router 接入原则
### 核心规则
1. 正式业务路由继续完全走自动路由
2. `previewRoutes`只是 append 到 router 中
3. preview 路径统一挂在 `/__preview__/...`
4. preview仅在本地 DEV 模式启用

### 应有的接入形态
逻辑上建议变成：

```ts
const appRoutes = [...commonHandledRoutes, ...(import.meta.env.VITE_ROUTE_AUTH === '0' ? routes : wmHandledRoutes)]
const routesWithPreview = import.meta.env.DEV ? [...appRoutes, ...previewRoutes] : appRoutes

const router = createRouter({
 history: createWebHistory(),
 routes: routesWithPreview,
})
```

这意味着：
- 正式路由不受影响
- preview 路由只是多一条访问入口
- approval 前后不会混淆正式页面和 preview 页面

---

## 路径策略
### 推荐路径前缀
统一使用：

- `/__preview__/components/:name`
- `/__preview__/pages/:name`

这样做有几个好处：

1. 一眼能识别为内部预览路径
2. 不与正式页面路径冲突
3. 可以和 approval 流程天然隔离
4. 后续清理和治理都更简单

---

## 与 approval 的关系
### approval 前
候选资产可以：
- 在 `ai-front-workbench` 做独立预览
- 在 `hashrate/src/__preview__` 做集成预览

但不能：
- 写入 `src/views` 正式页面目录
- 写入正式组件目录并让正式页面引用

### approval 后
才允许：
- 从知识库候选区 / preview版本同步到正式目录
- 正式业务页面开始引用新实现

所以 `previewRoutes` 永远只是验证层，不承担正式业务接管职责。

---

## hashrate作为宿主 app 的优点
###1.结构清晰
`src/router.ts` 明确存在手动组装点，适合插入 previewRoutes。

###2. 自动路由边界明确
当前 `vite-plugin-pages` 已明确扫描 `src/views`，所以 preview区完全可以规避主扫描链。

###3.依赖环境真实
hashrate 本身依赖：
- `@repo/ui`
- `@repo/utils`
- `@repo/request`
- `pinia`
- `vue-router`

足够承载“接近真实项目落地效果”的集成验证。

###4. 非侵入性好
只需要在 router 层增加 previewRoutes入口，不需要推翻现有路由方案。

---

## 当前阶段的最小实施建议
如果你下一步要真正开始做，建议按这个顺序：

1. 在 `apps/hashrate/src/__preview__/` 建目录骨架
2. 写 `preview-routes.ts`
3. 在 `src/router.ts` 中用 DEV 条件 append `previewRoutes`
4.先挂一个 `example-card` 集成预览页
5. 再接一个候选页面预览页

---

## 一句话结论
`hashrate` 非常适合作为你当前的集成预览宿主 app。

而且最推荐的接法是：

**不改自动路由核心，不让 preview参与自动扫描，而是在 `src/router.ts` 中于 DEV 环境下额外 append 一组 `/__preview__/...` 路由。**

这最符合你当前“个人试验、本地沙盒、approval 前不正式覆盖”的目标。
