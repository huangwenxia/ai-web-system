---
name: agione-3.10-ui
version: 3.10
description: >
  AGIOne Console UI prototype generator. Produces single-file HTML prototypes that feel
  like the real product — consistent, professional, bilingual (中/EN), Light/Dark.
  Trigger for any request to design, prototype, or review AGIOne console pages:
  list pages, form pages, detail pages, overview dashboards, shell/chrome-only reviews,
  or anything referencing the AGIOne design language.
---

# AGIOne Console UI Skill — v3.10

> **设计哲学**
> 本 skill 分两个层级：
> - **锁定层**（Chrome + Design DNA）：像素级执行，同事间保持视觉一致
> - **发挥层**（组件 + 页面内容）：遵循设计语言原则，AI 自行判断构图与细节
>
> 你是一名有审美判断力的高级前端工程师，不是像素搬运工。
> 在锁定层之外，优先考虑"这个页面是否美观、层次是否清晰"，而不是"是否精确遵守了某个数值"。

---

# PART 0 · 调用模式

## 0.1 三种调用方式

| 模式 | 指令 | 说明 |
|------|------|------|
| **A. 从 prototype 文件生成** | `/agione-ui --from [prototype-角色.md]` | 读取 prototype-[角色].md，按其菜单结构、页面、字段、Badge、Mock 数据生成完整 HTML |
| **B. 自由描述生成** | `/agione-ui [需求描述]` | 单页面快速验证，如"生成模型广场列表页" |
| **C. 增量修改** | `/agione-ui --edit [HTML路径] [修改描述]` | 在已有原型上精准增改，见 §0.2 |

**💡 同需求多功能效率提示（Token 节省）：**
同一 REQ 下有 F002、F003 等后续功能时，优先用 `--edit` 模式在 F001 原型基础上**增量添加**，不要重新生成完整文件。
- 只描述新增的菜单项和页面内容
- Chrome（TopBar / Sidebar / 主题 / 语言切换）不需要重复描述——它们已存在
- 公共组件（Badge、FilterBar、表格结构）复用已有实现，无需重新说明

---

## 0.2 增量修改模式（--edit）执行规则

1. **读取已有 HTML**：用 Read 工具读目标文件，识别 `activeNav` 切换逻辑和已有 `v-show` 区块
2. **用 Edit 工具精准修改**（**禁止 Write 整文件**——见 §1.2 cp + Edit 工作流）
3. **只改 `<main>` 内容**：Chrome（TopBar / Sidebar / CSS 变量 / Logo / PrototypeComponents）不允许修改
4. **定位修改区域**：找到对应页面的 `v-show` 区块，在其内部精准 Edit，不替换整块
5. **保持原有 mock 数据**：不改动已有数据定义，只新增需要的数据
6. **不输出整文件**：每次 Edit 后用户用浏览器即可看效果，不需要把整个 HTML 粘到对话里

禁止：❌ Write 重建整个文件 ❌ 修改 Chrome 区域 ❌ 改变现有 v-show 逻辑 ❌ 把整个 HTML 输出到对话框

---

## 0.3 双模式（v3.10）

skill 默认运行 **生产模式（strict）**：严格按 §5.0.5 三档清单选组件，不超出 DS。同事日常生成原型走此模式，保证视觉与系统一致。

当 prompt 满足以下任一条件时，进入 **探索模式（explore）**：

1. prompt 以 `explore:` 或 `探索：` 开头
2. prompt 中明确出现 **「不局限于 DS / 超出 DS / DS 之外」** 等措辞

**探索模式行为：**

- 给 2-3 种方案，并排展示
- **L1 铁律仍必须遵守**（chrome / token / Badge 词汇表 / 列表页根布局不能突破）
- L2 / L3 允许放飞，可以给 DS 之外的全新形式
- 每个方案在标题旁标注来源：
  - **[DS 已有]** — 完全照 §5.0.5 库组件
  - **[DS 变体]** — 基于 L2 组件加 props / slot 变体
  - **[DS 之外·待评估]** — 全新设计

**判断保守原则：** 模式不确定时**默认 strict**——宁可让设计师多输入一次明确触发词，也不能让同事的原型意外漂移到探索模式。

---

# PART 1 · 工程基础（锁定）

## 1.1 输出格式

每次输出都是**可在浏览器直接打开的单文件 HTML**，包含完整功能，不输出片段。

## 1.2 Chrome 零漂移原则（⚠️ 最高优先级）

> **核心原则**：所有原型必须以 `agione-console-shell-sample-v1.html` 为起点，**Chrome（TopBar / Sidebar / 主题切换 / Logo / 运行时组件库）字节级一致**，不允许重新手写或简化。

### 推荐工作流：`cp` + `Edit`（v3.10 起，默认方式）

**强制使用文件级复制 + 精准编辑，禁止"读取后整文件重写"。**

```bash
# Step 1：文件级复制 shell sample 到目标位置（0 token，0 漂移）
cp [skill-dir]/agione-console-shell-sample-v1.html ./[新原型].html
```

> `[skill-dir]` = skill 加载时获得的 base directory（如 `~/.claude/skills/agione-ui/`）。  
> AI 应自动用 Bash 工具执行此命令。

**Step 2**：用 Edit 工具精准修改可改区域（见下表），其余字节级保持。

**为什么必须 cp 而不是 Read + Write 整文件**：
- ✅ Logo / PrototypeComponents / chrome 全部 0 漂移（字节级精确复制）
- ✅ 输出 token 节省 80%+（每次省 ~$1.5，月省 ~$30 / 20 原型）
- ✅ 生成速度更快
- ✅ 一致性 100%，不依赖 AI 自律

### 锁定区域（Edit 禁止触碰，cp 已包含）

下表所有区域来自 shell sample 字节级复制，**Edit 工具禁止修改任何一项**：

| 复制区域 | 内容 |
|----------|------|
| 全部 `<style>` 中的 `:root { }` | 所有 CSS 变量（设计 DNA） |
| App Shell CSS（`.app` `.body` `.main`） | 布局结构 |
| TopBar CSS（`.topnav` 及所有子类） | 顶栏像素 |
| Sidebar CSS（`.sidebar` 及所有子类） | 侧栏像素 |
| `darkVars` / `lightVars` JS 对象 | 主题切换 |
| **`LOGO_DARK` / `LOGO_LIGHT` JS 常量**（⚠️ 易漏） | 品牌 logo base64 字符串（~25KB 每个）— **必须完整复制，禁止替换为占位符 / 注释 / 短链** |
| `PrototypeComponents` JS 对象 | 全部运行时组件库（§5.0.5 L1 + L2，逐字复制） |
| `i18n` 对象基础结构 | 双语骨架 |
| `<nav class="topnav">` 完整 HTML | 顶栏 DOM（含 `<img :src="logoSrc">`） |
| `<aside class="sidebar">` 完整 HTML | 侧栏 DOM（菜单项按页面调整） |

### 可改区域（Edit 工具仅修改这些位置）

| 区域 | 修改方式 | 备注 |
|------|---------|------|
| `<title>页面标题</title>` | Edit 替换 | 双语标题 |
| Sidebar 菜单项 + `activeNav` 初始值 | Edit 替换/新增 | 业务菜单 |
| `i18n` 对象 | Edit 增加 zh/en 嵌套 key | 新增业务文案；不删原有 key |
| `<main>` 区域内容 | Edit 替换占位 stage / 写业务内容 | **唯一需要"创作"的部分** |
| 必要时 `darkVars` / `lightVars` 增量 token | Edit 末尾追加 | 业务专用色 token；**禁止改已有 token 值** |

> ⚠️ 锁定区域如需调整，**先 push 到 SKILL.md / shell sample 升级**，禁止单原型私改。

### 兜底工作流：Read + Write（仅当 cp 不可用时）

只有以下场景退化为旧工作流：
- 沙箱环境无 Bash 工具
- 跨机器无文件系统访问
- 用户明确要求"全文输出"

**退化时的 logo 防漏检要求**（cp 工作流下不存在此问题）：
- ❌ 替换为 `'data:image/svg+xml,...'` 占位符
- ❌ 留 `// LOGO base64 omitted` 注释
- ❌ 写成短链 `iVBOR...`（用 `...` 截断）
- ❌ 删除常量（导致 `<img :src="logoSrc">` 取空）
- ✅ **必须完整粘贴两个常量的全部 base64 字符串**

### Skill 同目录配套文件

- `agione-console-shell-sample-v1.html` — 模板源（cp 起点）
- `agione-design-system.html` — 视觉画廊（27 组件 + 5 模板，仅用于设计参考，**不**作为 cp 起点）

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
6. **多状态/多角色页面必须实现 Scenario Switcher（⚠️ 重要）**：检测到以下任一条件时，自动启用演示场景切换器（详见 §6.8）：
   - prototype-[角色].md 中某实体定义了 ≥3 个状态分支
   - 用户描述包含关键词：演示 / 评审 / 不同状态 / 多场景 / 切换查看
   - 页面是强状态机（订单流、审批流、配额、订阅、向导完成度等）
   - 禁止单状态硬编码后让用户自己想象其他状态
7. **真实组件对齐 + data-component 标记（⚠️ 重要）**：
   - 列表/管理类页面默认采用 §5.0.2 标准骨架（`MainBox > HeaderBox + ScrollBox > CurdTable`）
   - 所有组件容器必须使用 §5.0.1 / §5.0.3 的真实 class 命名 + DOM 结构
   - 所有组件实例必须带 `data-component="xxx"` 属性，方便 HTML→Vue 转换工具识别边界

8. **多语言字段必须用 `<I18nField>` 组件（⚠️ 重要，v3.10）**：
   - 表单里任何需要支持多语言填写的字段（套餐名 / 模型介绍 / 政策标题 / 商品描述等），**必须**用 `<I18nField>` 组件
   - 禁止自己拼 input 数组 / 顶部加 tabs / "中文 / 英文" 双输入框等替代实现
   - 视觉规范见 `agione-design-system.html` §F2b 章节顶部的 ✅ 已选定 demo（Tabs 切换 + 圆点状态指示 · 无旗帜）
