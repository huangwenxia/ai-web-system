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

## 7. 抽离组件 props 直接使用外部类型泛型
错误：
```ts
import type { ModelMatchRowProps } from './types'

const props = defineProps<ModelMatchRowProps>()
```

正确：
```ts
import type { PropType } from 'vue'
import type { ModelMatchRow } from './types'

const props = defineProps({
  row: {
    type: Object as PropType<ModelMatchRow>,
    required: true,
  },
  selectedIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
})
```

原因：抽离组件后，SFC 编译宏需要在编译阶段解析 `defineProps<T>()` 的类型。外部 `types.ts`、复杂泛型、联合类型或插件生成的 `anonymous.vue` 场景可能解析失败；运行时 props 对象 + `PropType` 更稳定。

## 8. 为页面布局新增一堆 scoped class
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

## 9. 为单页效果污染共享层
错误：
```md
为了一个页面的特殊卡片阴影，直接改 apps/common/src/assets/scss/reset.scss。
```

正确：
```md
先用 app-local 组件或 soft override。只有跨 app 语义和主题边界稳定后，再考虑上提 common。
```

## 10. 自己实现或美化 scrollbar
错误：
```vue
<div class="max-h-80 overflow-y-auto scrollbar-thin">
  ...
</div>

<style scoped>
.panel::-webkit-scrollbar {
  width: 6px;
}
</style>
```

正确：
```vue
<el-scrollbar max-height="320px">
  ...
</el-scrollbar>
```

## 11. 新增 CSS Grid 布局，或只靠 viewport 断点改结构
错误：
```vue
<div class="grid grid-cols-3 gap-6 rounded-xl p-6">
  <!-- 原型是紧凑 row，这里用了 grid 且被改成了大卡片 -->
</div>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1280px) {
  .model-row {
    flex-direction: column;
  }
}
</style>
```

正确：
```vue
<div class="model-row flex items-center gap-3">
  <div class="min-w-0 flex-1">...</div>
  <div class="model-row__meta shrink-0">...</div>
</div>

<style scoped>
.model-row {
  container-type: inline-size;
}

@container (max-width: 560px) {
  .model-row {
    flex-wrap: wrap;
  }

  .model-row__meta {
    flex: 0 0 100%;
  }
}
</style>
```

## 12. 直接用原生标签 `v-for` 渲染重复视觉单元
错误：
```vue
<span v-for="tag in displayTags" :key="tag" class="model-match-row__tag">
  {{ tag }}
</span>
```

正确：
```vue
<OverflowTag
  v-if="displayTags.length"
  :tags="displayTags"
  tag-max-width="180px"
/>
```

说明：
```md
出现 v-for 前先查项目已有组件或同语义封装；确实没有合适能力时，才手写循环并在最终检查表说明未复用原因。
```

## 13. 把中文展示文案写成 Unicode escape
目标：
```md
源码按 UTF-8 保存，中文保持可读；不要把 Unicode escape 当成防乱码方案。
```

错误：
```ts
const INPUT_MODALITY_LABELS = {
  'zh-CN': {
    text: '\u6587\u672c',
    file: '\u6587\u4ef6',
  },
}
```

正确：
```ts
const INPUT_MODALITY_LABELS = {
  'zh-CN': {
    text: '文本',
    file: '文件',
  },
}
```

技术例外：
```ts
const parts = value.split(/[,，]/)
const chinesePattern = new RegExp('[\\u4e00-\\u9fff]')
```

说明：`/[,，]/` 中的 `，` 是单个可读中文标点，必须直写；`[\u4e00-\u9fff]` 是 Unicode 字符范围匹配，可以保留转义，但要在最终检查表说明原因。
