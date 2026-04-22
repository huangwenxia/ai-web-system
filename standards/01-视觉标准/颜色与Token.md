# 颜色系统与 Token 使用

## 核心规则
- 颜色必须来自设计 token，禁止在组件内直接写裸十六进制
- 文字颜色必须区分主文字、次文字、禁用文字、占位符
- 普通文字对比度最低 `4.5:1`
- 大文字对比度最低 `3:1`
- UI 边框和图标对比度最低 `3:1`
- 品牌色和功能色必须在统一色板中定义，不允许组件内临时声明
- CSS 变量的优先级受导入顺序影响，审查时要先确认导入链

## Token 规则
- 优先使用项目已有 token 和 Element Plus / Tailwind 主题变量
- 颜色魔法值必须替换为现有 token
- 渐变中也应尽量使用 token，不直接写临时色值

## Tailwind Color 基准

使用 Tailwind 的 `text-` / `bg-` / `border-` / `ring-` 类，搭配项目定义的 CSS 变量。

| 语义 | Tailwind 类 | 用途 |
|------|------------|------|
| 主色 | `text-primary` / `bg-primary` | 主要操作、激活态 |
| 成功 | `text-success` / `bg-success` | 成功状态、成功提示 |
| 警告 | `text-warning` / `bg-warning` | 警告状态 |
| 错误 | `text-destructive` / `bg-destructive` | 错误状态、危险操作 |
| 主文字 | `text-foreground` | 主要文字 |
| 次文字 | `text-muted-foreground` | 辅助文字、标签 |
| 禁用 | `text-muted` | 占位符、禁用文字 |
| 边框 | `border-border` | 边框、分割线 |
| 背景 | `bg-background` | 页面背景 |

## 反模式
- `text-[#333]` 或 `bg-[#F2F3F6]`
- 组件内新增一组未登记的品牌色
- 硬编码 `#fff` 或 `#000`

## Badge 业务映射（锁定）

### 状态 Badge（带前缀符号）

| 状态 / 类型 | 推荐色 | 前缀符号 |
|------------|--------|---------|
| Active / Running | Green | `●` |
| Pending / Processing | Orange | `◐` |
| Inactive / Stopped | Muted | `○` |
| Error / Failed | Destructive | `✕` |

### 模型类型 Badge（无符号）

| 模型类型 | 推荐色 |
|---------|--------|
| Conversation | Blue |
| Multi-Modal | Purple |
| Reasoning | Orange |
| Embedding | Yellow |
| Image | Green |

### Tag Badge 词汇表（标签含义锁定）

| Tag | 推荐色 | 含义 |
|-----|--------|------|
| Trending | Purple | 热门、流量上升 |
| New | Green | 新上线（上线 < 30 天） |
| Beta | Blue | 公测中 |
| Stable | Muted | 稳定版 |
| Deprecated | Muted | 即将下线，搭配 ⚠ 图标 |

## 对应来源
- `ui.md` -> 颜色系统
- `ui.md` -> CSS 变量优先级与颜色 Token 使用
