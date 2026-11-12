<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { Globe2, Palette, Mail, Phone, ShieldCheck, Users } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/modules/auth'
import { localeOptions, type AppLocale } from '../../locales'
import { useAppStore, type AppTheme } from '../../store/modules/app'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()
type LoginMode = 'usernamePassword' | 'mobilePassword' | 'mobileSms'
const mode = ref<LoginMode>('usernamePassword')
const loginMask = ref(1)
const loading = ref(false)
const smsSending = ref(false)
const smsCountdown = ref(0)
const smsCaptchaOpen = ref(false)
const smsCaptchaCode = ref('')
const captcha = ref({ id: '', image: '' })
const captchaCode = ref('')
const form = ref({ identifier: 'admin', password: '', mobile: '', code: '', captcha: '' })
const loginModes = computed(() => [
  { key: 'usernamePassword' as const, bit: 1, label: t('login.passwordTab') },
  { key: 'mobilePassword' as const, bit: 2, label: t('login.mobilePasswordTab') },
  { key: 'mobileSms' as const, bit: 4, label: t('login.smsTab') },
].filter(item => Boolean(loginMask.value & item.bit)))
const themes = computed(() => [{ value: 'brand' as const, label: t('layout.brandBlue') }, { value: 'light' as const, label: t('layout.light') }, { value: 'dark' as const, label: t('layout.dark') }])
const themeClass = computed(() => `login-theme-${app.theme}`)

async function loadCaptcha() {
  try { const data = await authApi.captcha(); captcha.value = { id: data.captcha_id, image: data.image }; captchaCode.value = '' } catch { /* axios interceptor shows the error */ }
}
async function loadLoginConfig() {
  try {
    const data = await authApi.loginOptions()
    const mask = Number(data?.login_mask || 0)
    loginMask.value = mask > 0 ? mask : 1
  } catch { loginMask.value = 1 }
  if (!loginModes.value.some(item => item.key === mode.value)) mode.value = loginModes.value[0]?.key || 'usernamePassword'
}
async function submit() {
  const isPassword = mode.value !== 'mobileSms'
  const identifier = mode.value === 'usernamePassword' ? form.value.identifier : form.value.mobile
  const invalid = isPassword ? !identifier || !form.value.password || !form.value.captcha : !form.value.mobile || !form.value.code
  if (invalid) return message.warning(t('login.fillRequired'))
  loading.value = true
  try {
    const data = isPassword
      ? await authApi.passwordLogin({ identifier: identifier.trim(), password: form.value.password, captcha_id: captcha.value.id, captcha_code: form.value.captcha.trim() })
      : await authApi.smsLogin({ mobile: form.value.mobile.trim(), code: form.value.code.trim() })
    auth.setSession(data)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } finally { loading.value = false }
}
async function sendSms() {
  if (!form.value.mobile) return message.warning(t('login.fillRequired'))
  smsCaptchaCode.value = ''
  await loadCaptcha()
  smsCaptchaOpen.value = true
}
async function confirmSendSms() {
  if (!smsCaptchaCode.value.trim()) return message.warning(t('login.fillRequired'))
  smsSending.value = true
  try {
    await authApi.sendSms({ mobile: form.value.mobile.trim(), captcha_id: captcha.value.id, captcha_code: smsCaptchaCode.value.trim() })
    message.success(t('login.sent')); smsCountdown.value = 60
    const tick = () => window.setTimeout(() => { smsCountdown.value -= 1; if (smsCountdown.value > 0) tick() }, 1000)
    tick(); smsCaptchaOpen.value = false
  } finally { smsSending.value = false }
}
function setLocale(value: AppLocale) { app.setLocale(value) }
function setTheme(value: AppTheme) { app.setTheme(value) }
function selectMode(value: LoginMode) {
  mode.value = value
  form.value.captcha = ''
  if (value !== 'mobileSms') loadCaptcha()
}
onMounted(() => { loadLoginConfig(); loadCaptcha() })
</script>

