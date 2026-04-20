<script setup lang="ts">
import { Menu } from '@element-plus/icons-vue'
import AsideBar from '@common/layout/components/AsideBar.vue'
import HeaderBox from '@common/components/HeaderBox/src/HeaderBox.vue'
import MainBox from '@common/components/MainBox/src/MainBox.vue'
import UserAvatar from '@common/components/UserAvatar/src/UserAvatar.vue'
import { useStateHook } from '@common/layout/hooks/useState'
import { provideSetting } from '@common/layout/hooks/useSetting'
import { replaceName, tname } from '@repo/utils'
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import { workbenchMenuRoutes, workbenchQuickLinks } from '../layout/workbench-menu'

const route = useRoute()

watchEffect(() =>
 provideSetting({
  layout: 'classic',
  title: 'AI Front Workbench',
  logo: '',
  routes: workbenchMenuRoutes,
  pageType: 'card',
  themeColor: {
   colorPrimary: 'rgb(37, 99, 235)',
   asideBg: '#ffffff',
   asideColor: '#475569',
   headerBg: '#ffffff',
   headerColor: '#0f172a',
  },
 })
)

const { currentEndRoute, isMobile, sideOpen } = useStateHook()

const currentTitle = computed(() => {
 const translatedTitle = replaceName(tname(currentEndRoute.value?.meta?.translations || {}, 'name'))
 return String(route.meta.title || translatedTitle || 'AI Front Workbench')
})

const currentDescription = computed(() => {
 const translatedDescription = tname(currentEndRoute.value?.meta?.translations || {}, 'description')
 return String(
  route.meta.description ||
   translatedDescription ||
   '把已经确认过的结构落到真实 project-mamba 组件、依赖和运行时基线上。'
 )
})

const currentBadge = computed(() => String(route.meta.badge || 'Workbench'))
const showBack = computed(() => Boolean(route.meta.parentPath))

function toggleSidebar() {
 sideOpen.value = !sideOpen.value
}
</script>

<template>
 <div class="wb-shell">
  <AsideBar>
   <template #sidebar-foot>
    <div class="wb-shell-aside-foot">
     <div class="wb-shell-aside-card">
      <UserAvatar :size="40" />
      <div class="wb-shell-aside-copy">
       <div class="wb-shell-aside-title">AI Front Workbench</div>
       <p class="wb-shell-aside-note">project-mamba 组件基线</p>
      </div>
     </div>
    </div>
   </template>
  </AsideBar>

  <div class="wb-shell-main">
   <div class="wb-shell-header">
    <HeaderBox :hide-back="!showBack" :title="currentTitle">
     <template #titleRight>
      <span class="wb-shell-badge">{{ currentBadge }}</span>
     </template>

     <template #headerRight>
      <div class="wb-shell-header-actions">
       <button v-if="isMobile" class="wb-shell-menu-button" type="button" @click="toggleSidebar">
        <el-icon><Menu /></el-icon>
       </button>
       <router-link v-for="item in workbenchQuickLinks" :key="item.to" class="wb-chip wb-chip--soft" :to="item.to">
        {{ item.label }}
       </router-link>
      </div>
     </template>

     <div class="wb-shell-header-copy">
      <p class="wb-card-note">{{ currentDescription }}</p>
     </div>
    </HeaderBox>
   </div>

   <MainBox class="wb-shell-content">
    <router-view />
   </MainBox>
  </div>

  <div
   v-if="isMobile"
   class="wb-shell-overlay"
   :data-open="sideOpen ? 'true' : 'false'"
   @click="toggleSidebar"
  ></div>
 </div>
</template>
