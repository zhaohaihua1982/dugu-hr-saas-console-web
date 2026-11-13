<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { Languages, RefreshCw, Search, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ApiError } from '../../utils/http'
import AppPagination from '../../components/AppPagination.vue'
import LanguageConfigView from './LanguageConfigView.vue'
import { menuApi, type MenuItem } from '../../api/menu'
import { useAppStore } from '../../store/modules/app'
import { toServerMenuLocale } from '../../locales'
import {
  i18nApi,
  type I18nDeleteItem,
  type I18nMeta,
  type I18nPendingItem,
  type I18nResourceType,
  type I18nTexts,
  type I18nTextsList,
} from '../../api/i18n'

interface TranslationRow {
  key: string
  resId: string
  resourceKey: string
  field: string
  lang: string
  source: string
  content: string
}

const { t } = useI18n()
const route = useRoute()
const app = useAppStore()
const activeView = ref('resource')
const resourceType = ref<I18nResourceType>('menu')
const resourceId = ref('')
const meta = ref<I18nMeta | null>(null)
const detail = ref<I18nTexts | null>(null)
const textList = ref<I18nTextsList | null>(null)
const loadingMeta = ref(false)
const loadingDetail = ref(false)
const deletingKey = ref('')
const batchDeleting = ref(false)
const apiUnavailable = ref(false)
const selectedRowKeys = ref<string[]>([])
const listPage = ref(1)
const listLimit = ref(20)
const editorOpen = ref(false)
const editorLoading = ref(false)
const editorSaving = ref(false)
const editorResourceId = ref('')
const editorField = ref('')
const editorSource = ref('')
const editorDrafts = reactive<Record<string, string>>({})
const resourceNames = ref<Record<string, string>>({})

const pendingLang = ref('')
const pendingItems = ref<I18nPendingItem[]>([])
const pendingLoading = ref(false)
const pendingPage = ref(1)
const pendingLimit = ref(20)
const pendingTotal = ref(0)

const resourceOptions = computed(() => [
  { value: 'menu' as const, label: t('i18nData.resourceMenu') },
  { value: 'dict_item' as const, label: t('i18nData.resourceDictItem') },
])
const availableLangs = computed(() => (meta.value?.langs || []).filter(lang => lang !== meta.value?.defaultLang))
const validResourceId = computed(() => /^[1-9]\d*$/.test(resourceId.value.trim()))
const resourceIdFilterValid = computed(() => !resourceId.value.trim() || validResourceId.value)
const listMode = computed(() => !detail.value)
const translationRows = computed<TranslationRow[]>(() => {
  if (detail.value) return Object.keys(detail.value.defaultValue).flatMap(field => availableLangs.value.map(lang => {
    const key = `${detail.value?.resId}:${field}:${lang}`
    return {
      key,
      resId: detail.value?.resId || '',
      resourceKey: '',
      field,
      lang,
      source: detail.value?.defaultValue[field] || '',
      content: detail.value?.texts[field]?.[lang] || '',
    }
  }))
  if (!textList.value) return []
  return textList.value.items.map(item => {
    const texts = parseStoredTexts(item.texts)
    return {
      key: `${item.res_id}:${item.field}`,
      resId: item.res_id,
      resourceKey: resourceNames.value[item.res_id] || item.res_id,
      field: item.field,
      lang: '',
      source: '',
      content: Object.values(texts).find(value => typeof value === 'string' && value.trim()) || '',
    }
  })
})
const canBatchDelete = computed(() => selectedRowKeys.value.length > 0 && !apiUnavailable.value)

function languageLabel(lang: string) {
  const key = `i18nData.languages.${lang}`
  const label = t(key)
  return label === key ? lang : label
}

