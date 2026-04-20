<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
 status: string
}>()

const tone = computed(() => {
 switch (props.status) {
  case 'official':
  case 'synced':
   return 'success'
  case 'raw-candidate':
  case 'candidate':
  case 'cleaned-candidate':
   return 'warning'
  case 'integration-approved':
   return 'info'
  default:
   return 'neutral'
 }
})

const label = computed(() => props.status.replace(/-/g, ' '))
</script>

<template>
 <span class="wb-status-badge" :data-tone="tone">{{ label }}</span>
</template>
