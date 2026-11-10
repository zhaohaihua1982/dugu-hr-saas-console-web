<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { loginLogApi, type LoginLog } from '../../api/loginlog'
import AppPagination from '../../components/AppPagination.vue'

const { t } = useI18n()
const loading = ref(false)
const ip = ref('')
const identifier = ref('')
const today = new Date()
const datePrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const startAt = ref(`${datePrefix} 00:00:00`)
const endAt = ref(`${datePrefix} 23:59:59`)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const rows = ref<LoginLog[]>([])
const columns = computed(() => [
  { title: t('loginLog.identifier'), dataIndex: 'identifier_mask', key: 'identifier', width: 140 },
  { title: t('loginLog.type'), dataIndex: 'login_type', key: 'type', width: 120 },
  { title: t('loginLog.result'), key: 'result', width: 100 },
  { title: t('loginLog.reason'), dataIndex: 'fail_reason', key: 'reason', width: 180 },
  { title: t('loginLog.ip'), dataIndex: 'ip', key: 'ip', width: 150 },
  { title: t('loginLog.time'), dataIndex: 'created_at', key: 'time', width: 180 },
])

async function load() {
  if (!startAt.value || !endAt.value) {
    message.warning(t('loginLog.timeRequired'))
    return
  }
  if (startAt.value > endAt.value) {
    message.warning(t('loginLog.timeOrderInvalid'))
    return
  }
  loading.value = true
  try {
    const data = await loginLogApi.list({
      page: page.value,
      page_size: pageSize.value,
      identifier: identifier.value.trim() || undefined,
      ip: ip.value.trim() || undefined,
      start_at: startAt.value,
      end_at: endAt.value,
    })
    rows.value = Array.isArray(data?.items) ? data.items : []
    total.value = Number(data?.total || 0)
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function changePagination(nextPage: number, nextPageSize: number) {
  page.value = nextPage
  pageSize.value = nextPageSize
  load()
}

onMounted(load)
</script>

<template>
  <section class="page-content">
    <div class="user-toolbar">
      <a-space wrap class="login-log-filters">
        <a-input v-model:value="identifier" allow-clear class="login-log-identifier" :placeholder="t('loginLog.identifierPlaceholder')" @press-enter="search"/>
        <a-input v-model:value="ip" allow-clear class="login-log-ip" :placeholder="t('loginLog.ip')" @press-enter="search"/>
        <a-date-picker
          v-model:value="startAt"
          :allow-clear="false"
          :placeholder="t('loginLog.startTime')"
          :show-time="{ format: 'HH:mm:ss' }"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm:ss"
          class="login-log-time"
        />
        <a-date-picker
          v-model:value="endAt"
          :allow-clear="false"
          :placeholder="t('loginLog.endTime')"
          :show-time="{ format: 'HH:mm:ss' }"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm:ss"
          class="login-log-time"
        />
        <a-button type="primary" @click="search">{{ t('common.search') }}</a-button>
        <a-button :loading="loading" @click="load">{{ t('common.refresh') }}</a-button>
      </a-space>
    </div>
    <a-table
      :columns="columns"
      :loading="loading"
      :data-source="rows"
      :pagination="false"
      :scroll="{ x: 870 }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'result'">
          <a-tag :color="record.success ? 'success' : 'error'">
            {{ record.success ? t('loginLog.success') : t('loginLog.failed') }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'reason'">{{ record.fail_reason || '-' }}</template>
      </template>
    </a-table>
    <AppPagination :current="page" :page-size="pageSize" :total="total" @change="changePagination"/>
  </section>
</template>
