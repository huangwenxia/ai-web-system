# Implementation Anti-Patterns

本文件保存高频坏写法与正例。只有出现类似风险、代码审查或实现反复犯错时读取。

## 1. 把 profile 当事实源
错误：
```md
profile 写 hashrate 复用 @wanmore install，所以直接去 @wanmore 找 bootstrap。
```

正确：
```md
先读 apps/hashrate/vite.config.ts 和 apps/hashrate/src/main.ts；若当前代码与 profile 冲突，以当前代码为准，并把矩阵更新列为回写候选。
```

## 2. 把 `@common` alias 当 route ownership
错误：
```ts
// general 有 @common alias，所以页面壳默认按 common view 实现。
```

正确：
```md
alias 只能说明 import 能力，不能说明页面来自 common。先判 vite-plugin-pages / router 挂载来源。
```

## 3. 用 `--ui-*` 重建 Element Plus 内部状态
错误：
```scss
.el-input {
  --el-input-bg-color: var(--ui-bg-card);
}
```

正确：
```md
页面容器和业务壳层用 --ui-*；Element Plus anatomy、placeholder、disabled、overlay、border 优先用 --el-* 或既有 Element Plus bridge。
```

## 4. 把动作语义当视觉补丁
错误：
```vue
<el-button :type="isDisabled ? 'default' : 'primary'" :disabled="isDisabled" />
```

正确：
```vue
<el-button type="primary" :disabled="isDisabled" />
```

## 5. 用 `watch` 维护可推导状态
错误：
```ts
const visibleRows = ref<Row[]>([])
watch([rows, keyword], () => {
  visibleRows.value = filterRows(rows.value, keyword.value)
})
```

正确：
```ts
const visibleRows = computed(() => filterRows(rows.value, keyword.value))
```

## 6. 数组 / 对象 props 默认值写字面量
错误：
```ts
import { PropType } from 'vue'

const props = defineProps({
  userList: {
    type: Array as PropType<UserItem[]>,
    default: [],
  },
})
```

正确：
```ts
import type { PropType } from 'vue'
import type { UserItem } from '@/types'

const props = defineProps({
  userList: {
    type: Array as PropType<UserItem[]>,
    default: () => [],
  },
})
```

## 7. 为页面布局新增一堆 scoped class
错误：
```vue
<div class="page-header-row">
  <div class="page-header-left">...</div>
</div>
```

正确：
```vue
<div class="flex items-center justify-between gap-4">
  <div class="min-w-0">...</div>
</div>
```

## 8. 为单页效果污染共享层
错误：
```md
为了一个页面的特殊卡片阴影，直接改 apps/common/src/assets/scss/reset.scss。
```

正确：
```md
先用 app-local 组件或 soft override。只有跨 app 语义和主题边界稳定后，再考虑上提 common。
```
