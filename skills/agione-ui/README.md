# agione-ui · AGIOne Console UI 原型生成器

> 单文件 HTML 原型生成器：自带 chrome / 双语 (中/EN) / Light&Dark / 38 组件 + 11 设计 token 基础。
> 喂一段需求描述 → 输出可在浏览器直接打开的高保真原型。
>
> **v4.0 起 token 命名（`--ui-*`）与生产项目 `mamba-layout` 完全对齐**：原型代码可直接粘贴到 project-mamba 仓库，零 token rename。

---

## 🚀 快速更新（最常用）

> ⚠️ **不要用 `npx skills update`** —— CLI 的 update 命令对自托管 GitLab 有 bug：会把仓库 path 当成 GitHub `owner/repo` 简写跑去查 `api.github.com`，结果一定是"假装已经是最新"，**实际没拉新内容**。
>
> **正确做法：用 `npx skills add ... -y` 强制重装**。会按 sourceUrl 重新 clone `main` 覆盖现有 4 个 agione skill，**不会**动其他 skill（如 lark-*）。

```bash
npx skills add http://192.168.31.254:9998/agione/agione-skill.git -g --all -y
```

参数解释：
- `-g` —— 装在用户级（`~/.agents/skills/`，Claude Code / Codex 共享同一份源，跑一次两边都生效）
- `--all` —— 覆盖仓库里全部 4 个 skill（agione-req-intake / agione-req-refine / agione-prototype-prep / agione-ui）
- `-y` —— 跳过确认，已存在的 skill 直接覆盖

仓库在公司内网（`http://192.168.31.254:9998/agione/agione-skill.git`），拉不到先连同一内网或 VPN。

> 完整安装 / 锁版本 / 卸载 / AI 代跑提示词 等等，见仓库根 [`README.md`](../../README.md) §二 更新。

---

## 📞 三种调用方式

| 模式 | 触发 | 何时用 |
|------|------|------|
| **A · 从 prototype 文件生成** | `/agione-ui --from <path/to/prototype-角色.md>` | PM 已经写好原型说明（推荐主流程） |
| **B · 自由描述** | `/agione-ui <自由描述>` | 单页面快速验证 / 探索 |
| **C · 增量改** | `/agione-ui --edit <existing.html> <修改描述>` | 在已有原型上加页面 / 改某段 |

> 也可以自然语言直接说"帮我用 AGIOne UI 风格生成 XXX 页面"，AI 会自动触发 skill。

---

## 🧠 Skill 怎么工作的

每次调用，AI 走 **4 层决策流**（v3.12 起）：

```
┌─ Layer 0 · 页面骨架 ────────────────────────────────────┐
│ 看 selection-rules § ⓪：列表/详情/Overview/向导/营销     │
│ → 选模板：复制 templates/pattern-list.html 等起步         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer A · SKILL.md 硬规则（已在上下文，无 IO）────────┐
│ • cp shell-sample-v1.html → 你的原型.html               │
│ • 所有 <el-form> 包 .form-modern                        │
│ • 字号用 .type-* class，不硬编码                         │
│ • Radio 必走 4 variant，多语言必走 <I18nField>          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer B · catalog 按"意图"选组件 ─────────────────────┐
│ 看 catalog.md 12 个意图桶（列表展示 / 数据指标 / ...）  │
│ 每行有"信号"列：                                        │
│   • STOP   → 直接用，禁止 Read 单组件文件               │
│   • TREE-N → 跳 Layer C 走决策树                       │
│   • READ   → 罕见，允许 Read 组件文件查细节             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─ Layer C · selection-rules 决策树 ─────────────────────┐
│ catalog signal=TREE-N 时 Read 对应章节                  │
│ 10 棵树覆盖所有"同类多候选"场景                          │
└─────────────────────────────────────────────────────────┘
                          ↓
       Edit shell-sample.html 的 <main> 区域 + i18n + sidebar
                          ↓
                    单文件可运行原型
```

**关键设计**：

- **Chrome 锁定**：TopBar / Sidebar / Logo / 主题切换 / 双语切换从 shell-sample 字节级复制，零漂移
- **38 个原子组件**：每个有 frontmatter + CSS + demo + props 签名（AI 不读组件文件，从 catalog + cheatsheet 拿信号就够）
- **决策机制**：信号 + 决策树 + 反指针（confusable）三层防止 AI 选错

---

## 📁 目录结构（你需要知道的）

```
agione-ui/
├── SKILL.md                          AI 加载即生效的设计哲学 + 工程铁律
├── README.md                         本文件
├── agione-console-shell-sample-v1.html  cp 起点
├── agione-design-system.html         视觉画廊（人看 / AI 禁读）
├── design-system/                    AI 选型素材
│   ├── AI-USAGE.md                   AI 主入口（替代读完整 SKILL.md）
│   ├── catalog.md                    12 意图桶 × 38 组件索引
│   ├── selection-rules.md            10 棵决策树
│   ├── api-cheatsheet.md             23 PrototypeComponents + EP 高频组件签名
│   ├── index.html                    人类预览导航
│   ├── foundations/ (11)             token / 字型 / 韵律
│   └── components/                   L1 (17) · L2 (19) · templates (2)
└── scripts/                          仅 owner 用，AI 不调用
```

---

## ❓ FAQ

### 单次原型生成消耗多少 token？

**实测 ~15-25k input token / 原型**。

对比：
- 旧方案（AI Read 整个 458KB 设计系统）：~150k token
- v3.12 新方案：~15-25k token
- **降幅 6-10×**

