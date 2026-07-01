---
name: agione-prototype-to-production
version: 1.1
description: >
  把 agione-ui 生成的单文件 HTML 原型（不限版本，v3 premium 到 v6+ 均适用），高保真还原成
  project-mamba 生产页面（接真实 packages/api、easybill-ui、真实数据）。当用户说"把这份原型落到
  项目里 / port 进 project-mamba / 按原型还原这个页面 / 实现这个 HTML 原型 / 这个页面跟原型不一致"，
  或在 apps/financial、apps/cbdp 等
  生产 app 里基于 HTML 原型做新页面/改页面时，务必使用本 skill。它解决两件现有 skill 没覆盖的事：
  ① 生成端如何一次到位避免 AI agent 常犯的系统性偏差（硬编码文案、手搓图表、绕开共享组件、luxury hero 退化）；
  ② review 端如何用「截图保真闭环」（scripts/fidelity/：自动截两边图 + 对称遮蔽动态数据 + pixelmatch% +
  逐元素 computed-style delta + proto/impl 并排合成图给视觉 agent），循环到量化停止条件，精确抓出肉眼看不到的
  偏差（字号差 2px、字重差一档、圆角 12 vs 8、字体 mono/Inter 混排、图标 path 不同、缺阴影、间距错位）。
  注意：本 skill 针对**生产项目 project-mamba**；如果是 agione-sandbox 沙盒环境，用 agione-prototype-port。
---

# 原型 → project-mamba 生产页高保真还原（通用引擎）

**目标:任意高质量定稿的原型,过一遍本 skill,生产 v1 直接达到 ≥80% 还原,剩下用 fidelity 闭环微调到位。**

- **那 80% 来自 §2「生成自检清单」** —— 它把 naive port 必踩的系统性偏差提前堵住。这是本 skill 的**核心价值,且与具体原型无关**:换任何原型都照它做。
- **剩下 20% 靠 §3「fidelity 闭环」** —— 它**不产出质量,只测量**:把肉眼看不到的精细偏差(字号差 2px、字重差一档、圆角差 4px、字体 mono/Inter 混排、图标 path、缺阴影、间距错位)变成**可测量的数字 + 客观闸门**,逐项调到位。

> **通用核心**(任何原型都适用):§0 理念 / §2 生成清单 / §3 闭环 / §5 节奏 / §6 禁忌。
> **案例 / 环境适配层**(FO·AGIOne 的具体物料,都是**举例,按你的原型与环境替换**):§4 标杆页偏差清单、`references/*` 里的类名 / 选择器 / 登录角色 / operator targets。
> **配套权威**(生产侧,不重复):视觉 token / 暗色 → `ui-spec`;页面骨架 / 共享组件 → `mamba-page-development`;EasyBill 组件 → `easybill-ui-component-manual`。

如果用户只是询问“视觉效果怎么样”“帮我看下页面”“页面好不好看”“哪里不舒服”“UI 审查”或“视觉审查”，不要直接进入原型落生产或 fidelity 修复闭环。先读取 `../page-review-skill/docs/agione-visual-review-protocol.md`，按 review-only 模式输出问题定位和优化方向；只有用户明确确认“按建议改”“开始落地”“执行精修”后，才进入本 skill 的生产还原流程。

## AI 文件加载指引（Token 友好，按需 Read）

| 文件 | 何时 Read |
|---|---|
| 本 SKILL.md | 触发时必读全文（~160 行） |
| `references/vue-porting-patterns.md` | **写第一版前**——判 archetype（CRUD vs 仪表盘）、抄页面骨架时 |
| `references/target-config.md` | **配 targets.json 时**（Tier 1 闭环准备阶段） |
| `scripts/fidelity/GOAL-MODE.md` | **跑 Tier 1 自动闭环时**——循环纪律 + 停止条件 + 硬规则 |
| `references/comparison-method.md` | **走 Tier 2 手动比对时**（没法跑 Playwright 的兜底） |
| `references/troubleshooting.md` | **闭环报错/数字反常时按条查**（10 条按命中频率排序，不必整读） |
| `references/landmark-page-issues.md` | **review / 收尾自查时**当 checklist 逐条过（~47 条高频偏差） |
| `scripts/compare-elements.js` | Tier 2 贴函数时（头部注释 + 函数体，整读即可） |

> 不要触发即全读：闭环顺利时 troubleshooting / comparison-method 都用不到。

---

## §0 核心理念：原型是"视觉与交互的唯一权威"，但实现要服从工程

落地原型时心里要同时握住两条，缺一不可：

