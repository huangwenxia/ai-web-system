<script setup lang="ts">
interface ExampleCardProps {
 title: string;
 value?: string | number;
 description?: string;
 loading?: boolean;
 emptyText?: string;
}

const props = withDefaults(defineProps<ExampleCardProps>(), {
 value: '',
 description: '',
 loading: false,
 emptyText: '暂无数据',
});
</script>

<template>
 <section class="example-card">
 <header class="example-card__header">
 <h3 class="example-card__title">{{ props.title }}</h3>
 </header>

 <div v-if="props.loading" class="example-card__state">加载中...</div>
 <div v-else-if="props.value === '' || props.value === null || props.value === undefined" class="example-card__state">
 {{ props.emptyText }}
 </div>
 <div v-else class="example-card__content">
 <div class="example-card__value">{{ props.value }}</div>
 <p v-if="props.description" class="example-card__description">{{ props.description }}</p>
 </div>
 </section>
</template>

<style scoped>
.example-card {
 padding:16px;
 border:1px solid #e5e7eb;
 border-radius:12px;
 background: #fff;
}

.example-card__header {
 margin-bottom:8px;
}

.example-card__title {
 margin:0;
 font-size:14px;
 font-weight:600;
 color: #111827;
}

.example-card__content {
 display: flex;
 flex-direction: column;
 gap:8px;
}

.example-card__value {
 font-size:24px;
 font-weight:700;
 color: #111827;
}

.example-card__description,
.example-card__state {
 margin:0;
 font-size:12px;
 color: #6b7280;
}
</style>
