---
name: agione-ui
version: 3.2
description: >
  AGIOne Console UI prototype generator. Produces single-file HTML prototypes that feel
  like the real product — consistent, professional, bilingual (中/EN), Light/Dark.
  Trigger for any request to design, prototype, or review AGIOne console pages:
  list pages, form pages, detail pages, overview dashboards, shell/chrome-only reviews,
  or anything referencing the AGIOne design language.
---

# AGIOne Console UI Skill — v3.2

> **设计哲学**
> 本 skill 分两个层级：
> - **锁定层**（Chrome + Design DNA）：像素级执行，同事间保持视觉一致
> - **发挥层**（组件 + 页面内容）：遵循设计语言原则，AI 自行判断构图与细节
>
> 你是一名有审美判断力的高级前端工程师，不是像素搬运工。
> 在锁定层之外，优先考虑"这个页面是否美观、层次是否清晰"，而不是"是否精确遵守了某个数值"。

---

# PART 0 · 安装与共享

> 本节供第一次使用的同事阅读，日常生成原型时跳过。

## 0.1 安装步骤

```bash
# 1. 把整个 agione-ui 文件夹复制到 ~/.claude/skills/
cp -r /path/to/agione-ui ~/.claude/skills/

# 安装后目录结构应为：
# ~/.claude/skills/agione-ui/
# ├── SKILL.md                           ← 设计规范（本文件）
# └── agione-console-shell-sample-v1.html  ← Chrome 模板（必须存在）
```

> **注意**：`agione-console-shell-sample-v1.html` 必须与 `SKILL.md` 在同一目录，否则 §1.2 的 Read 指令会失败。

## 0.2 使用方式

安装后，在任意 Claude Code 会话中输入：

```
/agione-ui  [需求描述]
```

**示例**：
- `/agione-ui 生成模型广场列表页，支持按类型筛选`
- `/agione-ui 创建 API Key 管理页，含新建和撤销功能`
- `/agione-ui 做一个充值页面，预设金额 ¥500/1000/2000/5000`

## 0.3 团队规范

- 每次生成后，AI 产物直接在浏览器打开确认视觉无误
- 如发现 TopBar / Sidebar 与模板有差异，立即报告并用 `agione-console-shell-sample-v1.html` 对比
- 更新 SKILL.md 或模板文件后，用以下命令同步给团队成员：
  ```bash
  cp -r ~/.claude/skills/agione-ui /path/to/shared/location
  ```

---

# PART 1 · 工程基础（锁定）

## 1.1 输出格式

每次输出都是**可在浏览器直接打开的单文件 HTML**，包含完整功能，不输出片段。

## 1.2 Chrome 零漂移原则（⚠️ 最高优先级）

**每次生成原型，必须以 `agione-console-shell-sample-v1.html` 作为起点，逐字复制以下部分，不允许重新手写：**

| 复制区域 | 内容 |
|----------|------|
| 全部 `<style>` 中的 `:root { }` | 所有 CSS 变量（设计 DNA） |
| App Shell CSS（`.app` `.body` `.main`） | 布局结构 |
| TopBar CSS（`.topnav` 及所有子类） | 顶栏像素 |
| Sidebar CSS（`.sidebar` 及所有子类） | 侧栏像素 |
| `darkVars` / `lightVars` JS 对象 | 主题切换 |
| `i18n` 对象基础结构 | 双语骨架 |
| `<nav class="topnav">` 完整 HTML | 顶栏 DOM |
| `<aside class="sidebar">` 完整 HTML | 侧栏 DOM（菜单项按页面调整） |

**只有以下内容可以修改：**
- `<main>` 区域内的业务内容
- `i18n` 对象中新增的业务文案 key
- Sidebar 菜单项的具体条目和 activeNav 初始值
- `<title>` 页面标题

这条规则的目的是**消除 Chrome 漂移**——不同同事、不同时间生成的所有页面，顶栏与侧栏应当像素级一致。

### 执行步骤（每次生成前必做）

1. **读取模板文件**：
   ```
   Read: ~/.claude/skills/agione-ui/agione-console-shell-sample-v1.html
   ```
2. 从模板中**逐字复制**上表所列区域，粘贴到新文件对应位置
3. 只在 `<main>` 区域及允许修改的范围内写业务内容
4. 不要凭记忆或规范描述重建 Chrome——必须从文件复制

## 1.3 固定 CDN

```html
<!-- Vue 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

<!-- Element Plus — 必须完整路径，版本号锁定 -->
<link rel="stylesheet" href="https://unpkg.com/element-plus@2.9.1/dist/index.css" />
<script src="https://unpkg.com/element-plus@2.9.1/dist/index.full.min.js"></script>

<!-- Element Plus Icons — 必须单独引入 -->
<script src="https://unpkg.com/@element-plus/icons-vue@2.3.1/dist/index.iife.min.js"></script>

<!-- 字体 — 用 jsdelivr+fontsource，禁止 Google Fonts（国内被墙） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/manrope/index.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/inter/index.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-mono/400.css" />

<!-- TailwindCSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Lucide Icons — 普通 script 标签，不能加 type="module" -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

## 1.4 工程铁律

1. **显式闭合**：所有 `el-*` 和图标组件必须有闭合标签，禁止自闭合
2. **无 mustache 属性**：禁止 `placeholder="{{x}}"`，必须用 `:placeholder="x"`
3. **设计 token 优先（⚠️ 重要）**：所有有对应 CSS 变量的属性，必须使用变量，禁止硬编码
4. **Lucide 初始化**：Vue mount 后立即调用 `lucide.createIcons()`
5. **app 引用分步**：禁止链式 `Vue.createApp({}).use(...).mount()`，必须保存 app 引用
6. **TailwindCSS 布局优先（⚠️ 重要）**：Expression 层的布局/间距/尺寸必须优先使用 Tailwind utility class，禁止为这些属性新建自定义 CSS class

### 规则 6 展开：Tailwind 使用边界

| 场景 | 做法 |
|------|------|
| **布局**（flex、grid、overflow、position） | ✅ Tailwind：`flex items-center gap-2`、`grid grid-cols-3` |
| **间距**（padding、margin） | ✅ Tailwind：`px-4 py-2`、`mt-6` |
| **尺寸**（width、height、min/max） | ✅ Tailwind：`w-full h-10`、`max-w-xs` |
| **圆角 / 阴影**（有对应 Tailwind class） | ✅ Tailwind：`rounded-lg`、`shadow-md` |
| **颜色**（需要用 CSS 变量） | Tailwind 任意值语法：`bg-[var(--surface)]`、`text-[var(--accent)]` |
| **Chrome 层已有 class**（TopNav / Sidebar） | ❌ 不改动，保持原样 |
| **El Plus 组件 class 覆盖**（`.el-xxx`） | ❌ 必须写自定义 CSS，Tailwind 无法精准覆盖 |
| **复杂伪元素 / 动画** | ❌ 写自定义 CSS，Tailwind 无法完整表达 |

### 规则 3 展开：哪些属性必须用 CSS 变量

> Mock 数据可以是假的，但 UI 的每一个视觉属性都必须来自设计系统。

| 属性类型 | ❌ 禁止写法 | ✅ 正确写法 |
|---------|-----------|-----------|
| **颜色**（背景/文字/边框） | `color: #09090b` | `color: var(--foreground)` |
| **主色** | `background: #5f4ecf` | `background: var(--color-primary)` |
| **状态色** | `color: #22c55e` | `color: var(--color-success)` |
| **边框** | `border: 1px solid #e4e4e7` | `border: 1px solid var(--border)` |
| **阴影** | `box-shadow: 0 2px 8px rgba(0,0,0,.08)` | `box-shadow: var(--shadow-md)` |
| **圆角** | `border-radius: 8px` | `border-radius: var(--radius-lg)` |
| **间距** | `padding: 16px` / `gap: 8px` | `padding: var(--space-base)` / `gap: var(--space-sm)` |
| **动效时长** | `transition: .15s` | `transition: var(--duration-fast)` |
| **字族** | `font-family: 'Inter', sans-serif` | `font-family: var(--font-base)` |
| **图标尺寸** | `width: 18px; height: 18px` | `width: var(--icon-lg); height: var(--icon-lg)` |
| **z-index** | `z-index: 100` | `z-index: var(--z-dropdown)` |

