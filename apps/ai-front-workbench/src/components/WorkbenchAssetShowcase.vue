<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

const ExampleCard = defineAsyncComponent(() => import('../../../../assets/components/candidates/example-card.vue'))
const ExampleOverviewPage = defineAsyncComponent(() => import('../../../../assets/pages/drafts/example-overview-page.vue'))
const WanmoreListTabBoxPreview = defineAsyncComponent(() => import('../previews/WanmoreListTabBoxPreview.vue'))

const props = withDefaults(
 defineProps<{
  assetId: string
  mode?: 'card' | 'stage'
 }>(),
 {
  mode: 'card',
 }
)

const exampleCardStates = [
 {
  title: '默认态',
  props: {
   title: '算力总览',
   value: '128.5 TH/s',
   description: '最近 24 小时稳定运行',
  },
 },
 {
  title: '空态',
  props: {
   title: '昨日收益',
   value: '',
   emptyText: '暂无收益数据',
  },
 },
 {
  title: '加载态',
  props: {
   title: '在线矿机数',
   loading: true,
  },
 },
]

const isStageMode = computed(() => props.mode === 'stage')
</script>

<template>
 <div class="wb-showcase" :data-mode="props.mode">
  <template v-if="props.assetId === 'component:example-card'">
   <div v-if="!isStageMode" class="wb-showcase-shell wb-showcase-shell--card">
    <ExampleCard v-bind="exampleCardStates[0].props" />
   </div>
   <div v-else class="wb-showcase-grid-inner">
    <article v-for="item in exampleCardStates" :key="item.title" class="wb-showcase-state">
     <div class="wb-showcase-state-title">{{ item.title }}</div>
     <ExampleCard v-bind="item.props" />
    </article>
   </div>
  </template>

  <template v-else-if="props.assetId === 'component:wanmore-list-tab-box'">
   <div class="wb-showcase-shell wb-showcase-shell--canvas">
    <WanmoreListTabBoxPreview />
   </div>
  </template>

  <template v-else-if="props.assetId === 'page:example-overview-page'">
   <div class="wb-showcase-shell wb-showcase-shell--canvas wb-showcase-shell--page">
    <ExampleOverviewPage />
   </div>
  </template>

  <template v-else>
   <div class="wb-showcase-placeholder">
    <div class="wb-showcase-placeholder-title">预览待接入</div>
    <p class="wb-card-note">这个资产还没有挂接可视预览，当前可以先看结构说明和下一步处理建议。</p>
   </div>
  </template>
 </div>
</template>
