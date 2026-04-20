<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { defineAsyncComponent } from 'vue'

const WanmoreListTabBoxPreview = defineAsyncComponent(() => import('../previews/WanmoreListTabBoxPreview.vue'))
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <CardBox class="wb-surface-card">
    <template #title>
     <div class="wb-card-heading">
      <div class="wb-card-heading-title">Wanmore ListTabBox 独立预览</div>
      <p class="wb-card-heading-note">真实抽取组件直接跑在 project-mamba 的 Tailwind、公共样式和依赖基线上。</p>
     </div>
    </template>

    <CardBoxBody>
     <div class="wb-preview-frame">
      <WanmoreListTabBoxPreview />
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