function parseStoredTexts(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function pendingRowKey(record: I18nPendingItem) {
  return `${record.resId}:${record.field}`
}

function resetDetail() {
  detail.value = null
  textList.value = null
  selectedRowKeys.value = []
  listPage.value = 1
}

function resetPending() {
  pendingItems.value = []
  pendingPage.value = 1
  pendingTotal.value = 0
}

async function loadMeta() {
  loadingMeta.value = true
  resetDetail()
  resetPending()
  try {
    meta.value = await i18nApi.meta(resourceType.value, true)
    await loadResourceNames()
    apiUnavailable.value = false
    const langs = availableLangs.value
    if (!langs.includes(pendingLang.value)) pendingLang.value = langs[0] || ''
    await queryTexts(true)
  } catch (error) {
    meta.value = null
    apiUnavailable.value = error instanceof ApiError && error.status === 404
    if (!apiUnavailable.value && error instanceof Error) message.error(error.message)
  } finally {
    loadingMeta.value = false
  }
}

async function loadResourceNames() {
  resourceNames.value = {}
  if (resourceType.value !== 'menu') return
  try {
    const tree = await menuApi.tree(toServerMenuLocale(app.locale), true)
    const visit = (items: MenuItem[]) => items.forEach(item => {
      resourceNames.value[item.id] = item.name
      visit(item.children || [])
    })
    visit(Array.isArray(tree) ? tree : [])
  } catch {
    resourceNames.value = {}
  }
}

async function queryTexts(reset = false) {
  const id = resourceId.value.trim()
  if (!resourceIdFilterValid.value) return
  if (reset) listPage.value = 1
  loadingDetail.value = true
  try {
    if (id) {
      detail.value = await i18nApi.texts(resourceType.value, id)
      textList.value = null
    } else {
      detail.value = null
      textList.value = await i18nApi.textsList(resourceType.value, listPage.value, listLimit.value)
      listPage.value = textList.value.page
      listLimit.value = textList.value.page_size
    }
    selectedRowKeys.value = []
  } finally {
    loadingDetail.value = false
  }
}

async function openEditor(row: TranslationRow) {
  editorOpen.value = true
  editorLoading.value = true
  editorResourceId.value = row.resId
  editorField.value = row.field
  editorSource.value = row.source
  Object.keys(editorDrafts).forEach(key => delete editorDrafts[key])
  try {
    const data = await i18nApi.texts(resourceType.value, row.resId)
    editorSource.value = data.defaultValue[row.field] || row.source
    availableLangs.value.forEach(lang => { editorDrafts[lang] = data.texts[row.field]?.[lang] || '' })
  } finally {
    editorLoading.value = false
  }
}

async function saveEditor() {
  if (!editorResourceId.value || !editorField.value) return
  editorSaving.value = true
  try {
    await i18nApi.save({
      resType: resourceType.value,
      resId: editorResourceId.value,
      texts: { [editorField.value]: Object.fromEntries(availableLangs.value.map(lang => [lang, editorDrafts[lang] || ''])) },
    })
    message.success(t('i18nData.saveSuccess'))
    editorOpen.value = false
    if (activeView.value === 'pending') await loadPending()
    else await queryTexts()
  } finally {
    editorSaving.value = false
  }
}

function deleteItem(row: TranslationRow): I18nDeleteItem {
  return { resType: resourceType.value, resId: row.resId, field: row.field, lang: row.lang }
}

async function deleteTranslation(row: TranslationRow) {
  deletingKey.value = row.key
  try {
    await i18nApi.remove(deleteItem(row))
    message.success(t('i18nData.deleteSuccess'))
    await queryTexts()
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
    await queryTexts()
  } finally {
    batchDeleting.value = false
  }
}

function onSelectionChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys.map(String)
}

async function changeListPage(page: number, pageSize = listLimit.value) {
  listPage.value = pageSize === listLimit.value ? page : 1
  listLimit.value = pageSize
  await queryTexts()
}

async function changePendingPage(page: number, pageSize = pendingLimit.value) {
  pendingPage.value = pageSize === pendingLimit.value ? page : 1
  pendingLimit.value = pageSize
  await loadPending()
}

async function loadPending(reset = false) {
  if (!pendingLang.value) return
  if (reset) pendingPage.value = 1
  pendingLoading.value = true
  try {
    const data = await i18nApi.pending(resourceType.value, pendingLang.value, pendingPage.value, pendingLimit.value)
    pendingItems.value = (data.items || []).map(item => ({
      ...item,
      resId: item.resId || item.res_id || '',
      source: item.source || item.key,
      content: '',
    }))
    pendingPage.value = data.page || pendingPage.value
    pendingLimit.value = data.page_size || pendingLimit.value
    pendingTotal.value = data.total || 0
  } finally {
    pendingLoading.value = false
  }
}

function openPendingEditor(item: I18nPendingItem) {
  openEditor({
    key: `${item.resId}:${item.field}:${pendingLang.value}`,
    resId: item.resId,
    resourceKey: item.key,
    field: item.field,
    lang: pendingLang.value,
    source: item.source || item.key,
    content: '',
  })
}

