<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ChevronLeft, ChevronRight, RefreshCw, Save, Search, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { ApiError } from '../../utils/http'
import {
  i18nApi,
  type I18nDeleteItem,
  type I18nMeta,
  type I18nPendingItem,
  type I18nResourceType,
  type I18nTexts,
} from '../../api/i18n'

interface TranslationRow {
  key: string
  field: string
  lang: string
  source: string
  content: string
}

const { t } = useI18n()
const activeView = ref('resource')
const resourceType = ref<I18nResourceType>('menu')
const resourceId = ref('')
const meta = ref<I18nMeta | null>(null)
const detail = ref<I18nTexts | null>(null)
const loadingMeta = ref(false)
const loadingDetail = ref(false)
const savingKey = ref('')
const deletingKey = ref('')
const batchDeleting = ref(false)
const apiUnavailable = ref(false)
const selectedRowKeys = ref<string[]>([])
const drafts = reactive<Record<string, string>>({})

const pendingLang = ref('')
const pendingItems = ref<I18nPendingItem[]>([])
const pendingDrafts = reactive<Record<string, string>>({})
const pendingLoading = ref(false)
const pendingSavingKey = ref('')
const cursorHistory = ref<string[]>(['0'])
const pendingLimit = ref(20)
const nextAfterId = ref('')
const serverHasMore = ref<boolean | null>(null)

const resourceOptions = computed(() => [
  { value: 'menu' as const, label: t('i18nData.resourceMenu') },
  { value: 'dict_item' as const, label: t('i18nData.resourceDictItem') },
])
const availableLangs = computed(() => (meta.value?.langs || []).filter(lang => lang !== meta.value?.defaultLang))
const translationRows = computed<TranslationRow[]>(() => {
  if (!detail.value) return []
  return Object.keys(detail.value.defaultValue).flatMap(field => availableLangs.value.map(lang => {
    const key = `${field}:${lang}`
    return {
      key,
      field,
      lang,
      source: detail.value?.defaultValue[field] || '',
      content: detail.value?.texts[field]?.[lang] || '',
    }
  }))
})
const canBatchDelete = computed(() => selectedRowKeys.value.length > 0 && !apiUnavailable.value)
const currentCursor = computed(() => cursorHistory.value[cursorHistory.value.length - 1] || '0')
const hasPrevious = computed(() => cursorHistory.value.length > 1)
const hasNext = computed(() => serverHasMore.value ?? pendingItems.value.length >= pendingLimit.value)

function languageLabel(lang: string) {
  const key = `i18nData.languages.${lang}`
  const label = t(key)
  return label === key ? lang : label
}

function pendingRowKey(record: I18nPendingItem) {
  return `${record.resId}:${record.field}`
}

function resetDetail() {
  detail.value = null
  selectedRowKeys.value = []
  Object.keys(drafts).forEach(key => delete drafts[key])
}

function resetPending() {
  pendingItems.value = []
  cursorHistory.value = ['0']
  nextAfterId.value = ''
  serverHasMore.value = null
  Object.keys(pendingDrafts).forEach(key => delete pendingDrafts[key])
}

async function loadMeta() {
  loadingMeta.value = true
  resetDetail()
  resetPending()
  try {
    meta.value = await i18nApi.meta(resourceType.value, true)
    apiUnavailable.value = false
    const langs = availableLangs.value
    if (!langs.includes(pendingLang.value)) pendingLang.value = langs[0] || ''
  } catch (error) {
    meta.value = null
    apiUnavailable.value = error instanceof ApiError && error.status === 404
    if (!apiUnavailable.value && error instanceof Error) message.error(error.message)
  } finally {
    loadingMeta.value = false
  }
}

async function queryDetail() {
  const id = resourceId.value.trim()
  if (!/^\d+$/.test(id) || id === '0') {
    message.warning(t('i18nData.resourceIdRequired'))
    return
  }
  loadingDetail.value = true
  try {
    const data = await i18nApi.texts(resourceType.value, id)
    detail.value = data
    selectedRowKeys.value = []
    Object.keys(drafts).forEach(key => delete drafts[key])
    translationRows.value.forEach(row => { drafts[row.key] = row.content })
  } finally {
    loadingDetail.value = false
  }
}

async function saveTranslation(row: TranslationRow) {
  const content = (drafts[row.key] || '').trim()
  if (!content) {
    message.warning(t('i18nData.translationRequired'))
    return
  }
  savingKey.value = row.key
  try {
    await i18nApi.save({
      resType: resourceType.value,
      resId: resourceId.value.trim(),
      texts: { [row.field]: { [row.lang]: content } },
    })
    message.success(t('i18nData.saveSuccess'))
    await queryDetail()
  } finally {
    savingKey.value = ''
  }
}

function deleteItem(row: TranslationRow): I18nDeleteItem {
  return { resType: resourceType.value, resId: resourceId.value.trim(), field: row.field, lang: row.lang }
}