**可以硬编码的例外**（这些没有对应 token）：

- 组件特定的固定宽度：`width: 240px`（搜索框）、`width: 256px`（侧边栏）
- `flex: 1`、`min-width: 0`、`overflow: hidden` 等纯布局值
- `line-height` 精确值（按 §2.2 字型表中的值写，如 `line-height: 1.6`）
- `font-size` 精确值（按 §2.2 字型表中的值写，如 `font-size: 14px`）

```js
// 正确姿势
const app = Vue.createApp({ /* ... */ });
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, comp);
}
app.use(ElementPlus);
app.mount('#app');
lucide.createIcons();
```

## 1.5 已知 CDN 坑（必读）

| 问题 | 错误写法 | 正确写法 |
|------|---------|---------|
| Element Plus 白屏 | `unpkg.com/element-plus`（裸路径） | 必须 `/dist/index.full.min.js` |
| 字体加载失败 | `fonts.googleapis.com` | `cdn.jsdelivr.net` + fontsource |
| CSS 选择器无效 | `:deep(.el-xxx)` | 直接用 `.el-xxx {}` |
| Lucide 图标不渲染 | `<script type="module" src="...lucide...">` | 去掉 `type="module"` |
| Unicode 乱码 | `\u00a5` | 直接写 `¥` |

## 1.6 Vue 3 模板语法强制规则

> 本文件使用 Vue 3 CDN（Global Build）+ `setup()` 选项式写法，**严禁混入任何 React/JSX 语法**。

### ✅ 唯一允许的写法

| 用途 | 正确 | 禁止 |
|------|------|------|
| 模板插值 | `{{ expression }}` | `${...}` / `${{...}}` |
| 属性绑定 | `:prop="expression"` | `prop={expression}` |
| 事件绑定 | `@click="handler"` | `onClick={handler}` |
| 类名 | `class="..."` / `:class="..."` | `className="..."` |
| 内联样式 | `:style="{ color: x }"` | `style={{ color: x }}` |

### 禁止清单（每次生成前心智扫描）

- ❌ 模板正文中出现 `${...}` — JS 模板字符串语法，不属于 Vue 模板
- ❌ 出现 `${{...}}` — 非法混合语法，会导致解析错误
- ❌ 出现 `className` — React 属性名，Vue 中无效
- ❌ `:style="{{ ... }}"` 双括号写法 — 语法错误
- ❌ 长 `:style` 字符串未拆开 — 必须逐属性拆成对象 `{ fontSize: '14px', color: x }`
- ❌ 展示逻辑写在模板 `{{ }}` 里超过 1 个三元表达式 — 提取到 `setup()` 的 computed 或函数
- ❌ 动态拼接 Tailwind class（如 `'text-' + color`、`` `bg-${token}` ``）— Tailwind CDN 运行时扫描静态字符串，动态拼接的 class 不会被注入，必须写完整 class 名

### i18n 对象闭合规则（⚠️ 高频 Bug）

每次在 `i18n` 对象中添加新语言块（`en:`）之前，**必须确认上一个语言块（`zh:`）已用 `},` 正确闭合**。

```js
// ✅ 正确 — zh 已闭合，en 作为独立兄弟对象
const i18n = {
  zh: { title: '模型广场', add: '新建' },
  en: { title: 'Models',   add: 'Add'  }
};

// ❌ 错误 — zh 末尾只有逗号没有闭合 }
const i18n = {
  zh: { title: '模型广场', add: '新建',   // ← 缺少 }
  en: { title: 'Models',   add: 'Add'  }
  // 浏览器将 en 解析为 zh 的属性，报 Unexpected token ':'
};
```

**检查技巧**：在 `en: {` 所在行上方，如果上一行以 `,` 结尾而非 `},`，则缺少闭合括号。  
凡是 i18n 对象有改动，必须从头到尾扫一遍每个语言块的 `},` 收尾。

### 数据规范

- 默认使用**静态 mock 数据**（`ref([...])` 硬编码数组），不用 `Math.random()` 作为主展示值
- 复杂格式化逻辑（日期、金额、百分比）提取为 `setup()` 内的纯函数，不内联在模板里

## 1.7 输出前自检清单（7 项，缺一不可）

> 在输出 HTML 文件前，逐条过：

- [ ] **1. 语法纯净**：只有 Vue 模板语法，无 React/JSX 残留
- [ ] **2. 无 `${...}`**：全文搜索，模板内不存在 JS 模板字符串
- [ ] **3. 字符串闭合**：所有 JS 字符串（特别是 `:style` 对象内）正确闭合，无悬空引号
- [ ] **4. `:style` 合法**：每个 `:style` 绑定的值是合法 JS 对象字面量，key 用 camelCase
- [ ] **5. Token 覆盖**：颜色、间距、圆角、阴影、动效、字族、图标尺寸、z-index 均用 `var(--*)` 变量，无遗漏的硬编码值
- [ ] **6. i18n 闭合**：`i18n` 对象每个语言块都以 `},` 结尾，特别是 `zh:` 块在 `en:` 之前已闭合
- [ ] **7. JS 语法验证**：若环境允许，提取 `<script>` 块内容用 `node --check` 验证无语法错误
- [ ] **8. Tailwind class 完整**：全文检查无动态拼接 Tailwind class；新增布局/间距/尺寸属性已优先使用 Tailwind utility，未无故新建自定义 CSS class

```bash
# 快速验证命令（在终端运行）
sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' | node --check
```

---

# PART 2 · Design DNA（锁定）

> 以下 token 是整个设计系统的基因，任何页面都必须使用，不得绕过。

## 2.1 完整 CSS 变量

