<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { loginConfigApi, type LoginConfig } from '../../api/loginconfig'
import { ApiError } from '../../utils/http'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const apiUnavailable = ref(false)
const activeType = ref(1)
const configs = ref<Record<number, LoginConfig>>({})
const maskBits = [
  { bit: 1, key: 'usernamePassword' },
  { bit: 2, key: 'mobilePassword' },
  { bit: 4, key: 'mobileSms' },
  { bit: 8, key: 'emailPassword' },
]

function defaults(type: number): LoginConfig {
  return {
    config_type: type, login_mask: type === 1 ? 5 : 15, fail_threshold: 5, lock_minutes: 15, unlock_mode: 3,
    captcha_after_fails: 3, ip_fail_limit: 50, ip_rate_limit: 20, access_token_ttl: 7200,
    refresh_token_ttl: type === 1 ? 86400 : 86400 * 30,
    session_hard_ttl: type === 1 ? 86400 : 86400 * 30,
    session_max_concurrent: type === 1 ? 1 : 3,
    kick_on_pwd_change: 1, remember_days: 0, pwd_level: type === 1 ? 3 : 2, pwd_min_length: type === 1 ? 12 : 10,
    pwd_min_classes: type === 1 ? 3 : 2, pwd_forbid_username: 1, pwd_max_age_days: type === 1 ? 180 : 0,
    pwd_expire_action: 1, pwd_remind_days: 7, pwd_history_count: 3, pwd_force_first_change: 0,
    allow_self_change_pwd: type === 1 ? 0 : 1, extras: {}, version: 0,
  }
}

const form = reactive<LoginConfig>(defaults(1))
const enabledMethods = computed(() => maskBits
  .filter(item => Boolean(form.login_mask & item.bit))
  .map(item => t(`loginConfig.methods.${item.key}`)).join('、'))

function replaceForm(value: LoginConfig) {
  Object.assign(form, defaults(activeType.value), value, { config_type: activeType.value })
}
function cloneConfig(value: LoginConfig) {
  return JSON.parse(JSON.stringify(value)) as LoginConfig
}
function recordUnavailable(error: unknown) {
  apiUnavailable.value = error instanceof ApiError && (error.status === 404 || error.status === 405)
}
async function load() {
  loading.value = true
  apiUnavailable.value = false
  try {
    const admin = await loginConfigApi.getAdmin()
    configs.value[1] = admin
    replaceForm(configs.value[activeType.value])
  } catch (error) { recordUnavailable(error) }
  finally { loading.value = false }
}
async function changeType(type: number) {
  activeType.value = type
  if (configs.value[type]) { replaceForm(configs.value[type]); return }
  loading.value = true
  apiUnavailable.value = false
  try {
    const value = type === 1 ? await loginConfigApi.getAdmin() : await loginConfigApi.getTenant()
    configs.value[type] = value
    replaceForm(value)
  } catch (error) { recordUnavailable(error); replaceForm(defaults(type)) }
  finally { loading.value = false }
}
function toggleMask(bit: number, enabled: boolean) {
  form.login_mask = enabled ? form.login_mask | bit : form.login_mask & ~bit
}
function setLevel(level: number) {
  form.pwd_level = level
  const presets: Record<number, [number, number]> = { 1: [8, 1], 2: [10, 2], 3: [12, 3] }
  form.pwd_min_length = presets[level][0]
  form.pwd_min_classes = presets[level][1]
}
function validate() {
  if (!form.login_mask || (activeType.value === 1 && !(form.login_mask & 1))) return t('loginConfig.validationLoginMethod')
  if (form.lock_minutes < form.fail_threshold * 2) return t('loginConfig.validationLock')
  if (!(form.access_token_ttl < form.refresh_token_ttl && form.refresh_token_ttl <= form.session_hard_ttl)) return t('loginConfig.validationToken')
  if (form.remember_days > Math.floor(form.refresh_token_ttl / 86400)) return t('loginConfig.validationRemember')
  if (form.pwd_min_length < 8 || form.pwd_min_length > 32 || form.pwd_min_classes < 1 || form.pwd_min_classes > 4 || form.pwd_min_classes > form.pwd_min_length) return t('loginConfig.validationPassword')
  return ''
}
async function save() {
  const warning = validate()
  if (warning) { message.warning(warning); return }
  saving.value = true
  try {
    await loginConfigApi.update(activeType.value, cloneConfig(form))
    const updated = activeType.value === 1
      ? await loginConfigApi.getAdmin()
      : await loginConfigApi.getTenant()
    configs.value[activeType.value] = updated
    replaceForm(updated)
    message.success(t('loginConfig.saveSuccess'))
  } finally { saving.value = false }
}
function resetConfig() {
  Modal.confirm({
    title: t('loginConfig.resetTitle'), content: t('loginConfig.resetContent'), okType: 'danger',
    onOk: async () => {
      saving.value = true
      try {
        await loginConfigApi.reset(activeType.value)
        const value = activeType.value === 1
          ? await loginConfigApi.getAdmin()
          : await loginConfigApi.getTenant()
        configs.value[activeType.value] = value
        replaceForm(value)
        message.success(t('loginConfig.resetSuccess'))
      } finally { saving.value = false }
    },
  })
}
onMounted(load)
</script>

