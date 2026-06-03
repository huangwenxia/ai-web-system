# agione-ui-explore · AGIOne 探索模式原型生成器

> `agione-ui` skill 的姐妹版——**专门做发散探索 / 多 variant 对比**。
> 不追求生产 100% 对齐，鼓励 DS 之外的创新视觉。
>
> 想要给产品/PM 评审的原型 → 用 [`agione-ui`](../agione-ui/) skill（strict 模式）

---

## 这个 skill 解决什么问题

设计早期发散阶段，经常需要"看几种风格"决定方向：
- "用 Sankey 图代替 KPI 卡可不可行"
- "Quota Policy 列表能不能用时间线驱动"
- "首页要不要做异形 hero"

strict skill 默认 1 个原型 + 守 DS catalog，**回答不了这种发散问题**。本 skill 强制 2-3 variant + 鼓励 DS 之外尝试，让用户挑构图。

## 跟 strict 的差异（速查）

| 项 | strict | **explore** |
|---|---|---|
| 输出数量 | 1 个 | **2-3 个 variant** |
| L2/L3 选型 | 守 DS catalog | **鼓励 DS 之外** |
| 业务卡 | 5 底线 | **守 2 条**（token / `.type-*`）|
| 信息架构 | 4 硬约束 | **2 必守 + 2 推荐** |
| Typography | audit 强制 0 violation | **info-only** |
| 锁定层（chrome / token / 字型） | 守 | **同样守**（这是同事共同语言）|

## 怎么用

```bash
# A · 从 REQ 文件 explore
/agione-ui-explore --from prototype-admin.md

# B · 自由 explore
/agione-ui-explore "为 Credit dashboard 做几种构图，看看 KPI 砌墙之外的可能"

# C · 局部 explore
/agione-ui-explore --refine usage-log.html "顶部 hero 区"
```

## 项目结构（v2.0 重构后 · 故意比 strict 精简）

```
agione-ui-explore/
├── SKILL.md                              # explore 规则（独有）
├── MAINTAINING.md                        # 同步策略（owner 看）
├── README.md                             # 本文件
├── agione-console-shell-sample-v1.html   # ← strict 同步（chrome / base spec）
├── design-system/
│   ├── AI-USAGE.md                       # explore-specific（4 层决策流是 explore 版）
│   ├── api-cheatsheet.md                 # explore-specific（只列 chrome-mandatory）
│   └── foundations/                      # ← strict 同步（typography / color / spacing 展示）
└── scripts/
    ├── sync-from-strict.sh               # 同步脚本（explore 独有）
    ├── check-explore-variants.sh         # explore 独有：Jaccard 检测假 explore
    ├── audit-typography.sh               # ← strict 同步（info-only 跑）
    └── check-dom-template-safety.sh      # ← strict 同步
```

## v2.0 故意没有什么（跟 strict 关键差异）

- ❌ `catalog.md`（DS 组件总览 → 引导按 DS 选）
- ❌ `selection-rules.md`（选 DS 组件的决策树 → 跟探索反向）
- ❌ `design-system/components/L1/` + `L2/` + `templates/`（23 个组件展示 + 4 page partial → 引导复用）
- ❌ `agione-design-system.html`（458KB DS 全景 → 引导整体复制）

**为什么这么决定**：v1.x 时 explore 基本是 strict 的 clone。AI 进 explore 看到完整 DS 反而本能"按 DS 选组件"，跟探索精神冲突。v2.0 砍掉所有 DS 引导，强迫 AI 用 base spec + 自创构图。

体积：~1.5MB → 584KB（减 61%）。

## 同步基线

跟随 `agione-ui` v6.2。每次 strict 改了 chrome / shell-sample / token 后跑 `bash scripts/sync-from-strict.sh`（v2.0 后只同步 base spec 资产，不再同步 DS 引导文件）。详见 [MAINTAINING.md](./MAINTAINING.md)。
