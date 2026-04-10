# assets

这里存放独立于真实项目的前端资产层，用于承接：

-组件候选与正式组件
- 页面草稿与可复用页面范式
-视觉 / 布局 /交互模式
-评审记录
- 同步所需 manifest 元数据

## 当前分层
- `components/candidates`：组件候选区
- `components/official`：知识库正式组件区
- `components/manifests`：组件 manifest 区
- `pages/drafts`：页面草稿区
- `pages/reusable`：可复用页面范式区
- `pages/manifests`：页面 manifest 区
- `patterns`：视觉 / 布局 /交互模式
- `reviews`：组件、页面、同步评审记录

## 使用原则
1. 新产物先进入候选区或草稿区
2.通过评审后再晋升到 official / reusable
3. 是否允许同步到真实项目，以 manifest 为准
4.评审结论与回写动作要能追踪