9. **所有 Form 必须用 `.form-modern` 包裹（⚠️ 重要，v3.10）**：
   - 任何含 `<el-form>` 的表单，**必须**用 `<div class="form-modern">` 包裹外层
   - **禁止** EP 默认的 `label-position="right"` 风格（label 右对齐 + 100px 固宽 = 老派 enterprise 视觉）
   - 必备结构（一字不能少）：
     - `.form-modern` · 外层 scope class（触发现代化样式：label 顶部 + 40px 高 + 8px 圆角 + ring focus + ⚠ icon 错误）
     - `.form-group` · 字段分组卡片（含 `.form-group__head` + icon + `.form-group__title`），同一类字段聚成一组
     - `.form-helper` · label 下方 12px muted 描述（说明字段用途，不必每个字段都加）
     - `.form-actions` · 右下提交区，顶部 1px 分隔线，至多 3 个按钮
   - el-form-item 始终用 `size="large"`（40px 高），不要 default
   - 视觉规范见 `agione-design-system.html` §F2 章节顶部的 ✅ 已选定 demo
10. **Radio 必须按数据特性选 4 variant（⚠️ 重要，v3.10）**：
    - **禁止**直接用 EP 默认 `<el-radio>`（视觉粗糙、跟系统不一致）
    - 按以下决策树选 variant：
      - **① 选项含副描述？** → `.radio-card`（D · L2，如套餐升级、付费方案、权限角色，每选项一张卡片含 name + desc）
      - **② 2-4 个互斥状态且强调切换感？** → `.radio-segmented`（C · L2，连体按钮组，如视图切换 / 计费周期）
      - **③ 横排紧凑 / 筛选条件 / 标签类？** → `.radio-pill`（B · L2，圆角胶囊横排）
      - **④ 其他所有场景（默认 90%）** → `.radio-circle`（A · L1，圆环 + 主色填充）
    - 视觉规范 + 完整 demo 见 `agione-design-system.html` §F2c
11. **字体必须用 `.type-*` utility class（⚠️ L1 铁律，v3.10）**：
    - **禁止**在 HTML 元素上手写 `font-size / font-weight / line-height / font-family`
    - **必须**用以下 8 个 class 之一（对应 §2.2 字型层级表）：
      - `.type-h1` · Manrope 30 / 800 / 1.2 · 页面主标题
      - `.type-h2` · Manrope 20 / 700 / 1.4 · Section 标题
      - `.type-h3` · Inter 16 / 600 / 1.4 · 卡片 / 弹窗标题
      - `.type-body` · Inter 14 / 400 / 1.6 · 正文（默认）
      - `.type-body-sm` · Inter 13 / 400 / 1.43 · 表格内容 / 次要描述
      - `.type-caption` · Inter 12 / 500 / 1.33 · 标签 / 辅助说明 / helper text
      - `.type-data` · IBM Plex Mono 13 / 400 / 1.5 / tabular-nums · 数字 / 时间 / ID
      - `.type-table-header` · Inter 11 / 600 / 1.4 / uppercase / 0.5px tracking · 表头
    - **颜色与字型解耦**：颜色仍用 `var(--*)` token 单独设置（如 `<span class="type-caption" style="color: var(--muted-foreground);">`），让 caption 也能用 foreground 色
    - **极少数例外**（KPI 巨数字 / Hero 营销字）：必须先升级 §2.2 字型表，加新 `.type-*` class 到 shell sample，禁止现场写
    - 视觉对齐 DS §1.2 ✅ Type Utility Class 章节

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
- ~~`line-height` / `font-size` 精确值~~（v3.10 已废止，改用 `.type-*` class，见规则 11）

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

### i18n key 命名空间规则（与生产代码对齐）

> 真实代码使用 `vue-i18n` 的命名空间风格 `t('common.btn.save')`、`t('finance.quota.title')`。  
> 原型在 CDN 单文件下不能用 vue-i18n 的多模块结构，但 **key 命名应使用相同的命名空间**，方便后续转换。

**约定**：
- 通用文案：`common.*`（如 `common.save`、`common.cancel`、`common.search`、`common.reset`、`common.add`）
- 按钮专属：`common.btn.*`（如 `common.btn.add`、`common.btn.delete`）
- 业务模块：`{module}.{page}.*`（如 `finance.quota.title`、`user.role.add`）

**实现**：用嵌套对象，模板中用 `t.common.btn.save` 或 `t['common.btn.save']` 访问。

```js
// ✅ 推荐：嵌套结构对齐生产代码
const i18n = {
  zh: {
    common: {
      save: '保存', cancel: '取消', search: '搜索', reset: '重置',
      btn: { add: '新建', delete: '删除', edit: '编辑' }
    },
    finance: {
      quota: { title: '配额管理', overLimit: '已超限' }
    }
  },
  en: { /* 同结构 */ }
};

// 模板使用
<el-button>{{ t.common.btn.add }}</el-button>
<h1>{{ t.finance.quota.title }}</h1>
```

转换到生产代码时：`t.common.btn.add` → `t('common.btn.add')`，1:1 替换。

### 数据规范

- 默认使用**静态 mock 数据**（`ref([...])` 硬编码数组），不用 `Math.random()` 作为主展示值
- 复杂格式化逻辑（日期、金额、百分比）提取为 `setup()` 内的纯函数，不内联在模板里
- mock、AI-NOTES、data-source、原型说明、状态推导规则、接口 client 名称和代码变量只允许作为内部实现/注释/属性存在，不得作为客户可见文案、标签、标题、表格内容或按钮文本出现

## 1.7 输出前自检清单（7 项，缺一不可）

> 在输出 HTML 文件前，逐条过：

- [ ] **1. 语法纯净**：只有 Vue 模板语法，无 React/JSX 残留
- [ ] **2. 无 `${...}`**：全文搜索，模板内不存在 JS 模板字符串
- [ ] **3. 字符串闭合**：所有 JS 字符串（特别是 `:style` 对象内）正确闭合，无悬空引号
- [ ] **4. `:style` 合法**：每个 `:style` 绑定的值是合法 JS 对象字面量，key 用 camelCase
- [ ] **5. Token 覆盖**：颜色、间距、圆角、阴影、动效、字族、图标尺寸、z-index 均用 `var(--*)` 变量，无遗漏的硬编码值
- [ ] **6. i18n 闭合**：`i18n` 对象每个语言块都以 `},` 结尾，特别是 `zh:` 块在 `en:` 之前已闭合
- [ ] **7. JS 语法验证**：若环境允许，提取 `<script>` 块内容用 `node --check` 验证无语法错误
- [ ] **8. Scenario Switcher**：若页面满足 §1.4 规则 6 触发条件，已实现演示场景切换器，所有 mock 数据从 `scenarioData` 取，且非默认场景显示警示横幅
- [ ] **9. 组件按等级使用**（v3.9 三档分级，详见 §5.0.5）：
  - **L1 铁律**：chrome / 全部 token / Badge 词汇表 / 列表页根布局 + 17 个高频骨架组件（HeaderBox / FilterBox / DataTable / TableActions / KpiCard / KvCard / DetailSection / CardBox / Tabs / Alert / EmptyState / Tag / StatusBadge / UsageBar / Avatar / Breadcrumb / Button）— **必须用组件标签 / 真实 class，禁止重新发明**
  - **L2 推荐**：17 个已沉淀组件（ListCardItem / PageHeader / MetricsStrip / HeroBand / DetailPage / StepPills / Stepper / Form / Form Controls / Upload / Modal / Drawer / Tooltip / Popconfirm / Loading / Skeleton 等）— **优先用，允许加 props 变体或参考 DS 风格自定义**
  - **L3 自由**：DS 没有的全新场景，按 §4 设计语言原则发挥；设计师 review 时吸收好的升级到 L2
- [ ] **10. Logo 完整**：`LOGO_DARK` / `LOGO_LIGHT` 两个 JS 常量已**完整复制**（每个约 25KB base64），无占位符 / `...` 截断 / 注释跳过。验证：浏览器打开后 TopBar 左上角能看到完整 AGIOne logo（Light / Dark 主题切换都正常显示）。

- [ ] **10. 多语言字段已用 `<I18nField>`**（v3.10）：表单里任何「同一字段需要多语言填写」的场景，已用 `<I18nField>` 组件而非自己拼 input + tab；视觉对齐 DS §F2b ✅ 已选定 demo
- [ ] **11. Form 已用 `.form-modern` 包裹**（v3.10）：任何 `<el-form>` 都外包 `<div class="form-modern">`；字段分组用 `.form-group`；字段说明用 `.form-helper`；提交区用 `.form-actions`；`el-form-item` 用 `size="large"`；视觉对齐 DS §F2 ✅ 已选定 demo
- [ ] **12. Radio 已按数据特性选 4 variant**（v3.10）：禁止 EP 默认 `<el-radio>`；含描述用 `.radio-card`；2-4 互斥状态用 `.radio-segmented`；横排紧凑用 `.radio-pill`；其他默认 `.radio-circle`；视觉对齐 DS §F2c
- [ ] **13. 字体已用 `.type-*` class**（v3.10）：所有文字元素已加 `.type-h1/h2/h3/body/body-sm/caption/data/table-header` 之一；未在 HTML 上手写 `font-size / font-weight / line-height / font-family`；颜色用 `var(--*)` token 独立设置；视觉对齐 DS §1.2 ✅ Type Utility Class 章节

