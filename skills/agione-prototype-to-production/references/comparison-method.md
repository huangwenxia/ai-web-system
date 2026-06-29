# 逐元素数值比对 —— 完整操作方法

本文是 SKILL.md §3 的展开。目标：用 computed-style 数值比对，精确抓出原型与实现之间肉眼看不到的偏差。

## 为什么不能靠肉眼

标杆页前 4 轮靠看截图 review，反复"看着差不多"却一直对不上。真正的偏差是：字号差 2px、字重 600 vs 700、圆角 12 vs 8px、字体 mono vs Inter、hero 缺 3 层阴影、图标 path 不同、间距错 20px。**这些截图全看不出，必须读两边的 computed style 数值。**

## 准备：两个页面同时在线

1. **原型**（静态 HTML）：在原型 HTML 所在目录起静态服务
   ```bash
   cd <原型 html 目录> && python3 -m http.server 8088
   ```
   原型常带语言切换（lang）。比对前先切到与实现相同的语言态（点 globe 图标或调 lang）。

2. **实现**（项目 dev server）：用项目正常方式起（如 `pnpm dev:financial`）。注意端口可能变化，以实际为准。
   - 生产 app 通常需要登录。快捷登录账号在 `apps/common/.env.development.local`（`VITE_FAST_LOGIN_USERS`），按目标角色选（Provider 页用"创作者 provider_onepro"）。
   - 用浏览器自动化执行环境驱动（Claude: `preview_eval` / Codex: `chrome.eval` / 通用: DevTools console）：先 `window.location.href='http://localhost:<port>/user/login'`，再点对应快捷登录行（`[...document.querySelectorAll('*')].find(e=>/provider_onepro/.test(e.textContent)...).click()`），登录后会跳回目标 URL。
   - 注意 dark/light：实现默认可能 light，比对前 `document.documentElement.classList.add('dark')` 切到与原型一致的主题。

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
并排对比每个文字叶子的 `text`(措辞差异) / `font`(Inter vs mono 混排是否对) / `size` / `weight` / `color`。

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
对比每个图标的 `w/h`(尺寸)、`color`(语义色是否丢成单色)、`pathStart`(变体！同名不同 path 是不同图标)。

## 读差异 → 改 → 重比对

- 把原型和实现两份输出**并排贴出来**，逐行找不一致。
- 每处偏差**用原型实测值**去改，不要凭感觉给（"看着大一点"→ 必须是具体 px）。
- 改完**重新跑同样的 dump**，直到差异清零。
- 一轮抓一类（先盒模型、再排版、再图标）效率最高，避免遗漏。

## 规范红线（改的时候守住）

- 字号要贴原型但又不破坏项目：用 **page scoped 覆盖**（`.xxx-page { font-size: 16px }`），不动全局 `--el-font-size-base`。
- 颜色用 `--ui-*` token（dark/light 自适配），不硬编码原型的 hex —— 用 token 渲染出的色号和原型 hex 略有差是**正确的**（token 是项目规范）。
- 共享组件（CardBox 标题、el-table 列头）的字号用 `:deep()` 在 page scoped 覆盖，不改组件本身。

## 收尾验收

差异表清零后，最后过一遍：中文态 + 英文态 + light + dark 四态都跑一次 `dumpTextLeaves`/`dumpBoxModel` 抽查，确认四态都对齐。再跑 `pnpm --filter <app> tsc` 确认无类型错误。