```css
:root {
  /* ── TopBar（始终保持深色系；bg / accent / muted 随主题微调，见 darkVars / lightVars） ── */
  --topnav-bg:          #1a1025;   /* Light 默认值 */
  --topnav-accent:      #2d2240;   /* Light 默认值 */
  --topnav-fg:          #f0edf5;
  --topnav-muted:       #8b7fa0;   /* Light 默认值 */
  --topnav-active-bg:   #312870;
  --topnav-active-fg:   #c4bdff;
  --topnav-height:      56px;

  /* ── Sidebar & Body（Light 默认） ── */
  --sidebar-bg:         #fafafa;
  --sidebar-border:     #e4e4e7;
  --sidebar-fg:         #09090b;
  --sidebar-muted:      #71717a;
  --sidebar-active-bg:  #e4e4e7;
  --sidebar-active-fg:  #18181b;
  --sidebar-width:      256px;
  --body-bg:            #ffffff;
  --body-radius:        16px 16px 0 0;

  /* ── 主色 ── */
  --color-primary:        #5f4ecf;
  --color-primary-hover:  #4a3eb0;
  --color-primary-active: #3d3399;
  --color-primary-subtle: #ece9f9;
  --primary-foreground:   #ffffff;

  /* ── 中性色 ── */
  --foreground:           #09090b;
  --background:           #ffffff;
  --card:                 #ffffff;
  --muted:                #f4f4f5;
  --muted-foreground:     #71717a;
  --border:               #e4e4e7;
  --input:                #ffffff;

  /* ── 状态色 ── */
  --color-success:        #22c55e;
  --color-warning:        #e6a23c;
  --color-destructive:    #ef4444;
  --color-success-subtle:      #ecfdf5;  /* inline alert / 成功区背景 */
  --color-warning-subtle:      #fef3c7;  /* inline alert / 警告区背景 */
  --color-destructive-subtle:  #fef2f2;  /* inline alert / 错误区背景 */

  /* ── 表面层 ── */
  --accent:               #f4f4f5;   /* 表格斑马纹、hover 背景、次要面 */

  /* ── Badge 6 色（bg + fg 成对，Light 默认） ── */
  --badge-purple-bg: #f2eef8;  --badge-purple-fg: #6a4e9a;
  --badge-blue-bg:   #eef1f8;  --badge-blue-fg:   #4a6298;
  --badge-green-bg:  #eef5f0;  --badge-green-fg:  #3a7252;
  --badge-orange-bg: #f8f1ec;  --badge-orange-fg: #8a5e38;
  --badge-yellow-bg: #f7f4ea;  --badge-yellow-fg: #7a6228;
  --badge-muted-bg:  var(--muted); --badge-muted-fg: var(--muted-foreground);

  /* ── 阴影 ── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg:  0 4px 16px rgba(0,0,0,0.12);
  --shadow-xl:  0 8px 32px rgba(0,0,0,0.16);

  /* ── 圆角 ── */
  --radius-sm:   4px;   /* 小组件 */
  --radius-md:   6px;   /* 按钮、输入框、菜单项 */
  --radius-lg:   8px;   /* 卡片、下拉层 */
  --radius-xl:   12px;  /* 主卡片、Modal */
  --radius-2xl:  16px;  /* Body 顶部圆角 */
  --radius-pill: 9999px;

  /* ── 字体 ── */
  --font-heading: 'Manrope Variable', Inter, system-ui, sans-serif;
  --font-base:    'Inter Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-mono:    'IBM Plex Mono', 'SF Mono', Consolas, monospace;

  /* ── 动效 ── */
  --duration-fast: 150ms;   /* hover / focus / state */
  --duration-base: 250ms;   /* card hover / tooltip */
  --duration-slow: 400ms;   /* drawer / dialog */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Avatar ── */
  --avatar-bg: #7c3aed;

  /* ── Sidebar nav item hover → 直接用 var(--accent)，不单独定义 token ── */

  /* ── Focus ring ── */
  --ring: #18181b;

  /* ── Spacing scale（4px 基准网格，语义命名） ── */
  --space-xs:   4px;    /* 图标与文字间距、Badge 内边距 */
  --space-sm:   8px;    /* 行内元素间距、组件 gap */
  --space-md:   12px;   /* 组件内边距（紧凑）、按钮组 gap */
  --space-base: 16px;   /* 表格列内边距、表单行间距 */
  --space-lg:   20px;   /* 卡片内边距 */
  --space-xl:   24px;   /* 主内容区内边距、Section 间距 */
  --space-2xl:  32px;   /* 大区块间距 */
  --space-3xl:  48px;   /* 页面顶部空白 */

  /* ── Z-index ── */
  --z-base:        1;
  --z-raised:      10;
  --z-sidebar:     100;
  --z-topbar:      200;
  --z-dropdown:    300;
  --z-sticky:      400;
  --z-tooltip:     500;
  --z-drawer:      600;
  --z-dialog-mask: 699;
  --z-dialog:      700;
  --z-loading:     800;
  --z-message:     900;

  /* ── Icon sizes ── */
  --icon-xs:   12px;  /* 行内伴随文字 */
  --icon-sm:   14px;  /* 表格操作列、表单内嵌 */
  --icon-base: 16px;  /* TopBar 按钮 */
  --icon-md:   18px;  /* Sidebar nav item */
  --icon-lg:   20px;  /* 工具栏、状态提示 */
  --icon-xl:   24px;  /* 页面标题区 */
  --icon-2xl:  40px;  /* 空状态插画 */
  --icon-3xl:  48px;  /* 模型 Logo（列表行） */

  /* ── Element Plus 兼容 ── */
  --el-border-radius-base:     6px;
  --el-border-color:           var(--border);
  --el-bg-color:               var(--background);
  --el-bg-color-page:          var(--accent);
  --el-bg-color-overlay:       #ffffff;
  --el-text-color-primary:     var(--foreground);
  --el-text-color-regular:     var(--muted-foreground);
  --el-text-color-secondary:   var(--muted-foreground);
  --el-text-color-placeholder: #a1a1aa;
  --el-fill-color-blank:       var(--input);
  --el-fill-color-light:       var(--accent);
  --el-fill-color:             #f0f0f0;
  --el-color-primary:          var(--color-primary);
  --el-disabled-bg-color:      #f5f5f5;
  --el-disabled-border-color:  #e4e4e7;
  --el-mask-color:             rgba(255,255,255,0.9);
}

/* ── Dark 主题（由 JS 动态设置，见 PART 3） ── */
```

## 2.2 字型层级

| 层级 | 字族 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|------|
| H1 | Manrope | 30px | 800 | 1.2 | 页面主标题 |
| H2 | Manrope | 20px | 700 | 1.4 | Section 标题 |
| H3 | Inter | 16px | 600 | 1.4 | 卡片标题、弹窗标题 |
| Body | Inter | 14px | 400 | 1.6 | 正文、标准段落 |
| Body Small | Inter | 13px | 400 | 1.43 | 表格内容、次要描述 |
| Caption | Inter | 12px | 500 | 1.33 | 标签、辅助说明、错误提示 |
| Data | IBM Plex Mono | 11–16px | 400 | — | 数字、时间、ID、代码（右对齐） |
| Table Header | Inter | 11px | 600 | — | 全大写，`letter-spacing: 0.5px`，muted 背景 |

## 2.3 Badge 业务映射（锁定）

**状态 Badge（带前缀符号）**

| 状态 / 类型 | Badge 色 | 前缀符号 |
|------------|---------|---------|
| Active / Running | Green | `●` |
| Pending / Processing | Orange | `◐` |
| Inactive / Stopped | Muted | `○` |
| Error / Failed | Destructive | `✕` |

**模型类型 Badge（无符号）**

| 模型类型 | Badge 色 |
|---------|---------|
| Conversation | Blue |
| Multi-Modal | Purple |
| Reasoning | Orange |
| Embedding | Yellow |
| Image | Green |

**Tag Badge 词汇表（标签含义锁定）**

| Tag | 推荐色 | 含义 |
|-----|--------|------|
| Trending | Purple | 热门、流量上升 |
| New | Green | 新上线（上线 < 30 天） |
| Beta | Blue | 公测中 |
| Stable | Muted | 稳定版 |
| Deprecated | Muted | 即将下线，搭配 ⚠ 图标 |

---


## 2.4 Spacing（锁定）

语义命名，4px 基准网格：