async function deleteTranslation(row: TranslationRow) {
  deletingKey.value = row.key
  try {
    await i18nApi.remove(deleteItem(row))
    message.success(t('i18nData.deleteSuccess'))
    await queryDetail()
  } finally {
    deletingKey.value = ''
  }
}

async function batchDelete() {
  const rows = translationRows.value.filter(row => selectedRowKeys.value.includes(row.key) && row.content)
  if (!rows.length) return
  batchDeleting.value = true
  try {
    const result = await i18nApi.batchDelete(rows.map(deleteItem))
    message.success(t('i18nData.batchDeleteSuccess', { count: result.deleted }))
    await queryDetail()
  } finally {
    batchDeleting.value = false
  }
}

function onSelectionChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys.map(String)
}

async function loadPending(reset = false) {
  if (!pendingLang.value) return
  if (reset) cursorHistory.value = ['0']
  pendingLoading.value = true
  try {
    const data = await i18nApi.pending(resourceType.value, pendingLang.value, currentCursor.value, pendingLimit.value)
    pendingItems.value = data.items || []
    nextAfterId.value = data.nextAfterId || pendingItems.value[pendingItems.value.length - 1]?.resId || ''
    serverHasMore.value = typeof data.hasMore === 'boolean' ? data.hasMore : null
    Object.keys(pendingDrafts).forEach(key => delete pendingDrafts[key])
    pendingItems.value.forEach(item => { pendingDrafts[`${item.resId}:${item.field}`] = item.content || '' })
  } finally {
    pendingLoading.value = false
  }
}

async function nextPendingPage() {
  if (!nextAfterId.value) return
  cursorHistory.value.push(nextAfterId.value)
  await loadPending()
}

async function previousPendingPage() {
  if (!hasPrevious.value) return
  cursorHistory.value.pop()
  await loadPending()
}

async function savePending(item: I18nPendingItem) {
  const key = `${item.resId}:${item.field}`
  const content = (pendingDrafts[key] || '').trim()
  if (!content) {
    message.warning(t('i18nData.translationRequired'))
    return
  }
  pendingSavingKey.value = key
  try {
    await i18nApi.save({
      resType: resourceType.value,
      resId: item.resId,
      texts: { [item.field]: { [pendingLang.value]: content } },
    })
    message.success(t('i18nData.saveSuccess'))
    await loadPending()
  } finally {
    pendingSavingKey.value = ''
  }
}

watch(resourceType, loadMeta)
watch(pendingLang, resetPending)
onMounted(loadMeta)
</script>

