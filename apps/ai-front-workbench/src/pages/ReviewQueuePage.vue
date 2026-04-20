<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed } from 'vue'

import WorkbenchAssetShowcase from '../components/WorkbenchAssetShowcase.vue'
import WorkbenchStatusBadge from '../components/WorkbenchStatusBadge.vue'
import {
 assetRegistry,
 getAssetImplementationLabel,
 getAssetNextGate,
 getAssetQueueReasons,
 getAssetSummary,
 getAssetTypeLabel,
} from '../registry'

const queueAssets = computed(() =>
 assetRegistry.filter(
  (asset) =>
   asset.status === 'draft' ||
   asset.status.includes('candidate') ||
   asset.implementation.fallbackHtmlBlocks.length > 0 ||
   asset.composition.missingCapabilities.length > 0
 )
)

const queueSections = computed(() => {
 const sections = [
  {
   id: 'page-fallback',
   title: '先把页面里的 fallback 换成组件',
   note: '页面如果还残留大量原生区块，就还没真正进入组件装配层。',
   assets: queueAssets.value.filter((asset) => asset.type === 'page' && asset.implementation.fallbackHtmlBlocks.length > 0),
  },
  {
   id: 'component-alignment',
   title: '先把候选组件对齐真实基线',
   note: '这些组件已经值得沉淀，但还没完全站到真实 project-mamba 依赖上。',
   assets: queueAssets.value.filter((asset) => asset.type === 'component' && !asset.implementation.realComponentRefs),
  },
  {
   id: 'boundary-gap',
   title: '补能力、补边界、补预览',
   note: '方向已明确，但还缺缺口收敛、装配能力或预览接入。',
   assets: queueAssets.value.filter(
    (asset) =>
     !(asset.type === 'page' && asset.implementation.fallbackHtmlBlocks.length > 0) &&
     !(asset.type === 'component' && !asset.implementation.realComponentRefs)
   ),
  },
 ]

 return sections.filter((section) => section.assets.length > 0)
})

const queueMetrics = computed(() => ({
 total: queueAssets.value.length,
 pageFallback: queueSections.value.find((item) => item.id === 'page-fallback')?.assets.length ?? 0,
 componentAlign: queueSections.value.find((item) => item.id === 'component-alignment')?.assets.length ?? 0,
 boundaryGap: queueSections.value.find((item) => item.id === 'boundary-gap')?.assets.length ?? 0,
}))
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <section class="wb-top-grid">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">队列怎么用</div>
       <p class="wb-card-heading-note">这里不是简单列清单，而是把下一步工作拆成可执行的三种类型。</p>
      </div>
     </template>

     <CardBoxBody>
      <ul class="wb-inline-list">
       <li>页面里还有大量原生区块时，优先抽视觉单元，不要继续堆页面壳。</li>
       <li>候选组件还没接到真实 project-mamba 依赖时，优先做对齐和解耦。</li>
       <li>结构已经清晰的资产，集中补边界态、补预览和补同步链路。</li>
      </ul>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">当前队列规模</div>
       <p class="wb-card-heading-note">一眼看清楚现在卡在哪里。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article class="wb-metric-item">
        <div class="wb-metric-label">总队列</div>
        <div class="wb-metric-value">{{ queueMetrics.total }}</div>
        <p class="wb-card-note">需要继续处理的资产总数</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">页面 fallback</div>
        <div class="wb-metric-value">{{ queueMetrics.pageFallback }}</div>
        <p class="wb-card-note">还没完成组件化抽离的页面</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">组件对齐</div>
        <div class="wb-metric-value">{{ queueMetrics.componentAlign }}</div>
        <p class="wb-card-note">还没对齐真实依赖的候选组件</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">边界与预览</div>
        <div class="wb-metric-value">{{ queueMetrics.boundaryGap }}</div>
        <p class="wb-card-note">结构明确但还缺边界或预览接入</p>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <CardBox v-for="section in queueSections" :key="section.id" class="wb-surface-card">
    <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">{{ section.title }}</div>
       <p class="wb-card-heading-note">{{ section.note }}</p>
      </div>
    </template>

    <template #headerRight>
     <span class="wb-chip wb-chip--soft">{{ section.assets.length }} 项</span>
    </template>

    <CardBoxBody>
     <div class="wb-asset-grid">
      <article v-for="asset in section.assets" :key="asset.id" class="wb-asset-tile">
       <div class="wb-card-row">
        <WorkbenchStatusBadge :status="asset.status" />
        <span class="wb-chip">{{ getAssetTypeLabel(asset.type) }}</span>
        <span class="wb-chip wb-chip--soft">{{ getAssetImplementationLabel(asset) }}</span>
       </div>

       <div class="wb-asset-copy">
        <h3 class="wb-card-title">{{ asset.name }}</h3>
        <p class="wb-card-note">{{ getAssetSummary(asset) }}</p>
       </div>

       <div class="wb-asset-preview">
        <WorkbenchAssetShowcase :asset-id="asset.id" mode="card" />
       </div>

       <dl class="wb-metadata">
        <div>
         <dt>来源项目</dt>
         <dd>{{ asset.sourceTrace.sourceProject || '待补充' }}</dd>
        </div>
        <div>
         <dt>下一步</dt>
         <dd>{{ getAssetNextGate(asset) }}</dd>
        </div>
       </dl>

       <ul class="wb-inline-list">
        <li v-for="item in getAssetQueueReasons(asset).slice(0, 3)" :key="item">{{ item }}</li>
       </ul>

       <div class="wb-asset-actions">
        <router-link class="wb-action-link" :to="asset.preview.catalogRoute">看详情</router-link>
        <router-link v-if="asset.preview.demoRoute" class="wb-action-link" :to="asset.preview.demoRoute">
         打开预览
        </router-link>
       </div>
      </article>
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
