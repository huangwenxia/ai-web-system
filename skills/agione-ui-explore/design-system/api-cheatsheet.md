# Component API Cheatsheet · Explore-only

> ⚠️ **explore-only**：本文件只列 **chrome-mandatory** 组件（AI 必用的、chrome 自动渲染的、L1 铁律强制的）。
>
> strict skill 的 catalog 里那些 `<KpiCard>` / `<KvCard>` / `<MetricsStrip>` / `<HeroBand>` / `<StepPills>` 等 **DS 选用类组件**，explore 里**故意不列 API**——目的是强制 AI 在 L3 构图层**自创**业务卡，而不是默认拿 DS 现成组件拼。
>
> 如果 AI 真的需要某个 DS 组件，可以**自己造一个类似的**用 `var(--ui-*)` token + `.type-*` class 实现；或者直接说"这个用 DS 现成的更好" → 提示用户切到 `agione-ui` (strict)。

---

## 🔧 Element Plus 常用原生组件（不在 chrome 里）

> EP 库自带组件，AI 直接用 `<el-*>` 标签。下列 props 是 AGIOne 原型最高频用法。完整 API 见 [element-plus.org](https://element-plus.org)。

### `<el-button>`
**Props**: `type`（primary/success/warning/danger/info/default）· `size`（large/default/small）· `plain` · `link` · `disabled` · `loading` · `circle` · `icon`
**Event**: `@click`

### `<el-input>`
**Props**: `v-model` · `placeholder` · `type`（text/textarea/password/number）· `clearable` · `disabled` · `prefix-icon` · `maxlength` · `show-word-limit`
**Slots**: `prefix`, `suffix`, `prepend`, `append`

### `<el-input-number>`
**Props**: `v-model` · `min` · `max` · `step` · `controls-position`（right）· `disabled` · `precision`

### `<el-select>` + `<el-option>`
**Props**: `v-model` · `placeholder` · `clearable` · `filterable` · `multiple` · `collapse-tags` · `disabled`
**el-option**: `label` · `value` · `disabled`

### `<el-date-picker>` / `<el-time-picker>`
**Props**: `v-model` · `type`（date/daterange/month/year）· `placeholder` · `range-separator` · `start-placeholder` · `end-placeholder` · `value-format`

### `<el-checkbox>` / `<el-checkbox-group>`
**Props**: `v-model` · `label` · `disabled` · `indeterminate` · `border`
**Group**: `v-model`（Array）

### `<el-switch>`
**Props**: `v-model` · `active-text` · `inactive-text` · `active-value` · `inactive-value` · `disabled`

### `<el-pagination>`
**Props**: `v-model:current-page` · `page-size` · `:total` · `layout`（默认 `total, prev, pager, next, sizes, jumper`）· `background`

### `<el-dialog>`
**Props**: `v-model` · `title` · `width` · `:show-close` · `destroy-on-close` · `append-to-body` · `modal` · `center` · `align-center`
**Slots**: `default`, `header`, `footer`

### `<el-form>` + `<el-form-item>`
> ⚠️ 任何 `<el-form>` **必须包在 `<div class="form-modern">` 里**（base spec L1 铁律 #9）
**el-form**: `:model` · `:rules` · `ref` · `label-position="top"`（form-modern 默认）
**el-form-item**: `label` · `prop` · `size="large"`（40px 高，form-modern 必须）· `required`

### `<el-upload>`
**Props**: `action` · `list-type` · `multiple` · `accept` · `:limit` · `:before-upload` · `:on-success`
**Slots**: `default`, `tip`

### `<el-tooltip>` / `<el-popconfirm>`
- Tooltip Props: `content` · `placement` · `effect`
- Popconfirm Props: `title` · `confirm-button-text` · `cancel-button-text` · Event: `@confirm`

### `<el-radio>` ⚠️
**禁止裸用** —— 必须按数据特性选 4 variant：
- `.radio-card`（含副描述）/ `.radio-segmented`（2-4 互斥强切换）
- `.radio-pill`（横排紧凑）/ `.radio-circle`（默认 90% 场景）
- 详见 SKILL.md §1（base spec L1 铁律 #10）

---

## 🏛️ Chrome-mandatory 组件（explore 必用 · 不可替代）

这些组件 explore 跟 strict 一样**必须用**——它们是 chrome 的一部分或 L1 铁律强制。AI **不要**自己造替代品。

### `<HeaderBox>` ⚠️ chrome

页面顶部标题区，自带 title + actions 右侧 slot + 可选 content 默认 slot（含 border-top 分隔）。

**Props**:
- `title: String` (required)
- `subtitle: String` (default `''`) — **explore 可填可不填**（v1.2 base spec framing 加固后说明）

**Slots**:
- `actions` — 右侧操作按钮组
- `default` — 标题下方内容（如 FilterBox、tabs）

**用法**:
```vue
<HeaderBox :title="t.pageTitle">
  <template #actions>
    <el-button type="primary"><i data-lucide="plus"></i>{{ t.btnNew }}</el-button>
  </template>
  <FilterBox>...</FilterBox>  <!-- ⚠️ 不要 wrap CardBox -->
</HeaderBox>
```

⚠️ **base spec**：`.header-box__title` 跟 `.type-h2` 视觉近似但有意保留独立（line-height 1.2 vs 1.4）—— AI **禁止覆盖** font-size / font-family。

---

### `<PageHeader>` ⚠️ chrome 替代选项

比 HeaderBox 更轻量的 section 标题，含可选 eyebrow（小标题 + icon）。**HeaderBox 是页级**，PageHeader 是**段级**。

**Props**:
- `title: String` (required)
- `subtitle: String` (default `''`)
- `eyebrow: String` (default `''`)
- `eyebrowIcon: String`（Lucide 图标名）

**Slots**: `actions`

---

### `<DetailPage>` ⚠️ chrome

详情页组合壳：MainBox + HeaderBox（返回+标题+actions）+ 可选 Tabs + ScrollBox。

**Props**:
- `title: String` (required)
- `subtitle: String` (default `''`)
- `tabs: Array` (default `[]`) — `[{ label, key }]`
- `activeTab: String|Number`
- `showBack: Boolean` (default `true`)

**Slots**: `actions`, `default`
**Events**: `@update:activeTab`, `@back`

---

### `<FilterBox>` ⚠️ chrome

筛选条容器，4 个 variant（standard / three-zone / selection / compact）。

**Props**:
- `variant: 'standard' | 'three-zone' | 'selection' | 'compact'` (default `'standard'`)
- `selectedCount: Number` (default `0`)

**Slots**: `default`（放 el-input / el-select / el-button 等筛选控件）

⚠️ **base spec**（v6.1 加固）：
- 默认放 HeaderBox 默认 slot 内
- 独立放置时**不要 wrap CardBox**
- **禁止**自创 `.filter-card` 类

---

### `<DataTable>` ⚠️ chrome（列表页主组件）

标准列表表格 + 内置分页 + skeleton loading + empty state。**explore 也用这个**——不要自己造 table。

**Props**:
- `data: Array` (required)
- `columns: Array` (required) — `[{ prop, label, width, fixed, slot, sortable }]`
- `loading: Boolean`
- `total: Number`（启用分页）
- `pageSize: Number`
- `currentPage: Number`
- `rowKey: String`（默认 `'id'`）
- `selectable: Boolean`（含 selection 列）

**Slots**:
- 按 columns[].slot 命名动态 slot
- `empty` — 空态自定义
- `actions` (per row) — 操作列

**Events**: `@update:currentPage`, `@update:pageSize`, `@selection-change`

⚠️ **L1 铁律**：列表页用 DataTable，不要降级 `<el-table>` 除非真有 DataTable 不支持的特殊需求。

---

### `<I18nField>` ⚠️ L1 铁律强制（base spec #8）

多语言字段，Tabs 切换 + 圆点状态指示。**表单内同字段多语言填写必须用此组件**，禁止自己拼 input 数组。

**Props**:
- `modelValue: Object` (required) — `{ zh: '', en: '', ja: '', ko: '' }`
- `langs: Array`（default 含 zh/en 必填、ja/ko 选填）
- `required: Boolean`
- `placeholder: String`

**v-model usage**:
```vue
<I18nField v-model="form.name" required />
<!-- 绑定到 { zh, en, ja, ko } 对象 -->
```

---

### `<MainBox>` + `.scroll-box-inner`（page 根容器 CSS-pattern）

页面根 layout（不是 component，是 CSS class）：
```html
<div class="main-box" data-component="main-box">
  <HeaderBox ... />
  <el-scrollbar>
    <div class="scroll-box-inner">
      <!-- 页面内容 -->
    </div>
  </el-scrollbar>
</div>
```

⚠️ **不要**手写自定义 page layout 替代 `.main-box`——这是 chrome 必要骨架。

---

## 🚧 chrome 自动渲染（AI 不直接调用 component）

这些**不是用组件标签调用**，而是在 `setup()` 里设值，chrome 自动渲染。

### `Scenario Switcher` —— 多状态切换

```js
const scenarios = reactive({
  normal: { label: { zh: '正常', en: 'Normal' }, data: {...} },
  empty:  { label: { zh: '空态', en: 'Empty' },  data: {...} },
  // ...
});
```

⚠️ **base spec**：chip 永远在 TopNav 右侧 chrome 自动渲染。**禁止**自造 `.scenario-bar` / `.demo-switcher`。

### `BalanceBox` —— TopBar 余额药丸

```js
balance.value = {
  balance: 15311.79,        // 默认值已预设
  level: 'normal',          // 'normal' | 'low' | 'critical' | 'empty'
  currency: 'Credits',
  showTopUp: true,
};
```

⚠️ **base spec**：chrome 常驻。**禁止**自造 BalanceBox / 充值按钮。explore 可设值切换告警态，不可造替代品。

---

## 🚫 explore 故意不列的组件

下列 strict skill API 里有，**explore 故意不列**——目的是不让 AI 默认拿现成组件拼。如果 explore 真的需要相似功能，**自己用 token + class 造一个**。

- `<KpiCard>` / `<StatusBadge>` / `<EmptyState>` / `<Alert>` / `<UsageBar>` / `<KvCard>`
- `<DetailSection>` / `<TableActions>` / `<MetricsStrip>` / `<HeroBand>`
- `<StepPills>` / `<ProgressBar>` / `<Tag>` / `<CardBox>` / `<Tabs>` / `<Avatar>` / `<Breadcrumb>`

**判别原则**：如果你在 explore 里想用上面任何一个 → 先问自己「这个 variant 跟 strict 输出有什么本质差异？」如果只是想拼现成组件 → 切到 strict skill。

---

## 🧱 强制 CSS-pattern（base spec L1 铁律强制）

### `.form-modern`（包裹所有 `<el-form>`）

L1 铁律 #9 强制结构：
```html
<div class="form-modern">
  <el-form :model="form" label-position="top">
    <div class="form-group">
      <div class="form-group__head">
        <h3 class="form-group__title">分组标题</h3>
        <p class="form-group__desc">分组描述</p>
      </div>
      <el-form-item label="..." prop="..." size="large">
        <el-input v-model="form.field" />
      </el-form-item>
      <div class="form-helper">辅助说明</div>
    </div>
    <div class="form-actions">
      <el-button type="primary">提交</el-button>
      <el-button>取消</el-button>
    </div>
  </el-form>
</div>
```

### `.radio-*` 4 variant（L1 铁律 #10）

按数据特性选：
- `.radio-card` — 含副描述（每项有 title + desc + 可选 icon）
- `.radio-segmented` — 2-4 互斥强切换（如查看模式 list/grid）
- `.radio-pill` — 横排紧凑（短 label）
- `.radio-circle` — 默认 90% 场景（标准选择）

详细 DOM 骨架见 strict skill 的 components/L2/radio-variants.html。explore 不重复展示，但**强制选用**这 4 个 variant 之一，不裸用 `<el-radio>`。

---

**最后更新**：2026-05 (explore v2.0 重写，从 23 个组件裁到 6 个 chrome-mandatory + 强制 CSS-pattern)