```bash
# 快速验证命令（在终端运行）
sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' | node --check

# Logo 完整性快速验证（base64 长度应 ≥ 20000 字符）
grep -E "^const LOGO_(DARK|LIGHT)" file.html | awk -F"'" '{print length($2)}'
# 输出应为两行，每行数值 ≥ 20000，否则 logo 被截断
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
  --foreground:           #09090b;   /* 主文字（最重要的内容） */
  --text-secondary:       #3f3f46;   /* 次级文字（辅助说明） */
  --muted-foreground:     #71717a;   /* muted 文字（弱化、tertiary） */
  --text-placeholder:     #a1a1aa;   /* input placeholder */
  --text-disabled:        #d4d4d8;   /* 禁用态文字 */
  --background:           #ffffff;
  --card:                 #ffffff;
  --muted:                #f4f4f5;
  --border-soft:          #f4f4f5;   /* 弱分隔（行间细线） */
  --border:               #e4e4e7;   /* 默认分隔（卡片描边） */
  --border-strong:        #a1a1aa;   /* 强分隔（表头底边、强调） */
  --input:                #ffffff;

  /* ── 状态色 ── */
  --color-success:        #22c55e;
  --color-warning:        #f59e0b;   /* Tailwind amber-500，与生产代码对齐 */
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
  --ease-out:    cubic-bezier(0.4, 0, 0.2, 1);    /* 进入 / hover */
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);      /* 退出 / 离场（v3.10）*/
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* 切换 / 双向（v3.10）*/
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 强调反馈（v3.10）*/

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
  --el-text-color-regular:     var(--text-secondary);
  --el-text-color-secondary:   var(--muted-foreground);
  --el-text-color-placeholder: var(--text-placeholder);
  --el-text-color-disabled:    var(--text-disabled);
  --el-fill-color-blank:       var(--input);
  --el-fill-color-light:       var(--accent);
  --el-fill-color:             #f0f0f0;
  --el-color-primary:          var(--color-primary);
  --el-disabled-bg-color:      var(--muted);
  --el-disabled-border-color:  var(--border);
  --el-mask-color:             rgba(255,255,255,0.9);
}

/* ── Dark 主题（由 JS 动态设置，见 PART 3） ── */
```

### 生产代码 token 映射表（原型 → project-mamba）

> 真实代码库（`apps/common/src/assets/scss/vars.scss`）使用 `--ui-*` 前缀。  
> 当原型转交前端落地时，按下表 1:1 替换变量名即可，无需重新设计。

| 原型 token（本规范） | 生产 token（`--ui-*`） | 说明 |
|---------------------|------------------------|------|
| `--color-primary` | `--ui-color-primary` | 主色（注意：生产代码 EP 主色 `#5f4ecf` 与 UI 层主色 `#7c66f7` 暂不一致，以前端最终决策为准） |
| `--foreground` | `--ui-text-primary` | 主文字 |
| `--text-secondary` | `--ui-text-secondary` | 次级文字 |
| `--muted-foreground` | `--ui-text-muted` | 弱化文字 |
| `--text-placeholder` | `--ui-text-placeholder` | placeholder |
| `--text-disabled` | `--ui-text-disabled` | 禁用文字 |
| `--background` | `--ui-bg-page` | 页面背景 |
| `--card` | `--ui-bg-card` | 卡片背景 |
| `--accent` | `--ui-bg-hover` | hover / 次要面 |
| `--border-soft` | `--ui-color-border-soft` | 弱分隔 |
| `--border` | `--ui-color-border` | 默认分隔 |
| `--border-strong` | `--ui-color-border-strong` | 强分隔 |
| `--shadow-md` | `--ui-shadow-card` | 卡片阴影 |
| `--shadow-lg` | `--ui-shadow-pop` | 浮层阴影 |
| `--radius-md` | `--ui-radius-control` | 按钮/输入圆角 |
| `--radius-xl` | `--ui-radius-card` | 卡片圆角 |
| `--radius-2xl` | `--ui-radius-modal` | Modal/Body 顶部圆角 |
| `--space-base` (16px) | `--ui-space-card` | 卡片内边距 |
| `--space-xl` (24px) | `--ui-space-section` | 区块间距 |
| `--topnav-bg/-accent/-active-bg/-active-fg` | 同名 `--ui-topnav-*` | 完全一致 |

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

### 对应 Utility Class（v3.10 强制用，禁止手写 font-size/weight/line-height）

| 字型 | Class | 备注 |
|------|-------|------|
| H1 | `.type-h1` | 页面主标题 |
| H2 | `.type-h2` | Section 标题 |
| H3 | `.type-h3` | 卡片 / 弹窗标题 |
| Body | `.type-body` | 默认正文 |
| Body Small | `.type-body-sm` | 表格内容 / 次要描述 |
| Caption | `.type-caption` | 标签 / 辅助说明 / helper text |
| Data | `.type-data` | 数字 / 时间 / ID（含 tabular-nums） |
| Table Header | `.type-table-header` | 表头（含 uppercase + letter-spacing） |

**注**：8 个 class 都不含 `color`，颜色由 `var(--*)` token 独立设置——让 caption 既能用 muted 也能用 foreground 色。详见 §1.4 规则 11。

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

/* 演示场景 chip（多场景模式自动显示，详见 §6.8） */
.demo-mode-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  border: 1px dashed var(--topnav-muted);
  background: transparent;
  font-size: 12px; font-weight: 600;
  color: var(--topnav-fg);
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--duration-fast);
}
.demo-mode-chip:hover { background: var(--topnav-accent); }
.demo-mode-chip [data-lucide="lightbulb"] { width: 13px; height: 13px; color: var(--color-warning); }

