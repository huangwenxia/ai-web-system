<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed, ref } from 'vue'

import WorkbenchAssetShowcase from '../components/WorkbenchAssetShowcase.vue'
import WorkbenchStatusBadge from '../components/WorkbenchStatusBadge.vue'
import {
 assetRegistry,
 getAssetImplementationLabel,
 getAssetNextGate,
 getAssetReviewSummary,
 getAssetSummary,
 getAssetTypeLabel,
} from '../registry'
import type { WorkbenchAssetType } from '../registry/types'

type CatalogFilter = 'all' | WorkbenchAssetType
type CatalogReadiness = 'all' | 'previewable' | 'aligned' | 'pending'

const activeType = ref<CatalogFilter>('all')
const activeReadiness = ref<CatalogReadiness>('all')

const typeFilters: Array<{ id: CatalogFilter; label: string }> = [
 { id: 'all', label: '全部' },
 { id: 'component', label: '组件' },
 { id: 'page', label: '页面' },
 { id: 'pattern', label: '模式' },
]

const readinessFilters: Array<{ id: CatalogReadiness; label: string }> = [
 { id: 'all', label: '全部状态' },
 { id: 'previewable', label: '可直接看效果' },
 { id: 'aligned', label: '真实基线' },
 { id: 'pending', label: '继续沉淀' },
]

const filteredAssets = computed(() =>
 assetRegistry.filter((asset) => {
  if (activeType.value !== 'all' && asset.type !== activeType.value) {
   return false
  }

  if (activeReadiness.value === 'previewable') {
   return Boolean(asset.preview.demoRoute)
  }

  if (activeReadiness.value === 'aligned') {
   return asset.implementation.realComponentRefs || asset.implementation.strategy === 'asset-composed'
  }

  if (activeReadiness.value === 'pending') {
   return Boolean(
    asset.implementation.fallbackHtmlBlocks.length ||
     asset.composition.missingCapabilities.length ||
     !asset.implementation.realComponentRefs
   )
  }

  return true
 })
)

function getCatalogLane(asset: (typeof assetRegistry)[number]) {
 if (asset.preview.demoRoute) {
  return 'previewable'
 }

 if (asset.implementation.realComponentRefs || asset.implementation.strategy === 'asset-composed') {
  return 'aligned'
 }

 return 'pending'
}

const catalogSections = computed(() => {
 const laneLabels = {
  previewable: {
   title: '可直接看效果',
   note: '先看能不能用，再决定要不要继续抽象。',
  },
  aligned: {
   title: '真实基线 / 结构清晰',
   note: '这些资产已经比较靠近真实 project-mamba 引用或明确装配结构。',
  },
  pending: {
   title: '继续沉淀',
   note: '这些资产还需要补边界、补能力或补接入。',
  },
 } as const

 return (['previewable', 'aligned', 'pending'] as const)
  .map((lane) => ({
   id: lane,
   ...laneLabels[lane],
   assets: filteredAssets.value.filter((asset) => getCatalogLane(asset) === lane),
  }))
  .filter((section) => section.assets.length > 0)
})

const metrics = computed(() => ({
 total: filteredAssets.value.length,
 previewable: filteredAssets.value.filter((asset) => asset.preview.demoRoute).length,
 aligned: filteredAssets.value.filter(
  (asset) => asset.implementation.realComponentRefs || asset.implementation.strategy === 'asset-composed'
 ).length,
 pending: filteredAssets.value.filter(
  (asset) =>
   asset.implementation.fallbackHtmlBlocks.length ||
   asset.composition.missingCapabilities.length ||
   !asset.implementation.realComponentRefs
 ).length,
}))
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <section class="wb-top-grid">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">筛选资产</div>
       <p class="wb-card-heading-note">先缩小范围，再看效果和落地难度。</p>
      </div>
     </template>

     <CardBoxBody class="wb-filter-stack">
      <div class="wb-toolbar-group">
       <div class="wb-field-label">资产类型</div>
       <div class="wb-segmented">
        <button
         v-for="item in typeFilters"
         :key="item.id"
         class="wb-segmented-button"
         :data-active="activeType === item.id"
         type="button"
         @click="activeType = item.id"
        >
         {{ item.label }}
        </button>
       </div>
      </div>

      <div class="wb-toolbar-group">
       <div class="wb-field-label">查看方式</div>
       <div class="wb-segmented">
        <button
         v-for="item in readinessFilters"
         :key="item.id"
         class="wb-segmented-button"
         :data-active="activeReadiness === item.id"
         type="button"
         @click="activeReadiness = item.id"
        >
         {{ item.label }}
        </button>
       </div>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">筛选结果</div>
       <p class="wb-card-heading-note">把目录直接拆成三条处理线，避免列表一眼看不出优先级。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article class="wb-metric-item">
        <div class="wb-metric-label">当前资产</div>
        <div class="wb-metric-value">{{ metrics.total }}</div>
        <p class="wb-card-note">筛选后仍在视野内的资产数量</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">可直接预览</div>
        <div class="wb-metric-value">{{ metrics.previewable }}</div>
        <p class="wb-card-note">已经能直接打开运行效果</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">真实基线</div>
        <div class="wb-metric-value">{{ metrics.aligned }}</div>
        <p class="wb-card-note">已经接到真实组件链路</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">继续沉淀</div>
        <div class="wb-metric-value">{{ metrics.pending }}</div>
        <p class="wb-card-note">还要补边界或继续抽离</p>
       </article>
      </div>
     </CardBoxBody>
    </CardBox>
   </section>

   <CardBox v-for="section in catalogSections" :key="section.id" class="wb-surface-card">
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
         <dt>下一步</dt>
         <dd>{{ getAssetNextGate(asset) }}</dd>
        </div>
        <div>
         <dt>来源项目</dt>
         <dd>{{ asset.sourceTrace.sourceProject || '待补充' }}</dd>
        </div>
       </dl>

       <ul v-if="getAssetReviewSummary(asset).length" class="wb-inline-list">
        <li v-for="item in getAssetReviewSummary(asset).slice(0, 2)" :key="item">{{ item }}</li>
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

   <CardBox v-if="!catalogSections.length" class="wb-surface-card">
    <CardBoxBody>
     <el-empty description="当前筛选条件下没有资产" />
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