| Token | 值 | 场景 |
|-------|----|------|
| `--space-xs` | 4px | 图标与文字间距、Badge 内边距 |
| `--space-sm` | 8px | 行内元素间距、组件 gap |
| `--space-md` | 12px | 组件内边距（紧凑）、按钮组 gap |
| `--space-base` | 16px | 表格列内边距、表单行间距 |
| `--space-lg` | 20px | 卡片内边距 |
| `--space-xl` | 24px | 主内容区内边距、Section 间距 |
| `--space-2xl` | 32px | 大区块间距 |
| `--space-3xl` | 48px | 页面顶部空白 |

主内容区标准内边距：`padding: var(--space-xl) 28px`

## 2.5 Z-index（锁定）

禁止硬编码 z-index 数字，全部走 `--z-*` token。

| Token | 值 | 层级 |
|-------|----|------|
| `--z-base` | 1 | 文档流 |
| `--z-raised` | 10 | 浮动卡片 |
| `--z-sidebar` | 100 | Sidebar |
| `--z-topbar` | 200 | TopBar |
| `--z-dropdown` | 300 | Dropdown / Select 下拉 |
| `--z-sticky` | 400 | Sticky 表头 |
| `--z-tooltip` | 500 | Tooltip |
| `--z-drawer` | 600 | Drawer |
| `--z-dialog-mask` | 699 | Dialog 遮罩 |
| `--z-dialog` | 700 | Dialog |
| `--z-loading` | 800 | 全局 Loading |
| `--z-message` | 900 | Toast / Message |

## 2.6 图标系统（尺寸锁定，Lucide 优先）

### 尺寸 token

| Token | 值 | 场景 |
|-------|----|------|
| `--icon-xs` | 12px | 行内伴随文字 |
| `--icon-sm` | 14px | 表格操作列、表单内嵌 |
| `--icon-base` | 16px | TopBar 按钮 |
| `--icon-md` | 18px | Sidebar nav item |
| `--icon-lg` | 20px | 工具栏、状态提示 |
| `--icon-xl` | 24px | 页面标题区 |
| `--icon-2xl` | 40px | 空状态插画 |
| `--icon-3xl` | 48px | 模型 Logo（列表行） |

### 常用图标速查（Lucide 名称）

| 场景 | 名称 | 场景 | 名称 |
|------|------|------|------|
| 搜索 | `search` | 删除 | `trash-2` |
| 新建 | `plus` | 下拉箭头 | `chevron-down` |
| 编辑 | `pencil` | 展开/折叠 | `chevron-right` |
| 复制 | `copy` | 分页左/右 | `chevron-left` / `chevron-right` |
| 文档 | `book-open` | 错误 | `circle-x` |
| 语言 | `globe` | 成功 | `check` |
| 主题 | `sun` / `moon` | 设置 | `settings` |
| API Key | `key` | 数据库 | `database` |
| 模型/CPU | `cpu` | 工具 | `wrench` |
| 发现 | `compass` | 终端 | `square-terminal` |

---

# PART 3 · Chrome（像素级锁定）

> TopBar、Sidebar、主题切换、语言切换是全团队共用的品牌 chrome，必须像素级一致。

## 3.1 App Shell 结构

```css
/* html/body 背景 = 深紫，让 TopBar 全宽"出血" */
html, body {
  height: 100%;
  background: var(--topnav-bg);
  font-family: var(--font-base);
  -webkit-font-smoothing: antialiased;
}

/* 全视口 Flex 列布局 */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Body 区域：顶部 16px 圆角将主内容区从深紫中"切出" */
.body {
  display: flex;
  flex: 1;
  overflow: hidden;
  border-radius: var(--body-radius);
  background: var(--body-bg);
}

/* 主内容区 */
.main {
  flex: 1;
  overflow: auto;
  background: var(--body-bg);
}
```

## 3.2 TopBar（完全锁定）

```css
.topnav {
  height: var(--topnav-height);
  min-height: var(--topnav-height);
  background: var(--topnav-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 8px;
  z-index: 100;
}
/* 左侧：品牌区 + 分隔线 + 导航 Tabs */
.topnav-left  { display: flex; align-items: center; gap: 12px; min-width: 0; }
.topnav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* 品牌 Logo 容器 */
.nav-logo {
  width: 22px; height: 28px;
  border-radius: 4px;
  background: var(--topnav-accent);
  display: flex; align-items: center; justify-content: center;
}
.nav-logo [data-lucide] { width: 13px; height: 13px; color: var(--topnav-muted); }

/* 品牌名 */
.nav-brand-name {
  font-size: 15px; font-weight: 700;
  color: var(--topnav-fg);
  white-space: nowrap;
}

/* 分隔线 */
.nav-divider { width: 1px; height: 20px; background: var(--topnav-accent); flex-shrink: 0; }

/* 导航 Tab */
.nav-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--topnav-muted);
  white-space: nowrap;
  transition: background var(--duration-fast), color var(--duration-fast);
}
.nav-tab.active { background: var(--topnav-active-bg); color: var(--topnav-active-fg); }
.nav-tab:not(.active):hover { background: rgba(255,255,255,0.06); color: var(--topnav-fg); }

/* 搜索框 */
.nav-search {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--topnav-accent);
  cursor: pointer;
}
.nav-search:hover { opacity: 0.8; }
.nav-search [data-lucide] { width: 14px; height: 14px; color: var(--topnav-muted); }
.nav-search-text { font-size: 13px; color: var(--topnav-muted); }
.nav-search-kbd {
  padding: 2px 6px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 11px; color: var(--topnav-muted);
}

/* 图标按钮（Docs / Language / Theme） */
.nav-icon-btn {
  width: 30px; height: 30px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: var(--topnav-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
}
.nav-icon-btn:hover { background: var(--topnav-accent); color: var(--topnav-fg); }
.nav-icon-btn [data-lucide] { width: 16px; height: 16px; }

/* Avatar */
.nav-avatar {
  width: 28px; height: 28px;
  border-radius: var(--radius-pill);
  background: var(--avatar-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #fff;
  cursor: pointer; flex-shrink: 0;
}
```

**右侧固定顺序**：Search → Docs → Language → Theme Toggle（Sun/Moon） → Avatar

## 3.3 Sidebar（完全锁定）

```css
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 12px 12px 16px;
  display: flex; flex-direction: column; gap: 4px;
  overflow-y: auto; overflow-x: hidden;
}
/* 自定义滚动条 */
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 9999px; }

.sidebar-section { margin-bottom: 4px; }

.sidebar-section-title {
  padding: 8px 8px 4px;
  font-size: 12px; font-weight: 500;
  color: var(--sidebar-muted);
  letter-spacing: 0.01em;
}
.sidebar-section + .sidebar-section .sidebar-section-title { padding-top: 12px; }

.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px; font-weight: 400;
  color: var(--sidebar-fg);
  transition: background 0.12s, color 0.12s;
}
.nav-item [data-lucide] { width: 18px; height: 18px; flex-shrink: 0; color: var(--sidebar-muted); }
.nav-item.active {
  background: var(--sidebar-active-bg);
  font-weight: 500; color: var(--sidebar-active-fg);
}
.nav-item.active [data-lucide] { color: var(--sidebar-active-fg); }
.nav-item:not(.active):hover { background: var(--accent); }   /* ⚠️ 必须用 var(--accent)，见下方说明 */
```

**导航项三态规范（锁定）**

| 状态 | 背景 | 文字 | 图标 | 字重 |
|------|------|------|------|------|
| Default | 透明 | `var(--sidebar-fg)` | `var(--sidebar-muted)` | 400 |
| **Hover** | `var(--accent)` | `var(--sidebar-fg)` | `var(--sidebar-muted)` | 400 |
| **Active** | `var(--sidebar-active-bg)` | `var(--sidebar-active-fg)` | `var(--sidebar-active-fg)` | 500 |