<template>
  <section class="page-content i18n-page">
    <a-alert
      v-if="apiUnavailable"
      type="warning"
      show-icon
      class="i18n-api-alert"
      :message="t('i18nData.apiPendingTitle')"
      :description="t('i18nData.apiPendingDescription')"
    />

    <a-tabs v-model:activeKey="activeView">
      <a-tab-pane key="resource" :tab="t('i18nData.resourceTranslations')">
        <div class="i18n-filter-bar">
          <a-space wrap>
            <a-select v-model:value="resourceType" class="i18n-resource-select" :loading="loadingMeta">
              <a-select-option v-for="item in resourceOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
            </a-select>
            <a-input v-model:value="resourceId" class="i18n-id-input" allow-clear :placeholder="t('i18nData.resourceId')" @press-enter="queryDetail"/>
            <a-button type="primary" :loading="loadingDetail" :disabled="apiUnavailable || !meta" @click="queryDetail">
              <template #icon><Search :size="15"/></template>{{ t('common.search') }}
            </a-button>
            <a-button :loading="loadingDetail" :disabled="apiUnavailable || !detail" @click="queryDetail">
              <template #icon><RefreshCw :size="15"/></template>{{ t('common.refresh') }}
            </a-button>
          </a-space>
        </div>

        <template v-if="detail">
          <div class="i18n-resource-summary">
            <div><span>{{ t('i18nData.resourceType') }}</span><strong>{{ detail.label }}</strong></div>
            <div><span>{{ t('i18nData.resourceId') }}</span><strong>{{ detail.resId }}</strong></div>
            <div><span>{{ t('i18nData.defaultLanguage') }}</span><strong>{{ languageLabel(detail.defaultLang) }}</strong></div>
          </div>

          <div class="i18n-table-toolbar">
            <span>{{ t('i18nData.translationHint') }}</span>
            <a-popconfirm :title="t('i18nData.batchDeleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="batchDelete">
              <a-button danger :loading="batchDeleting" :disabled="!canBatchDelete">
                <template #icon><Trash2 :size="15"/></template>{{ t('i18nData.batchDelete') }}
              </a-button>
            </a-popconfirm>
          </div>

          <a-table
            :data-source="translationRows"
            :loading="loadingDetail"
            :pagination="false"
            :scroll="{ x: 900 }"
            :row-selection="{ selectedRowKeys, onChange: onSelectionChange, getCheckboxProps: (row: TranslationRow) => ({ disabled: !row.content }) }"
            row-key="key"
            size="middle"
          >
            <a-table-column key="field" :title="t('i18nData.field')" data-index="field" :width="130"/>
            <a-table-column key="source" :title="t('i18nData.source')" data-index="source" :width="220"/>
            <a-table-column key="lang" :title="t('i18nData.targetLanguage')" :width="150">
              <template #default="{ text }">{{ languageLabel(text) }}</template>
            </a-table-column>
            <a-table-column key="translation" :title="t('i18nData.translation')" :width="300">
              <template #default="{ record }">
                <a-input v-model:value="drafts[record.key]" :maxlength="meta?.fields[record.field] || 512" :placeholder="t('i18nData.translationPlaceholder')"/>
              </template>
            </a-table-column>
            <a-table-column key="operations" :title="t('common.operation')" fixed="right" :width="190">
              <template #default="{ record }">
                <a-space :size="2">
                  <a-button type="link" size="small" :loading="savingKey === record.key" :disabled="apiUnavailable" @click="saveTranslation(record)">
                    <template #icon><Save :size="14"/></template>{{ t('common.save') }}
                  </a-button>
                  <a-popconfirm :title="t('i18nData.deleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="deleteTranslation(record)">
                    <a-button type="link" danger size="small" :loading="deletingKey === record.key" :disabled="apiUnavailable || !record.content">
                      <template #icon><Trash2 :size="14"/></template>{{ t('common.delete') }}
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </template>
        <a-empty v-else class="i18n-empty" :description="t(apiUnavailable ? 'i18nData.apiPendingTitle' : 'i18nData.queryHint')"/>
      </a-tab-pane>

      <a-tab-pane key="pending" :tab="t('i18nData.missingTranslations')">
        <div class="i18n-filter-bar">
          <a-space wrap>
            <a-select v-model:value="resourceType" class="i18n-resource-select" :loading="loadingMeta">
              <a-select-option v-for="item in resourceOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
            </a-select>
            <a-select v-model:value="pendingLang" class="i18n-lang-select" :placeholder="t('i18nData.targetLanguage')" :disabled="apiUnavailable || !meta">
              <a-select-option v-for="lang in availableLangs" :key="lang" :value="lang">{{ languageLabel(lang) }}</a-select-option>
            </a-select>
            <a-button type="primary" :loading="pendingLoading" :disabled="apiUnavailable || !pendingLang" @click="loadPending(true)">
              <template #icon><Search :size="15"/></template>{{ t('common.search') }}
            </a-button>
            <a-button :loading="pendingLoading" :disabled="apiUnavailable || !pendingLang" @click="loadPending()">
              <template #icon><RefreshCw :size="15"/></template>{{ t('common.refresh') }}
            </a-button>
          </a-space>
        </div>

        <a-table :data-source="pendingItems" :loading="pendingLoading" :pagination="false" :scroll="{ x: 980 }" :row-key="pendingRowKey" size="middle">
          <a-table-column key="resId" :title="t('i18nData.resourceId')" data-index="resId" :width="190"/>
          <a-table-column key="key" :title="t('i18nData.resourceKey')" data-index="key" :width="170"/>
          <a-table-column key="field" :title="t('i18nData.field')" data-index="field" :width="110"/>
          <a-table-column key="source" :title="t('i18nData.source')" data-index="source" :width="220"/>
          <a-table-column key="translation" :title="t('i18nData.translation')" :width="300">
            <template #default="{ record }">
              <a-input v-model:value="pendingDrafts[`${record.resId}:${record.field}`]" :maxlength="meta?.fields[record.field] || 512" :placeholder="t('i18nData.translationPlaceholder')"/>
            </template>
          </a-table-column>
          <a-table-column key="operations" :title="t('common.operation')" fixed="right" :width="110">
            <template #default="{ record }">
              <a-button type="link" size="small" :loading="pendingSavingKey === `${record.resId}:${record.field}`" :disabled="apiUnavailable" @click="savePending(record)">
                <template #icon><Save :size="14"/></template>{{ t('common.save') }}
              </a-button>
            </template>
          </a-table-column>
          <template #emptyText><a-empty :description="t(apiUnavailable ? 'i18nData.apiPendingTitle' : 'i18nData.noMissing')"/></template>
        </a-table>

        <div class="i18n-cursor-pagination">
          <span>{{ t('i18nData.cursorPage', { page: cursorHistory.length }) }}</span>
          <a-space>
            <a-select v-model:value="pendingLimit" class="i18n-limit-select" size="small" @change="loadPending(true)">
              <a-select-option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ t('common.perPage', { size }) }}</a-select-option>
            </a-select>
            <a-button size="small" :disabled="!hasPrevious || pendingLoading" @click="previousPendingPage"><template #icon><ChevronLeft :size="14"/></template>{{ t('i18nData.previousPage') }}</a-button>
            <a-button size="small" :disabled="!hasNext || pendingLoading" @click="nextPendingPage">{{ t('i18nData.nextPage') }}<template #icon><ChevronRight :size="14"/></template></a-button>
          </a-space>
        </div>
      </a-tab-pane>
    </a-tabs>
  </section>
</template>