- **还原 = 不多不少**。原型有的不能丢（阴影、徽章颜色、某一列），原型没有的不能擅自加**装饰元素**（最典型：AI 给页面塞了原型没有的"账期选择器 + 刷新按钮"）。review 时既要查"少了什么/丑了什么"，**也要查"多了什么"**。**一个例外**：生产**查询/列表页**为查真实数据所必需的筛选（按 Provider / 账期定位真实结算单等）是合法的——原型 mock 不展示全部生产 affordance；判据是"查真实数据所必需"vs"纯装饰冗余"（详见 `references/vue-porting-patterns.md`）。
- **真实数据如实展示，严禁 mock 兜底**。这是生产项目不是 sandbox。原型里 `14,150.14` 只是设计稿示例；真实账号余额是 `2.43` 就展示 `2.43`，趋势图只有 2 根柱就 2 根柱。"还原度"指的是**结构/布局/视觉语言**跟原型一致，**不是数字大小**跟设计稿一致。任何往真实页面注入假数据让它"像原型"的做法都是错的。
- **原型的解释/注解文字不进生产**。原型标题下方那行小灰字副标题（如 "Business-semantic status; technical detail handled by ops" / "All tenants using my models / apps"）、sidebar 的 "F-O 深化/新增" 角标、纯说明性 desc —— 都是**给评审看的设计注解**，不是产品文案。port 时一律去掉，**生产页只留标题 + 功能性内容**。**banner / alert 也分两类**：解释"它怎么工作"的实现口径 / 脱敏 / V1 说明（如"客户标识按 sourceConsumerKey 哈希脱敏展示"）同样是设计注解，**一并去掉**；只有**可操作的功能性通知**（如"当月数据持续变化中，抹零下月 1 日生成"、错误 / 空态提示）才保留。（原型生成器会保留这些注解供评审，但落生产时必须收敛。）
- **生产页默认按当前目标用户第一次进入页面判断是否成立**。先确认目标用户是业务用户、开发者、运维、管理员还是集成用户，再决定信息展示深度。首屏必须交代对象/范围、关键状态/结果/上下文、下一步关注点/动作和主操作结果；如果页面需要解释才能看懂，先收敛主任务和业务表达，不继续堆模块、说明、标签、指标或装饰。
- **客户可见界面不能露出无关内部技术证据**。生产页可见文本不得出现 `Api.general.xxx`、`result.total`、`hasXxx`、`currentStep`、`AI-NOTES`、`data-source`、`mock`、前端路由、源码 API client 名称、状态判断表达式、原型数据来源说明、“数据来源 / 状态判断来源 / 根据规则推导”等。开发者/API/日志/诊断页可以展示完成任务所需的接口 URL、请求方法、Headers、Body、示例代码、响应示例、错误码和复制入口，但不得展示前端源码 client 名称或 AI 设计备注，敏感信息必须脱敏，低频诊断信息应折叠。

工作顺序：**先读规范 → 抽原型样式基线 → 生成（按 §2 清单）→ 逐元素数值比对（§3）→ 按差异表精修 → 重新比对**。不要靠"看截图差不多"收尾。

---

## §1 开工前必读

1. `ui-spec` SKILL.md —— 颜色 token、`--ui-*`、暗色策略、Tailwind vs scoped SCSS。
2. `mamba-page-development` SKILL.md —— `MainBox→HeaderBox→ScrollBox` 骨架 + `CurdTable`/`FilterBox`/`FormDialog` 等共享组件。
3. 原型 HTML —— **视觉/交互/文案的唯一权威**。记下它的对应 section 行号区间，逐元素照它还原。
4. 项目范本页（写法成熟、可抄结构）：`apps/financial/src/views/index/customers/top-ups/orders/`（列表+筛选四件套）、`customers/accounts/useCustomerAccountAction.ts`（FormDialog 命令式弹窗）。
5. 确认 `packages/api/financial/` 里对应的 v1 客户端 + types 真实存在（AI 调的接口/工具基本是真的，但要核对参数契约，尤其哪些参数该传哪些不该传 —— 见 §2 第 14 条）。

---

## §2 生成端自检清单（AI 写第一版时逐条过）

这些是 AI agent 反复犯的**系统性偏差**。每一条都对应标杆页踩过的坑。生成时主动遵守，能把"相差很远"变成"小修即可"。

> **先判 archetype**：标准 CRUD 列表页用 CurdTable 四件套；仪表盘/诊断页（operator dashboard、对账、月度总览…）要复刻原型 bespoke 区块（HeaderBox / KPI grid / CardBox / detail-tabs / Alert / EmptyState / 只读诊断表）—— 骨架模板见 `references/vue-porting-patterns.md`。下面清单两类通用。

