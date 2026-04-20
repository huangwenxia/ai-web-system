<template>
  <div class="list-tab-box">
    <div class="controls">
      <el-radio-group v-model="showType" size="small">
        <el-radio-button value="card">
          <el-icon><Menu /></el-icon>
        </el-radio-button>
        <el-radio-button value="table"><i class="wicon wicon-shujujiguanli"></i></el-radio-button>
      </el-radio-group>
    </div>
    <slot v-if="showType == 'card'" name="card"></slot>
    <slot v-if="showType == 'table'" name="table"></slot>
  </div>
</template>

<script lang="ts" setup>
import { Menu } from "@element-plus/icons-vue"
const showType = ref("card")
</script>

<style lang="scss" scoped>
.list-tab-box {
  .controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
  }
}
</style>
