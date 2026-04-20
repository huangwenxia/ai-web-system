<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { defineAsyncComponent } from 'vue'

const ExampleCard = defineAsyncComponent(() => import('../../../../assets/components/candidates/example-card.vue'))

const examples = [
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
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <CardBox class="wb-surface-card">
    <template #title>
     <div class="wb-card-heading">
      <div class="wb-card-heading-title">Example Card 独立预览</div>
      <p class="wb-card-heading-note">直接消费候选组件源码，先验证状态矩阵，再进入真实项目预览。</p>
     </div>
    </template>

    <CardBoxBody>
     <div class="wb-card-grid wb-card-grid--three">
      <article v-for="item in examples" :key="item.title" class="wb-metric-item">
       <h3 class="wb-card-title">{{ item.title }}</h3>
       <p class="wb-card-note">状态矩阵样例</p>
       <div class="wb-preview-frame">
        <ExampleCard v-bind="item.props" />
       </div>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
