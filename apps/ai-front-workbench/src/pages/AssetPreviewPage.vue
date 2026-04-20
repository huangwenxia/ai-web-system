<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import WorkbenchAssetShowcase from '../components/WorkbenchAssetShowcase.vue'
import WorkbenchStatusBadge from '../components/WorkbenchStatusBadge.vue'
import {
 formatCompositionLink,
 getAssetByRoute,
 getAssetCompositionSummary,
 getAssetImplementationLabel,
 getAssetNextGate,
 getAssetQueueReasons,
 getAssetReviewSummary,
 getAssetSummary,
 getAssetTypeLabel,
} from '../registry'

const route = useRoute()
const asset = computed(() => getAssetByRoute(String(route.params.type), String(route.params.name)))

const compositionSummary = computed(() => (asset.value ? getAssetCompositionSummary(asset.value) : []))
const queueReasons = computed(() => (asset.value ? getAssetQueueReasons(asset.value) : []))
const reviewSummary = computed(() => (asset.value ? getAssetReviewSummary(asset.value) : []))

const runtimeFacts = computed(() => {
 if (!asset.value) {
  return []
 }

 return [
  {
   label: 'Tailwind Sources',
   values: asset.value.runtimeProfile.tailwindSources,
  },
  {
   label: 'Public Roots',
   values: asset.value.runtimeProfile.publicRoots,
  },
  {
   label: 'Shared Packages',
   values: asset.value.runtimeProfile.sharedPackages,
  },
 ]
})

const sourceFacts = computed(() => {
 if (!asset.value) {
  return []
 }

 return [
  { label: '来源项目', value: asset.value.sourceTrace.sourceProject || '待补充' },
  { label: '来源路径', value: asset.value.sourceTrace.sourcePath || '待补充' },
  { label: '来源类型', value: asset.value.sourceTrace.sourceKind || '待补充' },
  { label: '上下文类型', value: asset.value.sourceTrace.contextType || '待补充' },
  { label: '可移植级别', value: asset.value.sourceTrace.portabilityLevel || '待补充' },
  { label: '抽取来源页面', value: asset.value.sourceTrace.extractedFromPage || '无' },
 ]
})