watch(resourceType, loadMeta)
watch(pendingLang, resetPending)
watch(() => [route.query.resType, route.query.resId], ([nextType, nextId]) => {
  if (nextType === 'menu' || nextType === 'dict_item') resourceType.value = nextType
  resourceId.value = typeof nextId === 'string' ? nextId : ''
  queryTexts(true)
})
onMounted(() => {
  const queryType = route.query.resType
  const queryId = route.query.resId
  if (queryType === 'menu' || queryType === 'dict_item') resourceType.value = queryType
  if (typeof queryId === 'string') resourceId.value = queryId
  loadMeta()
})
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
      <a-tab-pane key="languages" :tab="t('i18nData.languageConfig')">
        <LanguageConfigView />
      </a-tab-pane>

      <a-tab-pane key="resource" :tab="t('i18nData.resourceTranslations')">
        <div class="i18n-filter-bar">
          <a-space wrap>
            <a-select v-model:value="resourceType" class="i18n-resource-select" :loading="loadingMeta">
              <a-select-option v-for="item in resourceOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
            </a-select>
            <a-input v-model:value="resourceId" class="i18n-id-input" allow-clear :placeholder="t('i18nData.resourceIdOptional')" @press-enter="queryTexts(true)"/>
            <a-button type="primary" :loading="loadingDetail" :disabled="apiUnavailable || !meta || !resourceIdFilterValid" @click="queryTexts(true)">
              <template #icon><Search :size="15"/></template>{{ t('common.search') }}
            </a-button>
            <a-button :loading="loadingDetail" :disabled="apiUnavailable || (!detail && !textList)" @click="queryTexts()">
              <template #icon><RefreshCw :size="15"/></template>{{ t('common.refresh') }}
            </a-button>
          </a-space>
        </div>

        <template v-if="detail || textList">
          <div v-if="detail" class="i18n-resource-summary">
            <div><span>{{ t('i18nData.resourceType') }}</span><strong>{{ detail.label }}</strong></div>
            <div><span>{{ t('i18nData.resourceId') }}</span><strong>{{ detail.resId }}</strong></div>
            <div><span>{{ t('i18nData.defaultLanguage') }}</span><strong>{{ languageLabel(detail.defaultLang) }}</strong></div>
          </div>

          <div class="i18n-table-toolbar">
            <span>{{ t('i18nData.translationHint') }}</span>
            <a-popconfirm v-if="!listMode" :title="t('i18nData.batchDeleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="batchDelete">
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
            <a-table-column v-if="listMode" key="resId" :title="t('i18nData.resourceId')" data-index="resId" :width="190"/>
            <a-table-column v-if="listMode" key="resourceKey" :title="t('i18nData.resourceKey')" data-index="resourceKey" :width="190"/>
            <a-table-column key="field" :title="t('i18nData.field')" data-index="field" :width="130"/>
            <a-table-column v-if="!listMode" key="lang" :title="t('i18nData.targetLanguage')" :width="150">
              <template #default="{ text }">{{ languageLabel(text) }}</template>
            </a-table-column>
            <a-table-column key="operations" :title="t('common.operation')" fixed="right" :width="190">
              <template #default="{ record }">
                <a-space :size="2">
                  <a-button type="link" size="small" :disabled="apiUnavailable" @click="openEditor(record)">
                    <template #icon><Languages :size="14"/></template>{{ t('common.edit') }}
                  </a-button>
                  <a-popconfirm v-if="!listMode" :title="t('i18nData.deleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="deleteTranslation(record)">
                    <a-button type="link" danger size="small" :loading="deletingKey === record.key" :disabled="apiUnavailable || !record.content">
                      <template #icon><Trash2 :size="14"/></template>{{ t('common.delete') }}
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
          <AppPagination v-if="listMode" :current="listPage" :page-size="listLimit" :total="textList?.total || 0" @change="changeListPage"/>
        </template>
        <a-empty v-else class="i18n-empty" :description="t(apiUnavailable ? 'i18nData.apiPendingTitle' : 'i18nData.noData')"/>
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
          <a-table-column key="lang" :title="t('i18nData.targetLanguage')" :width="150"><template #default>{{ languageLabel(pendingLang) }}</template></a-table-column>
          <a-table-column key="operations" :title="t('common.operation')" fixed="right" :width="110">
            <template #default="{ record }">
              <a-button type="link" size="small" :disabled="apiUnavailable" @click="openPendingEditor(record)">
                <template #icon><Languages :size="14"/></template>{{ t('common.edit') }}
              </a-button>
            </template>
          </a-table-column>
          <template #emptyText><a-empty :description="t(apiUnavailable ? 'i18nData.apiPendingTitle' : 'i18nData.noMissing')"/></template>
        </a-table>

        <AppPagination :current="pendingPage" :page-size="pendingLimit" :total="pendingTotal" @change="changePendingPage"/>
      </a-tab-pane>
    </a-tabs>

    <a-modal v-model:open="editorOpen" :title="t('i18nLabels.editTranslations')" :width="620" :confirm-loading="editorSaving" :ok-text="t('common.save')" @ok="saveEditor">
      <a-spin :spinning="editorLoading">
        <div class="i18n-editor">
          <div class="i18n-editor-meta"><span>{{ t('i18nData.resourceId') }}</span><strong>{{ editorResourceId }}</strong></div>
          <div class="i18n-editor-field"><span>{{ t('i18nData.field') }}</span><strong>{{ editorField }}</strong></div>
          <a-form layout="vertical">
            <a-form-item :label="`${languageLabel(meta?.defaultLang || 'zh-CN')} · ${t('i18nData.source')}`">
              <a-input :value="editorSource" disabled/>
            </a-form-item>
            <a-form-item v-for="lang in availableLangs" :key="lang" :label="languageLabel(lang)">
              <a-input v-model:value="editorDrafts[lang]" :maxlength="meta?.fields[editorField] || 512" :placeholder="t('i18nData.translationPlaceholder')"/>
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-modal>
  </section>
</template>
