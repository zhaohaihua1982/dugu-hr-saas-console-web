<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { ChevronDown, ChevronRight, Plus, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { departmentApi, type Department } from '../../api/department'
import { ApiError } from '../../utils/http'

const { t } = useI18n()
const rows = ref<Department[]>([])
const loading = ref(false)
const unavailable = ref(false)
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<Department | null>(null)
const expandedKeys = ref<string[]>([])
const form = ref({ parent_id: '', name: '', sort: 0, status: 1, remark: '' })
const root = computed(() => rows.value.find(item => String(item.parent_id) === '0'))
const allIds = computed(() => {
  const ids: string[] = []
  const visit = (items: Department[]) => items.forEach(item => { ids.push(item.id); visit(item.children || []) })
  visit(rows.value)
  return ids
})
const parentTree = computed(() => rows.value.map(toSelectNode))

function toSelectNode(item: Department): Record<string, unknown> {
  return { value: item.id, title: item.name, disabled: editing.value?.id === item.id || isDescendant(item, editing.value?.id), children: (item.children || []).map(toSelectNode) }
}
function isDescendant(item: Department, id?: string) {
  if (!id) return false
  return item.path.split('/').includes(id)
}
async function load() {
  loading.value = true
  unavailable.value = false
  try {
    const data = await departmentApi.tree(true)
    rows.value = Array.isArray(data) ? data : []
    expandedKeys.value = allIds.value
  } catch (error) {
    rows.value = []
    unavailable.value = error instanceof ApiError && (error.status === 404 || error.status === 405)
  } finally { loading.value = false }
}
function openCreate(parent?: Department) {
  editing.value = null
  form.value = { parent_id: parent?.id || root.value?.id || '', name: '', sort: 0, status: 1, remark: '' }
  modalOpen.value = true
}
function openEdit(item: Department) {
  editing.value = item
  form.value = { parent_id: item.parent_id, name: item.name, sort: item.sort, status: item.status, remark: item.remark || '' }
  modalOpen.value = true
}
async function save() {
  if (!form.value.name.trim() || !form.value.parent_id) { message.warning(t('department.required')); return }
  saving.value = true
  try {
    if (editing.value) await departmentApi.update(editing.value.id, { ...form.value, name: form.value.name.trim(), remark: form.value.remark.trim() })
    else await departmentApi.create({ parent_id: form.value.parent_id, name: form.value.name.trim(), sort: form.value.sort, remark: form.value.remark.trim() })
    modalOpen.value = false
    message.success(t(editing.value ? 'department.updateSuccess' : 'department.createSuccess'))
    await load()
  } finally { saving.value = false }
}
async function remove(item: Department) {
  await departmentApi.remove(item.id)
  message.success(t('department.deleteSuccess'))
  await load()
}
function toggleAll() { expandedKeys.value = expandedKeys.value.length ? [] : allIds.value }
function isRoot(item: Department) { return String(item.parent_id) === '0' }
onMounted(load)
</script>

<template>
  <section class="page-content department-page">
    <a-alert v-if="unavailable" type="info" show-icon class="department-alert" :message="t('common.interfacePending')" :description="t('department.apiPending')" />
    <a-alert v-else-if="!loading && !rows.length" type="warning" show-icon class="department-alert" :message="t('department.rootMissing')" />
    <div class="department-toolbar">
      <span>{{ t('department.hint') }}</span>
      <a-space>
        <a-button @click="toggleAll"><template #icon><component :is="expandedKeys.length ? ChevronDown : ChevronRight" :size="15" /></template>{{ t('department.expandCollapse') }}</a-button>
        <a-button :loading="loading" @click="load"><template #icon><RefreshCw :size="15" /></template>{{ t('common.refresh') }}</a-button>
        <a-button type="primary" :disabled="unavailable || !root" @click="openCreate()"><template #icon><Plus :size="15" /></template>{{ t('department.add') }}</a-button>
      </a-space>
    </div>
    <a-table :data-source="rows" :loading="loading" :pagination="false" row-key="id" :expanded-row-keys="expandedKeys" :scroll="{ x: 900 }" @expandedRowsChange="(keys: Array<string | number>) => expandedKeys = keys.map(String)">
      <a-table-column key="name" :title="t('department.name')" data-index="name" :width="260"><template #default="{ record }"><span :class="{ 'department-disabled': record.status !== 1 }">{{ record.name }}</span><a-tag v-if="isRoot(record)" color="blue" class="department-root-tag">{{ t('department.root') }}</a-tag></template></a-table-column>
      <a-table-column key="sort" :title="t('department.sort')" data-index="sort" :width="90" />
      <a-table-column key="status" :title="t('common.status')" :width="100"><template #default="{ record }"><a-tag :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? t('department.enabled') : t('department.disabled') }}</a-tag></template></a-table-column>
      <a-table-column key="remark" :title="t('department.remark')" data-index="remark" :ellipsis="true" />
      <a-table-column key="created_at" :title="t('department.createdAt')" data-index="created_at" :width="180" />
      <a-table-column key="actions" :title="t('common.operation')" fixed="right" :width="220"><template #default="{ record }"><a-space size="small"><a-button type="link" size="small" @click="openCreate(record)">{{ t('department.addChild') }}</a-button><a-button type="link" size="small" @click="openEdit(record)">{{ t('common.edit') }}</a-button><a-popconfirm v-if="!isRoot(record)" :title="t('department.deleteConfirm')" :ok-text="t('common.confirm')" :cancel-text="t('common.cancel')" @confirm="remove(record)"><a-button type="link" danger size="small">{{ t('common.delete') }}</a-button></a-popconfirm></a-space></template></a-table-column>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('department.edit') : t('department.add')" :confirm-loading="saving" @ok="save">
      <a-form layout="vertical">
        <a-form-item v-if="!editing || !isRoot(editing)" :label="t('department.parent')" required><a-tree-select v-model:value="form.parent_id" :tree-data="parentTree" tree-default-expand-all /></a-form-item>
        <a-form-item :label="t('department.name')" required><a-input v-model:value="form.name" :maxlength="64" /></a-form-item>
        <a-form-item :label="t('department.sort')"><a-input-number v-model:value="form.sort" :min="0" :max="9999" style="width:100%" /></a-form-item>
        <a-form-item v-if="editing" :label="t('common.status')"><a-switch v-model:checked="form.status" :checked-value="1" :un-checked-value="0" :disabled="isRoot(editing)" /></a-form-item>
        <a-form-item :label="t('department.remark')"><a-textarea v-model:value="form.remark" :rows="3" :maxlength="255" show-count /></a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>