> ⚠️ **Hover 背景必须使用 `var(--accent)`，严禁硬编码 `#f0f0f1` 或 `rgba(255,255,255,0.05)`。**
> 硬编码值在 dark mode 切换时不会随主题更新，导致 hover 状态在深色模式下完全失效。
>
> | Token | Light | Dark |
> |-------|-------|------|
> | `var(--accent)` | `#f4f4f5` | `#27272a` |
> | `var(--sidebar-active-bg)` | `#e4e4e7` | `#27272a` |

## 3.4 主题切换（完全锁定）

**机制**：JS 直接对 `:root` 批量设置 CSS 变量，同时替换 Sun/Moon 图标并重调 `lucide.createIcons()`。

```js
const darkVars = {
  // TopBar — Dark
  '--topnav-bg':           '#2d2241',
  '--topnav-accent':       '#574aa0',
  '--topnav-muted':        '#e1daed',
  // Sidebar & Body
  '--sidebar-bg':          '#18181b',
  '--sidebar-border':      '#27272a',
  '--sidebar-fg':          '#fafafa',
  '--sidebar-muted':       '#a1a1aa',
  '--sidebar-active-bg':   '#27272a',
  '--sidebar-active-fg':   '#fafafa',
  '--body-bg':             '#09090b',
  // Global
  '--background':          '#09090b',
  '--card':                '#18181b',
  '--accent':              '#27272a',
  '--muted':               '#27272a',
  '--muted-foreground':    '#a1a1aa',
  '--border':              '#27272a',
  '--input':               '#18181b',
  '--foreground':          '#fafafa',
  // Primary
  '--color-primary':       '#7c6ff7',
  '--color-primary-subtle':'#221838',
  // Badge（Dark 版）
  '--badge-purple-bg':     '#221838', '--badge-purple-fg': '#9878c8',
  '--badge-blue-bg':       '#1c2438', '--badge-blue-fg':   '#7a9ac8',
  '--badge-green-bg':      '#1a2820', '--badge-green-fg':  '#5a9272',
  '--badge-orange-bg':     '#2a1c12', '--badge-orange-fg': '#b07848',
  '--badge-yellow-bg':     '#261e0c', '--badge-yellow-fg': '#a08838',
  // Element Plus
  '--el-border-color':          '#27272a',
  '--el-bg-color':              '#09090b',
  '--el-bg-color-page':         '#27272a',
  '--el-bg-color-overlay':      '#1d1d1f',
  '--el-text-color-primary':    '#fafafa',
  '--el-text-color-regular':    '#a1a1aa',
  '--el-fill-color-blank':      '#18181b',
  '--el-fill-color-light':      '#27272a',
  '--el-fill-color':            '#303030',
  '--el-fill-color-darker':     '#424243',
  '--el-color-primary':         '#7c6ff7',
  '--el-disabled-bg-color':     '#1c1c1e',
  '--el-disabled-border-color': '#414243',
  '--el-mask-color':            'rgba(0,0,0,0.8)',
  '--ring':                     '#d4d4d8',
  '--color-success-subtle':     '#052e16',
  '--color-warning-subtle':     '#2a1a00',
  '--color-destructive-subtle': '#2a0a0a',
};
const lightVars = {
  // TopBar — Light
  '--topnav-bg':           '#1a1025',
  '--topnav-accent':       '#2d2240',
  '--topnav-muted':        '#8b7fa0',
  // Sidebar & Body
  '--sidebar-bg':          '#fafafa',
  '--sidebar-border':      '#e4e4e7',
  '--sidebar-fg':          '#09090b',
  '--sidebar-muted':       '#71717a',
  '--sidebar-active-bg':   '#e4e4e7',
  '--sidebar-active-fg':   '#18181b',
  '--body-bg':             '#ffffff',
  // Global
  '--background':          '#ffffff',
  '--card':                '#ffffff',
  '--accent':              '#f4f4f5',
  '--muted':               '#f4f4f5',
  '--muted-foreground':    '#71717a',
  '--border':              '#e4e4e7',
  '--input':               '#ffffff',
  '--foreground':          '#09090b',
  // Primary
  '--color-primary':       '#5f4ecf',
  '--color-primary-subtle':'#ece9f9',
  // Badge（Light 版）
  '--badge-purple-bg':     '#f2eef8', '--badge-purple-fg': '#6a4e9a',
  '--badge-blue-bg':       '#eef1f8', '--badge-blue-fg':   '#4a6298',
  '--badge-green-bg':      '#eef5f0', '--badge-green-fg':  '#3a7252',
  '--badge-orange-bg':     '#f8f1ec', '--badge-orange-fg': '#8a5e38',
  '--badge-yellow-bg':     '#f7f4ea', '--badge-yellow-fg': '#7a6228',
  // Element Plus
  '--el-border-color':          '#e4e4e7',
  '--el-bg-color':              '#ffffff',
  '--el-bg-color-page':         '#f4f4f5',
  '--el-bg-color-overlay':      '#ffffff',
  '--el-text-color-primary':    '#09090b',
  '--el-text-color-regular':    '#71717a',
  '--el-fill-color-blank':      '#ffffff',
  '--el-fill-color-light':      '#f4f4f5',
  '--el-fill-color':            '#f0f0f0',
  '--el-color-primary':         '#5f4ecf',
  '--el-disabled-bg-color':     '#f5f5f5',
  '--el-disabled-border-color': '#e4e4e7',
  '--el-mask-color':            'rgba(255,255,255,0.9)',
  '--ring':                     '#18181b',
  '--color-success-subtle':     '#ecfdf5',
  '--color-warning-subtle':     '#fef3c7',
  '--color-destructive-subtle': '#fef2f2',
};

let isDark = false;
themeBtn.addEventListener('click', () => {
  isDark = !isDark;
  const vars = isDark ? darkVars : lightVars;
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
  themeBtn.innerHTML = isDark
    ? '<i data-lucide="moon"></i>'
    : '<i data-lucide="sun"></i>';
  lucide.createIcons();
});
```

## 3.5 语言切换（完全锁定）

- 右上角 Globe 图标（`lucide:globe`），点击切换中/英
- 所有可见文案**必须同时提供中英双语**，切换时同步更新
- 每个文案绑 Vue 响应式变量，不做静态双份 DOM
- 格式原则：中文简洁专业；英文 Sentence case，按钮/Tab 用 Title Case

---

# PART 4 · 设计语言（发挥层的原则）

> 这部分是 AI 构建组件和页面时的审美标准，不是像素规定。

## 4.1 视觉气质

**克制、专业、有层次。**

- 留白是设计的一部分，不要把每个角落都填满
- 不做炫技动效，交互反馈只用颜色变化 + 轻微阴影
- 信息密度：展示当前任务需要的，其余收起或折叠
- 颜色饱和度保持低调，主色只用在最重要的操作和激活态

## 4.2 层次原则

页面从视觉重量由重到轻：

1. **主操作 / 页面标题** — 最突出，Manrope 大字重
2. **核心数据 / 列表内容** — 清晰可读，Inter 正文
3. **辅助信息 / 标签** — 弱化，muted 色，小字号
4. **边框 / 分隔线** — 只是结构线索，不是装饰

## 4.3 交互原则

