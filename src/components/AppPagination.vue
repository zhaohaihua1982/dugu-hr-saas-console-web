<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ current: number; pageSize: number; total: number }>()
const emit = defineEmits<{ change: [page: number, pageSize: number] }>()
const { t } = useI18n()
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function changePage(page: number) {
  emit('change', Math.min(Math.max(1, page), pageCount.value), props.pageSize)
}

function changePageSize(value: number) {
  emit('change', 1, value)
}
</script>

<template>
  <div class="app-pagination">
    <span class="pagination-total">{{ t('common.totalData', { total }) }}</span>
    <div class="pagination-actions">
      <a-button size="small" :disabled="current <= 1" @click="changePage(1)">{{ t('common.firstPage') }}</a-button>
      <a-pagination :current="current" :page-size="pageSize" :total="total" :show-size-changer="false" :show-less-items="true" size="small" @change="changePage"/>
      <a-button size="small" :disabled="current >= pageCount" @click="changePage(pageCount)">{{ t('common.lastPage') }}</a-button>
      <a-select :value="pageSize" size="small" class="pagination-size" @change="changePageSize">
        <a-select-option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ t('common.perPage', { size }) }}</a-select-option>
      </a-select>
    </div>
  </div>
</template>
