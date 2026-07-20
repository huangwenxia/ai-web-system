# Vue 落地骨架：两类页面 archetype

> **通用 vs 举例**：archetype 判断、骨架结构、表格三选一是**通用模式**；类名（`.ps-`/`.pc-`/`.operator-<page>`）是举例，按你的页面命名。

“优先共享表格/弹窗组件”只适用于**标准 CRUD 列表页**。agione-ui 原型里也有大量**仪表盘/诊断型页面**（operator dashboard、月度总览、对账中心、调账 SOP 等），它们的视觉权威是原型的 bespoke 区块组件，不是某个表格组件的默认样式。先判断 archetype 再选骨架。

## A. CRUD 列表页 → 共享四件套
有筛选 + 分页 + 增删改的标准列表。优先使用目标仓库当前推荐的 `CurdTable` / `FilterBox` / `FormDialog` / table hook。设置 `APP=financial`（按任务替换），再用 `rg --files "apps/$APP/src/views"` 找同 app 的成熟范本，不写死历史路径。

## B. 仪表盘/诊断页 → 复刻原型 bespoke 区块
hero/KPI/卡片/诊断表/空态为主，按 Gate B 复刻原型的 section 结构；历史 operator 六页案例都属于这一类。

### 页面骨架
```vue
<template>
  <MainBox>
    <ScrollBox>
      <div v-loading="loading" class="operator-<page>">
        <section class="header-box" data-component="header-box">
          <div class="header-box__top"><h1 class="header-box__title">Page Title</h1></div>
        </section>
        <section class="operator-<page>-content" data-scroll-box data-component="scroll-box">
          <!-- detail-tabs / alert / card-box / kpi-grid / empty-state / table -->
        </section>
      </div>
    </ScrollBox>
  </MainBox>
</template>
```
给根节点稳定 class（`.operator-reconciliation`）——probe/waitFor/waitForGone 都靠它。

### detail-tabs（下划线 tab，原型常见，不是 segmented）
```vue
<div class="detail-tabs" data-component="tabs">
  <button v-for="tab in tabs" :key="tab.value" class="detail-tabs__item"
          :class="{ 'is-active': active === tab.value }" type="button" @click="active = tab.value">
    <span>{{ tab.label }}</span>
  </button>
</div>
```

### card-box / alert / empty-state
```vue
<section class="card-box card-box--padded" data-component="card-box">
  <div class="card-box__head"><div class="card-box__title">Title</div></div>
  <div class="card-box__body"> … </div>
</section>

<div class="alert alert-info" data-component="alert">
  <InfoIcon class="alert-icon" /><div class="alert-body"><p class="alert-title">…</p></div>
</div>

<div v-if="rows.length === 0" class="empty-state" data-component="empty-state">
  <CheckCircleIcon class="empty-state__icon" /><p class="empty-state__title">No pending items</p>
</div>
```
> CardBox 的 title prop/slot 以目标仓库当前组件源码为准；若默认标题结构无法匹配原型，使用组件公开 slot 和 page-scoped 样式调整，不猜历史 API。

### 表格三选一（别一刀切"禁 el-table"）
| 场景 | 用什么 |
|---|---|
| 标准增删改列表（筛选+分页+表单） | `CurdTable` 四件套 |
| **生产查询型列表**（按真实条件查后端、分页，但非 CRUD;如 settlement-list） | `el-table` + 生产筛选 OK —— 配 `:deep` 把 dark 下行高/分隔线/表头填充纠到原型值 |
| 只读、要 1:1 复刻原型的诊断/汇总表（对账、双边核对） | 原型同款 bespoke `<table> + th.type-table-header`（套 CurdTable/el-table 会带入与原型不符的默认样式） |

bespoke 表 dark 下补：
```scss
.operator-<page>-table th.type-table-header { padding: 12px 0; }
.operator-<page>-table td { padding: 12px 0; border-bottom: 1px solid var(--ui-border-soft); }
```
> 生产页可以比原型 mock **多出查真实数据所必需的筛选**（如 settlement-list 的 Provider / 账期筛选）——这是 Gate A 的生产功能刚需。判据：**查真实数据所必需 = 合法；纯装饰/冗余工具栏 = 不增加**。

## 真实数据纪律（Gate A）
- 行数据来自**真实 API**；按 SKILL Gate A 核对生成类型、后端语义和每个参数。
- 无数据走 empty-state，**不造 mock**。
- 真实首屏行数和原型静态行数不同会拉高 mismatch：对称 mask 动态表体，并分别验证表头、列结构、行样式、空态和分页。**不要只为降低 mismatch 擅改生产 pageSize**；只有产品口径本来就要求该首屏行数时才调整。
- icon 使用目标仓库当前 `AGENTS.md` 指定的包并静态具名导入。不要从历史页面或本 skill 的旧案例推断包名；核对方法见 `project-mamba-adaptation.md`。
