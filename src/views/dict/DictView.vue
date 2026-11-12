<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { dictApi, type DictItem, type DictType } from '../../api/dict'
import { i18nApi, type I18nMeta } from '../../api/i18n'
import AppPagination from '../../components/AppPagination.vue'

const { t } = useI18n()
const loadingTypes = ref(false)
const loadingItems = ref(false)
const types = ref<DictType[]>([])
const selectedType = ref<DictType | null>(null)
const items = ref<DictItem[]>([])
const typeKeyword = ref('')
const typeStatus = ref<number | undefined>()
const typePage = ref(1)
const typePageSize = ref(10)
const typeTotal = ref(0)
const itemWithDisabled = ref(true)
const typeModal = ref(false)
const itemModal = ref(false)
const editingType = ref<DictType | null>(null)
const editingItem = ref<DictItem | null>(null)
const typeForm = ref({ code: '', name: '', status: 1, remark: '' })
const itemForm = ref({ value: '', label: '', sort: 0, status: 1, remark: '' })
const translationOpen = ref(false)
const translationLoading = ref(false)
const translationSaving = ref(false)
const translationTarget = ref<DictItem | null>(null)
const translationMeta = ref<I18nMeta | null>(null)
const translationDrafts = ref<Record<string, string>>({})
const selectedTypeCode = computed(() => selectedType.value?.code || '')

async function loadTypes() {
  loadingTypes.value = true
  try {
    const data = await dictApi.types({ code: typeKeyword.value || undefined, status: typeStatus.value, page: typePage.value, page_size: typePageSize.value })
    const payload = data || { items: [], total: 0 }
    types.value = Array.isArray(payload.list) ? payload.list : (Array.isArray(payload.items) ? payload.items : [])
    typeTotal.value = Number(payload.total || 0)
    if (selectedType.value) selectedType.value = types.value.find(item => item.id === selectedType.value?.id) || null
    if (!selectedType.value && types.value.length) selectType(types.value[0])
    if (selectedType.value) await loadItems()
  } finally { loadingTypes.value = false }
}

async function loadItems() {
  if (!selectedTypeCode.value) { items.value = []; return }
  loadingItems.value = true
  try {
    const data = await dictApi.items({ type: selectedTypeCode.value, manage: 1, withDisabled: itemWithDisabled.value ? 1 : 0 })
    items.value = Array.isArray(data) ? data : []
  } finally { loadingItems.value = false }
}

