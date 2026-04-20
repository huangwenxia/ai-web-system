<script setup lang="ts">
import ExampleCard from '../../components/candidates/example-card.vue'

const metricCards = [
 {
  title: '在线矿机',
  value: '1,284',
  description: '当前在线设备已完成健康筛查',
 },
 {
  title: '总算力',
  value: '128.5 TH/s',
  description: '核心指标优先复用沉淀卡片组件呈现',
 },
 {
  title: '昨日收益',
  value: '0.532 BTC',
  description: '当页面进入真实项目时直接替换为业务数据即可',
 },
]
</script>

<template>
 <main class="overview-draft">
  <section class="overview-draft__shell">
   <header class="overview-draft__header">
    <h1 class="overview-draft__title">算力概览页面草稿</h1>
    <p class="overview-draft__description">
     这个草稿页不再直接平铺指标卡 HTML，而是先复用已沉淀的 `example-card`，验证页面作为组件装配层是否成立。
    </p>
   </header>

   <section class="overview-draft__metrics">
    <ExampleCard
     v-for="item in metricCards"
     :key="item.title"
     :title="item.title"
     :value="item.value"
     :description="item.description"
    />
   </section>
  </section>
 </main>
</template>

<style scoped>
.overview-draft {
 min-height: 100%;
 padding: 12px;
}

.overview-draft__shell {
 display: flex;
 flex-direction: column;
 gap: 24px;
}

.overview-draft__header {
 display: flex;
 flex-direction: column;
 gap: 8px;
}

.overview-draft__title {
 margin: 0;
 font-size: 28px;
 line-height: 1.1;
 font-weight: 800;
 color: #0f172a;
}

.overview-draft__description {
 margin: 0;
 max-width: 720px;
 font-size: 14px;
 line-height: 1.6;
 color: #64748b;
}

.overview-draft__metrics {
 display: grid;
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 16px;
}

@media (max-width: 720px) {
 .overview-draft__metrics {
  grid-template-columns: 1fr;
 }
}
</style>