const integrationPreview = computed(() => {
 if (!asset.value?.preview.integrationRoute) {
  return '尚未接入'
 }

 return `${asset.value.preview.integrationHost || ''}${asset.value.preview.integrationRoute}`
})
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div v-if="asset" class="wb-page-shell">
   <section class="wb-top-grid wb-top-grid--detail">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">{{ asset.name }}</div>
       <p class="wb-card-heading-note">{{ getAssetSummary(asset) }}</p>
      </div>
     </template>

     <template #headerRight>
      <div class="wb-card-row">
       <WorkbenchStatusBadge :status="asset.status" />
       <span class="wb-chip">{{ getAssetTypeLabel(asset.type) }}</span>
       <span class="wb-chip wb-chip--soft">{{ getAssetImplementationLabel(asset) }}</span>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-asset-preview wb-asset-preview--detail">
       <WorkbenchAssetShowcase :asset-id="asset.id" mode="stage" />
      </div>

      <div class="wb-asset-actions">
       <router-link v-if="asset.preview.demoRoute" class="wb-action-link" :to="asset.preview.demoRoute">
        打开独立预览
       </router-link>
       <router-link class="wb-action-link" to="/workbench/review-queue">查看处理队列</router-link>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">落地判断</div>
       <p class="wb-card-heading-note">先确认下一步做什么，再进入具体实现。</p>
      </div>
     </template>

     <CardBoxBody>
      <div class="wb-metric-grid">
       <article class="wb-metric-item">
        <div class="wb-metric-label">下一步</div>
        <div class="wb-metric-value wb-metric-value--small">{{ getAssetNextGate(asset) }}</div>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">真实对齐</div>
        <div class="wb-metric-value">{{ asset.implementation.realComponentRefs ? '是' : '否' }}</div>
        <p class="wb-card-note">是否已经接入真实组件依赖</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">装配资产</div>
        <div class="wb-metric-value">{{ asset.composition.composedOf.length }}</div>
        <p class="wb-card-note">当前页面或组件依赖的资产数</p>
       </article>
       <article class="wb-metric-item">
        <div class="wb-metric-label">原生 fallback</div>
        <div class="wb-metric-value">{{ asset.implementation.fallbackHtmlBlocks.length }}</div>
        <p class="wb-card-note">仍需继续抽离的原生区块</p>
       </article>
      </div>

      <dl class="wb-metadata">
       <div>
        <dt>版本</dt>
        <dd>{{ asset.version }}</dd>
       </div>
       <div>
        <dt>来源任务</dt>
        <dd>{{ asset.sourceTask || '待补充' }}</dd>
       </div>
       <div>
        <dt>集成预览</dt>
        <dd>{{ integrationPreview }}</dd>
       </div>
       <div>
        <dt>依赖</dt>
        <dd>{{ asset.compatibility.dependencies.join(', ') || '无' }}</dd>
       </div>
      </dl>

      <ul class="wb-inline-list">
       <li v-for="item in queueReasons" :key="item">{{ item }}</li>
      </ul>
     </CardBoxBody>
    </CardBox>
   </section>

   <section class="wb-card-grid wb-card-grid--two">
    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">Runtime Profile</div>
       <p class="wb-card-heading-note">明确这份资产运行时依赖哪一套 Tailwind、public 和共享包。</p>
      </div>
     </template>

     <CardBoxBody>
      <dl class="wb-metadata">
       <div>
        <dt>Source Project</dt>
        <dd>{{ asset.runtimeProfile.sourceProject || '待补充' }}</dd>
       </div>
       <div>
        <dt>Base Scss</dt>
        <dd>{{ asset.runtimeProfile.baseScss || '无' }}</dd>
       </div>
       <div>
        <dt>Iconfont</dt>
        <dd>{{ asset.runtimeProfile.iconfont || '无' }}</dd>
       </div>
       <div>
        <dt>Sync Target</dt>
        <dd>{{ asset.sync.targetPath || '待补充' }}</dd>
       </div>
      </dl>

      <div v-for="item in runtimeFacts" :key="item.label" class="wb-runtime-group">
       <div class="wb-field-label">{{ item.label }}</div>
       <div class="wb-chip-row">
        <span v-if="item.values.length === 0" class="wb-chip wb-chip--soft">无</span>
        <span v-for="value in item.values" :key="value" class="wb-chip wb-chip--soft">{{ value }}</span>
       </div>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">来源与同步</div>
       <p class="wb-card-heading-note">确认它从哪里来、清理了哪些耦合、后续能否同步回真实项目。</p>
      </div>
     </template>

     <CardBoxBody>
      <dl class="wb-metadata">
       <div v-for="item in sourceFacts" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
       </div>
      </dl>

      <ul class="wb-inline-list">
       <li>适配器: {{ asset.sourceTrace.adapterRequired.join(', ') || '无' }}</li>
       <li>已移除耦合: {{ asset.sourceTrace.removedCouplings.join(', ') || '无' }}</li>
       <li>Mock 需求: {{ asset.sourceTrace.mockRequired ? '需要' : '不需要' }}</li>
       <li>允许同步: {{ asset.sync.allowed ? '是' : '否' }}</li>
       <li>最后同步时间: {{ asset.sync.lastSyncedAt || '尚未同步' }}</li>
      </ul>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">装配结构</div>
       <p class="wb-card-heading-note">看它由哪些资产构成，还缺哪些能力，不再只盯着一个静态结果。</p>
      </div>
     </template>

     <CardBoxBody>
      <h3 class="wb-subsection-title">装配摘要</h3>
      <ul v-if="compositionSummary.length" class="wb-inline-list">
       <li v-for="item in compositionSummary" :key="item">{{ item }}</li>
      </ul>
      <p v-else class="wb-card-note">当前还没有结构化装配说明。</p>

      <h3 class="wb-subsection-title">装配清单</h3>
      <ul v-if="asset.composition.composedOf.length" class="wb-inline-list">
       <li v-for="item in asset.composition.composedOf" :key="`${item.assetId}-${item.role}`">
        {{ formatCompositionLink(item) }}
       </li>
      </ul>
      <p v-else class="wb-card-note">当前没有声明装配资产。</p>

      <h3 class="wb-subsection-title">缺失能力</h3>
      <div class="wb-chip-row">
       <span v-if="asset.composition.missingCapabilities.length === 0" class="wb-chip wb-chip--soft">无</span>
       <span v-for="item in asset.composition.missingCapabilities" :key="item" class="wb-chip wb-chip--soft">
        {{ item }}
       </span>
      </div>

      <h3 class="wb-subsection-title">原生 fallback</h3>
      <div class="wb-chip-row">
       <span v-if="asset.implementation.fallbackHtmlBlocks.length === 0" class="wb-chip wb-chip--soft">无</span>
       <span v-for="item in asset.implementation.fallbackHtmlBlocks" :key="item" class="wb-chip wb-chip--soft">
        {{ item }}
       </span>
      </div>
     </CardBoxBody>
    </CardBox>

    <CardBox class="wb-surface-card">
     <template #title>
      <div class="wb-card-heading">
       <div class="wb-card-heading-title">评审摘要</div>
       <p class="wb-card-heading-note">把评审、完整度和目标项目信息放在一处看清楚。</p>
      </div>
     </template>

     <CardBoxBody>
      <ul v-if="reviewSummary.length" class="wb-inline-list">
       <li v-for="item in reviewSummary" :key="item">{{ item }}</li>
      </ul>
      <p v-else class="wb-card-note">当前还没有结构化评审结论。</p>

      <dl class="wb-metadata">
       <div>
        <dt>目标项目</dt>
        <dd>{{ asset.sync.targetProject || '待补充' }}</dd>
       </div>
       <div>
        <dt>目标路径</dt>
        <dd>{{ asset.sync.targetPath || '待补充' }}</dd>
       </div>
       <div>
        <dt>复用说明</dt>
        <dd>{{ asset.review.notes || '待补充' }}</dd>
       </div>
       <div>
        <dt>来源创建</dt>
        <dd>{{ asset.sourceCreatedFrom || '待补充' }}</dd>
       </div>
      </dl>
     </CardBoxBody>
    </CardBox>
   </section>
  </div>

  <div v-else class="wb-page-shell">
   <CardBox class="wb-surface-card">
    <CardBoxBody>
     <el-empty description="当前路由没有匹配到 registry 中的资产" />
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
