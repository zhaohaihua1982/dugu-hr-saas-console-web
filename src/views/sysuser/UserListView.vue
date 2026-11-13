<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { sysuserApi, type BatchResult, type SysUser } from '../../api/sysuser'
import { departmentApi, type Department } from '../../api/department'
import AppPagination from '../../components/AppPagination.vue'

const { t } = useI18n()
const loading = ref(false)
const keyword = ref('')
const status = ref<string | undefined>()
const departmentId = ref<string | undefined>()
const departments = ref<Department[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const rows = ref<SysUser[]>([])
const modal = ref(false)
const resetModal = ref(false)
const freezeModal = ref(false)
const resetTarget = ref<SysUser | null>(null)
const newPassword = ref('')
const freezeMinutes = ref<number | null>(60)
const editing = ref<SysUser | null>(null)
const form = ref<{ username: string; name: string; password: string; mobile: string; email: string; dept_id?: string }>({ username: '', name: '', password: '', mobile: '', email: '', dept_id: undefined })
const departmentFilterTree = computed(() => departments.value.map(item => departmentNode(item, false)))
const departmentEditTree = computed(() => departments.value.map(item => departmentNode(item, true)))
const selectedIds = ref<string[]>([])
const selectedUsers = computed(() => rows.value.filter(user => selectedIds.value.includes(user.id)))
const selectedFreezableUsers = computed(() => selectedUsers.value.filter(user => !user.is_current && user.status !== 3))
const selectedLockedUsers = computed(() => selectedUsers.value.filter(user => !user.is_current && user.status === 3))
const rowSelection = computed(() => ({
  selectedRowKeys: selectedIds.value,
  preserveSelectedRowKeys: false,
  onChange: (keys: Array<string | number>) => { selectedIds.value = keys.map(String) },
  getCheckboxProps: (record: SysUser) => ({ disabled: record.is_current, name: record.username }),
}))

async function load() {
  loading.value = true
  try {
    const data = await sysuserApi.list({ page: page.value, page_size: pageSize.value, keyword: keyword.value || undefined, status: status.value, dept_id: departmentId.value })
    rows.value = Array.isArray(data?.items) ? data.items : []
    total.value = Number(data?.total || 0)
    selectedIds.value = selectedIds.value.filter(id => rows.value.some(user => user.id === id && !user.is_current))
  } finally {
    loading.value = false
  }
}

function departmentNode(item: Department, disableInactive: boolean): Record<string, unknown> {
  return { value: item.id, title: item.name, disabled: disableInactive && item.status !== 1, children: (item.children || []).map(child => departmentNode(child, disableInactive)) }
}
async function loadDepartments() {
  try { const data = await departmentApi.tree(true); departments.value = Array.isArray(data) ? data : [] } catch { departments.value = [] }
}

function open(user?: SysUser) {
  editing.value = user || null
  form.value = user
    ? { username: user.username, name: user.name, password: '', mobile: '', email: user.email, dept_id: user.dept_id || undefined }
    : { username: '', name: '', password: '', mobile: '', email: '', dept_id: undefined }
  modal.value = true
}

async function save() {
  try {
    if (editing.value) {
      const data: Record<string, unknown> = { name: form.value.name, email: form.value.email, dept_id: form.value.dept_id || null }
      if (form.value.mobile) data.mobile = form.value.mobile
      await sysuserApi.update(editing.value.id, data)
    } else {
      await sysuserApi.create(form.value)
    }
    modal.value = false
    message.success(editing.value ? t('user.updateSuccess') : t('user.createSuccess'))
    await load()
  } catch { /* interceptor handles error */ }
}

async function disable(user: SysUser) {
  try {
    await sysuserApi.setStatus(user.id, 2)
    message.success(t('user.disableSuccess'))
    await load()
  } catch { /* interceptor handles error */ }
}

async function enable(user: SysUser) {
  try {
    await sysuserApi.setStatus(user.id, 1)
    message.success(t('user.updateSuccess'))
    await load()
  } catch { /* interceptor handles error */ }
}

function batchResultMessage(result: BatchResult, successKey: string) {
  if (!result.failed) {
    message.success(t(successKey, { count: result.succeeded }))
    return
  }
  const errorKeys: Record<number, string> = {
    30023: 'user.batchErrorNotFound',
    30025: 'user.batchErrorInvalid',
    30026: 'user.batchErrorProtected',
    30027: 'user.batchErrorSelf',
  }
  const errorCodes = Array.from(new Set(result.items.filter(item => !item.success).map(item => item.code).filter((code): code is number => Boolean(code))))
  const reasons = errorCodes.map(code => t(errorKeys[code] || 'user.batchErrorGeneric')).join(t('user.reasonSeparator'))
  message.warning(t('user.batchPartial', { succeeded: result.succeeded, failed: result.failed, reasons }))
}

function openBatchFreeze() {
  if (!selectedFreezableUsers.value.length) {
    message.warning(t('user.selectFreezable'))
    return
  }
  freezeMinutes.value = 60
  freezeModal.value = true
}

async function batchFreeze() {
  if (!freezeMinutes.value || freezeMinutes.value < 1 || freezeMinutes.value > 10080) {
    message.warning(t('user.freezeMinutesInvalid'))
    return
  }
  try {
    const result = await sysuserApi.batchFreeze(selectedFreezableUsers.value.map(user => user.id), freezeMinutes.value)
    freezeModal.value = false
    selectedIds.value = result.items.filter(item => !item.success).map(item => item.id)
    batchResultMessage(result, 'user.batchFreezeSuccess')
    await load()
  } catch { /* interceptor handles error */ }
}

async function batchUnlock(ids = selectedLockedUsers.value.map(user => user.id)) {
  if (!ids.length) {
    message.warning(t('user.selectLocked'))
    return
  }
  try {
    const result = await sysuserApi.batchUnfreeze(ids)
    selectedIds.value = result.items.filter(item => !item.success).map(item => item.id)
    batchResultMessage(result, 'user.batchUnlockSuccess')
    await load()
  } catch { /* interceptor handles error */ }
}

function openReset(user: SysUser) {
  resetTarget.value = user
  newPassword.value = ''
  resetModal.value = true
}

async function resetPassword() {
  if (!resetTarget.value || !newPassword.value) return
  try {
    await sysuserApi.resetPassword(resetTarget.value.id, newPassword.value)
    resetModal.value = false
    message.success(t('user.resetSuccess'))
  } catch { /* interceptor handles error */ }
}

function changePagination(nextPage: number, nextPageSize: number) {
  page.value = nextPage
  pageSize.value = nextPageSize
  load()
}

onMounted(() => { loadDepartments(); load() })
</script>

<template>
  <section class="page-content user-page">
    <div class="user-toolbar">
      <a-space>
        <a-input v-model:value="keyword" allow-clear :placeholder="`${t('user.name')} / ${t('user.username')} / ${t('user.mobile')}`" @press-enter="load"/>
        <a-select v-model:value="status" allow-clear style="width:130px">
          <a-select-option value="1">{{ t('user.active') }}</a-select-option>
          <a-select-option value="2">{{ t('user.disabled') }}</a-select-option>
          <a-select-option value="3">{{ t('user.locked') }}</a-select-option>
        </a-select>
        <a-tree-select v-model:value="departmentId" allow-clear :tree-data="departmentFilterTree" tree-default-expand-all style="width:180px" :placeholder="t('user.department')" />
        <a-button :loading="loading" @click="load">{{ t('common.search') }}</a-button>
        <a-button @click="keyword=''; status=undefined; departmentId=undefined; page=1; load()">{{ t('common.reset') }}</a-button>
      </a-space>
      <a-space>
        <a-button :disabled="!selectedFreezableUsers.length" @click="openBatchFreeze">{{ t('user.batchFreeze') }}</a-button>
        <a-button :disabled="!selectedLockedUsers.length" @click="batchUnlock()">{{ t('user.batchUnlock') }}</a-button>
        <a-button type="primary" @click="open()">{{ t('user.add') }}</a-button>
      </a-space>
    </div>
    <a-table
      :loading="loading"
      :data-source="rows"
      :row-selection="rowSelection"
      :pagination="false"
      :scroll="{ x: 1080 }"
      row-key="id"
    >
      <a-table-column key="name" :title="t('user.name')" data-index="name" :width="120"/>
      <a-table-column key="username" :title="t('user.username')" data-index="username" :width="140"/>
      <a-table-column key="mobile" :title="t('user.mobile')" data-index="mobile" :width="140"/>
      <a-table-column key="email" :title="t('user.email')" data-index="email" :width="220"/>
      <a-table-column key="department" :title="t('user.department')" data-index="dept_name" :width="150"><template #default="{ text }">{{ text || '—' }}</template></a-table-column>
      <a-table-column key="status" :title="t('common.status')" :width="90">
        <template #default="{ record }">
          <a-tag :color="record.status === 1 ? 'success' : record.status === 3 ? 'error' : 'warning'">
            {{ record.status === 1 ? t('user.active') : record.status === 3 ? t('user.locked') : t('user.disabled') }}
          </a-tag>
        </template>
      </a-table-column>
      <a-table-column key="actions" :title="t('common.operation')" fixed="right" :width="270">
        <template #default="{ record }">
          <a-space>
            <a-button type="link" size="small" @click="open(record)">{{ t('common.edit') }}</a-button>
            <a-button type="link" size="small" @click="openReset(record)">{{ t('user.resetPassword') }}</a-button>
            <template v-if="!record.is_current">
              <a-button v-if="record.status === 3" type="link" size="small" @click="batchUnlock([record.id])">{{ t('common.unlock') }}</a-button>
              <a-button v-else-if="record.status === 2" type="link" size="small" @click="enable(record)">{{ t('common.enable') }}</a-button>
              <a-button v-else type="link" danger size="small" @click="disable(record)">{{ t('common.disable') }}</a-button>
            </template>
          </a-space>
        </template>
      </a-table-column>
    </a-table>
    <AppPagination :current="page" :page-size="pageSize" :total="total" @change="changePagination"/>

    <a-modal v-model:open="modal" :title="editing ? t('common.edit') : t('user.add')" @ok="save">
      <a-form layout="vertical">
        <a-form-item :label="t('user.username')"><a-input v-model:value="form.username" :disabled="Boolean(editing)"/></a-form-item>
        <a-form-item :label="t('user.name')"><a-input v-model:value="form.name"/></a-form-item>
        <a-form-item v-if="!editing" :label="t('user.password')"><a-input-password v-model:value="form.password"/></a-form-item>
        <a-form-item :label="t('user.mobile')"><a-input v-model:value="form.mobile" :placeholder="editing ? t('user.mobileKeep') : ''"/></a-form-item>
        <a-form-item :label="t('user.email')"><a-input v-model:value="form.email"/></a-form-item>
        <a-form-item :label="t('user.department')"><a-tree-select v-model:value="form.dept_id" allow-clear :tree-data="departmentEditTree" tree-default-expand-all :placeholder="t('user.departmentOptional')" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="resetModal" :title="t('user.resetPassword')" @ok="resetPassword">
      <a-form layout="vertical">
        <a-form-item :label="t('user.newPassword')" :help="t('user.passwordHint')"><a-input-password v-model:value="newPassword"/></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="freezeModal" :title="t('user.batchFreeze')" @ok="batchFreeze">
      <a-form layout="vertical">
        <a-form-item :label="t('user.freezeMinutes')" :help="t('user.freezeMinutesHint')">
          <a-input-number v-model:value="freezeMinutes" :min="1" :max="10080" :precision="0" style="width:100%"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>