- hover 只做颜色变化，不做位移 / scale
- 150ms 是默认过渡时长，感觉"快但不急"
- 危险操作（删除等）必须二次确认，且视觉上使用 destructive 色
- 状态反馈用色 + 图标 + 文字三重区分，不能只靠颜色
- 键盘焦点：`outline: 2px solid var(--ring); outline-offset: 2px`，不要 `pointer-events: none` 屏蔽

## 4.4 排版原则

- 数字、时间、ID、代码片段 → IBM Plex Mono
- 中英文混排时中文保持同等字号，不缩小
- 不允许固定宽度文字容器（ID 列除外），用 flex 防溢出
- 禁止单词内断行：`word-break: keep-all; overflow-wrap: break-word`

## 4.5 颜色配对强制规则（防止 dark mode 色彩错误）

**这是最容易出错的地方，必须严格遵守。**

### 背景 → 文字对应表

| 背景变量 | 必须使用的文字色 | 禁止使用 |
|---|---|---|
| `var(--color-primary)` | `var(--primary-foreground)`（= #fff） | `var(--foreground)` ❌ |
| `var(--color-primary-subtle)` | `var(--color-primary)` | `var(--foreground)` ❌（dark 下会是浅灰） |
| `var(--sidebar-active-bg)` | `var(--sidebar-active-fg)` | 直接写 `#000` ❌ |
| `var(--card)` / `var(--background)` | `var(--foreground)` | 直接写 `#000` 或 `#fff` ❌ |
| `var(--accent)` / `var(--muted)` | `var(--muted-foreground)` | — |
| `--topnav-bg`（#1a1025） | `var(--topnav-fg)` 或 `var(--topnav-muted)` | 任何 light 文字色 ❌ |

### El Plus 组件主色规则

- El Plus 的 `--el-color-primary` 已通过 `darkVars`/`lightVars` 绑定到我们的品牌色
- 使用 `el-button type="primary"` / `el-tag type="primary"` 是安全的，El Plus 自动管理对比度
- **禁止手写** `background-color: #7c6ff7` 等硬编码主色，改用 `var(--color-primary)`
- **禁止** 在主色背景上使用 `color: var(--el-text-color-primary)` 或 `color: var(--foreground)`

### Status Subtle 背景配对

| 背景变量 | 文字色 | 图标色 |
|---|---|---|
| `var(--color-success-subtle)` | `var(--color-success)` | `var(--color-success)` |
| `var(--color-warning-subtle)` | `var(--color-warning)` | `var(--color-warning)` |
| `var(--color-destructive-subtle)` | `var(--color-destructive)` | `var(--color-destructive)` |
| `var(--color-primary-subtle)` | `var(--color-primary)` | `var(--color-primary)` |

### Badge 背景配对

- Badge 只能使用 `--badge-{color}-bg` 作为背景，`--badge-{color}-fg` 作为文字色
- Dark mode 下 `darkVars` 已覆盖所有 badge 变量，不需要手动处理

### 禁止创造新颜色表面

> **严禁**使用设计系统之外的 HEX 值作为背景色。
>
> ✅ 正确：`background: var(--card)` / `var(--accent)` / `var(--background)`
>
> ❌ 错误：`background: #111113` / `background: #1e1e2e`（即使是深色也不行）
>
> 如需额外 surface 层次，使用透明度叠加：`background: rgba(255,255,255,0.04)`

### Animation token 使用规则

| 场景 | 使用 token | 时长 |
|---|---|---|
| hover / focus / state 变化 | `--duration-fast` | 150ms |
| 卡片浮起、tooltip 出现 | `--duration-base` | 250ms |
| 抽屉、Dialog 进出 | `--duration-slow` | 400ms |

### Dark mode 配色口诀

> 深色背景不用黑字，浅色背景不用白字；主色背景永远白字；用变量不用硬编码；不造新颜色。

---

# PART 5 · 组件指导（方向 + 关键约束）

> AI 在这些约束内自由发挥，追求美观，不追求"和规范文档一模一样"。

## 5.1 按钮

**气质**：紧凑、有分量、不抢占内容焦点。

- 变体只有三种：Primary（fill 主色）/ Secondary（stroke border）/ Danger（fill destructive）
- 圆角用 `--radius-md`（6px），保持与输入框统一
- hover 只变颜色 + 加一层轻阴影，不做 scale
- 图标按钮：30×30 圆角 6px，hover 背景 muted，颜色提亮
- 主操作在右，次操作在左，按钮组 gap 约 12px

**尺寸规格（锁定）**

| 尺寸 | 高度 | padding | 字号 |
|------|------|---------|------|
| Small | 28px | 0 12px | 12px |
| Default | 36px | 0 16px | 14px |
| Large | 44px | 0 20px | 15px |

**状态规格**

- Loading：spinner 图标替换左侧 icon，文字改为 "Loading..."，禁止点击
- Disabled Primary：opacity 0.5，cursor not-allowed
- Disabled Secondary：border + text 均变 `--muted-foreground`，opacity 0.5

## 5.2 输入框 / 表单控件

**气质**：克制、边界清晰、状态明确。

**Input 四态（锁定）**

| 状态 | 边框 | 背景 | 说明 |
|------|------|------|------|
| Default | `--border` | `--input` | placeholder muted 色 |
| Focus | `--color-primary` 2px | `--input` | Chevron/icon 变主色 |
| Error | `--color-destructive` 2px | `--input` | 右侧 `×` 清除图标变红；下方 caption 错误文字 |
| Disabled | `--border` | `--accent` | 文字 muted，cursor not-allowed |

- 高度 36px，圆角 `--radius-lg`（8px）
- Select 与 Input 视觉完全一致，Chevron 图标用 `lucide:chevron-down`，focus 时变主色
- **错误提示格式**：字段下方 caption（12px / `--color-destructive`），支持双语 `字段不能为空 / Required field`
- Label 放字段上方，12px / `--muted-foreground`
- 表单排布偏好双列（1440px 设计基准），字段间距 16px，列间 20px
- Action Bar 放页面底部，左侧可选 `* 必填字段` 提示，右侧 Cancel + Submit

**Toggle / Checkbox / Radio（锁定）**

- 激活态全部使用 `--color-primary`（紫色）
- Toggle：开 = primary fill；关 = muted fill；圆形滑块白色
- Checkbox：勾选 = primary fill + 白色 `✓`；未勾选 = `--border` 边框，白底
- Radio：选中 = primary 外圈 + primary 实心内圈；未选中 = `--border` 边框，白底
- 禁用态：opacity 0.5，cursor not-allowed（颜色不变，仅降透明度）

## 5.3 表格

**气质**：信息密集但不压迫，层次靠字重和颜色区分。

- 表头：11px / 600 / UPPERCASE / letter-spacing 0.5px / `var(--accent)` 背景色
- 行高约 52px；奇偶行交替：偶数行 `var(--accent)` 轻底色；hover 整行 `var(--accent)` 背景（禁止硬编码 `#f5f5f5` 等）
- 主列（名称）用 500 字重，辅助列用 400，数字列用 IBM Plex Mono
- 操作列图标小（14px），默认 muted 色，hover 变 primary 或 destructive
- 超过 3 个操作收进 "More" Dropdown，危险操作优先折叠
- 表格容器 border + 12px 圆角，溢出隐藏

## 5.4 卡片

**气质**：有呼吸感，hover 时边界清晰但不跳跃。

- 圆角 12px，border，内边距约 20px
- hover：border 变主色 + 带主色调的轻阴影
- 网格：1440px 起 3 列，1024–1440px 2 列，gap 约 16px
- 状态错误原因直接可见，不藏 tooltip

