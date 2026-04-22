# Z-index 规范

## 核心规则
- 禁止硬编码 z-index 数字，必须使用 CSS 变量或 Tailwind 的 z- 类
- 明确各层级的用途，避免层级冲突

## Z-index 基准（锁定）

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

## Tailwind 对照

| Tailwind | 值 | 场景 |
|---------|----|------|
| `z-0` | 0 | 默认 |
| `z-10` | 10 | 浮动元素 |
| `z-20` | 20 | dropdown |
| `z-30` | 30 | sticky |
| `z-40` | 40 | modal backdrop |
| `z-50` | 50 | modal |

注意：Tailwind 的 z-50 是最高，当项目需要更高层级时，扩展 CSS 变量。

## 禁止
- 硬编码 `z-index: 999`
- 在组件内部使用 `z-index: 1000` 试图覆盖全局层级
- 随意增大 z-index 而不追溯冲突原因

## 层级冲突排查
1. 确认两个元素各自的层级
2. 检查父容器是否创建了新的 stacking context
3. 确认是否有 modal/drawer 等全局覆盖层

## 对应来源
- `ui.md` -> z-index 系统
