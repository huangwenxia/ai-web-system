# 标杆页完整问题清单 —— Provider 收益总览（PR-1）

2026-06 把 Provider 收益总览原型落到 `apps/financial` 时，来回 **8 轮**才对齐，累计 ~40 处偏差 + 1 个功能 bug。这份清单按"类别"归档每一处，新页面 review 时**逐条自查**，大概率命中一半以上。

> 每条格式：`元素 — 原型值 vs 第一版错值 — 根因/教训`

---

## 一、致命 / 结构性（最先查）

1. **dark 模式 hero 浅底浅字、整块隐形** — AI 用了随主题反转的 `--ui-bg-inverse`(dark下=近白) 当底 + `--ui-text-on-brand`(近白) 当字 → 白底白字。且 `color-mix(...inverse...)` 在当前环境算出透明，hero 根本没底色。**修：固定深色驾驶舱**（light/dark 都深底+浅字），背景/阴影/渐变写 page scoped SCSS，禁用会反转的 token。
2. **私自加了原型没有的元素** — AI 给页面加了"账期选择器 `2026-06` + 刷新按钮"，原型根本没有。**教训：review 要查"多了什么"，不只查"少了什么"。**
3. **破坏性删存量 i18n** — 改基线文件时把已 i18n 化的 `my/account/index.vue` 从 62 个 `t()` 砍到 16 个、塞回硬编码中文。**教训：改基线只能叠加，不能删 `t()`。**
4. **重复标题栏** — hero 自带标题，外层又加了一条页面标题栏，重复。

## 二、文案（中英文都要对原型）

5. 副标题英文：原型 `Live balance · MTD est. · Next settle · Cumulative`（缩写）vs 实现 `... MTD estimate · Next settlement · Cumulative settled`（全称）。
6. 费率说明：原型 `当前费率`/`如对费率有疑问，请联系商务`、英文 `Current rate`/`For rate questions, contact business team` vs 实现 `Provider rate`/`Contact sales`。
7. 徽章中文：原型 `连续结算月数 / 历史结算成功率 / 本月新客户 / 在用模型 / 应用` vs 实现 `连续盈利月数 / 结算成功率 / 新增客户 / 活跃模型数`。英文同理（`Streak months / Settle success / New customers / Active models / apps`）。
8. Settled 行连字符：原型用 `−`（U+2212 减号）vs 实现用 `-`（hyphen）。
9. **教训：英文文案第一版完全没对原型，只对了中文。中英文都要逐条 inspect 原型措辞。**

## 三、字体（混排，不是全切一种）

10. **原型是 Inter（文字）+ IBM Plex Mono（数字/代码）混排**。一度误把整个 hero 设成全 mono，又一度全 Inter。**修：hero 根 `font-family: var(--ui-font-body)`，数字处单独 `font-mono`/`--ui-font-mono`。**
11. 排名金额：原型用 **Inter 16px** vs 实现用 mono 15px。（不是所有数字都 mono —— 排名金额原型特意用 Inter。）

## 四、字号 / 字重（差 1-2px / 差一档，肉眼看不出）

12. 基础字号：原型 16px vs 项目全局 14px。**修：page scoped `.xxx-page { font-size: 16px }`**，不动全局。
13. hero 主标题：原型 16px/600 vs 实现 20px/700。
14. 金属大数字：原型 700 + `letter-spacing: -0.5px` vs 实现 800 无字间距。
15. 辅助 KPI 值：原型 26px/700 vs 实现 24px/600。
16. 余额 label：原型 500 + `letter-spacing: 0.5px` vs 实现 400 无。
17. KPI label / 副标题：原型 500 vs 实现 400。
18. 卡片标题：原型 14px/600 vs 实现 16px/700（CardBox 默认 base+2px 偏大，要 `:deep` 覆盖）。
19. 排名 #号：原型 16px vs 实现 13px。排名名称：原型 500 vs 实现 600。
20. 表格列头：原型 11px/600/uppercase vs 实现 12-13px。表格单元格/金额：原型 13px vs 实现 14px。
21. 趋势 stat value：原型 13px vs 实现 14px。

## 五、颜色 / token