### A. 文案与 i18n
1. **0 硬编码中文**。所有面向用户文案进 `apps/<app>/src/locales/{zh-cn,en}/<ns>.ts`，页面用 `i18n.global.t("...")`（注意是 `i18n.global.t`，不是 `useI18n()`）。
2. **中英文都要逐条对原型核对措辞**，不能只对中文。原型常用缩写（`Live balance · MTD est. · Next settle · Cumulative`），不要自己改成全称。徽章/标签/说明文字一字不差照原型。
3. **绝不删存量 i18n**。若改的是已 i18n 化的基线文件，只能在原 `t()` 基础上叠加，不能删掉改硬编码（AI 干过把 62 个 `t()` 砍到 16 个的事）。
3b. **可见文案必须是用户语言**。内部状态、接口判断和系统规则要翻译成用户能行动的表达：业务用户看业务状态和下一步动作，开发者看可调用接口、参数、示例和错误处理，管理员看配置影响和风险。不要把实现细节、原型备注或状态推导规则当成产品文案。

### B. 数字与金额
4. **大数字的单位策略以项目/PM 口径为准，但务必全页一致**。原型里 hero/KPI 大数字常是纯数字（单位靠 `PROVIDER_AVAILABLE` 等标签表达）；但项目可能要求带单位（如 AGIOne 财务页定为大数字也带 `Credits` 后缀，用 `<span class="pr-credit-unit">` 把单位做成小字弱化跟在数字后）。**两种都可以，关键三点**：① 整页统一（hero/KPI/stat/明细同一套）② 带后缀时单位要做成小字弱化（别跟主数字同字号，否则 48px 的 "Credits" 会撑到换行）③ 先确认项目既有口径，别一个页面一种。
5. 金额右对齐 + 千分位；日期用 `getLocalizedDateTime`（英文环境 `May 31, 2026`，不是 `2026-05-31`）。

### C. 组件，禁手搓
6. **图表用项目自带 `EsChart`**（`import { EsChart } from "@common/components"`，基于 echarts），**禁止手搓 `<div :style="{height}">` 柱状图**。
7. **表格用 `CurdTable`、弹窗用 `FormDialog.show({formSchema})`**，禁止手写 `<el-table>` 堆列 / 手写 `<el-dialog>+<el-form>`。能复用旁边现成的 `useTableHook.ts`/`columns.ts` 就复用。**例外**：只读、要 1:1 复刻原型的诊断/汇总表，用原型同款 bespoke `<table>`（套 CurdTable 会带入与原型不符的 el-table 样式）—— 见 `references/vue-porting-patterns.md`。
8. **CardBox 标题用 `#title` 插槽，不是 `:title` prop**（`:title` prop 在 CardBoxHead 里不渲染，标题会消失）。
9. 图标用 `lucide-vue-next`，**渲染即用的优先静态具名导入** `import { CopyIcon } from "lucide-vue-next"`（动态 `import("lucide-vue-next…")` 易触发 Vite `504 Outdated Optimize Dep`，仅真懒加载才用 —— 见 `references/troubleshooting.md`）。**选图标要比对 svg path，不只看名字** —— lucide 0.5x 里 `circle-check`（闭合圆+小勾）和 `circle-check-big`（开口圆+外延勾，= 旧 `check-circle`）是**两个不同图标**。原型用哪个，去 `node_modules/.pnpm/lucide-vue-next@*/.../icons/<name>.js` 对 path 确认。
9b. **`el-select` 宽度别靠 Tailwind `w-*`** —— element-plus 内部样式会让它在宽松 flex 里被撑大、在紧凑 flex（如 CardBoxHead 的 `.right`）里被压扁到文字都显示不全。要用固定 `width + flex:0 0 <px>` 锁定；同页多个同类选择器抽一个共用 class 保证一致。
9c. **`el-table` 在 dark 下默认样式不对版**：① 行偏挤（cell padding `8px 0`，行高 ~41px；原型多为 `12px`/~49px）② 行分隔线在 dark 下算出 `rgba(0,0,0,0)` 看不见 ③ 表头带默认填充色。需要时一并 `:deep` 纠：`.el-table th.el-table__cell, td.el-table__cell { padding:12px 0; border-bottom:1px solid var(--ui-border-soft) }`、表头 `background-color:transparent`、表内 `el-button` 字号压到原型值（多为 12px）。

