# 知识库目录分层与 Manifest设计

##目标
为 `E:\work\ai-web-system` 建立一套可持续扩展的资产目录分层与同步 manifest设计，使“知识库独立于真实项目，但能稳定回落到真实项目”这件事有明确落点。

## 为什么要补这份设计
前面的流程文档已经定义了闭环与同步原则，但如果没有目录分层和 manifest设计，执行层仍会面临几个问题：

- 草稿、候选、正式资产混在一起
- 无法知道某个组件是否允许同步到项目
- 无法记录组件来源、依赖、适用项目和版本状态
- 同步脚本没有统一元数据入口

所以这一层是“流程落地”的关键补足。

---

## 推荐目录分层
建议未来在 `ai-web-system` 内逐步补成以下结构：

```text
ai-web-system/
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
 reviews/
 component-reviews/
 page-reviews/
 sync-reviews/
 docs/
 standards/
 skills/
 commands/
 agents/
 examples/
 scripts/
```

---

## 各层职责定义
###1. `assets/components/candidates`
存放刚生成、待评审的组件。

适合内容：
- 新组件草稿
- 从页面中抽出来但尚未验证稳定性的组件
-仍在补 API 和边界的组件

###2. `assets/components/official`
存放已通过知识库内部评审的正式组件资产。

适合内容：
- L2级别组件
- 可以作为后续任务直接复用的成熟组件

###3. `assets/components/manifests`
存放组件级 manifest 元数据。

作用：
-让脚本和 Agent 知道组件当前所处状态、依赖与同步资格

###4. `assets/pages/drafts`
存放页面草稿与任务产物。

适合内容：
- 单次任务页面草案
- 尚未验证复用价值的页面结构

###5. `assets/pages/reusable`
存放已经验证过、可作为范式参考的页面模板或页面模式。

###6. `assets/pages/manifests`
存放页面级 manifest 元数据。

###7. `assets/patterns`
存放从多次项目中提炼出来的模式资产，而不是完整组件。

例如：
-视觉模式
- 页面布局模式
-交互模式

###8. `assets/reviews`
存放评审记录，便于回看某个资产为何被保留、为何不允许同步。

---

## 推荐最小 manifest 字段
不论是组件还是页面，建议先有一版统一最小 manifest。

```json
{
 "name": "EntityDetailCard",
 "type": "component",
 "status": "candidate",
 "maturityLevel": "L1",
 "source": {
 "task": "接口详情页生成",
 "createdFrom": "schema-to-ui + frontend-implementer",
 "createdAt": "2026-04-08"
 },
 "projectCompatibility": {
 "projects": ["project-mamba"],
 "dependencies": ["vue", "element-plus", "easybill-ui"],
 "forbiddenDependencies": []
 },
 "sync": {
 "allowed": false,
 "targetProject": "project-mamba",
 "targetPath": "",
 "lastSyncedAt": "",
 "syncStrategy": "manual-review"
 },
 "review": {
 "reusability": "medium",
 "apiStability": "low",
 "visualQuality": "medium",
 "boundaryCompleteness": "low"
 },
 "writeback": {
 "docs": [],
 "standards": [],
 "examples": []
 }
}
```

---

## 字段说明
###基础字段
- `name`：资产名称
- `type`：`component` / `page` / `pattern`
- `status`：`draft` / `candidate` / `official` / `project-synced`
- `maturityLevel`：对应 `L0` ~ `L3`

### source
记录这个资产从哪里来。

建议至少记录：
- 来源任务
-由哪些 Skill / Agent产出
-生成时间

### projectCompatibility
记录它依赖什么、能适配哪些项目。

### sync
记录它是否允许同步、目标路径是什么、上次同步时间是什么。

### review
记录主要评审结论，便于脚本和 Agent结合使用。

### writeback
记录它引发了哪些标准、文档或示例的回写动作。

---

## 状态流转建议
推荐最小状态流转：

1. `draft`
2. `candidate`
3. `official`
4. `project-synced`

###解释
- `draft`：刚生成，尚未进入正式评审
- `candidate`：具备初步复用价值，等待成熟度评审
- `official`：已成为知识库正式资产
- `project-synced`：已同步进入真实项目，并保留同步记录

---

##目录与 manifest 如何配合
建议采用“双判断”：

1. **目录位置** 表示当前资产所处分层
2. **manifest 状态** 表示当前资产的治理结论

这样做的好处：
- 人眼容易理解
- 脚本容易读取
- Agent 容易解释
- 后续支持批量同步更方便

---

## 推荐后续脚本能力
基于这套目录和 manifest，可以继续做这些脚本：

1. `create-manifest`
 - 为新组件 / 页面生成 manifest

2. `validate-asset-compatibility`
 - 扫描依赖是否超出 `project-mamba`

3. `promote-asset`
 - 把资产从 `draft / candidate` 升级为 `official`

4. `sync-asset-to-project`
 - 按 manifest 同步到 `project-mamba`

5. `collect-writeback-items`
 - 汇总哪些资产触发了文档或标准回写

---

## 当前建议的落地顺序
如果要逐步落地，不建议一次性建全所有目录。推荐顺序：

1.先建立 `assets/components/candidates`
2. 再建立 `assets/components/official`
3. 补 `assets/components/manifests`
4. 再补 `assets/pages/drafts` 与 `assets/pages/manifests`
5.最后再逐步补 `patterns` 与 `reviews`

这样最符合你当前“先抓组件与页面复用”的目标。

## 当前已落地的第一版骨架
当前仓库已补上第一版基础骨架：

- `assets/components/candidates`
- `assets/components/official`
- `assets/components/manifests`
- `assets/pages/drafts`
- `assets/pages/reusable`
- `assets/pages/manifests`
- `assets/patterns/visual`
- `assets/patterns/layout`
- `assets/patterns/interaction`
- `assets/reviews/component-reviews`
- `assets/reviews/page-reviews`
- `assets/reviews/sync-reviews`
- `scripts/asset-tools/create-manifest.mjs`
- `scripts/asset-tools/validate-asset-compatibility.mjs`
- `scripts/asset-tools/promote-asset.mjs`
- `scripts/asset-tools/sync-asset-to-project.mjs`
- `scripts/asset-tools/collect-writeback-items.mjs`

并提供了组件 / 页面 manifest 模板，可以直接作为后续治理和同步脚本的起点。

另外，当前还补了一份可直接演示的示例：

- `assets/components/candidates/example-card.vue`
- `assets/components/manifests/example-card.manifest.json`
- `examples/资产治理工作流示例.md`

这样你可以用一个真实样板去跑通 manifest 创建、兼容性校验、晋升和同步前准备流程。

---

##结论
目录分层解决“资产放哪”的问题。
Manifest解决“资产当前是什么状态、能不能同步、为什么”的问题。

两者结合，才能把你的知识库真正升级成可治理、可同步、可积累的前端资产系统。