<script setup lang="ts">
import CardBox from '@common/components/CardBox/src/CardBox.vue'
import CardBoxBody from '@common/components/CardBox/src/CardBoxBody.vue'
import ScrollBox from '@common/components/ScrollBox/src/ScrollBox.vue'
import { defineAsyncComponent } from 'vue'

const ExampleOverviewPage = defineAsyncComponent(() => import('../../../../assets/pages/drafts/example-overview-page.vue'))
</script>

<template>
 <ScrollBox class="wb-page-scroll">
  <div class="wb-page-shell">
   <CardBox class="wb-surface-card">
    <template #title>
     <div class="wb-card-heading">
      <div class="wb-card-heading-title">Overview Draft 独立预览</div>
      <p class="wb-card-heading-note">验证页面草稿是否已经进入组件装配层，而不是继续平铺原生结构。</p>
     </div>
    </template>

    <CardBoxBody>
     <div class="wb-preview-frame">
      <ExampleOverviewPage />
     </div>
    </CardBoxBody>
   </CardBox>
  </div>
 </ScrollBox>
</template>