**KPI Card 模式（数据概览）**

结构：`指标名称（caption）` → `大数字（Data / Manrope 24–30px bold）` → `趋势指示器`

- 趋势 ↑ 正向：`--color-success` + `lucide:trending-up` 或 `↑`
- 趋势 ↓ 负向：`--color-destructive` + `lucide:trending-down` 或 `↓`
- 中性：`--muted-foreground` + `—`
- 数字用 IBM Plex Mono，千位分隔符格式（见 §5.13）

**Model Card 模式（资源列表）**

结构：`字母头像` → `名称（H3）+ Slug（caption mono）` → `描述（body small）` → `Badge 行` → `价格 + 状态行`

- 字母头像：40px 圆角 8px，背景 `--color-primary-subtle`，文字 `--color-primary`，Manrope 16px bold
- 价格格式：`¥0.0028 / 1K tokens`，mono 字体
- 状态 Badge 右对齐，字母头像左对齐

## 5.5 Badge

**规则锁定**，见 §2.3 映射表，使用 6 套 token，pill 圆角，约 22px 高。

```html
<span class="badge badge-green">● Active</span>
<span class="badge badge-orange">◐ Pending</span>
<span class="badge badge-muted">○ Inactive</span>
```

```css
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.2px;
}
```

## 5.6 弹窗 / 抽屉

**气质**：聚焦、遮罩足够暗、打开/关闭有明确感。

- Dialog：圆角 12px，`shadow-xl`，标题区约 52px，内容区 padding 约 24-32px
- Drawer：从右滑出，圆角左侧 12px，宽度根据内容约 600–1000px
- 大型资源选择 Modal：可到 1024px 宽，圆角 16–24px
- 关闭动画约 250–400ms

## 5.7 空状态 / 加载态 / 反馈

**气质**：轻量，不打断流程，给用户下一步方向。

- **空状态**：图标（约 40px muted 色）+ 1 句说明 + 可选 CTA 按钮，整体居中
- **骨架屏**：shimmer 动效，形状贴合真实内容轮廓
- **Toast**：右下角或右上角出现，4 种语义（success/error/warning/info），约 3-5s 消失
- **表格加载**：`v-loading` 覆盖表格区域，不影响 FilterBar 和 Pagination

## 5.8 分页

**气质**：低调、明确当前位置。

- 左侧文字格式（锁定）：`Showing X–Y of Z items / 共 Z 项，当前 X–Y`，caption 级，`--muted-foreground`
- 页码按钮：32×32px，圆角 6px；当前页 fill `--color-primary` + 白字；其他页 border + foreground 字
- Prev/Next：`<` `>` 箭头，无 fill，border，hover 时变主色
- 整体 44px 高容器，`justify-content: space-between`

## 5.9 Tabs

**下划线式（内容切换，默认）**

- 激活 tab：`--color-primary` 下划线 2px，`--foreground` 文字
- 非激活：`--muted-foreground`，hover 变 foreground
- 禁用 border-card 形式；Tabs 不嵌套

**Segmented 样式（模式切换，≤4 项）**

- 外容器：`--accent` 背景，`--radius-lg`（8px）圆角，`padding: 3px`
- 激活 tab：`--card` 白底，`--border` 边框，`--radius-md`（6px），`--foreground` 文字，`shadow-sm`
- 非激活 tab：透明背景，`--muted-foreground` 文字
- 高度约 36px，等宽分配
- 数量：2–7 个，超过 7 个改用侧栏或 Select

## 5.10 Tooltip / 复制

- 溢出文本 hover 展示完整内容
- 可复制字段（API Key、ID 等）：旁边放复制图标，复制成功 2s 后恢复，用 mono 字体展示

## 5.11 多语言字段输入（i18n Tabs）

AGIOne 部分字段（如名称、描述）需要同时填写中文和英文版本。

- 用 Tab 切换语言，固定顺序：`English` → `中文简体`
- 每个语言绑独立 `v-model`，切换 Tab 不清空已填内容
- Placeholder 需注明语言：`Enter name in English` / `请输入中文简体版名称`
- Tab 样式：下划线式，激活态主色，非激活态 muted

---


## 5.12 FilterBar

**气质**：高效、紧凑、状态清晰。按场景选择两种模式之一，同一页面不混用。

### 模式 A：紧凑 FilterBar（≤3 个筛选项，推荐默认）

- 高度 44px，`display: flex; justify-content: space-between; align-items: center`
- **左侧**：搜索框（240px，`lucide:search` 前缀图标）+ 可选 Select（140–160px）
- **右侧**：主操作 Add 按钮（fill primary，height 36px，radius 8px，含 `lucide:plus`）

```html
<div style="display:flex;justify-content:space-between;align-items:center;height:44px;">
  <div style="display:flex;gap:8px;">
    <el-input v-model="search" placeholder="搜索 / Search" style="width:240px;">
      <template #prefix><i data-lucide="search"></i></template>
    </el-input>
    <el-select v-model="type" placeholder="类型 / Type" style="width:160px;">
      <el-option v-for="o in types" :key="o.value" :label="o.label" :value="o.value"></el-option>
    </el-select>
  </div>
  <el-button type="primary">
    <i data-lucide="plus"></i>&nbsp;新建 / Add
  </el-button>
</div>
```

### 模式 B：完整 FilterBox（≥4 个筛选项）

- 默认首次展开，`localStorage` 记住折叠态
- 默认显示 ≤3 项，超出折叠；末位跟 `展开 / Expand` → `搜索 / Search` → `重置 / Reset`
- 折叠动画 `transition: all 300ms ease`；折叠后**保留已填值**，不清空

## 5.13 数字与货币格式化

| 类型 | 规则 | 示例 |
|------|------|------|
| 整数 | 千分位逗号 | `123,456,789` |
| 紧凑 | M / B 缩写 | `123.5M` |
| 字节 | 自动单位 | `12.34 MB` |
| 货币（CNY） | ¥ + 千分位 | `¥123,456.78` |
| 百分比 | 2 位小数 | `85.67%` |

- 数字列统一设 `font-variant-numeric: tabular-nums`，配合 IBM Plex Mono
- 趋势上涨用 `var(--color-success)`，下跌用 `var(--color-destructive)`
- 禁止在属性中写 `\u00a5`，直接用 `¥`

## 5.14 Inline Alert / Banner

用于表单顶部或页面区块内的**整行反馈提示**，区别于 Toast（右下角弹出、自动消失）。

**4 种语义**

| 类型 | 背景 | 左边框 / 图标色 | Lucide 图标 |
|------|------|----------------|------------|
| success | `--color-success-subtle` | `--color-success` | `circle-check` |
| warning | `--color-warning-subtle` | `--color-warning` | `triangle-alert` |
| error | `--color-destructive-subtle` | `--color-destructive` | `circle-x` |
| info | `--color-primary-subtle` | `--color-primary` | `info` |

**结构规范**

```html
<div class="alert alert-error">
  <i data-lucide="circle-x" class="alert-icon"></i>
  <div class="alert-body">
    <p class="alert-title">提交失败 / Submission failed</p>
    <p class="alert-desc">请检查必填字段 / Please check required fields</p>
  </div>
  <button class="alert-close"><i data-lucide="x"></i></button>  <!-- 可选 -->
</div>
```

