<script setup lang="ts">
interface WorkbenchExampleCardProps {
 title: string
 value?: string | number
 description?: string
 loading?: boolean
 emptyText?: string
}

const props = withDefaults(defineProps<WorkbenchExampleCardProps>(), {
 value: '',
 description: '',
 loading: false,
 emptyText: '暂无数据',
})
</script>

<template>
 <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
 <header class="mb-2">
 <h3 class="m-0 text-sm font-semibold text-slate-900">{{ props.title }}</h3>
 </header>

 <div v-if="props.loading" class="text-xs text-slate-500">加载中...</div>
 <div v-else-if="props.value === '' || props.value === null || props.value === undefined" class="text-xs text-slate-500">
 {{ props.emptyText }}
 </div>
 <div v-else class="flex flex-col gap-2">
 <div class="text-2xl font-bold text-slate-900">{{ props.value }}</div>
 <p v-if="props.description" class="m-0 text-xs text-slate-500">{{ props.description }}</p>
 </div>
 </section>
</template>