/* 演示场景横幅（非默认场景时显示，挂在 TopNav 下方） */
.demo-banner {
  height: 32px;
  padding: 0 16px;
  display: flex; align-items: center; gap: 8px;
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  font-size: 13px; font-weight: 500;
  border-bottom: 1px solid var(--border);
}
.demo-banner [data-lucide] { width: 14px; height: 14px; }
```

**右侧固定顺序**：[Demo Scenario chip（仅 `hasScenarios=true` 时显示）] → Search → Docs → Language → Theme Toggle（Sun/Moon） → Avatar

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
  '--border-soft':         '#1f1f22',
  '--border':              '#27272a',
  '--border-strong':       '#52525b',
  '--input':               '#18181b',
  '--foreground':          '#fafafa',
  '--text-secondary':      '#d4d4d8',
  '--text-placeholder':    '#71717a',
  '--text-disabled':       '#3f3f46',
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
  '--border-soft':         '#f4f4f5',
  '--border':              '#e4e4e7',
  '--border-strong':       '#a1a1aa',
  '--input':               '#ffffff',
  '--foreground':          '#09090b',
  '--text-secondary':      '#3f3f46',
  '--text-placeholder':    '#a1a1aa',
  '--text-disabled':       '#d4d4d8',
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

### 首访用户判断路径

- 所有 UI / 原型默认站在“当前目标用户第一次进入页面”的视角判断是否成立。目标用户可能是外行业务用户、开发者、运维、管理员或集成用户；先判断用户角色和页面任务，再决定信息展示深度。
- “大道至简”不是内容少，而是用户判断路径短、主次清楚、动作明确。页面若需要解释才能看懂，默认先收敛主任务和业务表达，不继续增加模块、说明、卡片、标签、指标或装饰。
- 首屏必须让用户快速知道：正在看什么对象或范围，当前最重要的状态/结果/上下文是什么，接下来最自然应该关注哪里或执行什么动作，以及主要动作会进入哪里、改变什么或得到什么结果。
- 列表页强调范围、筛选、记录状态和行操作；详情页强调对象身份、关键状态、主要配置和关联入口；表单页强调填写目标、必填重点和提交后果；流程页强调当前步骤、阻塞原因和下一步动作；Dashboard 强调整体状态、异常和下钻路径；API/开发者页面强调接口状态、调用方式、必要参数、复制入口、错误处理和调试路径。
- 客户可见界面严禁展示与当前任务无关的内部技术证据，包括 `Api.general.xxx`、`result.total`、`hasXxx`、`currentStep`、`AI-NOTES`、`data-source`、`mock`、前端路由、源码 API client 名称、代码变量、内部判断表达式、“数据来源”“状态判断来源”“根据规则推导”等。
- 如果页面本身面向开发者/API/SDK/调试/日志/事件追踪，则可以展示接口 URL、请求方法、Headers、Body、示例代码、响应示例、错误码和复制入口；但仍不得展示前端源码里的 API client 名称、状态判断表达式、原型数据来源说明或 AI 设计备注，敏感信息必须脱敏，低频诊断信息应折叠。
- 所有内部状态、接口判断和系统规则都要翻译成当前用户能理解并能行动的语言：业务用户看业务状态和下一步动作，开发者看可调用接口和错误处理，管理员看配置影响和风险。

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

## 4.5 信息韵律（v3.8 新增，从优秀原型提炼）

> 以下韵律是从大量原型实践中提炼出的"事实标准"，新生成的原型应自觉遵循。

### Eyebrow → Title → Desc → Points 四段韵律

Overview 页和详情 hero 区的标准信息阶梯，**强烈推荐**：

```
[eyebrow]  ← 11px / 600 / uppercase / letter-spacing 0.5px / 主色，可选带胶囊背景
[Title]    ← 24-32px / 700-800 / Manrope / foreground
[desc]     ← 13-15px / 400 / muted-foreground / line-height 1.6
[points]   ← 14px / 含 16px 主色 icon + strong（标题）+ muted（描述）
```

库内 `<HeroBand>` `<PageHeader>` 已固化此韵律。

### 三态进度阈值规则

任何带阈值的进度可视化（用量、配额、容量等）**必须**遵循 80/100 双断点：
- `< 80%` → normal（主色）
- `≥ 80%` → warning（橙）
- `≥ 100%` → danger（红）

库内 `<UsageBar>` 已自动应用（裸 Bare 变体亦同），禁止自定义其他阈值。

### 流程状态四色语义

显示流程进度时使用 4 状态色，**比通用 stepper 更精确**：
- `done`（紫透明）：已完成基础动作（如已填写信息）
- `doneGreen`（绿透明）：已通过审核 / 验证
- `current`（实心主色加粗）：当前正在进行
- `todo`（灰）：尚未开始

库内 `<StepPills>` 固化此规则。

### 5-cell 等分指标条

数据型详情页 hero 区**优先用 5-cell 等分横条**而非"5 张独立卡片"：
- 信息密度更高
- cell 间用 1px `--border-soft` 分隔，不用 gap
- 整体单一外框（border + radius）
- 适合：模型详情、节点详情、API 详情等技术指标密集场景

库内 `<MetricsStrip>` 固化此模式。卡片化场景仍用 `<KpiCard>` 网格。

### Drawer 三段式（header / body / footer）

右侧抽屉**强烈推荐**采用：
- 宽度 480-560px（数据多时可至 640px）
- header sticky（标题 + 关闭按钮 + 可选副标题）
- body 顶部第一屏放 3 列 summary stats（活跃数 / 总值 / 状态 badge）
- footer sticky 放主操作（取消 + 主操作）

### FilterBar 三段布局

列表页 filter bar 标准结构：

```
[search][filter1][filter2][filter3] <spacer/> [sort/view] [actions]
```

- 左侧：搜索 + 筛选条件
- 中间：spacer（flex: 1）
- 右侧：视图切换 / 排序 / 主操作（如导出）

### Motion 动画库（v3.10）

页面 / 组件的进入与切换**必须使用 anim-* preset class**，禁止自己写 keyframes：

| 场景 | preset | 时长 + 缓动 |
|------|--------|-----------|
| 列表 / 卡片首次出现 | `.anim-stagger`（父加，子自动 30ms 错峰） | base + ease-out |
| 单个内容卡进入 | `.anim-fade-in` 或 `.anim-slide-in-up` | base + ease-out |
| Drawer 滑入 / 关闭 | `.anim-slide-in-right` / 反向 + ease-in | slow |
| Modal 弹出 | `.anim-scale-in` | base + ease-out |
| Toast / Notification | `.anim-slide-in-up` | base + ease-out |
| Tab 内容切换 | 新内容加 `.anim-fade-in` | fast + ease-in-out |
| CTA 按钮强调 | transition + `--ease-spring` | base |

**4 缓动函数选型：**
- `--ease-out` 进入 / hover（默认）
- `--ease-in` 退出 / 离场
- `--ease-in-out` 来回切换 / Tab
- `--ease-spring` 仅"注意力反馈"场景（CTA / Hero 入口卡）

**红线（与 §4.3 配合）：**
- 普通卡片 / 表格行 hover **严禁位移 / scale**
- Hero band 入口卡 / CTA 按钮等"主行动强调"**允许 -2px 位移 + ease-spring**（修订）
- 不要在同一元素嵌套多层 anim-* class
- `prefers-reduced-motion` 已在 CSS 自动处理（@media 查询关闭装饰动画），禁止手动覆盖

完整可视化 + replay demo 见 `agione-design-system.html` § Motion 动画库。

## 4.6 颜色配对强制规则（防止 dark mode 色彩错误）

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

## 5.0 组件契约（HTML → Vue 转换准备）

> 本节定义所有原型必须遵守的组件契约。这些契约同时是 **project-mamba 重构的目标态**（依据顶部 Source of Truth 政策）。  
> 当真实代码与本节契约冲突时，应通过重构向本节对齐，而非反过来。

### 对齐策略
- **本节定义的所有组件**：原型必须使用本节的 class 命名 + DOM 结构 + `data-component` 标记
- **§5.0.1 已知真实组件**：调研自 `apps/common/src/components/`，重构进行中，class/DOM 以本节为目标
- **§5.0.3 自定义组件**：原型常用但代码尚未抽象，本节定义即为未来真实组件的接口规范
- **转换路径**：开发者把 `<div class="header-box">` 整块替换为 `<HeaderBox>` 即可

### 5.0.1 真实组件对齐表（Top 7 高复用）

| 真实组件 | 引用次数 | 原型必须使用的 class + DOM | data-component |
|---------|---------|---------------------------|----------------|
| `<MainBox>` | 225 | `<div class="main-box">`（flex column, height:100%） | `main-box` |
| `<HeaderBox>` | 202 | `<div class="header-box">` 含 `.header-box__top` / `.header-box__title` / `.header-box__right` / `.header-box__content` / `.btn-back`；圆角 `rounded-lg` | `header-box` |
| `<ScrollBox>` | 226 | `<el-scrollbar><div class="px-7 pb-7" data-scroll-box>...</div></el-scrollbar>` | `scroll-box` |
| `<CardBox>` | 86 | `<div class="card-box"><div class="card-box-head"><div class="title">...</div></div><div class="card-box-body">...</div></div>`，背景 `var(--el-bg-color)` | `card-box` |
| `<ListCardItem>` | 70 | `<div class="list-card-item list-card-item--surface">`，行用 `.list-card-item-row` 含 `.list-card-item__label` + `.flex-1.min-w-0`（值） | `list-card-item` |
| `<FilterBox>` | 172 | `<div class="filter-box">` + 内含表单元素 + 搜索/重置按钮 | `filter-box` |
| `<DataTable>` (v3.7 库内) | 231（真实代码 `<CurdTable>`）| `<el-table>` + `<el-pagination>`，操作列固定右侧 fixed=right | `data-table` |

### 5.0.2 标准列表页骨架（200+ 真实页面同一模式）

> AI 生成列表/管理类页面时，**默认采用此骨架**：

#### 必备 CSS（防止 ScrollBox 与 chrome `.main` 滚动冲突）

```css
/* MainBox 占满 main 高度，使内部组件能用 flex 分配空间 */
.main-box {
  display: flex; flex-direction: column; height: 100%;
}
/* el-scrollbar 必须 flex: 1 + min-height: 0，否则会与 .main 双滚动条 */
.main-box > .el-scrollbar { flex: 1; min-height: 0; }
```

#### HTML 骨架

```html
<div class="main-box" data-component="main-box">
  <!-- 顶部标题 + 筛选 -->
  <div class="header-box rounded-lg" data-component="header-box">
    <div class="header-box__top flex justify-between py-5 px-7">
      <span class="header-box__title text-xl font-bold leading-9">{{ pageTitle }}</span>
      <div class="header-box__right">
        <el-button type="primary" :icon="Plus">新建</el-button>
      </div>
    </div>
    <div class="header-box__content px-7">
      <div class="filter-box" data-component="filter-box">
        <!-- 筛选表单 + 搜索/重置按钮 -->
      </div>
    </div>
  </div>

  <!-- 内容区（滚动） -->
  <el-scrollbar>
    <div class="px-7 pb-7" data-scroll-box data-component="scroll-box">
      <!-- 表格：直接用 v3.7 库组件 <DataTable>（替代手写 el-table + el-pagination）-->
      <DataTable :data="rows" :columns="columns" :total="total" v-model:page="page">
        <template #status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #operations="{ row }">
          <TableActions :actions="rowActions(row)" />
        </template>
      </DataTable>
    </div>
  </el-scrollbar>
</div>
```

### 5.0.3 真实代码没有但原型常用的组件（自定义契约）

| 原型组件 | 推荐 class 命名 | data-component | 用途 |
|---------|---------------|----------------|------|
| **KpiCard / StatCard** | `.kpi-card` 含 `.kpi-card__icon` / `.kpi-card__title` / `.kpi-card__value` / `.kpi-card__trend` | `kpi-card` | Dashboard 数字卡 |
| **PageHeader**（含面包屑） | `.page-header` 含 `.page-header__breadcrumb` / `.page-header__title` / `.page-header__actions` | `page-header` | 详情页/向导页头 |
| **EmptyState** | `.empty-state` 含 `.empty-state__icon` / `.empty-state__title` / `.empty-state__hint` / `.empty-state__action` | `empty-state` | 高级空态 |
| **SectionTitle** | `.section-title`（小节分隔标题） | `section-title` | Form 分组标题 |
| **Toolbar** | `.toolbar` 含 `.toolbar__left` / `.toolbar__right` | `toolbar` | 表格上方按钮组 |
| **StatusBadge** | `.status-badge` 含 `.status-badge__dot` / `.status-badge__label` | `status-badge` | 状态点 + 文字 |
| **DescriptionList** | `.desc-list` 含 `.desc-list__row` / `.desc-list__label` / `.desc-list__value` | `desc-list` | K-V 描述（详情页） |

### 5.0.4 强制：所有组件实例必须带 data-component 属性

> 这是 HTML→Vue 转换的桥梁，零视觉成本。

```html
<!-- ✅ 正确 -->
<div class="header-box" data-component="header-box">...</div>
<div class="kpi-card" data-component="kpi-card">...</div>