```css
.alert {
  display: flex; align-items: flex-start; gap: var(--space-sm);
  padding: var(--space-md) var(--space-base);
  border-radius: var(--radius-lg);
  border-left: 4px solid;
  font-size: 14px;
}
.alert-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
.alert-title { font-weight: 500; }
.alert-desc  { font-size: 13px; color: var(--muted-foreground); margin-top: 2px; }
.alert-close { margin-left: auto; color: var(--muted-foreground); }
```

- 同一区域同时只显示 1 条；多条错误合并成列表
- 可关闭的 Banner 用 `×` 按钮，不可关闭的（系统级警告）不放关闭按钮

---

## 5.15 Divider 分隔线

**何时用**：区块之间的视觉分隔，优先用间距（`--space-2xl`）代替，只在间距不足以区分层级时才加分隔线。

```css
hr, .divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: var(--space-xl) 0;
}
/* 竖向分隔（TopNav / 按钮组内） */
.divider-v {
  width: 1px; height: 20px;
  background: var(--border);
  flex-shrink: 0;
}
```

- 颜色**只用** `var(--border)`，dark mode 自动适配
- 禁止在每个表单字段或卡片之间加分隔线，那是间距的职责

---

## 5.16 文字链接

**链接 vs 按钮决策**：

| 场景 | 用哪个 |
|------|--------|
| 跳转到另一个页面 / 路由 | 链接 |
| 触发一个操作（保存、删除、调用 API） | 按钮 |
| 表格中的行内导航（"查看详情"） | 链接 |
| 弹窗底部的主操作 | 按钮 |

**样式规范**

```css
a, .link {
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity var(--duration-fast);
}
a:hover, .link:hover {
  text-decoration: underline;
  opacity: 0.85;
}
/* 外链：图标跟随 */
.link-external::after {
  content: '';
  display: inline-block;
  width: 12px; height: 12px;
  /* 用 lucide external-link 图标替代 */
  margin-left: 3px; vertical-align: middle;
}
```

- 链接颜色**只用** `var(--color-primary)`，dark mode 自动适配（`#7c6ff7`）
- 危险操作的文字链接（"删除账号"）用 `var(--color-destructive)`，不用主色
- 正文段落中的链接加下划线；独立行的导航链接不加下划线（hover 时才加）

---

# PART 6 · 页面模式

## 6.1 页面类型决策

| 用户需求 | 选型 |
|---------|------|
| 数据密集、≥6 列、需排序筛选 | 列表页（表格） |
| 视觉资产、≤5 核心属性、状态突出 | 列表页（卡片） |
| 新建 / 编辑，字段简单 | 表单页 |
| 新建，依赖复杂（≥2 种关联资源） | 向导页（Step Wizard） |
| 只读展示、多维数据 | 详情页（Tabs 内容区） |
| 指标汇总、图表、快捷操作 | Overview Dashboard |
| 只验证框架 / chrome | Shell-only |

## 6.2 页面解剖（命名区域）

```
┌────────────────────────────────────────────────────────┐
│  TopBar 56px  [品牌][Tabs]  [搜索][Docs][语言][主题][头像]│
├─────────┬──────────────────────────────────────────────┤
│         │  ← 主内容区顶部 16px 圆角                      │
│Sidebar  │  PageHeader   标题 + 操作按钮                  │
│ 256px   │  FilterBar    搜索 + 筛选 + 主操作              │
│         │  ContentArea  表格 或 卡片网格                  │
│         │  PaginationBar 分页                            │
└─────────┴──────────────────────────────────────────────┘
```

- **PageHeader**：H1（Manrope 28-30px / 800）+ 副文本（可选）+ 右侧操作按钮
- **FilterBar**：≤3 项时用紧凑行内模式；≥4 项时可折叠展开
- **ContentArea**：表格或卡片，两者**不可运行时切换**
- **PaginationBar**：固定在内容区底部
- **面包屑**：列表/管理页**默认不显示**，仅在需求明确指定时添加（位于 PageHeader 标题上方 8px）

## 6.3 Overview Dashboard 模式

四层结构，从上到下：

1. **Hero Band**：问候语 + 用户名 + 右侧集群状态 Badge（背景用 `var(--topnav-bg)`（`#1a1025`），文字用 `var(--topnav-fg)`，约 80px 高，圆角 `--radius-xl`）
2. **Quick Actions**：4 个卡片，图标 + 标题 + 副文本，横向排布
3. **Resource Snapshot**：左侧 GPU 资源（环形 / 进度条），右侧 CPU / 内存 / 存储
4. **Activity**：左侧折线图 / 柱状图，右侧最近活动列表

## 6.4 向导页（Step Wizard）模式

触发条件：新建资源涉及 ≥2 种关联资源类型，或用户明确要求向导。

- 最少 5 步，最后一步为"确认汇总"：依赖范围 → 上游关联 → 资源详情 → 下游关联 → 审核确认
- 步骤不可点击跳转，每步校验通过才能前进
- 左侧或顶部持续展示步骤进度和已填摘要
- 返回上一步不丢失输入内容

## 6.5 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| `xl` | 1280px | 最低支持宽度 |
| `2xl` | 1440px | 设计基准，3 列卡片 |
| `3xl` | 1536px | 宽屏 |

- 列表卡片网格：≥1440px 3 列，1024–1440px 2 列
- < 1280px：可隐藏 Sidebar（Drawer 模式），TopBar 导航 Tabs 折叠隐藏

## 6.6 Shell-only 模式

用户只想看 chrome 时：主内容区降为空舞台（写一行 "Page content area" 或留白），但 TopBar、Sidebar、主题切换、语言切换**必须完整可交互**。

---

# PART 7 · 交付自检

> 输出前过一遍，不通过不交付。

### Chrome 完整性（必须全部 ✓）
- [ ] TopBar 结构与样式完全符合 §3.2，右侧顺序正确
- [ ] Sidebar 结构完全符合 §3.3
- [ ] 主题切换真实生效（不是静态截图），Sun/Moon 图标正确切换
- [ ] 语言切换生效，所有文案双语

### 工程健康
- [ ] 无自闭合 `el-*` 标签
- [ ] 无 `{{}}` 在 HTML 属性内
- [ ] 无硬编码颜色 hex
- [ ] 无硬编码 z-index 数字（全部走 `--z-*` token）
- [ ] 无硬编码间距数字（走 `--space-*` token 或有依据的例外）
- [ ] `lucide.createIcons()` 在 mount 后调用
- [ ] 控制台无报错
- [ ] **Vue 语法纯净**：无 `${...}`、无 `className`、无 `style={{ }}`、无 React/JSX 残留
- [ ] **i18n 闭合**：`zh:` 块在 `en:` 之前已用 `},` 闭合，逐块扫描收尾
- [ ] **JS 语法验证**：`sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' | node --check`

### 设计一致性
- [ ] 所有颜色走 CSS 变量
- [ ] 圆角使用分级 token，未混用
- [ ] Badge 严格使用 6 套配色，状态映射符合 §2.3
- [ ] 数字 / 时间 / ID 使用 IBM Plex Mono + `font-variant-numeric: tabular-nums`
- [ ] 字体层级符合 §2.2（H1 用 Manrope，正文用 Inter）
- [ ] 交互动效克制（150ms，无 scale / translate）
- [ ] 键盘焦点环可见（`outline: 2px solid var(--ring); outline-offset: 2px`）
- [ ] 状态提示色 + 图标 + 文字三重区分，不仅靠颜色

### 内容与双语
- [ ] 全部可见文案提供中英双语
- [ ] 无自创业务字段（信息不足时用合理占位数据）
- [ ] 错误 / 空状态 / 加载态有对应处理
