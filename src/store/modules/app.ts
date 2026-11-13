import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { hasLocalePack, i18n, LOCALE_KEY, localeOptions, type AppLocale } from '../../locales'
import { langApi, type PublicLanguage } from '../../api/lang'

export type AppTheme = 'light' | 'dark' | 'brand'
export const THEME_KEY = 'dugu-theme'

export const useAppStore = defineStore('app', () => {
  const locale = ref<AppLocale>((localStorage.getItem(LOCALE_KEY) as AppLocale) || 'zh-CN')
  const theme = ref<AppTheme>((localStorage.getItem(THEME_KEY) as AppTheme) || 'brand')
  const menuCollapsed = ref(false)
  const languageOptions = ref(localeOptions.map(item => ({ ...item, disabled: false })))
  const languageVersion = ref('')
  const dark = computed(() => theme.value === 'dark')
  function setLocale(value: AppLocale) {
    const option = languageOptions.value.find(item => item.value === value)
    if (option?.disabled || !hasLocalePack(value)) return false
    locale.value = value; i18n.global.locale.value = value; localStorage.setItem(LOCALE_KEY, value); return true
  }
  async function loadLanguages() {
    try {
      const data = await langApi.public()
      const items = (data.items || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
      const options = items.map(item => ({ value: item.code as AppLocale, label: item.nativeName || item.code, disabled: !hasLocalePack(item.code) }))
      if (options.length) languageOptions.value = options
      languageVersion.value = data.version || ''
      const defaultCode = data.defaultLang || items.find(item => item.isDefault)?.code || 'zh-CN'
      const current = languageOptions.value.find(item => item.value === locale.value)
      if (!current || current.disabled) setLocale((languageOptions.value.find(item => item.value === defaultCode && !item.disabled)?.value || 'zh-CN') as AppLocale)
      const missing = items.filter(item => !hasLocalePack(item.code)).map(item => item.code)
      if (missing.length) console.warn('[i18n] enabled languages without bundled language packs:', missing.join(', '))
    } catch { /* keep bundled fallback so login remains usable */ }
  }
  function setTheme(value: AppTheme) { theme.value = value; localStorage.setItem(THEME_KEY, value) }
  return { locale, theme, dark, menuCollapsed, languageOptions, languageVersion, setLocale, setTheme, loadLanguages }
})
