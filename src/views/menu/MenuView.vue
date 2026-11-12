<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ChevronsUpDown, Languages, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { ApiError } from '../../utils/http'
import { menuApi, type MenuItem, type MenuPayload, type MenuType } from '../../api/menu'
import { useAppStore } from '../../store/modules/app'
import { toServerMenuLocale } from '../../locales'
import { i18nApi, type I18nMeta } from '../../api/i18n'

const { t } = useI18n()
const app = useAppStore()
const loading = ref(false)
const saving = ref(false)
const savingSort = ref(false)
const apiUnavailable = ref(false)
const rows = ref<MenuItem[]>([])
const sortDraft = ref<Record<string, number>>({})
const keyword = ref('')
const statusFilter = ref<number | undefined>()
const expandedRowKeys = ref<string[]>([])
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const translationModalOpen = ref(false)
const translationLoading = ref(false)
const translationSaving = ref(false)
const translationTarget = ref<MenuItem | null>(null)
const translationMeta = ref<I18nMeta | null>(null)
const translationDrafts = ref<Record<string, string>>({})
const requestLang = computed(() => toServerMenuLocale(app.locale))

const emptyForm = (): MenuPayload => ({
  parent_id: '0', name: '', names: { 'zh-CN': '', 'zh-TW': '', 'en-US': '' }, type: 1, path: '', component: '', icon: '',
  sort: 0, visible: true, status: 1, code: '', remark: '',
})
const form = ref<MenuPayload>(emptyForm())

function withoutEmptyChildren(items: MenuItem[]): MenuItem[] {
  return items.map(item => {
    const children = withoutEmptyChildren(item.children || [])
    const normalized = { ...item }
    if (children.length && item.type !== 3) normalized.children = children
    else delete normalized.children
    return normalized
  })
}

function flatten(items: MenuItem[], depth = 0): Array<MenuItem & { depth: number }> {
  return items.flatMap(item => [{ ...item, depth }, ...flatten(item.children || [], depth + 1)])
}

function rowExpandable(record: MenuItem) {
  return record.type !== 3 && Boolean(record.children?.length)
}

const allItems = computed(() => flatten(rows.value))
const editingNode = computed(() => allItems.value.find(item => item.id === editingId.value))
const rootAllowed = computed(() => form.value.type === 1)
const parentOptions = computed(() => allItems.value.filter(item => {
  if (item.id === editingId.value) return false
  if (editingNode.value?.id_path && item.id_path?.startsWith(`${editingNode.value.id_path}/`)) return false
  if (form.value.type === 3) return item.type === 1 || item.type === 2
  return item.type === 1 && item.depth < 2
}))
const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  function filter(items: MenuItem[]): MenuItem[] {
    return items.flatMap(item => {
      const children = filter(item.children || [])
      const nameMatch = !query || item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)
      const statusMatch = statusFilter.value === undefined || item.status === statusFilter.value
      if (!(nameMatch && statusMatch || children.length)) return []
      const result = { ...item }
      if (children.length && item.type !== 3) result.children = children
      else delete result.children
      return [result]
    })
  }
  return filter(rows.value)
})

