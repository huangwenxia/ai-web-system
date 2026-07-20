# 逐元素数值比对 —— 完整操作方法

本文是 SKILL.md Gate B 手动比对方式的展开。目标：用 computed-style 数值比对，精确抓出原型与实现之间截图中容易漏掉的偏差。

## 为什么不能靠肉眼

标杆页前 4 轮只靠截图 review，反复"看着差不多"却一直对不上。常见偏差包括：字号差 2px、字重 600 vs 700、圆角 12 vs 8px、字体 mono vs Inter、hero 缺 3 层阴影、图标 path 不同、间距错 20px。**这些细节容易在截图目检中遗漏，必须再读两边的 computed style 数值。**

## 准备：两个页面同时在线

1. **原型**（静态 HTML）：在原型 HTML 所在目录起静态服务
   ```bash
   PROTOTYPE_DIR=/absolute/path/to/prototype-html-directory
   cd "$PROTOTYPE_DIR" && python3 -m http.server 8088
   ```
   原型常带语言切换（lang）。比对前先切到与实现相同的语言态（点 globe 图标或调 lang）。

2. **实现**（项目 dev server）：用项目正常方式起（如 `pnpm dev:financial`）。注意端口可能变化，以实际为准。
   - 生产 app 通常需要登录。先确认目标角色、后端和项目当前的快捷登录机制；不要复用来源不明的旧 `auth.json`。
   - 用浏览器自动化执行环境驱动（Claude: `preview_eval` / Codex: `chrome.eval` / 通用: DevTools console），并验证最终 URL、用户标识和页面稳定 marker。
   - 语言/主题必须通过项目实际使用的 storage key 或 UI 控件切换；不要只改 DOM class 后假设应用状态已经同步。

> ⚠️ 后台浏览器（preview_eval / chrome.eval 等）画面用户看不到、也无法点击。一切交互（登录、切主题、切语言、滚动）都由 AI 通过 JS 执行驱动，不要让用户去点。

## 比对三步

### 1. 文案 + 字体混排
对原型容器和实现容器各跑 `dumpTextLeaves`：
```js
// 实现页
dumpTextLeaves(".pr-revenue-hero")
// 原型页（换原型的 class）
dumpTextLeaves(".pr-v3-cockpit")
```
并排对比每个文字叶子的 `text` / `font` / `size` / `weight` / `lineHeight` / `letterSpacing` / `textTransform` / `whiteSpace` / `color`。

### 2. 盒模型（阴影/圆角/间距）
```js
dumpBoxModel([".pr-revenue-hero", ".card-box", ".pr-rank-row", ".pr-revenue-hero__metrics"])
```
重点看 `boxShadow`(最易漏)、`radius`、`padding`、`gap`、宽高。间距类偏差（如某两个元素之间距离）可能要额外用 `getBoundingClientRect()` 算"A 底到 B 顶"的实际像素：
```js
const a = document.querySelector(X).getBoundingClientRect()
const b = document.querySelector(Y).getBoundingClientRect()
Math.round(b.top - a.bottom)  // 实际间距
```

### 3. 图标（尺寸/颜色/变体）
```js
dumpIcons(".pr-revenue-hero")
```
对比每个图标的 `w/h`、`viewBox`、`stroke`、`strokeWidth`、`fill` 和 `signature`。`signature` 包含 shape 几何及 shape 级 computed stroke/fill；签名不同即存在图标变体或子节点样式差异，不能只看组件名。

## 读差异 → 改 → 重比对

- 把原型和实现两份输出**并排贴出来**，逐行找不一致。
- 每处偏差**用原型实测值**去改，不要凭感觉给（"看着大一点"→ 必须是具体 px）。
- 改完**重新跑同样的 dump**，直到差异清零。
- 一轮抓一类（先盒模型、再排版、再图标）效率最高，避免遗漏。

## 规范红线（改的时候守住）

- 字号要贴原型但又不破坏项目：用 **page scoped 覆盖**（`.xxx-page { font-size: 16px }`），不动全局 `--el-font-size-base`。
- 语义颜色优先使用当前项目 `--ui-*` token。若 token 结果与原型不同，先判断是语义/可访问性冲突还是页面特有品牌装饰：前者按项目规范并记录 residual，后者用 scoped local variable 精确复刻，不能用“用了 token”自动放过样式差异。
- 共享组件（CardBox 标题、el-table 列头）的字号用 `:deep()` 在 page scoped 覆盖，不改组件本身。

## 收尾验收

差异表清零后，最后过一遍：中文态 + 英文态 + light + dark 四态都跑一次 `dumpTextLeaves`/`dumpBoxModel` 抽查，确认四态都对齐。再从目标 app `package.json` 选择真实存在的 `type-check` / `tsc` / `build` / `lint` 命令，不要写死脚本名。
