<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { operationLogApi, type OperationLog } from '../../api/operlog'
import AppPagination from '../../components/AppPagination.vue'

const { t } = useI18n()
const loading = ref(false)
const rows = ref<OperationLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const operatorId = ref('')
const module = ref('')
const action = ref('')
const success = ref<number | undefined>()
const keyword = ref('')
const today = new Date()
const datePrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const start = ref(`${datePrefix} 00:00:00`)
const end = ref(`${datePrefix} 23:59:59`)
const expandedRowKeys = ref<string[]>([])

const moduleOptions = ['sys-user', 'menu', 'dict', 'lang', 'i18n', 'login-config', 'login-log', 'unknown']
const actionOptions = ['list', 'query', 'create', 'update', 'delete', 'unlock', 'reset-password', 'batch-freeze', 'batch-unfreeze', 'set-status', 'set-default', 'sort', 'unknown']
const columns = computed(() => [
  { title: t('operationLog.time'), dataIndex: 'created_at', key: 'time', width: 175 },
  { title: t('operationLog.operator'), dataIndex: 'operator_name', key: 'operator', width: 120 },
  { title: t('operationLog.module'), dataIndex: 'module', key: 'module', width: 130 },
  { title: t('operationLog.action'), dataIndex: 'action', key: 'action', width: 130 },
  { title: t('operationLog.targetId'), dataIndex: 'target_id', key: 'target', width: 130 },
  { title: t('operationLog.result'), key: 'result', width: 90 },
  { title: t('operationLog.cost'), dataIndex: 'cost_ms', key: 'cost', width: 90 },
  { title: t('operationLog.ip'), dataIndex: 'ip', key: 'ip', width: 140 },
])

function label(key: string, value: string) {
  const translated = t(`operationLog.${key}.${value}`)
  return translated === `operationLog.${key}.${value}` ? value : translated
}
function detailObject(value: OperationLog['detail']) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) as Record<string, unknown> } catch { return { raw: value } }
}
function displayValue(value: unknown) {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}
function detailText(log: OperationLog) { return JSON.stringify(detailObject(log.detail), null, 2) }
function diffRows(log: OperationLog) {
  const diff = detailObject(log.detail).diff
  return diff && typeof diff === 'object' ? Object.entries(diff as Record<string, { old?: unknown; new?: unknown }>) : []
}
function query() {
  page.value = 1
  load()
}
async function load() {
  if (start.value > end.value) { message.warning(t('operationLog.timeOrderInvalid')); return }
  loading.value = true
  try {
    const data = await operationLogApi.list({ page: page.value, page_size: pageSize.value, operator_id: operatorId.value.trim() || undefined, module: module.value || undefined, action: action.value || undefined, success: success.value, start: start.value || undefined, end: end.value || undefined, keyword: keyword.value.trim() || undefined })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
    expandedRowKeys.value = []
  } finally { loading.value = false }
}
function changePagination(nextPage: number, nextPageSize: number) { page.value = nextPage; pageSize.value = nextPageSize; load() }
onMounted(load)
</script>

<template>
  <section class="page-content operation-log-page">
    <div class="user-toolbar">
      <a-space wrap class="operation-log-filters">
        <a-input v-model:value="operatorId" allow-clear class="operation-log-operator" :placeholder="t('operationLog.operatorId')" @press-enter="query" />
        <a-select v-model:value="module" allow-clear class="operation-log-select" :placeholder="t('operationLog.module')"><a-select-option v-for="item in moduleOptions" :key="item" :value="item">{{ label('modules', item) }}</a-select-option></a-select>
        <a-select v-model:value="action" allow-clear class="operation-log-select" :placeholder="t('operationLog.action')"><a-select-option v-for="item in actionOptions" :key="item" :value="item">{{ label('actions', item) }}</a-select-option></a-select>
        <a-select v-model:value="success" allow-clear class="operation-log-result" :placeholder="t('operationLog.result')"><a-select-option :value="1">{{ t('operationLog.success') }}</a-select-option><a-select-option :value="0">{{ t('operationLog.failed') }}</a-select-option></a-select>
        <a-input v-model:value="keyword" allow-clear class="operation-log-keyword" :placeholder="t('operationLog.keyword')" @press-enter="query" />
        <a-date-picker v-model:value="start" :allow-clear="false" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" show-time class="operation-log-time" :placeholder="t('operationLog.start')" />
        <a-date-picker v-model:value="end" :allow-clear="false" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" show-time class="operation-log-time" :placeholder="t('operationLog.end')" />
        <a-button type="primary" @click="query">{{ t('common.search') }}</a-button><a-button :loading="loading" @click="load">{{ t('common.refresh') }}</a-button>
      </a-space>
    </div>
    <a-table :columns="columns" :data-source="rows" :loading="loading" :pagination="false" :scroll="{ x: 1100 }" row-key="id" :expanded-row-keys="expandedRowKeys" @expand="(expanded: boolean, record: OperationLog) => { expandedRowKeys = expanded ? [record.id] : [] }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'module'">{{ label('modules', record.module) }}</template>
        <template v-else-if="column.key === 'action'">{{ label('actions', record.action) }}</template>
        <template v-else-if="column.key === 'result'"><a-tag :color="record.success ? 'success' : 'error'">{{ record.success ? t('operationLog.success') : t('operationLog.failed') }}</a-tag></template>
        <template v-else-if="column.key === 'cost'">{{ record.cost_ms }} ms</template>
      </template>
      <template #expandedRowRender="{ record }">
        <div class="operation-log-detail">
          <div class="operation-log-meta"><span>{{ t('operationLog.method') }}: {{ record.method }}</span><span>{{ t('operationLog.path') }}: {{ record.path || record.route }}</span><span>{{ t('operationLog.bizStatus') }}: {{ record.biz_status }}</span><span>{{ t('operationLog.userAgent') }}: {{ record.ua || '-' }}</span></div>
          <table v-if="diffRows(record).length" class="operation-log-diff"><thead><tr><th>{{ t('operationLog.field') }}</th><th>{{ t('operationLog.oldValue') }}</th><th>{{ t('operationLog.newValue') }}</th></tr></thead><tbody><tr v-for="item in diffRows(record)" :key="item[0]"><td>{{ item[0] }}</td><td>{{ displayValue(item[1]?.old) }}</td><td>{{ displayValue(item[1]?.new) }}</td></tr></tbody></table>
          <pre v-else>{{ detailText(record) }}</pre>
        </div>
      </template>
    </a-table>
    <AppPagination :current="page" :page-size="pageSize" :total="total" @change="changePagination" />
  </section>
</template>