<!-- ❌ 错误：少了 data-component -->
<div class="header-box">...</div>
```

转换工具/AI 通过 `data-component` 识别组件边界，DOM 树自动映射为 Vue 组件树。

> **💡 v3.6 起，14 个高复用组件已预定义为 Vue Global Component**（详见 §5.0.5），`data-component` 属性自动添加，AI **优先使用 `<KpiCard>` `<Tag>` 等组件标签**，不要再手写完整 DOM。

### 5.0.5 运行时组件库（v3.9 三档分级，⚠️ AI 必须按等级使用）

> shell sample HTML 已内置高复用组件，注册为 Vue Global Component。  
> AI 按"组件等级"使用：**L1 必须用 / L2 推荐用（可加变体）/ L3 完全自由发挥**。  
> 所有 L1 + L2 组件已自带 `data-component` 标记 + 完整 CSS。  
> **可视化预览**：打开 `agione-design-system.html`（27 个组件 + 5 个 Templates）。

#### 三档分级原则

| 等级 | 含义 | AI 行为 | 设计师行为 |
|------|------|--------|----------|
| **L1 铁律** | 动了视觉一致性就垮 | 必须严格遵循，**禁止**重新发明 | 自己也不能突破 |
| **L2 推荐** | 已沉淀的组件库 | 优先用，可加 props 变体；不够时可参考 DS 风格自定义 | 评审时检查是否走捷径 |
| **L3 自由** | DS 没有的全新场景 | 按 §4 设计语言原则发挥 | 评审时吸收好的 → 升级到 L2 |

#### L1 铁律（禁止突破 / 重新发明）

**视觉系统层：**
- **Chrome**：TopBar / Sidebar 像素级（§3.2 / §3.3）
- **8 类设计 Token**：颜色 / 字型 / 间距 / 圆角 / 阴影 / 动效 / 图标 / Z-index（§2.1）
- **Badge 词汇表 + 流程状态四色 + 80/100 进度阈值**（§2.3 / §4.5）
- **列表页根布局 CSS**：`.main-box { height:100% }` + `.el-scrollbar { flex:1; min-height:0 }`（§5.0.2）

**高频骨架组件（必须用组件标签 / 真实 class，禁止手写完整 DOM）：**

| 组件 | data-component | 适用 |
|------|---------------|------|
| `<HeaderBox>` | `header-box` | 列表页 / 管理页头部（每页必有） |
| `<FilterBox>` | `filter-box` | 筛选条容器（含 selection 变体替代旧 Toolbar） |
| `<DataTable>` | `data-table` | 表格容器（含分页 + 操作列） |
| `<TableActions>` | `table-actions` | 表格行操作按钮组 |
| `<KpiCard>` | `kpi-card` | Dashboard 数字卡 |
| `<KvCard>` | `kv-card` | 详情页 K-V 描述卡 |
| `<DetailSection>` | `detail-section` | 详情页 section（含 compact 变体替代旧 SectionTitle） |
| `<CardBox>` | `card-box` | 通用卡片容器 |
| `<Tabs>` | `tabs-segmented` / `tabs-underline` | 选项卡 |
| `<Alert>` | `alert` | 行内警示横幅（4 variants） |
| `<EmptyState>` | `empty-state` | 空状态（icon 推荐表见 DS） |
| `<Tag>` | `tag` | 通用标签（**preset 优先**，词汇表锁定） |
| `<StatusBadge>` | `status-badge` | 状态徽标（status 枚举锁定） |
| `<UsageBar>` | `usage-bar` | 用量进度（80/100 阈值；含 Bare 变体替代旧 ProgressBar） |
| `<Avatar>` | `avatar` | 用户头像 |
| `<Breadcrumb>` | `breadcrumb` | 面包屑 |
| `<el-button>` | — | 按钮（语义类型锁定 primary / default / danger） |

#### L2 推荐用（已沉淀，可加变体）

**优先用 L2 组件，但允许根据场景加 props 变体或参考 DS 风格自定义。**

| 组件 | 类别 | 出处 / 备注 |
|------|------|-----------|
| `<ListCardItem>` | 容器 | 真实组件 70×（非表格场景列表行） |
| `<PageHeader>` | 布局 | 含面包屑的轻量段级标题（vs HeaderBox：无 card 边框） |
| `<MetricsStrip>` | 数据 | 5-cell 等分指标条（业务沉淀，技术指标密集场景） |
| `<HeroBand>` | 页面级 | 营销引导带（v1.2 my-models 沉淀；整页限一个） |
| `<DetailPage>` | 页面级 | 详情页一体化骨架（PageHeader + MetricsStrip + Tabs + DetailSection） |
| `<StepPills>` | 导航 | 微型流程指示器（4 状态药丸，嵌套场景） |
| `<el-steps>` (Stepper) | 导航 | 完整向导（≥3 步 + 每步要填字段） |
| `<el-form>` (Form) | 表单 | **必须用 `.form-modern` 包裹**：label 顶部 + 40px 高 + 8px 圆角 + ring focus；配合 `.form-group` / `.form-helper` / `.form-actions`；详见 §1.4 规则 9 |
| `<el-input>` 完整态 | 表单 | disabled / error / prefix-icon / suffix / counter / textarea |
| `<el-switch>` `<el-checkbox>` `<el-date-picker>` | 表单 | Form Controls，详见 DS Form Controls 章节（注意：Radio 不再用 EP 默认，见下行）|
| `<el-radio>` 4 variant | 表单 | **不再用 EP 默认**，按数据特性选 4 种生产 variant（详见 §1.4 规则 10 + DS §F2c）：<br>· `.radio-circle` （L1 默认 · 圆环 · 90% 场景）<br>· `.radio-pill` （L2 · 横排紧凑 / 筛选）<br>· `.radio-segmented` （L2 · 2-4 互斥状态 / 视图切换）<br>· `.radio-card` （L2 · 含描述的关键决策）|
| `<el-upload>` + `.upload-zone` | 表单 | 拖拽上传 + 4 状态文件项（waiting / uploading / done / error） |
| `<el-dialog>` (Modal) | Overlay | 3 种宽度：420 / 520 / 720px；表单态锁遮罩 |
| `<el-drawer>` (Drawer) | Overlay | 三段式 header / body / footer；宽 480-640px |
| `<el-tooltip>` (Tooltip) | Overlay | 仅补充说明，禁止承载关键信息 |
| `<el-popconfirm>` (Popconfirm) | Overlay | 行级二次确认（vs Modal Confirm：影响小可恢复） |
| Loading + Skeleton | 反馈 | 三态：首次 Skeleton / 翻页 v-loading / 关键操作按钮 loading |
| `<I18nField>` | 表单 | **多语言字段（强制用）**：Tabs 切换 + 圆点状态（绿✓已填 / 灰○未填 / 红⚠必填未填脉动）+ 进度条；无旗帜 emoji；详见 §1.4 规则 8

#### L3 自由发挥

**DS 里没有的全新场景。AI 按 §4 设计语言原则自由发挥，不强制套用现有组件。**

**典型 L3 场景：**
- 新业务流程的视觉创新（如未来某个特殊业务的引导带）
- 当前组件无法表达的特殊数据结构
- 探索性的 hero / banner / 引导动效
- 营销页 / 错误页 / 大屏可视化等非控制台主流场景

**升级路径：**
设计师 review 时若发现新模式值得复用 →
写进 `agione-design-system.html`（视觉）+ 本节 L2 清单（规则）+ `agione-console-shell-sample-v1.html`（CSS / 组件实现）→
下次 AI 调用 skill 自动按 L2 用上。

#### 使用原则

1. **L1 优先组件标签**：能用 `<KpiCard>` 时不要写 `<div class="kpi-card">`，能用 `<HeaderBox>` 不要手写 head + filter 组合
2. **L2 允许变体**：若 L2 组件 props 不够，可参考 DS 风格自定义（必须保持 token 一致性）
3. **L3 不强制套用**：AI 在 §4 原则下自由发挥，但不能突破 L1 视觉系统层
4. **保留布局自由**：组件之间的网格 / flex 布局始终由 AI 自由发挥（任何等级都不约束这一层）
5. **不在原型里改组件实现**：L1 / L2 组件 CSS / template 来自 shell sample，原型只是消费者

#### 组件 API 速查

##### `<HeaderBox>` — 页面顶部标题区（每页必有）
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | — | ✅ | 页面主标题 |
| `subtitle` | String | `''` | ✗ | 副标题（说明文字）|

| Slot | 说明 |
|------|------|
| `actions` | 右侧操作按钮区（如新建按钮） |
| (default) | 标题下方区域（如 FilterBox） |

```html
<HeaderBox :title="t.apiKeys.title" :subtitle="t.apiKeys.subtitle">
  <template #actions>
    <el-button type="primary">{{ t.common.btn.add }}</el-button>
  </template>
  <div class="filter-box" data-component="filter-box">
    <!-- 筛选表单 -->
  </div>
</HeaderBox>
```

##### `<KpiCard>` — 数据指标卡（Dashboard 必备）
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | — | ✅ | 指标名称（uppercase） |
| `value` | String / Number | `''` | ✗ | 主数值（也可用 default slot 自定义）|
| `icon` | String | `''` | ✗ | Lucide 图标名 |
| `iconColor` | String | `'primary'` | ✗ | `primary` / `success` / `warning` / `destructive` |
| `trend` | String | `''` | ✗ | 趋势文字 |
| `trendType` | String | `'neutral'` | ✗ | `up` / `down` / `neutral`（影响颜色）|

| Slot | 说明 |
|------|------|
| (default) | 替换 value 内容（如富文本数字 + 总数）|
| `trend` | 替换 trend 文字（如带图标的趋势）|

```html
<!-- 简单用法 -->
<KpiCard title="总用户数" value="12,456" icon="users" iconColor="primary" trend="本月 +8%" trendType="up" />

<!-- slot 用法 -->
<KpiCard title="配额" icon="key">
  <template>5<span style="color:var(--muted-foreground);"> / 10</span></template>
</KpiCard>
```

##### `<StatusBadge>` — 状态徽标
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `status` | String | — | ✅ | `active` / `pending` / `expiringSoon` / `inactive` / `revoked` / `expired` / `error` |
| `label` | String | `''` | ✗ | 显示文本（不传则用 status 值）|

| Slot | 说明 |
|------|------|
| (default) | 自定义 label 内容 |

```html
<StatusBadge status="active" label="已启用" />
<StatusBadge :status="row.status">{{ statusLabel(row.status) }}</StatusBadge>
```

##### `<EmptyState>` — 空状态
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `icon` | String | `'inbox'` | ✗ | Lucide 图标名 |
| `title` | String | — | ✅ | 主提示文字 |
| `hint` | String | `''` | ✗ | 辅助说明 |

| Slot | 说明 |
|------|------|
| `action` | 底部 CTA（如重置按钮）|

```html
<EmptyState icon="search-x" title="没有匹配的密钥" hint="尝试调整筛选条件或重置。">
  <template #action>
    <el-button @click="handleReset">重置</el-button>
  </template>
</EmptyState>
```

##### `<Alert>` — 行内警示横幅（§5.14 同款）
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `variant` | String | `'info'` | ✗ | `success` / `warning` / `error` / `info` |
| `title` | String | — | ✅ | 标题 |
| `desc` | String | `''` | ✗ | 描述（也可用 default slot）|
| `closable` | Boolean | `false` | ✗ | 是否可关闭 |

| Slot | 说明 |
|------|------|
| (default) | 替换 desc 内容（支持富文本）|

```html
<Alert variant="error" title="API 密钥配额已用满" desc="请撤销不再使用的密钥后再试。" />
<Alert variant="warning" :title="`${n} 个密钥即将过期`" closable>
  过期后调用将失败，<a href="#">点此查看详情</a>。