function selectType(type: DictType) { selectedType.value = type; loadItems() }
function openType(type?: DictType) {
  editingType.value = type || null
  typeForm.value = type ? { code: type.code, name: type.name, status: type.status, remark: type.remark || '' } : { code: '', name: '', status: 1, remark: '' }
  typeModal.value = true
}
async function saveType() {
  if (!typeForm.value.code.trim() || !typeForm.value.name.trim()) return
  if (editingType.value) await dictApi.updateType(editingType.value.id, typeForm.value)
  else await dictApi.createType(typeForm.value)
  typeModal.value = false
  message.success(editingType.value ? t('dict.updateTypeSuccess') : t('dict.createTypeSuccess'))
  await loadTypes()
}
async function toggleType(type: DictType) {
  await dictApi.setTypeStatus(type.id, type.status === 1 ? 0 : 1)
  message.success(t('dict.statusSuccess'))
  await loadTypes()
}
function removeType(type: DictType) {
  Modal.confirm({ title: t('dict.deleteTypeConfirm'), okType: 'danger', onOk: async () => {
    await dictApi.removeType(type.id)
    message.success(t('dict.deleteSuccess'))
    if (selectedType.value?.id === type.id) { selectedType.value = null; items.value = [] }
    await loadTypes()
  } })
}
function openItem(item?: DictItem) {
  editingItem.value = item || null
  itemForm.value = item ? { value: item.value, label: item.label, sort: item.sort || 0, status: item.status ?? 1, remark: item.remark || '' } : { value: '', label: '', sort: 0, status: 1, remark: '' }
  itemModal.value = true
}
async function openTranslations(item: DictItem) {
  if (!item.id) return
  translationTarget.value = item
  translationOpen.value = true
  translationLoading.value = true
  try {
    const [meta, detail] = await Promise.all([i18nApi.meta('dict_item'), i18nApi.texts('dict_item', item.id)])
    translationMeta.value = meta
    const values: Record<string, string> = {}
    for (const lang of meta.langs) values[lang] = detail.texts?.label?.[lang] || ''
    translationDrafts.value = values
  } finally { translationLoading.value = false }
}
async function saveTranslations() {
  if (!translationTarget.value?.id || !translationMeta.value) return
  translationSaving.value = true
  try {
    const defaultLang = translationMeta.value.defaultLang
    await i18nApi.save({ resType: 'dict_item', resId: translationTarget.value.id, texts: { label: Object.fromEntries(translationMeta.value.langs.filter(lang => lang !== defaultLang).map(lang => [lang, translationDrafts.value[lang] || ''])) } })
    translationOpen.value = false
    message.success(t('dict.translationSuccess'))
    await loadItems()
  } finally { translationSaving.value = false }
}
async function saveItem() {
  if (!selectedTypeCode.value || !itemForm.value.value.trim() || !itemForm.value.label.trim()) return
  const payload = { ...itemForm.value, typeCode: selectedTypeCode.value }
  if (editingItem.value?.id) await dictApi.updateItem(editingItem.value.id, payload)
  else await dictApi.createItem(payload)
  itemModal.value = false
  message.success(editingItem.value ? t('dict.updateItemSuccess') : t('dict.createItemSuccess'))
  await loadItems()
}
function removeItem(item: DictItem) {
  if (!item.id) return
  Modal.confirm({ title: t('dict.deleteItemConfirm'), okType: 'danger', onOk: async () => { await dictApi.removeItem(item.id as string); message.success(t('dict.deleteSuccess')); await loadItems() } })
}
async function toggleItem(item: DictItem) {
  if (!item.id) return
  await dictApi.setItemStatus(item.id, item.status === 1 ? 0 : 1)
  message.success(t('dict.statusSuccess'))
  await loadItems()
}
function changeTypePagination(page: number, pageSize: number) { typePage.value = page; typePageSize.value = pageSize; loadTypes() }
onMounted(loadTypes)
</script>