<template>
  <section class="page-content login-config-page">
    <a-alert v-if="apiUnavailable" type="info" show-icon :message="t('common.interfacePending')" :description="t('loginConfig.apiPending')" class="login-config-alert" />
    <a-tabs v-model:active-key="activeType" :animated="false" @change="changeType">
      <a-tab-pane :key="1" :tab="t('loginConfig.adminTab')" />
      <a-tab-pane :key="2" :tab="t('loginConfig.tenantTab')" />
    </a-tabs>
    <a-spin :spinning="loading">
      <a-form layout="vertical" class="login-config-form">
        <div class="login-config-toolbar">
          <span>{{ t('loginConfig.enabledSummary', { methods: enabledMethods }) }}</span>
          <a-space><a-button @click="load">{{ t('common.refresh') }}</a-button><a-button danger @click="resetConfig">{{ t('loginConfig.reset') }}</a-button><a-button type="primary" :loading="saving" @click="save">{{ t('common.save') }}</a-button></a-space>
        </div>
        <div class="login-config-grid">
          <div class="login-config-section">
            <h3>{{ t('loginConfig.sections.methods') }}</h3>
            <a-form-item v-for="item in maskBits" :key="item.bit" :label="t(`loginConfig.methods.${item.key}`)">
              <a-switch :checked="Boolean(form.login_mask & item.bit)" @change="(checked: boolean) => toggleMask(item.bit, checked)" />
              <span class="login-config-help">{{ t(`loginConfig.methodHelp.${item.key}`) }}</span>
            </a-form-item>
          </div>
          <div class="login-config-section">
            <h3>{{ t('loginConfig.sections.protection') }}</h3>
            <div class="login-config-fields">
              <a-form-item :label="t('loginConfig.fields.failThreshold')"><a-input-number v-model:value="form.fail_threshold" :min="3" :max="20" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.lockMinutes')"><a-input-number v-model:value="form.lock_minutes" :min="1" :max="1440" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.unlockMode')"><a-select v-model:value="form.unlock_mode"><a-select-option :value="1">{{ t('loginConfig.unlockModes.auto') }}</a-select-option><a-select-option :value="2">{{ t('loginConfig.unlockModes.admin') }}</a-select-option><a-select-option :value="3">{{ t('loginConfig.unlockModes.both') }}</a-select-option></a-select></a-form-item>
              <a-form-item :label="t('loginConfig.fields.captchaAfterFails')"><a-input-number v-model:value="form.captcha_after_fails" :min="0" :max="5" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.ipFailLimit')"><a-input-number v-model:value="form.ip_fail_limit" :min="10" :max="1000" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.ipRateLimit')"><a-input-number v-model:value="form.ip_rate_limit" :min="5" :max="600" /></a-form-item>
            </div>
          </div>
          <div class="login-config-section">
            <h3>{{ t('loginConfig.sections.session') }}</h3>
            <p class="login-config-note">{{ t('loginConfig.newSessionNote') }}</p>
            <div class="login-config-fields">
              <a-form-item :label="t('loginConfig.fields.accessTokenTtl')"><a-input-number v-model:value="form.access_token_ttl" :min="300" :max="86400" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.refreshTokenTtl')"><a-input-number v-model:value="form.refresh_token_ttl" :min="3600" :max="2592000" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.sessionHardTtl')"><a-input-number v-model:value="form.session_hard_ttl" :min="300" :max="2592000" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.sessionMaxConcurrent')"><a-input-number v-model:value="form.session_max_concurrent" :min="0" :max="10" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.rememberDays')"><a-input-number v-model:value="form.remember_days" :min="0" :max="30" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.kickOnPwdChange')"><a-switch v-model:checked="form.kick_on_pwd_change" :checked-value="1" :un-checked-value="0" /></a-form-item>
            </div>
          </div>
          <div class="login-config-section">
            <h3>{{ t('loginConfig.sections.password') }}</h3>
            <a-form-item :label="t('loginConfig.fields.pwdLevel')"><a-radio-group v-model:value="form.pwd_level" @change="(event: { target: { value: number } }) => setLevel(event.target.value)"><a-radio :value="1">{{ t('loginConfig.passwordLevels.low') }}</a-radio><a-radio :value="2">{{ t('loginConfig.passwordLevels.medium') }}</a-radio><a-radio :value="3">{{ t('loginConfig.passwordLevels.high') }}</a-radio></a-radio-group></a-form-item>
            <div class="login-config-fields">
              <a-form-item :label="t('loginConfig.fields.pwdMinLength')"><a-input-number v-model:value="form.pwd_min_length" :min="8" :max="32" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.pwdMinClasses')"><a-input-number v-model:value="form.pwd_min_classes" :min="1" :max="4" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.pwdMaxAgeDays')"><a-input-number v-model:value="form.pwd_max_age_days" :min="0" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.pwdExpireAction')"><a-select v-model:value="form.pwd_expire_action"><a-select-option :value="1">{{ t('loginConfig.expireActions.notice') }}</a-select-option><a-select-option :value="2">{{ t('loginConfig.expireActions.force') }}</a-select-option></a-select></a-form-item>
              <a-form-item :label="t('loginConfig.fields.pwdRemindDays')"><a-input-number v-model:value="form.pwd_remind_days" :min="0" /></a-form-item>
              <a-form-item :label="t('loginConfig.fields.pwdHistoryCount')"><a-input-number v-model:value="form.pwd_history_count" :min="0" /></a-form-item>
            </div>
            <div class="login-config-checks"><a-checkbox v-model:checked="form.pwd_forbid_username" :checked-value="1" :unchecked-value="0">{{ t('loginConfig.fields.pwdForbidUsername') }}</a-checkbox><a-checkbox v-model:checked="form.pwd_force_first_change" :checked-value="1" :unchecked-value="0">{{ t('loginConfig.fields.pwdForceFirstChange') }}</a-checkbox><a-checkbox v-model:checked="form.allow_self_change_pwd" :checked-value="1" :unchecked-value="0">{{ t('loginConfig.fields.allowSelfChangePwd') }}</a-checkbox></div>
          </div>
        </div>
      </a-form>
    </a-spin>
  </section>
</template>