<template>
  <main :class="['login-page', themeClass]">
    <section class="login-shell">
      <div class="brand-panel"><div class="brand-lockup"><div class="brand-mark"><i/><i/><i/></div><b>{{ t('layout.brandShort') }}</b></div><div class="brand-copy"><small>DUGU · PEOPLE OS</small><h1>{{ t('login.slogan') }}</h1><p>{{ t('login.sloganDesc') }}</p></div><div class="brand-features"><span><ShieldCheck :size="15"/>{{ t('login.security') }}</span><span><Users :size="15"/>{{ t('login.collaboration') }}</span></div></div>
      <section class="login-panel"><div class="login-tools"><label><Globe2 :size="15"/><select :value="app.locale" @change="setLocale(($event.target as HTMLSelectElement).value as AppLocale)"><option v-for="item in localeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label><Palette :size="15"/><select :value="app.theme" @change="setTheme(($event.target as HTMLSelectElement).value as AppTheme)"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label></div>
        <div class="login-card"><div class="heading"><small>WELCOME BACK</small><h2>{{ t('login.title') }}</h2><p>{{ t('login.subtitle') }}</p></div><div class="tabs"><button v-for="item in loginModes" :key="item.key" :class="{ active: mode === item.key }" @click="selectMode(item.key)">{{ item.label }}</button></div>
          <form @submit.prevent="submit">
            <template v-if="mode === 'usernamePassword'">
              <label>{{ t('login.account') }}</label><a-input v-model:value="form.identifier" size="large"><template #prefix><Mail :size="16"/></template></a-input>
              <label>{{ t('login.password') }}</label><a-input-password v-model:value="form.password" size="large"><template #prefix><ShieldCheck :size="16"/></template></a-input-password>
              <label>{{ t('login.captcha') }}</label><div class="captcha-row"><a-input v-model:value="form.captcha" size="large" maxlength="5" inputmode="numeric"/><button type="button" class="captcha-image" @click="loadCaptcha"><img v-if="captcha.image" :src="captcha.image" alt="captcha"/><span v-else>{{ captchaCode }}</span></button></div>
            </template>
            <template v-else-if="mode === 'mobilePassword'">
              <label>{{ t('login.mobile') }}</label><a-input v-model:value="form.mobile" size="large"><template #prefix><Phone :size="16"/></template></a-input>
              <label>{{ t('login.password') }}</label><a-input-password v-model:value="form.password" size="large"><template #prefix><ShieldCheck :size="16"/></template></a-input-password>
              <label>{{ t('login.captcha') }}</label><div class="captcha-row"><a-input v-model:value="form.captcha" size="large" maxlength="5" inputmode="numeric"/><button type="button" class="captcha-image" @click="loadCaptcha"><img v-if="captcha.image" :src="captcha.image" alt="captcha"/><span v-else>{{ captchaCode }}</span></button></div>
            </template>
            <template v-else>
              <label>{{ t('login.mobile') }}</label><a-input v-model:value="form.mobile" size="large"><template #prefix><Phone :size="16"/></template></a-input>
              <label>{{ t('login.smsCode') }}</label><a-input v-model:value="form.code" size="large" maxlength="6" inputmode="numeric"><template #suffix><button type="button" :disabled="smsSending || smsCountdown > 0" @click="sendSms">{{ smsCountdown ? `${smsCountdown}s` : t('login.getCode') }}</button></template></a-input>
            </template>
            <a-button html-type="submit" type="primary" block size="large" :loading="loading" class="submit">{{ t('login.submit') }}</a-button>
          </form>
        </div><footer>{{ t('login.company') }}<span>{{ t('login.record') }}</span></footer></section>
      <a-modal v-model:open="smsCaptchaOpen" :title="t('login.captcha')" :confirm-loading="smsSending" @ok="confirmSendSms"><div class="sms-captcha-dialog"><div class="captcha-row"><a-input v-model:value="smsCaptchaCode" size="large" maxlength="5" inputmode="numeric"/><button type="button" class="captcha-image" @click="loadCaptcha"><img v-if="captcha.image" :src="captcha.image" alt="captcha"/></button></div></div></a-modal>
    </section>
  </main>
</template>