### D. 视觉，对齐 §0 与 ui-spec
10. **颜色全用语义 token**（`bg-bg-card`/`text-text-primary`/`border-border` 或 `--ui-*`），禁 `bg-white`/`text-gray-*`/`text-blue-*`/raw palette/裸 `rgba()`。
    - **token 对齐红利**：agione-ui v4.0+ 原型的 CSS 变量已与生产 mamba-layout 100% 同名（统一 `--ui-*` 前缀）。原型代码里的 `var(--ui-*)` 引用**可直接沿用，零 rename**——不要再做"原型 token → 项目 token"的翻译映射，直接 copy。仅旧版（v3.x）原型才需要对照 `ui-spec` 换名。
11. **深色 hero/驾驶舱用固定深色背景**（light/dark 都深底 + 浅字），**禁用会随主题反转的 `--ui-bg-inverse`/`--ui-text-on-brand`** —— dark 模式下它们变浅色，会导致浅底浅字整块隐形。固定深色 + 阴影 + 渐变写在 page scoped SCSS，用 `--ui-*` 调色，不堆 Tailwind 渐变工具类。
12. **luxury hero 的细节不能退化**：原型的多层阴影、金属质感数字、徽章语义色、紫色辉光，port 时极易丢成"普通渐变卡"。这些都要还原（见 §3 比对能抓出来）。
13. **字体按原型混排**：原型通常是**文字标签 Inter + 数字/代码 mono** 混排，不是全 mono 也不是全 Inter。不要图省事整块设一种字体。

### E. 数据契约
14. **参数只传该传的**。最隐蔽的 bug：AI 给"近 30 天滚动趋势"接口也传了 `cycle=2026-06`，导致后端按当月过滤、趋势只剩当月头几天。看清每个接口的 QueryParam —— 账期类参数只用在"按账期统计"的接口（overview/月度），滚动窗口类（trends by range）不传。
15. 消灭 `any`，用 `packages/api/<app>/types/` 生成的类型做 row/form model。

---

## §3 调优端：截图保真闭环（测量最后 20%，两个 tier）

§2 让 v1 上到 ~80%；**§3 不产出质量，只测量 + 微调最后 20%**。不要靠肉眼看截图判断对齐——字号差 2px、字重差一档、圆角差 4px、字体差、阴影有无、间距错位，截图全看不出，必须读 computed style 做数值对比。这是把标杆页从 8 轮压到 2-3 轮的关键。

### Tier 1（首选）：自动化保真闭环 `scripts/fidelity/`
一条命令对一页跑完整对比，产出可循环的客观信号。适合能跑 Playwright 的环境 + 视觉 agent（Codex Desktop / Claude）。

一次性准备：
```bash
cp -r <skill>/scripts/fidelity <project>/tools/fidelity      # 工具复制到目标项目
cd tools/fidelity && pnpm install && npx playwright install chromium
cd <原型 html 目录> && python3 -m http.server 8088            # 起原型静态服
# 实现 dev server 起在 :8030
node capture-auth.mjs                                          # 登录一次（impl 路由要 token）
```

每页循环：`node compare.mjs <page>` → 截两边图、对称遮蔽动态数据、pixelmatch% + style delta + 并排合成图。然后：
1. 打开 `report/shots/<page>-sidebyside.png`（proto ｜ impl）目检 —— 视觉抓结构/缺件/明显偏差。
2. 看 `report/fidelity-report.md` 的 **style delta**（精确值，`fontSize: proto=52px impl=40px` → 把实现改到 proto 值）。
3. 看 `-diff.png`：🟣 品红=被遮蔽动态数据→忽略，其它颜色才是真差异。
4. 只改实现 → 复跑该页 → 到停止条件。

配置写法 → `references/target-config.md`；循环纪律 + 硬规则 → `scripts/fidelity/GOAL-MODE.md`。

**量化停止条件（每页）**：**真正的门是 style delta = 0 + 结构/并排目检一致**;mismatch < 2% 是参考。mismatch% 偏高但 style delta=0 时,先判它是"真·样式回归"(要修)还是"真数据 / locale 残差"(可接受,记录即可)——见 `references/troubleshooting.md` §8/§9。残差全在图表 canvas（ECharts vs 手写 SVG）或真实字段标签就别追,**绝不为凑 mock 标签去伪造后端没有的字段**。

### Tier 2（兜底）：手动 console 比对 `scripts/compare-elements.js`
没法跑 Playwright 时，把脚本函数贴进浏览器执行环境（`preview_eval` / `chrome.eval` / DevTools console），对原型和实现各跑一遍并排比，生成差异表逐项改到清零（每项记原型实测值，不凭感觉）。