22. hero 配色：原型近黑底 `linear(150deg,#0f0a1f→#1a1233)` + 右上紫光 `radial(at 80% 20%, rgba(95,78,207,.45))` vs 实现偏亮纯紫。
23. 金属数字渐变：原型 5 段 135deg（白→紫白→金）vs 实现 2 段 180deg。
24. KPI 图标语义色：原型 trending-up 紫 / hourglass 橙 / check 绿 vs 实现全白 60%。
25. 徽章图标语义色：原型 award 紫 / check 绿 / user-plus 橙 / box 蓝灰 vs 实现全白。
26. 占比条：原型紫→金渐变 vs 实现纯紫实色。排名金额：原型紫色 vs 实现黑色。
27. 一处 raw palette / `bg-white` / gradient 工具类违规共 ~41 处（首版）。

## 六、图标（比对 path，不只看名字）

28. **Cumulative Settled / Settle success 图标**：原型 `check-circle`（= lucide 0.5x 的 `circle-check-big`，path `M21.801 10A10 10 0 1 1 17 3.335` + `m9 11 3 3L22 4`，开口圆+外延勾）vs 实现 `circle-check`（path `m9 12 2 2 4-4`，闭合圆+小勾）—— **两个不同图标**。
29. KPI 图标尺寸：原型 24px vs 实现 16px。费率 chip 图标：原型 12px vs 实现 14px。
30. **教训：lucide 选图标要去 `node_modules/.pnpm/lucide-vue-next@*/.../icons/<name>.js` 比对 svg path，名字相近的是不同变体。**

## 七、阴影 / 圆角 / 间距（盒模型）

31. **hero 缺 3 层 box-shadow**：原型 `rgba(15,10,31,.4) 0 4px 12px` + `rgba(95,78,207,.25) 0 24px 80px`(紫光大投影) + `rgba(255,255,255,.08) 0 1px 0 inset`(顶部内高光) vs 实现 none。**最容易整个漏掉。**
32. 卡片圆角：原型 8px vs 实现 12px（`rounded-lg` 在项目映射成 12，要 `rounded-[8px]`）。
33. hero 内边距：原型 32px vs 实现 28px。
34. scroll 容器左右 padding 双层叠加：ScrollBox 内置 `px-7` + 自己又包 `px-7` = 56px vs 原型 28px。**修：内层去掉 px-7。**
35. **副标题→余额标签间距**：原型 44px（标题行 mb20 + main pt24）vs 实现 24px（标题行缺 mb20）。
36. KPI grid gap：原型 24px vs 实现 40px。padding：原型 `20 0 4` vs 实现 `22 0 0`。
37. 主数字行 padding：原型 `24 0 20` vs 实现 `26 0 22`。徽章行 margin-top：原型 14px vs 实现 22px。
38. 排名行 padding：原型 8px vs 实现 10px。占比条：原型 6px高/3px圆角 vs 实现 5px/pill。
39. 趋势图例 swatch：原型 12px/3px vs 实现 10px/4px。趋势 stat 行 margin/padding：原型 0/12 vs 实现 14/14。

## 八、表格结构

40. 最近结算表列：原型 `Cycle / Amount / Round off / Settled at / Detail操作` vs 实现缺 Round off 列 + Detail 操作列、多了 Status 列。金额原型 `+9,876.54`(绿带正号) vs 实现带 Credits 后缀。

## 九、功能 bug（不只是样式）

41. **趋势账期 bug**：`loadTrend` 给"近 30 天滚动趋势"接口传了 `cycle=2026-06` → 后端按当月过滤 → 趋势只剩当月头几天（6-2、6-3 两根柱）。**修：trends 只传 `range`(7d/30d/90d)，不传 cycle。** 账期参数只用在按账期统计的接口（overview/月度账单）。

## 十、第二批发现（skill 成型后继续 review 抓到的，证明数值比对持续有效）