</Alert>
```

##### `<UsageBar>` (v3.5) — 用量进度条
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `used` | Number | — | ✅ | 已用值 |
| `total` | Number | — | ✅ | 总值 |
| `unit` | String | `''` | ✗ | 单位文字（如 `'GB'`、`'%'`）|
| `color` | String | `'auto'` | ✗ | `auto` / `primary` / `success` / `warning` / `danger`；`auto` 时按用量阈值（≥80% warning，≥100% danger）|
| `showText` | Boolean | `true` | ✗ | 是否显示右侧用量文字 |

| Slot | 说明 |
|------|------|
| (default) | 自定义右侧用量文字（如复杂格式化）|

```html
<!-- 自动配色：≥80% 黄，≥100% 红 -->
<UsageBar :used="80" :total="100" unit=" GB" />

<!-- 强制红色 -->
<UsageBar :used="quota.used" :total="quota.total" color="danger" />

<!-- 自定义文字 -->
<UsageBar :used="row.usage.used" :total="row.usage.total" :show-text="false">
  <span>{{ formatTokens(row.usage.used) }} / {{ formatTokens(row.usage.total) }}</span>
</UsageBar>
```

##### `<KvCard>` (v3.5) — K-V 描述卡（详情页核心）
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | `''` | ✗ | 卡片标题（不传则不显示标题栏）|
| `items` | Array | `[]` | ✗ | `[{ label, value, key? }]` 数据行 |
| `labelWidth` | String | `'auto'` | ✗ | `'auto'` 或 `'120px'` 等固定宽度 |
| `hover` | Boolean | `false` | ✗ | 是否启用 hover 边框变色 |

| Slot | 说明 |
|------|------|
| `headerRight` | 标题右侧（如编辑按钮）|
| `[item.key]` | 自定义某行 value 渲染（带 `:item` 作用域）|
| (default) | 在 items 后追加自定义内容 |

```html
<!-- 简单用法 -->
<KvCard
  title="基本信息"
  :items="[
    { label: '名称', value: 'prod-main' },
    { label: '创建时间', value: '2024-01-15' },
    { label: '状态', value: 'Active', key: 'status' },
  ]"
  label-width="100px"
>
  <template #status="{ item }">
    <StatusBadge status="active" :label="item.value" />
  </template>
</KvCard>
```

##### `<DetailSection>` (v3.5) — 详情页 section
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | — | ✅ | section 标题（左侧带 4px 主色竖条）|

| Slot | 说明 |
|------|------|
| `headerRight` | 标题右侧操作（如编辑/折叠）|
| (default) | section 内容（通常是 KvCard 或表格）|

```html
<DetailSection title="基本信息">
  <template #headerRight>
    <el-button link type="primary">编辑</el-button>
  </template>
  <KvCard :items="baseInfo" />
</DetailSection>
```

##### `<DataTable>` (v3.7) — 表格容器
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `data` | Array | `[]` | ✗ | 表格数据 |
| `columns` | Array | — | ✅ | 列定义数组（见下表）|
| `total` | Number | `0` | ✗ | 数据总数（分页用，>0 才显示分页栏）|
| `page` | Number | `1` | ✗ | 当前页（用 `v-model:page` 双向绑定）|
| `pageSize` | Number | `10` | ✗ | 每页条数 |
| `loading` | Boolean | `false` | ✗ | 加载态 |
| `emptyText` | String | `'暂无数据 / No data'` | ✗ | 空数据提示 |
| `showPagination` | Boolean | `true` | ✗ | 是否显示分页栏 |
| `operationsLabel` | String | `'操作'` | ✗ | 操作列表头文字 |
| `operationsWidth` | Number / String | `160` | ✗ | 操作列宽度 |

**columns 数组每项**：
| 字段 | 必填 | 说明 |
|------|------|------|
| `label` | ✅ | 列表头文字 |
| `prop` | ✗ | 数据字段名 |
| `width` | ✗ | 固定宽度（数字或字符串）|
| `minWidth` | ✗ | 最小宽度 |
| `fixed` | ✗ | `'left'` / `'right'` 固定列 |
| `align` | ✗ | 对齐方式（默认 `'left'`） |
| `sortable` | ✗ | 是否可排序 |
| `slot` | ✗ | 自定义渲染 slot 名（同时也是 column key）|

| Slot | 说明 |
|------|------|
| `[col.slot]` | 在 columns 项里声明 `slot: 'xxx'`，对应 `<template #xxx="{row, col, index}">` 自定义单元格 |
| `operations` | 自动生成右侧固定操作列（通常嵌 `<TableActions>`）|

| Event | 说明 |
|-------|------|
| `update:page` | 页码变化 |
| `update:pageSize` | 每页条数变化 |
| `row-click` | 行点击 |

```html
<DataTable
  :data="rows"
  :columns="[
    { label: '名称', prop: 'name', minWidth: 180 },
    { label: '类型', prop: 'type', width: 140, slot: 'type' },
    { label: '状态', prop: 'status', width: 120, slot: 'status' },
    { label: '用量', prop: 'usage', minWidth: 220, slot: 'usage' },
    { label: '创建时间', prop: 'createdAt', width: 130 },
  ]"
  :total="100"
  v-model:page="page"
  :page-size="10"
>
  <template #type="{ row }">
    <Tag :preset="row.type" />
  </template>
  <template #status="{ row }">
    <StatusBadge :status="row.status" />
  </template>
  <template #usage="{ row }">
    <UsageBar :used="row.usage.used" :total="row.usage.total" />
  </template>
  <template #operations="{ row }">
    <TableActions :actions="[
      { label: '编辑', icon: 'pencil', onClick: () => edit(row) },
      { label: '删除', icon: 'trash-2', danger: true, onClick: () => del(row) },
    ]" />
  </template>
</DataTable>
```

> **DataTable vs §5.0.2 标准骨架**：标准骨架里 `<div data-component="curd-table">` 占位符现在应替换为 `<DataTable>` 组件标签。  
> **真实代码对应**：production 用 `<CurdTable>` from `easybill-ui`（typo 沿用），DataTable 是 SKILL 层的统一命名。

##### `<PageHeader>` (v3.8) — 段级标题
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | — | ✅ | 标题 |
| `subtitle` | String | `''` | ✗ | 副标题 |
| `eyebrow` | String | `''` | ✗ | 顶部小字标签（uppercase）|
| `eyebrowIcon` | String | `''` | ✗ | eyebrow 图标（Lucide 名）|

| Slot | 说明 |
|------|------|
| `actions` | 右侧操作按钮 |

```html
<PageHeader title="财务概览" subtitle="组织 Credit 账户状态与近期交易">
  <template #actions>
    <el-button>导出</el-button>
    <el-button type="primary">新建充值</el-button>
  </template>
</PageHeader>
```

> **HeaderBox vs PageHeader**：HeaderBox 是页级 card 容器（带 border + radius，含 filter 槽位）；PageHeader 是更轻量的 section 标题（仅下方一条细线），用于详情页内分段、卡片头等。

##### `<MetricsStrip>` (v3.8) — 等分指标条
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `items` | Array | — | ✅ | `[{label, value, sub?, accent?, slot?, key?}]` |
| `cols` | Number | `0` | ✗ | 列数（0 = 自动按 items.length 等分）|
| `divided` | Boolean | `true` | ✗ | 是否在 cell 间显示分隔线 |

每 item：
- `label`：上方小字（uppercase）
- `value`：主数值（mono 字体）
- `sub`（可选）：value 下方辅助说明
- `accent`（可选）：true 时 value 用主色
- `slot`（可选）：自定义 value 渲染（如价格双行）

```html
<MetricsStrip :items="[
  { label: '上下文窗口', value: '128K', accent: true },
  { label: '参数规模',   value: '70B' },
  { label: '本月调用',   value: '2.4M', sub: 'vs 上月 +12%' },
  { label: '可用性',     value: '99.95%', sub: 'SLA' },
]" />
```

> **何时用 MetricsStrip vs 多个 KpiCard**：MetricsStrip 用于"信息密度优先"的横向指标条（详情页 hero、Overview 顶部）；多个 KpiCard 用于"卡片化网格"展示（每张卡有独立边框、icon、trend）。

##### `<HeroBand>` (v3.8) — Overview 营销引导带
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `eyebrow` | String | `''` | ✗ | 顶部小字标签（带胶囊背景）|
| `eyebrowIcon` | String | `''` | ✗ | eyebrow 图标 |
| `title` | String | — | ✅ | 大标题（28px Manrope）|
| `desc` | String | `''` | ✗ | 描述段落 |
| `points` | Array | `[]` | ✗ | `[{icon, title, desc}]` 特性点列表 |
| `tone` | String | `'primary'` | ✗ | `primary`（紫底）/ `neutral`（白底）/ `gradient`（渐变）|

| Slot | 说明 |
|------|------|
| `right` | 右侧 CTA / 选择卡（≥1024px 时左右双列布局，否则上下叠放）|

```html
<HeroBand
  eyebrow="AGIOne 私有部署"
  eyebrow-icon="shield-check"
  title="把模型变成你自己的资产"
  desc="无需暴露权重，全栈在你机房内完成推理。"
  :points="[
    { icon: 'lock-keyhole', title: '数据不出域', desc: '推理全程在私网' },
    { icon: 'gauge',        title: '高性能',     desc: 'GPU 资源池化调度' },
  ]"
>
  <template #right>
    <CardBox padded>
      <h3>选择部署方式</h3>
      <a class="link">立即部署 →</a>
    </CardBox>
  </template>
</HeroBand>
```

> Overview 页第一屏标配。当无 `right` slot 时自动单列；有 right slot 时大屏左右双列。

##### `<StepPills>` (v3.8) — 微型流程指示器
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `steps` | Array | — | ✅ | `[{label, state}]` |
| `separator` | String | `'›'` | ✗ | 分隔符 |