### 要比对的属性（每个元素都查）
盒模型：`box-shadow`(阴影最易漏) / `border` / `border-radius` / `padding` / `margin` / `gap` / 元素宽高。
排版：`font-family`(mono vs Inter) / `font-size` / `font-weight` / `letter-spacing` / `line-height` / `color`。
图标：尺寸(w/h) / `color`(语义色，常被做成单色) / svg `path`(变体！) / `stroke-width`。
背景：`background-image`(渐变算法/层数) / `background-color`。

### 比对脚本用法
`scripts/compare-elements.js` 里有两段可直接贴进浏览器执行环境（`preview_eval` / `chrome.eval` / DevTools console）的函数：
- `dumpTextLeaves(rootSelector)` —— 遍历一个容器内**所有文字叶子节点**，输出每个的「文案 + font-family + size + weight + color」。一次性抓出文案差异 + 字体混排是否正确。
- `dumpBoxModel(selectorList)` —— 对一组 selector 输出「shadow/border/radius/padding/margin/gap/宽高」。抓阴影、圆角、间距。
- `dumpIcons(rootSelector)` —— 输出容器内每个 svg 的「尺寸/color/path 前 40 字符/相邻文案」。抓图标尺寸、颜色、变体。

对原型和实现各跑一遍，把两份输出并排对比。详见 `references/comparison-method.md`。

---

## §4 案例：标杆页偏差清单（模式通用，页面是举例）

`references/landmark-page-issues.md` 是 Provider 收益总览那 8 轮 ~40 处偏差的复盘。**页面是 FO 特定的，但偏差模式通用** —— 新原型 review 时拿它当"高频偏差自查清单"逐条过，大概率命中一半。把它当**可复用的 checklist**，不是这套原型的专属档案。

跑闭环时的高频问题（mismatch 高但 delta 少 / probe not found / Vite 504 / height 不一致 / 文案规范冲突 / 单文件原型切页）→ `references/troubleshooting.md`。

---

## §5 落地节奏

1. **先做 1 个标杆页**，按 §1-§3 走通完整流程，对齐到差异表清零。不要一上来批量做。
2. 标杆页用户确认 1:1 后，**同一套手法批量做剩余页面**，每页都跑 §3 数值比对，不靠肉眼。
3. 每页验收门槛：硬编码中文=0 / `any`=0 / 用了共享组件骨架 / 颜色无 raw palette / **目标用户 5 秒自检通过** / **无可见内部技术证据** / **§3 停止条件达成（style delta=0 + height match + 并排目检 OK；mismatch% 是参考）** / 中英文 + light/dark 四态正确 / `pnpm --filter <app> tsc` + `pnpm lint` 通过。

前三项的机检命令（`<dir>` = 本页源码目录，如 `apps/financial/src/views/index/provider/revenue/`）：

```bash
# ① 硬编码中文 = 0（locales/ 目录本身豁免）
grep -rnP '[\x{4e00}-\x{9fa5}]' <dir> --include='*.vue' --include='*.ts' | grep -v '/locales/' || echo "✅ 无硬编码中文"

# ② any = 0
grep -rnE ':\s*any\b|as\s+any\b' <dir> --include='*.vue' --include='*.ts' || echo "✅ 无 any"

# ③ raw palette = 0（装饰性品牌渐变按 landmark §十二 豁免，逐条人审）
grep -rnE 'bg-white|text-gray-|text-blue-|bg-gray-|#[0-9a-fA-F]{6}\b' <dir> --include='*.vue' || echo "✅ 无 raw palette（hex 命中先查是否 §十二 豁免）"
```

---

## §6 不要做的事

1. ❌ 不要靠"看截图差不多"判断对齐 —— 必须 §3 数值比对。
2. ❌ 不要往真实页面注入 mock 数据让它"像原型"。
3. ❌ 不要加原型里没有的元素（账期选择器、多余工具栏）。
4. ❌ 不要为了贴原型改全局 token / 全局字号 —— 用 page scoped 覆盖（如 `.xxx-page { font-size: 16px }`），不污染项目。
5. ❌ 不要删存量 i18n 改硬编码。
6. ❌ 不要手搓图表/表格/弹窗 —— 用 EsChart/CurdTable/FormDialog。
7. ❌ 不要只对中文文案 —— 中英文都要对原型。
8. ❌ 不要把 `AI-NOTES`、`data-source`、mock 说明、接口 client 名称、代码变量、状态推导规则或原型说明渲染到生产页面可见区域。
