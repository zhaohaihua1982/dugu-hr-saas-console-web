<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { langApi, type AdminLanguage } from '../../api/lang'
import { ApiError } from '../../utils/http'
import { hasLocalePack } from '../../locales'

const { t } = useI18n()
const rows = ref<AdminLanguage[]>([])
const loading = ref(false)
const unavailable = ref(false)
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<AdminLanguage | null>(null)
const form = ref({ code: '', name: '', nativeName: '', sort: 10, remark: '' })

async function load() {
  loading.value = true
  unavailable.value = false
  try {
    const data = await langApi.list()
    rows.value = data.items || []
  } catch (error) {
    unavailable.value = error instanceof ApiError && (error.status === 404 || error.status === 405)
  } finally { loading.value = false }
}
function openCreate() {
  editing.value = null
  form.value = { code: '', name: '', nativeName: '', sort: 10, remark: '' }
  modalOpen.value = true
}
function openEdit(row: AdminLanguage) {
  editing.value = row
  form.value = { code: row.code, name: row.name, nativeName: row.nativeName, sort: row.sort || 0, remark: row.remark || '' }
  modalOpen.value = true
}
async function save() {
  if (!form.value.name.trim() || !form.value.nativeName.trim() || (!editing.value && !form.value.code.trim())) return
  saving.value = true
  try {
    if (editing.value) await langApi.update(editing.value.code, { name: form.value.name, nativeName: form.value.nativeName, sort: form.value.sort, remark: form.value.remark })
    else await langApi.create(form.value)
    modalOpen.value = false
    message.success(t('languageConfig.saveSuccess'))
    await load()
  } finally { saving.value = false }
}
async function toggle(row: AdminLanguage) {
  if (row.isDefault && Boolean(row.enabled)) { message.warning(t('languageConfig.defaultDisableHint')); return }
  if (!Boolean(row.enabled) && !hasLocalePack(row.code)) {
    message.warning(t('languageConfig.noLocalePack', { language: row.code }))
    return
  }
  await langApi.update(row.code, { enabled: Boolean(row.enabled) ? 0 : 1 })
  message.success(t('languageConfig.statusSuccess'))
  await load()
}
function setDefault(row: AdminLanguage) {
  if (row.isDefault) return
  Modal.confirm({ title: t('languageConfig.defaultConfirmTitle'), content: t('languageConfig.defaultConfirmContent', { language: row.nativeName }), onOk: async () => { await langApi.setDefault(row.code); message.success(t('languageConfig.defaultSuccess')); await load() } })
}
onMounted(load)
</script>

<template>
  <section class="language-config-panel">
    <a-alert v-if="unavailable" type="info" show-icon :message="t('common.interfacePending')" :description="t('languageConfig.apiPending')" class="i18n-api-alert" />
    <div class="i18n-table-toolbar"><span>{{ t('languageConfig.hint') }}</span><a-space><a-button :loading="loading" @click="load">{{ t('common.refresh') }}</a-button><a-button type="primary" :disabled="unavailable" @click="openCreate">{{ t('common.add') }}</a-button></a-space></div>
    <a-table :data-source="rows" :loading="loading" :pagination="false" row-key="code" size="middle">
      <a-table-column key="code" :title="t('languageConfig.code')" data-index="code" :width="130" />
      <a-table-column key="nativeName" :title="t('languageConfig.nativeName')" data-index="nativeName" :width="150" />
      <a-table-column key="name" :title="t('languageConfig.name')" data-index="name" :width="190" />
      <a-table-column key="bitIndex" :title="t('languageConfig.bitIndex')" data-index="bitIndex" :width="90" />
      <a-table-column key="enabled" :title="t('common.status')" :width="110"><template #default="{ record }"><a-tag :color="record.enabled ? 'success' : 'default'">{{ record.enabled ? t('languageConfig.enabled') : t('languageConfig.disabled') }}</a-tag><a-tag v-if="record.isDefault" color="blue">{{ t('languageConfig.default') }}</a-tag></template></a-table-column>
      <a-table-column key="sort" :title="t('languageConfig.sort')" data-index="sort" :width="80" />
      <a-table-column key="actions" :title="t('common.operation')" fixed="right" :width="230"><template #default="{ record }"><a-space size="small"><a-button type="link" size="small" @click="openEdit(record)">{{ t('common.edit') }}</a-button><a-button type="link" size="small" @click="toggle(record)">{{ record.enabled ? t('common.disable') : t('common.enable') }}</a-button><a-button type="link" size="small" :disabled="!record.enabled || record.isDefault" @click="setDefault(record)">{{ t('languageConfig.setDefault') }}</a-button></a-space></template></a-table-column>
    </a-table>
    <a-modal v-model:open="modalOpen" :title="editing ? t('languageConfig.edit') : t('languageConfig.add')" :confirm-loading="saving" @ok="save"><a-form layout="vertical"><a-form-item :label="t('languageConfig.code')" required><a-input v-model:value="form.code" :disabled="Boolean(editing)" placeholder="en-US" /></a-form-item><a-form-item :label="t('languageConfig.nativeName')" required><a-input v-model:value="form.nativeName" placeholder="English" /></a-form-item><a-form-item :label="t('languageConfig.name')" required><a-input v-model:value="form.name" placeholder="English" /></a-form-item><a-form-item :label="t('languageConfig.sort')"><a-input-number v-model:value="form.sort" :min="0" :max="999" style="width:100%" /></a-form-item><a-form-item :label="t('languageConfig.remark')"><a-textarea v-model:value="form.remark" :rows="3" /></a-form-item></a-form></a-modal>
  </section>
</template>
