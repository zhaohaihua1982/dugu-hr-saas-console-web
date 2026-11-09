<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { Globe2, Palette, Mail, Phone, ShieldCheck, Users } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/modules/auth'
import { localeOptions, type AppLocale } from '../../locales'
import { useAppStore, type AppTheme } from '../../store/modules/app'

const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const mode = ref<'password' | 'sms'>('password')
const loading = ref(false)
const smsSending = ref(false)
const smsCountdown = ref(0)
const captcha = ref({ id: '', image: '' })
const captchaCode = ref('')
const form = ref({ identifier: 'admin', password: '', mobile: '', code: '', captcha: '' })
const themes = computed(() => [{ value: 'brand' as const, label: t('layout.brandBlue') }, { value: 'light' as const, label: t('layout.light') }, { value: 'dark' as const, label: t('layout.dark') }])
const themeClass = computed(() => `login-theme-${app.theme}`)

async function loadCaptcha() {
  try { const data = await authApi.captcha(); captcha.value = { id: data.captcha_id, image: data.image }; captchaCode.value = '' } catch { /* axios interceptor shows the error */ }
}
async function submit() {
  const invalid = mode.value === 'password' ? !form.value.identifier || !form.value.password || !form.value.captcha : !form.value.mobile || !form.value.code
  if (invalid) return message.warning(t('login.fillRequired'))
  loading.value = true
  try {
    const data = mode.value === 'password'
      ? await authApi.passwordLogin({ identifier: form.value.identifier.trim(), password: form.value.password, captcha_id: captcha.value.id, captcha_code: form.value.captcha.trim() })
      : await authApi.smsLogin({ mobile: form.value.mobile.trim(), code: form.value.code.trim() })
    auth.setSession(data)
    window.location.assign('/')
  } finally { loading.value = false }
}
async function sendSms() {
  if (!form.value.mobile || !form.value.captcha) return message.warning(t('login.fillRequired'))
  smsSending.value = true
  try {
    await authApi.sendSms({ mobile: form.value.mobile.trim(), captcha_id: captcha.value.id, captcha_code: form.value.captcha.trim() })
    message.success(t('login.sent')); smsCountdown.value = 60
    const tick = () => window.setTimeout(() => { smsCountdown.value -= 1; if (smsCountdown.value > 0) tick() }, 1000)
    tick(); form.value.captcha = ''; await loadCaptcha()
  } finally { smsSending.value = false }
}
function setLocale(value: AppLocale) { app.setLocale(value) }
function setTheme(value: AppTheme) { app.setTheme(value) }
loadCaptcha()
</script>

<template>
  <main :class="['login-page', themeClass]">
    <section class="login-shell">
      <div class="brand-panel"><div class="brand-lockup"><div class="brand-mark"><i/><i/><i/></div><b>{{ t('layout.brandShort') }}</b></div><div class="brand-copy"><small>DUGU · PEOPLE OS</small><h1>{{ t('login.slogan') }}</h1><p>{{ t('login.sloganDesc') }}</p></div><div class="brand-features"><span><ShieldCheck :size="15"/>{{ t('login.security') }}</span><span><Users :size="15"/>{{ t('login.collaboration') }}</span></div></div>
      <section class="login-panel"><div class="login-tools"><label><Globe2 :size="15"/><select :value="app.locale" @change="setLocale(($event.target as HTMLSelectElement).value as AppLocale)"><option v-for="item in localeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label><Palette :size="15"/><select :value="app.theme" @change="setTheme(($event.target as HTMLSelectElement).value as AppTheme)"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label></div>
        <div class="login-card"><div class="heading"><small>WELCOME BACK</small><h2>{{ t('login.title') }}</h2><p>{{ t('login.subtitle') }}</p></div><div class="tabs"><button :class="{ active: mode === 'password' }" @click="mode = 'password'">{{ t('login.passwordTab') }}</button><button :class="{ active: mode === 'sms' }" @click="mode = 'sms'">{{ t('login.smsTab') }}</button></div>
          <form @submit.prevent="submit"><template v-if="mode === 'password'"><label>{{ t('login.account') }}</label><a-input v-model:value="form.identifier" size="large"><template #prefix><Mail :size="16"/></template></a-input><label>{{ t('login.password') }}</label><a-input-password v-model:value="form.password" size="large"><template #prefix><ShieldCheck :size="16"/></template></a-input-password></template><template v-else><label>{{ t('login.mobile') }}</label><a-input v-model:value="form.mobile" size="large"><template #prefix><Phone :size="16"/></template></a-input></template><label>{{ t('login.captcha') }}</label><div class="captcha-row"><a-input v-model:value="form.captcha" size="large" maxlength="5" inputmode="numeric"/><button type="button" class="captcha-image" @click="loadCaptcha"><img v-if="captcha.image" :src="captcha.image" alt="captcha"/><span v-else>{{ captchaCode }}</span></button></div><template v-if="mode === 'sms'"><label>{{ t('login.smsCode') }}</label><a-input v-model:value="form.code" size="large" maxlength="6" inputmode="numeric"><template #suffix><button type="button" :disabled="smsSending || smsCountdown > 0" @click="sendSms">{{ smsCountdown ? `${smsCountdown}s` : t('login.getCode') }}</button></template></a-input></template><a-button html-type="submit" type="primary" block size="large" :loading="loading" class="submit">{{ t('login.submit') }}</a-button></form>
        </div><footer>{{ t('login.company') }}<span>{{ t('login.record') }}</span></footer></section>
    </section>
  </main>
</template>