<template>
  <section class="page-content dict-page">
    <div class="dict-layout">
      <div class="dict-types-panel">
        <div class="dict-panel-heading"><strong>{{ t('dict.typesTitle') }}</strong><a-button type="primary" size="small" @click="openType()">{{ t('common.add') }}</a-button></div>
        <div class="dict-filter"><a-input v-model:value="typeKeyword" allow-clear :placeholder="t('dict.codePlaceholder')" @press-enter="typePage = 1; loadTypes()"/><a-select v-model:value="typeStatus" allow-clear :placeholder="t('common.status')" @change="typePage = 1; loadTypes()"><a-select-option :value="1">{{ t('dict.enabled') }}</a-select-option><a-select-option :value="0">{{ t('dict.disabled') }}</a-select-option></a-select><a-button :loading="loadingTypes" @click="loadTypes">{{ t('common.refresh') }}</a-button></div>
          <a-table :loading="loadingTypes" :data-source="types" :pagination="false" row-key="id" size="small" :custom-row="(record: DictType) => ({ onClick: () => selectType(record) })">
          <a-table-column key="name" :title="t('dict.typeName')" data-index="name"/><a-table-column key="code" :title="t('dict.code')" data-index="code"/>
          <a-table-column key="status" :title="t('common.status')" :width="74"><template #default="{ record }"><a-tag :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? t('dict.enabled') : t('dict.disabled') }}</a-tag></template></a-table-column>
          <a-table-column key="actions" :title="t('common.operation')" :width="190"><template #default="{ record }"><a-space size="small"><a-button type="link" size="small" @click.stop="openType(record)">{{ t('common.edit') }}</a-button><a-button type="link" size="small" @click.stop="toggleType(record)">{{ record.status === 1 ? t('common.disable') : t('common.enable') }}</a-button><a-button type="link" danger size="small" @click.stop="removeType(record)">{{ t('common.delete') }}</a-button></a-space></template></a-table-column>
        </a-table>
        <AppPagination :current="typePage" :page-size="typePageSize" :total="typeTotal" @change="changeTypePagination"/>
      </div>
      <div class="dict-items-panel">
        <div class="dict-panel-heading"><div><strong>{{ t('dict.itemsTitle') }}</strong><span v-if="selectedType" class="dict-selected-type">{{ selectedType.name }} ({{ selectedType.code }})</span></div><a-space><a-checkbox v-model:checked="itemWithDisabled" @change="loadItems">{{ t('dict.showDisabled') }}</a-checkbox><a-button type="primary" size="small" :disabled="!selectedType" @click="openItem()">{{ t('dict.addItem') }}</a-button></a-space></div>
        <a-empty v-if="!selectedType" :description="t('dict.selectTypeHint')" class="dict-empty"/>
          <a-table v-else :loading="loadingItems" :data-source="items" :pagination="false" row-key="value" size="small" :scroll="{ x: 760 }">
          <a-table-column key="value" :title="t('dict.value')" data-index="value" :width="180"/><a-table-column key="label" :title="t('dict.defaultLabel')" data-index="label" :width="200"/><a-table-column key="sort" :title="t('dict.sort')" :width="70"><template #default="{ record }">{{ record.sort ?? '-' }}</template></a-table-column>
          <a-table-column key="status" :title="t('common.status')" :width="78"><template #default="{ record }"><a-tag v-if="record.status !== undefined" :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? t('dict.enabled') : t('dict.disabled') }}</a-tag><span v-else>-</span></template></a-table-column>
          <a-table-column key="actions" :title="t('common.operation')" fixed="right" :width="250"><template #default="{ record }"><a-space v-if="record.id" size="small"><a-button type="link" size="small" @click="openItem(record)">{{ t('common.edit') }}</a-button><a-button type="link" size="small" @click="openTranslations(record)">{{ t('i18nLabels.editTranslations') }}</a-button><a-button type="link" size="small" @click="toggleItem(record)">{{ record.status === 1 ? t('common.disable') : t('common.enable') }}</a-button><a-button type="link" danger size="small" @click="removeItem(record)">{{ t('common.delete') }}</a-button></a-space><span v-else>-</span></template></a-table-column>
        </a-table>
      </div>
    </div>
    <a-modal v-model:open="typeModal" :title="editingType ? t('dict.editType') : t('dict.addType')" @ok="saveType"><a-form layout="vertical"><a-form-item :label="t('dict.code')" required><a-input v-model:value="typeForm.code" :disabled="Boolean(editingType)" :maxlength="64"/></a-form-item><a-form-item :label="t('dict.typeName')" required><a-input v-model:value="typeForm.name" :maxlength="64"/></a-form-item><a-form-item :label="t('common.status')"><a-switch v-model:checked="typeForm.status" :checked-value="1" :un-checked-value="0"/></a-form-item><a-form-item :label="t('dict.remark')"><a-textarea v-model:value="typeForm.remark" :maxlength="255" :rows="3"/></a-form-item></a-form></a-modal>
    <a-modal v-model:open="itemModal" :title="editingItem ? t('dict.editItem') : t('dict.addItem')" @ok="saveItem"><a-form layout="vertical"><a-form-item :label="t('dict.value')" required><a-input v-model:value="itemForm.value" :disabled="Boolean(editingItem)" :maxlength="64"/></a-form-item><a-form-item :label="t('dict.defaultLabel')" required><a-input v-model:value="itemForm.label" :maxlength="64"/></a-form-item><a-form-item :label="t('dict.sort')"><a-input-number v-model:value="itemForm.sort" :min="0" :precision="0" style="width:100%"/></a-form-item><a-form-item :label="t('common.status')"><a-switch v-model:checked="itemForm.status" :checked-value="1" :un-checked-value="0"/></a-form-item></a-form></a-modal>
    <a-modal v-model:open="translationOpen" :title="t('i18nLabels.editTranslations')" :confirm-loading="translationSaving" @ok="saveTranslations"><a-spin :spinning="translationLoading"><div class="dict-translation-meta"><span>{{ t('i18nData.resourceId') }}</span><strong>{{ translationTarget?.id }}</strong></div><a-form layout="vertical" class="dict-translation-form"><a-form-item :label="t('i18nData.defaultLanguage')"><a-input :value="translationTarget?.label" disabled/></a-form-item><a-form-item v-for="lang in (translationMeta?.langs || []).filter(item => item !== translationMeta?.defaultLang)" :key="lang" :label="t(`i18nData.languages.${lang}`)"><a-input v-model:value="translationDrafts[lang]" :maxlength="translationMeta?.fields.label || 64" :placeholder="t('i18nData.translationPlaceholder')"/></a-form-item></a-form></a-spin></a-modal>
  </section>
</template>