具体分布：
- AI-USAGE.md：~3.5k
- catalog.md：~2.5k
- api-cheatsheet.md：~2.5k（按需读）
- selection-rules § N：~1k / 棵树（按需）
- 需求文档（prototype-X.md）：~5-15k（业务文档占比最大）
- cp shell-sample：**0**（用 bash 命令，不进 AI 上下文）

### 为什么 AI 不能读 `agione-design-system.html`？

那个文件是 6544 行 / 458KB / **~150k token**，是给设计师在浏览器里看的视觉画廊。

AI 真正需要的信息（组件 props / 选型决策 / 设计 token / Badge 词汇）已经全部抽取到 `design-system/` 下的小文件，单次只读相关的几 k 就够。读整个 DS 文件 = 单次烧 150k token 干等同的事。

### Skill 怎么保证多原型视觉一致？

**Chrome 零漂移工作流**：
1. AI 必须 `cp agione-console-shell-sample-v1.html` 起步（不能 Read + Write 整文件）
2. 只允许 Edit `<main>` 区域 + sidebar 菜单 + i18n keys
3. TopBar / 主题切换 / Logo / 字体 / 全部 token 字节级一致

这意味着同事 A 和 B 各自生成的原型，**chrome 像素级相同**。

### 怎么知道生成质量好不好？

3 轮 subagent 实测，对比 10 个历史 prototype baseline：

| 指标 | 数据 |
|------|------|
| Baseline 历史 prototype 质量分均值 | 64.8 / 100 |
| v3.12 新流程 3 次实测 | 85.1 / 86.5 / 86.9 |

**新流程稳定高出 baseline 20 分以上**，6 维客观指标（token 一致性 / class 组合 / chrome 完整 / 禁用图案 / 双语 / Vue 挂载）全过。

### 如果生成的 HTML 看着不对？

按优先级排查：

1. **打开浏览器看 Console** — Vue 编译错误最常见在 `:style` 对象语法 / i18n 块没闭合
2. **检查是否字节级 cp** — `grep LOGO_DARK your-file.html` 应该看到 ~25KB base64
3. **检查 i18n 块** — `zh:` 末尾应是 `},`，不是 `,`
4. **缺组件实现** — AI 写了 `<KpiCard>` 但 PrototypeComponents 里没有 → cp 起点错了或 shell-sample 被改坏

### 我想加新组件 / 改 token 怎么办？

这是 **skill owner 私有工作流**，不是普通使用场景。需要：

- 本地的 5 个维护脚本（git 不追踪）
- 改 `agione-design-system.html` / `agione-console-shell-sample-v1.html` 的权限

→ 找 skill owner 协调。

### Skill 装在哪？

```bash
# Claude Code（默认）
~/.claude/skills/agione-ui/

# Codex
~/.codex/skills/agione-ui/
```

可以 `ls` 看一下内容是否完整。`SKILL.md` 必须存在，其他文件按上面"目录结构"对照。

### 触发不了 skill 怎么办？

1. 确认装上了：`npx skills list -g | grep agione-ui`
2. 触发关键词不到位 — 试用更明确的："请用 agione-ui 生成 ..." 或 `/agione-ui ...`
3. 如果只看到 `agione-ui` 没看到内容 — 重装：`npx skills remove -g agione-ui && npx skills add ...`

### Skill 多大？AI 加载会卡吗？

skill 本体 ~600KB（含 38 个组件文件 + foundations + 设计系统画廊）。但 AI **每次只加载几 k token**：

- `SKILL.md` ~ 30KB / 686 行（设计哲学 + 铁律，全文加载）
- 其他都是按需 Read，单次原型一般触发 ~15-25k

实际感受：触发 skill 后 1-2 秒就开始干活，跟其他 skill 体验一致。

### 双语 / Dark Mode 怎么工作的？

完全自动：

- **双语**：所有文案放 `i18n` 嵌套对象 `{ zh: {...}, en: {...} }`，模板里写 `{{ t.common.btn.save }}`，TopBar 语言切换按钮自动联动
- **Dark Mode**：shell-sample 内置 `darkVars` / `lightVars` 两套 token 注入，主题切换按钮自动联动；只要你的 CSS 用 `var(--*)` 不硬编码，dark mode 零额外工作

### 多状态页面怎么办？

shell-sample 内置 **Scenario Switcher** 机制：

```js
// AI 自动按需生成
const scenarios = reactive({
  normal:  { label: { zh: '默认', en: 'Default' }, data: { mode: 'normal' } },
  empty:   { label: { zh: '空态', en: 'Empty' },   data: { mode: 'empty' } },
  loading: { label: { zh: '加载', en: 'Loading' }, data: { mode: 'loading' } },
});
```

切到非 default 场景，chrome 自动加顶部橙色 banner 提示"For review only"。设计师评审多状态时直接 dropdown 切换看，不用各自存一个 HTML。

---

## 🆘 找谁

| 问题 | 找谁 |
|------|------|
| 装不上 / 更新拉不到 | 检查仓库根 [`README.md`](../../README.md) § 六 常见问题 |
| Skill 行为不对 / 生成质量异常 | 在 [skill 仓库](http://192.168.31.254:9998/agione/agione-skill.git) 开 issue 或找 owner |
| 想做大改 / 加组件 / 改 token | 找 skill owner（私有维护工作流，不在仓库内） |

---

## 📚 进一步阅读

- [`SKILL.md`](./SKILL.md) — 完整设计哲学（设计师 / skill 维护者用）
- [`design-system/AI-USAGE.md`](./design-system/AI-USAGE.md) — AI 主入口（理解 AI 怎么走流程）
- [`design-system/index.html`](./design-system/index.html) — 浏览器打开看 38 组件画廊