state 4 种语义：
- `done`：紫透明（已完成第一阶段，如已填写）
- `doneGreen`：绿透明（已通过审核）
- `current`：实心主色（当前进行中，加粗）
- `todo`：灰（待办）

```html
<StepPills :steps="[
  { label: '草稿',   state: 'done' },
  { label: '已提交', state: 'doneGreen' },
  { label: '审核中', state: 'current' },
  { label: '已发布', state: 'todo' },
]" />
```

> 比 `<el-steps>` 更轻量：只显示状态，不显示步骤编号，适合"草稿 / 已提交 / 已审核 / 已发布"这种内容生产流程。

##### `<TableActions>` (v3.5) — 表格操作列按钮组
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `actions` | Array | — | ✅ | `[{ label, type?, icon?, disabled?, danger?, onClick }]` |
| `max` | Number | `3` | ✗ | 最多显示几个 link 按钮，超出自动收纳到 ... 更多 dropdown |

每个 action：
- `label`: 按钮文字（必填）
- `type`: `'primary'` / `'success'` / `'warning'` / `'danger'`（默认 `'primary'`，`danger:true` 会覆盖）
- `icon`: Lucide 图标名（可选）
- `disabled`: 是否禁用
- `danger`: 是否危险操作（红色 + 触发样式）
- `onClick`: 点击 handler `(event) => void`

```html
<TableActions
  :actions="[
    { label: '编辑', icon: 'pencil',  onClick: () => edit(row) },
    { label: '复制', icon: 'copy',    onClick: () => copy(row) },
    { label: '撤销', icon: 'ban',     danger: true,
      onClick: () => revoke(row) },
    { label: '查看日志', icon: 'file-text', onClick: () => viewLog(row) },
  ]"
  :max="3"
/>
```

> 上例：前 3 个显示为 link 按钮（编辑/复制/撤销），第 4 个"查看日志"自动收纳到 `...` 更多下拉。

##### `<DetailPage>` (v3.5) — 详情页组合壳（唯一推荐的"复合组件"）
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | — | ✅ | 页面标题 |
| `subtitle` | String | `''` | ✗ | 副标题 |
| `tabs` | Array | `[]` | ✗ | `[{ label, value }]` 顶部 tabs（不传则无）|
| `activeTab` | String / Number | `''` | ✗ | 当前 tab 值（`v-model:active-tab` 绑定）|
| `showBack` | Boolean | `true` | ✗ | 是否显示返回按钮 |

| Event | 说明 |
|-------|------|
| `update:activeTab` | tab 切换 |
| `back` | 返回按钮点击 |

| Slot | 说明 |
|------|------|
| `actions` | 标题右侧操作按钮 |
| (default) | 内容区（通常包含多个 DetailSection） |

```html
<DetailPage
  title="prod-main"
  subtitle="API Key · 创建于 2024-01-15"
  :tabs="[
    { label: '概览', value: 'overview' },
    { label: '用量', value: 'usage' },
    { label: '日志', value: 'logs' },
  ]"
  v-model:active-tab="activeTab"
  @back="goBack"
>
  <template #actions>
    <el-button>编辑</el-button>
    <el-button type="danger">撤销</el-button>
  </template>

  <div v-show="activeTab === 'overview'" style="display:flex;flex-direction:column;gap:24px;">
    <DetailSection title="基本信息">
      <KvCard :items="baseInfo" />
    </DetailSection>
    <DetailSection title="使用统计">
      <KvCard :items="usageStats" />
    </DetailSection>
  </div>
</DetailPage>
```

> ⚠️ DetailPage 已包含 MainBox + HeaderBox + ScrollBox，**用 DetailPage 时不要再外层包这些**。

##### `<Tag>` (v3.6) — 通用标签
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `color` | String | `'muted'` | ✗ | `purple` / `blue` / `green` / `orange` / `yellow` / `muted` / `red` |
| `preset` | String | `''` | ✗ | 预设映射，自动覆盖 color：`trending` / `new` / `beta` / `stable` / `deprecated`（标签词汇表）；`conversation` / `multi-modal` / `reasoning` / `embedding` / `image`（模型类型）|
| `icon` | String | `''` | ✗ | Lucide 图标名（前缀图标，11px）。`preset="deprecated"` 自动加 ⚠ 图标 |

| Slot | 说明 |
|------|------|
| (default) | 标签文字（不传则用 preset 自动首字母大写）|

```html
<!-- 自定义颜色 -->
<Tag color="purple">Trending</Tag>
<Tag color="green">New</Tag>

<!-- 预设（自动颜色 + 自动 label） -->
<Tag preset="trending" />
<Tag preset="deprecated" />
<Tag preset="multi-modal" />

<!-- 带图标 -->
<Tag color="blue" icon="zap">实时</Tag>
```

> **何时用 Tag vs StatusBadge**：StatusBadge 用于**状态枚举**（active/revoked/expired，含状态点 ●）；Tag 用于**分类/标签**（无状态点）。

##### `<CardBox>` (v3.6) — 通用卡片容器
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `title` | String | `''` | ✗ | 卡片标题（不传则不显示标题栏）|
| `padded` | Boolean | `false` | ✗ | 是否启用更大内边距（20px 替代 16px）|

| Slot | 说明 |
|------|------|
| `headerRight` | 标题右侧（如"查看全部"链接）|
| (default) | 卡片主体内容（任意） |

```html
<!-- 带标题 + 右侧链接 -->
<CardBox title="Recent Activity">
  <template #headerRight>
    <el-button link type="primary">查看全部</el-button>
  </template>
  <ul>...</ul>
</CardBox>

<!-- 无标题 -->
<CardBox padded>
  <p>任意内容...</p>
</CardBox>
```

> **何时用 CardBox vs KvCard vs KpiCard**：CardBox 通用容器；KvCard 专用于 K-V 列表；KpiCard 专用于数字指标。优先选最特化的那个。

##### `<Tabs>` (v3.6) — 独立 Tabs
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `options` | Array | — | ✅ | `[{ label, value, count? }]` |
| `modelValue` | String / Number | `''` | ✗ | 当前选中（用 `v-model`）|
| `variant` | String | `'underline'` | ✗ | `underline`（默认，下划线式）/ `segmented`（药丸切换式，≤4 项推荐）|

| Event | 说明 |
|-------|------|
| `update:modelValue` | tab 切换 |

```html
<!-- 下划线式（带计数） -->
<Tabs
  v-model="status"
  :options="[
    { label: '全部',   value: 'all',     count: 12 },
    { label: '已启用', value: 'active',  count: 5 },
    { label: '已撤销', value: 'revoked', count: 3 },
  ]"
/>

<!-- 药丸切换（时间维度等模式切换）-->
<Tabs
  v-model="period"
  variant="segmented"
  :options="[
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
  ]"
/>
```

> **何时用 Tabs vs DetailPage 内嵌 Tabs**：独立 Tabs 用于列表页内的视角切换（如"全部/已启用"）；DetailPage 内嵌 Tabs 用于详情页的内容分组（如"概览/用量/日志"）。

##### `<Avatar>` (v3.6) — 用户头像
| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `src` | String | `''` | ✗ | 头像图片 URL（有图用图，无图 fallback 字母）|
| `name` | String | `''` | ✗ | 用户名（用于生成首字母 + 自动配色）|
| `size` | String | `'default'` | ✗ | `small`(24px) / `default`(32px) / `large`(40px) |
| `color` | String | `''` | ✗ | 自定义背景色（覆盖自动配色）|

```html
<!-- 列表行用法 -->
<div style="display:flex;align-items:center;gap:8px;">
  <Avatar :name="user.name" :src="user.avatar" size="small" />
  <span>{{ user.name }}</span>
</div>

<!-- 大尺寸头像（个人页）-->
<Avatar :name="user.name" size="large" />

<!-- 中文姓名（自动取首两字）-->
<Avatar name="李明" />
```

> 自动配色：基于 name 的 charCode 哈希映射到 5 种 Badge 色（purple/blue/green/orange/yellow），同名用户颜色稳定。

#### 真实代码映射（用于 HTML→Vue 转换）

| 原型组件 | 真实 Vue 组件（project-mamba 重构目标）|
|---------|---------------------------------------|
| `<HeaderBox>` | `<HeaderBox>` from `@common/components`（202 引用）|
| `<KpiCard>` | 待真实代码抽象 |
| `<StatusBadge>` | 待真实代码抽象（el-tag + class 包装）|
| `<Tag>` (v3.6) | 待真实代码抽象（el-tag + 颜色/preset 系统）|
| `<Avatar>` (v3.6) | `<UserAvatar>` from `@common/components`（17 引用）|
| `<EmptyState>` | 包装 `<el-empty>`，待抽象 |
| `<Alert>` | 待真实代码抽象（包装 `<el-alert>`）|
| `<UsageBar>` | 待真实代码抽象（包装 `<el-progress>` + 文字）|
| `<CardBox>` (v3.6) | `<CardBox>` from `@common/components`（86 引用）|
| `<KvCard>` | `<ListCardItem>` from `@common/components`（70 引用）|
| `<DetailSection>` | `<EditItem>` from `@common/components`（103 引用）|
| `<Tabs>` (v3.6) | `<TopTabs>` from `@common/components`（24 引用）|
| `<TableActions>` | 待真实代码抽象（消除 280+ 处内联）|
| `<DataTable>` (v3.7) | `<CurdTable>` from `easybill-ui`（231 引用，typo 沿用；SKILL 层统一为 DataTable）|
| `<DetailPage>` | `<MainBox> + <HeaderBox> + <ScrollBox> + <DetailTabs>` 组合 |

#### 何时降级到原始 DOM

如果遇到：
- 组件不支持的复杂结构（如 KpiCard 内嵌图表）
- 需要逐字段绑定的特殊布局

可回退到 §5.0.3 自定义契约 DOM，但必须保留 `data-component` 标记。

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

