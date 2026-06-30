# Partials · AI 可嵌入页面骨架

> 这个目录是给 AI 用的"页面骨架内层 HTML"。AI 选定 Layer 0 模板后，**复制对应 partial 的内容**塞到 cp 出来的 shell-sample 的 `<main>` 内。
>
> ⚠️ 不要复制完整 `templates/pattern-*.html` 文件（那是独立预览文档，含 `<!DOCTYPE>` / chrome / Vue setup，AI 复制会导致 chrome 双重）。

## 使用流程

```bash
# Step 1: cp shell-sample 起步（获得完整 chrome）
cp shell-sample-v1.html target.html

# Step 2: 找到 target.html 里 <main> 区域，把对应 partial 的内容 Edit 进去
# 例：list page → 把 standard-list-page.partial.html 内容塞进 <main>
```

partial 内容是**纯 `<main>` 内层 HTML**：
- ❌ 没有 `<!DOCTYPE>` / `<html>` / `<head>` / `<script>`
- ❌ 没有 TopBar / Sidebar / chrome
- ❌ 没有 Vue setup（用 shell-sample 自带的）
- ✅ 只有页面内容骨架 + 占位 mock 数据
- ✅ 用 runtime-component / css-pattern / element-plus，按 catalog 类型规则

## 文件清单

| Partial | 适用页面 | 必备组件 |
|---------|---------|---------|
| `standard-list-page.partial.html` | 列表 / 管理页（90% 控制台）| MainBox + HeaderBox + FilterBox + DataTable + TableActions |
| `overview-page.partial.html` | 轻量 Overview（KPI + 内容卡，无 chart 主体）| HeaderBox + KpiCard × 3 + CardBox × N |
| `detail-page.partial.html` | 详情 / 配置页 | Breadcrumb + PageHeader + MetricsStrip + Tabs + DetailSection × N |
| `dashboard.partial.html` | **监控大盘 / analytics（chart 为主，v6.9）** | PageHeader + `.ds-section` × N + KPI 两档 + chart family 5 种（契约见 `../dashboard.md`，决策树 ⑪ 命中才用）|

> 向导 / 营销页暂走 L3 自由组装，未来沉淀进 partial。
