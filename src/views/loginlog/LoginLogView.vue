<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { loginLogApi, type LoginLog } from '../../api/loginlog'
const { t } = useI18n(); const loading = ref(false); const ip = ref(''); const page = ref(1); const total = ref(0); const rows = ref<LoginLog[]>([])
async function load() { loading.value = true; try { const data = await loginLogApi.list({ page: page.value, page_size: 20, ip: ip.value || undefined }); rows.value = data.items; total.value = data.total } finally { loading.value = false } }
onMounted(load)
</script>
<template><section class="page-content"><div class="user-toolbar"><a-space><a-input v-model:value="ip" allow-clear :placeholder="t('loginLog.ip')" @press-enter="load"/><a-button type="primary" @click="load">{{ t('common.search') }}</a-button><a-button :loading="loading" @click="load">{{ t('common.refresh') }}</a-button></a-space></div><a-table :loading="loading" :data-source="rows" :pagination="{ current: page, pageSize: 20, total }" row-key="id" @change="(p: any) => { page = p.current; load() }"><a-table-column key="identifier" :title="t('loginLog.identifier')" data-index="identifier_mask"/><a-table-column key="type" :title="t('loginLog.type')" data-index="login_type"/><a-table-column key="result" :title="t('loginLog.result')"><template #default="{ record }"><a-tag :color="record.success ? 'success' : 'error'">{{ record.success ? t('loginLog.success') : t('loginLog.failed') }}</a-tag></template></a-table-column><a-table-column key="reason" :title="t('loginLog.reason')" data-index="fail_reason"/><a-table-column key="ip" :title="t('loginLog.ip')" data-index="ip"/><a-table-column key="time" :title="t('loginLog.time')" data-index="created_at"/></a-table></section></template>