| 用户需求 | 选型 | 默认骨架 |
|---------|------|---------|
| 数据密集、≥6 列、需排序筛选 | 列表页（表格） | §5.0.2 标准骨架 |
| 视觉资产、≤5 核心属性、状态突出 | 列表页（卡片） | §5.0.2（表格区换为卡片网格） |
| 新建 / 编辑，字段简单 | 表单页 | `MainBox > HeaderBox + 表单区` |
| 新建，依赖复杂（≥2 种关联资源） | 向导页（Step Wizard） | `EditContainer`（§6.4） |
| 只读展示、多维数据 | 详情页（Tabs 内容区） | `MainBox > HeaderBox + DetailTabs + Tab 内容区` |
| 指标汇总、图表、快捷操作 | Overview Dashboard | §6.3 |
| API / SDK / 调试 / 日志 / 事件追踪 | 开发者/诊断页 | `MainBox > HeaderBox + DetailSection + 可折叠技术详情` |
| 只验证框架 / chrome | Shell-only | §6.6 |

> ⚠️ 列表/管理类页面（占比 70%+）必须使用 §5.0.2 标准骨架，与真实代码 200+ 页面保持一致。

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

## 6.7 多页面 → 单文件 HTML 的导航映射（锁定）

> 每个 prototype-[角色].md 定义了多个页面（通常 5-15 个）。这些页面全部组织在**单一 HTML 文件**中，通过 Sidebar 菜单项切换显示。

**标准实现模式（必须遵守）**：

```js
// setup() 中定义当前激活页面
const activeNav = ref('overview');  // 默认页面 key
```

```html
<!-- Sidebar 菜单项：点击更新 activeNav -->
<div class="nav-item" :class="{ active: activeNav === 'finance' }" @click="activeNav = 'finance'">
  <i data-lucide="credit-card"></i> Finance
</div>

<!-- 主内容区：每个页面一个 v-show 区块 -->
<main class="main">
  <section v-show="activeNav === 'overview'"> <!-- Overview 页内容 --> </section>
  <section v-show="activeNav === 'finance'">  <!-- Finance 页内容 --> </section>
  <section v-show="activeNav === 'projects'"> <!-- Projects 页内容 --> </section>
  <!-- ... 每个菜单项对应一个 section -->
</main>
```

**规则**：
- 每个菜单项对应一个唯一的 `activeNav` key（用英文小写，如 `finance`、`api-keys`、`member-quota`）
- key 命名与 prototype 文件中的页面名对应，不随意发明
- 所有 `<section>` 同时存在于 DOM，通过 `v-show` 控制显隐（不用 `v-if`，保留状态）
- 页面切换时调用 `lucide.createIcons()` 重新初始化图标
- 禁止用路由、iframe、动态加载实现页面切换

## 6.8 演示场景切换器（Scenario Switcher）

> 复杂业务原型评审时，业务方常常需要看"不同状态下页面的呈现"。  
> 本模式让所有页面 mock 数据按场景集中管理，一键全局切换，避免重复生成不同状态的原型。

### 触发条件（AI 自动判断，详见 §1.4 规则 6）

满足任一即自动启用：
- prototype 中某实体定义 ≥3 个状态分支
- 用户描述含"演示 / 评审 / 不同状态 / 多场景 / 切换查看"
- 页面是强状态机（订单流 / 审批流 / 配额 / 订阅等）

### 数据结构（必须遵守）

```js
// setup() 中
const scenarios = {
  normal: {
    label: { zh: '正常状态', en: 'Normal' },
    data: {
      quota: { used: 60, total: 100 },
      orders: [/* ... */],
      // 所有页面共享的 mock 数据都放这里
    }
  },
  empty: {
    label: { zh: '空状态', en: 'Empty' },
    data: { quota: { used: 0, total: 100 }, orders: [] }
  },
  overLimit: {
    label: { zh: '配额超限', en: 'Over Limit' },
    data: { quota: { used: 120, total: 100 }, orders: [/* ... */] }
  }
};

const defaultScenario = 'normal';
const activeScenario = ref(defaultScenario);
const scenarioData = computed(() => scenarios[activeScenario.value].data);
const scenarioLabel = computed(() => scenarios[activeScenario.value].label[lang.value]);
const hasScenarios = computed(() => Object.keys(scenarios).length >= 2);
const isCustomScenario = computed(() => activeScenario.value !== defaultScenario);
```

**所有页面 mock 数据必须从 `scenarioData.value` 取**，不得再单独定义页面级 mock。

### UI 位置（全局共享，挂在 TopNav 右侧）

```html
<!-- TopNav 右侧首位（仅多场景时显示） -->
<el-dropdown v-if="hasScenarios" trigger="click">
  <button class="demo-mode-chip">
    <i data-lucide="lightbulb"></i>
    <span>{{ lang === 'zh' ? '演示场景' : 'Scenario' }}：{{ scenarioLabel }}</span>
    <i data-lucide="chevron-down"></i>
  </button>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item
        v-for="(s, key) in scenarios"
        :key="key"
        @click="activeScenario = key"
      >{{ s.label[lang] }}</el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>
```

### 强提示横幅（非默认场景时显示）

```html
<!-- TopNav 紧下方，main 上方 -->
<div v-if="isCustomScenario" class="demo-banner">
  <i data-lucide="lightbulb"></i>
  <span>{{ lang === 'zh' ? '当前演示场景' : 'Current scenario' }}：{{ scenarioLabel }} · {{ lang === 'zh' ? '仅评审用，非真实数据' : 'For review only, not real data' }}</span>
</div>
```

### 命名规范

- key 用 camelCase 语义命名：`normal` / `empty` / `overLimit` / `pendingApproval` / `trialExpiring` / `errorState`
- key 不能用 `case1`、`scenario2` 这类无意义编号
- `normal` 永远是 `defaultScenario`，列在第一位
- 标签必须双语（中/英）

### 场景设计参考表

| 业务领域 | 推荐场景集 |
|---------|-----------|
| 配额 / 用量 | `normal` / `empty` / `nearLimit`（≥80%）/ `overLimit` |
| 订单 / 审批 | `draft` / `pending` / `approved` / `rejected` / `completed` |
| 订阅 / 计费 | `freeTrial` / `paid` / `trialExpiring` / `expired` |
| 用户角色 | `admin` / `regularUser` / `guest` |
| 数据丰俭 | `normal` / `empty` / `singleItem` / `pagedLimit`（极限分页） |

---

# PART 7 · 交付自检

> 输出前过一遍，不通过不交付。

### Chrome 完整性（必须全部 ✓）
- [ ] TopBar 结构与样式完全符合 §3.2，右侧顺序正确
- [ ] **TopBar 左上角 logo 完整可见**（验证 `LOGO_DARK` / `LOGO_LIGHT` base64 字符串长度均 ≥ 20000 字符，未被简化）
- [ ] Sidebar 结构完全符合 §3.3
- [ ] 主题切换真实生效（不是静态截图），Sun/Moon 图标正确切换
- [ ] 主题切换后 logo 仍显示正常（Light / Dark 两套 logo 都已完整复制）
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
- [ ] **多场景 Scenario Switcher**：复杂状态机/多角色页面已实现 §6.8 切换器，TopNav 右侧 chip + 非默认场景横幅完整可用

### 设计一致性
- [ ] 所有颜色走 CSS 变量
- [ ] 圆角使用分级 token，未混用
- [ ] Badge 严格使用 6 套配色，状态映射符合 §2.3
- [ ] 数字 / 时间 / ID 使用 IBM Plex Mono + `font-variant-numeric: tabular-nums`
- [ ] 字体层级符合 §2.2（H1 用 Manrope，正文用 Inter）
- [ ] 交互动效克制（150ms，无 scale / translate）
- [ ] 键盘焦点环可见（`outline: 2px solid var(--ring); outline-offset: 2px`）
- [ ] 状态提示色 + 图标 + 文字三重区分，不仅靠颜色
- [ ] **目标用户 5 秒自检**：目标用户能在 5 秒内理解页面目的、当前状态、下一步关注点/动作和动作结果
- [ ] **无可见内部证据**：页面可见文本不出现 `Api.general.xxx`、`result.total`、`hasXxx`、`currentStep`、`AI-NOTES`、`data-source`、`mock`、前端路由、源码 API client 名称或原型说明感文案；开发者/API/诊断页只展示完成任务所需的技术信息且已脱敏

---

# PART 8 · Peer Review 配合

## 8.1 用路径引用，不粘贴内容

执行 peer review 时用 `@路径` 引用文件，**禁止将 HTML 全文粘贴进对话**（通常 800-1500 行，消耗大量 context token）。

```
✅ 高效写法：
请 review @[REQ路径]/prototype/eu.html，对照功能说明书 @[REQ路径]/functions/F001-*.md 进行 peer review

❌ 低效写法：
[将 HTML 全文粘贴进对话]
```

## 8.2 Peer Review 两步标准

**Step 1 — 工程规范（前端研发自查，不需要 PM 参与）**
- [ ] 所有 el-* 和图标组件显式闭合（非 `/>` 自闭合）
- [ ] 无属性字面量里的 mustache 语法（`placeholder="{{ x }}"` → 用 `:placeholder="x"`）
- [ ] 无硬编码色值（全部走 CSS 变量）
- [ ] Light / Dark 切换后显示正常，无元素消失
- [ ] 无控制台报错
- [ ] Lucide：`<i data-lucide="...">` + `createIcons()` 已调用

**Step 2 — 功能覆盖（前端完成后同步 PM）**
- [ ] 功能说明书的每个功能都有对应页面
- [ ] 4 种状态可访问：空 / 加载 / 错误 / 权限不足
- [ ] 字段名与功能说明书一致
- [ ] 异常文案与功能说明书一致
- [ ] 权限逻辑与功能说明书一致

**结论输出：**
- **通过** — 可提交 PM 抽查
- **不通过** — 列出问题和文件位置，修复后重新提交

### 内容与双语
- [ ] 全部可见文案提供中英双语
- [ ] 无自创业务字段（信息不足时用合理占位数据）
- [ ] 错误 / 空状态 / 加载态有对应处理