async function load() {
  loading.value = true
  try {
    const data = await menuApi.tree(requestLang.value)
    rows.value = Array.isArray(data) ? withoutEmptyChildren(data) : []
    sortDraft.value = Object.fromEntries(flatten(rows.value).map(item => [item.id, item.sort]))
    apiUnavailable.value = false
    expandedRowKeys.value = []
  } catch (error) {
    rows.value = []
    apiUnavailable.value = error instanceof ApiError && error.status === 404
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  keyword.value = ''
  statusFilter.value = undefined
}

function openTranslations(item: MenuItem) {
  translationTarget.value = item
  translationModalOpen.value = true
  translationLoading.value = true
  Promise.all([i18nApi.meta('menu'), i18nApi.texts('menu', item.id)])
    .then(([meta, detail]) => {
      translationMeta.value = meta
      const values: Record<string, string> = {}
      meta.langs.filter(lang => lang !== meta.defaultLang).forEach(lang => {
        values[lang] = detail.texts.name?.[lang] || ''
      })
      translationDrafts.value = values
    })
    .finally(() => { translationLoading.value = false })
}

async function saveTranslations() {
  if (!translationTarget.value || !translationMeta.value) return
  translationSaving.value = true
  try {
    await i18nApi.save({
      resType: 'menu',
      resId: translationTarget.value.id,
      texts: { name: Object.fromEntries(translationMeta.value.langs.filter(lang => lang !== translationMeta.value?.defaultLang).map(lang => [lang, translationDrafts.value[lang] || ''])) },
    })
    message.success(t('i18nData.saveSuccess'))
    translationModalOpen.value = false
  } finally {
    translationSaving.value = false
  }
}

function toggleExpand() {
  expandedRowKeys.value = expandedRowKeys.value.length
    ? []
    : flatten(filteredRows.value).filter(item => item.children?.length).map(item => item.id)
}

function openCreate(parent?: MenuItem) {
  editingId.value = null
  const parentAtMaxDepth = Boolean(parent?.id_path && parent.id_path.split('/').length >= 3)
  const type: MenuType = !parent ? 1 : parent.type === 2 || parentAtMaxDepth ? 3 : 2
  form.value = { ...emptyForm(), parent_id: parent?.id || '0', type, visible: type !== 3 }
  modalOpen.value = true
}

function normalizeParent() {
  const currentIsValid = form.value.parent_id === '0'
    ? rootAllowed.value
    : parentOptions.value.some(item => item.id === form.value.parent_id)
  if (!currentIsValid) form.value.parent_id = rootAllowed.value ? '0' : parentOptions.value[0]?.id || ''
  if (form.value.type === 3) form.value.visible = false
}

async function openEdit(item: MenuItem) {
  if (apiUnavailable.value) return
  loading.value = true
  try {
    const detail = await menuApi.detail(item.id)
    editingId.value = item.id
    form.value = {
      parent_id: String(detail.parent_id || '0'),
      name: detail.name,
      names: { 'zh-CN': detail.names?.['zh-CN'] || detail.name, 'zh-TW': detail.names?.['zh-TW'] || '', 'en-US': detail.names?.['en-US'] || '' },
      type: detail.type,
      path: detail.path || '',
      component: detail.component || '',
      icon: detail.icon || '',
      sort: detail.sort || 0,
      visible: detail.visible,
      status: detail.status,
      code: detail.code || '',
      remark: detail.remark || '',
    }
    modalOpen.value = true
  } finally {
    loading.value = false
  }
}

async function save() {
  if (apiUnavailable.value) return
  form.value.name = form.value.names['zh-CN']?.trim() || form.value.name.trim()
  if (!form.value.name) {
    message.warning(t('menuAdmin.nameRequired'))
    return
  }
  const code = form.value.code.trim()
  if ((form.value.type !== 1 || editingId.value) && !code) {
    message.warning(t('menuAdmin.codeRequired'))
    return
  }
  const path = form.value.type === 3 ? code : form.value.path.trim()
  if (!path) {
    message.warning(t('menuAdmin.pathRequired'))
    return
  }
  const payload: MenuPayload = {
    ...form.value,
    path,
    component: form.value.type === 2 ? form.value.component.trim() : '',
    code,
    names: { 'zh-CN': form.value.names['zh-CN'].trim() },
  }
  saving.value = true
  try {
    if (editingId.value) await menuApi.update(editingId.value, payload)
    else await menuApi.create(payload)
    modalOpen.value = false
    message.success(t(editingId.value ? 'menuAdmin.updateSuccess' : 'menuAdmin.createSuccess'))
    await load()
  } finally {
    saving.value = false
  }
}

async function saveSort() {
  const items = allItems.value.map(item => ({ id: item.id, sort: sortDraft.value[item.id] ?? item.sort }))
  if (!items.length) return
  savingSort.value = true
  try {
    const results = await menuApi.sort(items)
    const failed = results.filter(item => !item.success).length
    if (failed) message.warning(t('menuAdmin.sortPartial', { failed }))
    else message.success(t('menuAdmin.sortSuccess'))
    await load()
  } finally {
    savingSort.value = false
  }
}

async function remove(item: MenuItem) {
  if (apiUnavailable.value) return
  await menuApi.remove(item.id)
  message.success(t('menuAdmin.deleteSuccess'))
  await load()
}

watch(requestLang, load)
onMounted(load)
</script>

<template>
  <section class="page-content menu-page">
    <div class="menu-filter-bar">
      <a-space wrap>
        <a-input v-model:value="keyword" allow-clear class="menu-filter-name" :placeholder="t('menuAdmin.nameOrPath')"/>
        <a-select v-model:value="statusFilter" allow-clear class="menu-filter-status" :placeholder="t('menuAdmin.status')">
          <a-select-option :value="1">{{ t('menuAdmin.enabled') }}</a-select-option>
          <a-select-option :value="0">{{ t('menuAdmin.disabled') }}</a-select-option>
        </a-select>
        <a-button type="primary">{{ t('common.search') }}</a-button>
        <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
      </a-space>
    </div>

    <a-alert v-if="apiUnavailable" type="warning" show-icon class="menu-api-alert" :message="t('menuAdmin.apiPending')"/>

    <div class="menu-table-toolbar">
      <a-space>
        <a-button type="primary" @click="openCreate()"><template #icon><Plus :size="15"/></template>{{ t('common.add') }}</a-button>
        <a-button @click="toggleExpand"><template #icon><ChevronsUpDown :size="15"/></template>{{ t('menuAdmin.expandCollapse') }}</a-button>
        <a-button :loading="savingSort" @click="saveSort">{{ t('menuAdmin.saveSort') }}</a-button>
        <a-button :loading="loading" @click="load"><template #icon><RefreshCw :size="15"/></template>{{ t('common.refresh') }}</a-button>
      </a-space>
    </div>

    <a-table
      v-model:expandedRowKeys="expandedRowKeys"
      :data-source="filteredRows"
      :loading="loading"
      :pagination="false"
      :expandable="{ rowExpandable }"
      :scroll="{ x: 1120 }"
      row-key="id"
      size="middle"
    >
      <a-table-column key="name" :title="t('menuAdmin.name')" data-index="name" :width="230"/>
      <a-table-column key="sort" :title="t('menuAdmin.sort')" :width="96" align="center">
        <template #default="{ record }"><a-input-number v-model:value="sortDraft[record.id]" :min="0" :max="9999" :precision="0" size="small" style="width:68px"/></template>
      </a-table-column>
      <a-table-column key="path" :title="t('menuAdmin.path')" data-index="path" :width="190">
        <template #default="{ text }">{{ text || '-' }}</template>
      </a-table-column>
      <a-table-column key="type" :title="t('menuAdmin.type')" :width="90" align="center">
        <template #default="{ record }"><a-tag :color="record.type === 1 ? 'blue' : record.type === 2 ? 'green' : 'orange'">{{ t(`menuAdmin.type${record.type}`) }}</a-tag></template>
      </a-table-column>
      <a-table-column key="visible" :title="t('menuAdmin.visible')" :width="90" align="center">
        <template #default="{ record }"><a-tag :color="record.visible ? 'success' : 'default'">{{ t(record.visible ? 'menuAdmin.shown' : 'menuAdmin.hidden') }}</a-tag></template>
      </a-table-column>
      <a-table-column key="code" :title="t('menuAdmin.code')" data-index="code" :width="190">
        <template #default="{ text }">{{ text || '-' }}</template>
      </a-table-column>
      <a-table-column key="status" :title="t('menuAdmin.status')" :width="90" align="center">
        <template #default="{ record }"><a-tag :color="record.status ? 'success' : 'default'">{{ t(record.status ? 'menuAdmin.enabled' : 'menuAdmin.disabled') }}</a-tag></template>
      </a-table-column>
      <a-table-column key="operations" :title="t('common.operation')" fixed="right" :width="260">
        <template #default="{ record }">
          <a-space :size="2">
            <a-button type="link" size="small" :disabled="apiUnavailable" @click="openEdit(record)"><template #icon><Pencil :size="14"/></template>{{ t('common.edit') }}</a-button>
            <a-button type="link" size="small" :disabled="apiUnavailable" @click="openTranslations(record)"><template #icon><Languages :size="14"/></template>{{ t('i18nLabels.editTranslations') }}</a-button>
            <a-button v-if="record.type !== 3" type="link" size="small" @click="openCreate(record)"><template #icon><Plus :size="14"/></template>{{ t('menuAdmin.addChild') }}</a-button>
            <a-popconfirm :title="t('menuAdmin.deleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="remove(record)">
              <a-button type="link" danger size="small" :disabled="apiUnavailable"><template #icon><Trash2 :size="14"/></template>{{ t('common.delete') }}</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table-column>
      <template #emptyText><a-empty :description="t(apiUnavailable ? 'menuAdmin.apiPending' : 'menuAdmin.noData')"/></template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="t(editingId ? 'menuAdmin.editTitle' : 'menuAdmin.createTitle')"
      :width="760"
      :confirm-loading="saving"
      :ok-button-props="{ disabled: apiUnavailable }"
      @ok="save"
    >
      <a-alert v-if="apiUnavailable" type="warning" show-icon class="menu-modal-alert" :message="t('menuAdmin.apiPendingSave')"/>
      <a-form layout="vertical" class="menu-form-grid">
        <a-form-item :label="t('menuAdmin.parent')">
          <a-select v-model:value="form.parent_id">
            <a-select-option v-if="rootAllowed" value="0">{{ t('menuAdmin.root') }}</a-select-option>
            <a-select-option v-for="item in parentOptions" :key="item.id" :value="item.id">{{ `${'　'.repeat(item.depth)}${item.name}` }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('menuAdmin.type')" required>
          <a-radio-group v-model:value="form.type" @change="normalizeParent"><a-radio-button :value="1">{{ t('menuAdmin.type1') }}</a-radio-button><a-radio-button :value="2">{{ t('menuAdmin.type2') }}</a-radio-button><a-radio-button :value="3">{{ t('menuAdmin.type3') }}</a-radio-button></a-radio-group>
        </a-form-item>
        <a-form-item :label="t('menuAdmin.nameZh')" required><a-input v-model:value="form.names['zh-CN']" :maxlength="64"/></a-form-item>
        <a-form-item v-if="form.type !== 3" :label="t('menuAdmin.path')" required><a-input v-model:value="form.path" :maxlength="128" placeholder="/system/users"/></a-form-item>
        <a-form-item :label="t('menuAdmin.code')" :required="form.type !== 1 || Boolean(editingId)"><a-input v-model:value="form.code" :maxlength="64" placeholder="system:user:page"/></a-form-item>
        <a-form-item v-if="form.type === 2" :label="t('menuAdmin.component')"><a-input v-model:value="form.component" :maxlength="128" placeholder="views/system/UserView"/></a-form-item>
        <a-form-item v-if="form.type !== 3" :label="t('menuAdmin.icon')"><a-input v-model:value="form.icon" :maxlength="64" placeholder="Users"/></a-form-item>
        <a-form-item :label="t('menuAdmin.sort')"><a-input-number v-model:value="form.sort" :min="0" :precision="0" style="width:100%"/></a-form-item>
        <a-form-item :label="t('menuAdmin.visible')"><a-switch v-model:checked="form.visible"/></a-form-item>
        <a-form-item :label="t('menuAdmin.status')"><a-switch v-model:checked="form.status" :checked-value="1" :un-checked-value="0"/></a-form-item>
        <a-form-item class="menu-form-wide" :label="t('menuAdmin.remark')"><a-textarea v-model:value="form.remark" :rows="3" :maxlength="255" show-count/></a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="translationModalOpen"
      :title="t('i18nLabels.editTranslations')"
      :width="560"
      :confirm-loading="translationSaving"
      :ok-text="t('common.save')"
      @ok="saveTranslations"
    >
      <a-spin :spinning="translationLoading">
        <div class="menu-translation-meta">
          <span>{{ t('i18nData.resourceId') }}</span><strong>{{ translationTarget?.id }}</strong>
        </div>
        <a-form layout="vertical" class="menu-translation-form">
          <a-form-item :label="`${t('i18nData.languages.zh-CN')} · ${t('i18nData.source')}`">
            <a-input :value="translationTarget?.name" disabled/>
          </a-form-item>
          <a-form-item v-for="lang in (translationMeta?.langs || []).filter(item => item !== translationMeta?.defaultLang)" :key="lang" :label="t(`i18nData.languages.${lang}`)">
            <a-input v-model:value="translationDrafts[lang]" :maxlength="translationMeta?.fields.name || 64" :placeholder="t('i18nData.translationPlaceholder')"/>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </section>
</template>