42. **KPI 数字 line-height**：原型 39px（26px × 1.5）vs 实现 32.5px（`leading-tight`），数字 margin-top 原型 6px vs 实现 8px。**肉眼绝对看不出**，是 dumpBoxModel 发现 KPI grid 高度差 6px 后顺着钻出来的。→ 大数字别用 `leading-tight`，按原型行高显式给（如 `leading-[39px]`）。
43. **el-select 在 flex 里宽度失控**：`w-32`(128px) 对 `el-select` **不生效** —— element-plus 内部样式让它在宽松 flex 容器里被撑大（实测 210px）、在紧凑 flex（CardBoxHead 的 `.right`）里被压扁（实测 44px，文字显示不全）。**修：用固定 `width + flex: 0 0 <px>` 锁定**（如 `.x { width:124px; flex:0 0 124px }`），别靠 Tailwind `w-*`。同类控件（多个时间选择器）抽一个共用 class 保证三处一致。
44. **el-table 行太挤**：el-table 默认 cell padding `8px 0`，原型是 `12px` → 行高 41 vs 原型 49，整张表显拥挤。**修：`:deep(.el-table th.el-table__cell, td.el-table__cell){ padding: 12px 0 }`**。同时 el-table 内的 `el-button`(detail 操作) 默认 14px，原型 12px，要 `:deep(.el-table .el-button){ font-size:12px }`。
44b. **el-table 在 dark 下行分隔线透明、表头背景突兀**：dark 模式下 el-table 默认行边框算出来是 `rgba(0,0,0,0)`（看不见行分隔），表头还带默认填充色 → 整张表"糊"、跟原型那种"通透+清晰行线"不一样。**修：`:deep(.el-table td.el-table__cell, th.el-table__cell){ border-bottom: 1px solid var(--ui-border-soft) }` + 表头 `background-color: transparent`**。（和 #44 同一类：element-plus 表格在 dark 下默认样式不对版，要 `:deep` 显式纠。）
45. **lucide 图标变体选错**（已在六节，再强调）：`circle-check`（闭合圆+小勾，path `m9 12 2 2 4-4`）≠ `circle-check-big`（开口圆+外延勾，= 旧 `check-circle`，path `M21.801 10...`）。0.5x 版**没有** `check-circle.js`，原型的 `check-circle` 对应 npm 包里的 `circle-check-big`。**选图标必须去 `node_modules/.pnpm/lucide-vue-next@*/.../icons/<name>.js` 对 path，不能只看名字。**

## 十一、图表类元素的比对方法（EsChart / canvas 没法 dump computed style）

46. EsChart 是 canvas/echarts 渲染，`dumpBoxModel`/`dumpTextLeaves` 抓不到内部。**改为：抓原型手搓元素（如 `.pr-v3-bars` 的 div 柱）的视觉规格**——柱子 `background`(渐变 colorStops)、`borderRadius`、宽度、有无 Y 轴/网格、数值 label 字号 —— **翻译成等价的 echarts option**。标杆页趋势图实测原型规格：普通柱 `linear(top #7c66f7 → bottom rgba(95,78,207,.6))`、最高柱 `linear(#f5d976 → #f59e0b)`、圆角 `[3,3,0,0]`、**无 Y 轴无网格线**、最高柱顶 label 10px mono、柱宽满格。AI 默认 EsChart 是纯色实柱 + 有 Y 轴刻度 + markPoint 圆点，全错。

## 十二、装饰性渐变 vs 语义色的取舍

47. 排名占比条、hero 金属数字、趋势柱这些**品牌视觉渐变**，原型用固定 hex（如占比条 `#7c66f7→#f5d976`）。这类**装饰性渐变可以硬编码对齐原型**，不必强行用 `--ui-*` token（token 在 dark 下会变体，反而和原型对不上）。判断标准：是"语义色"（成功/警告/主色，随主题变）还是"品牌装饰色"（固定视觉）—— 后者硬编码。注意区别于 §2-D 第 10 条（普通文字/背景仍必须用语义 token）。

---

## 复盘：为什么要 8 轮？

- 前 4 轮我靠**肉眼看截图** review，只能抓到"配色不对、布局乱"这种粗差，抓不到字号/字重/圆角/字体/阴影/图标 path 这些精细差。
- 第 5 轮起改用 **inspect computed style 数值比对**（原型 vs 实现逐元素读值），偏差才开始系统性清零。
- **结论：第一天就用数值比对，这页 2-3 轮就能收敛。** 这正是本 skill §3 + 比对脚本的意义。
