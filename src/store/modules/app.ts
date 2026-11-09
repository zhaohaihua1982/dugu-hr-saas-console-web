import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { i18n, LOCALE_KEY, type AppLocale } from '../../locales'

export type AppTheme = 'light' | 'dark' | 'brand'
export const THEME_KEY = 'dugu-theme'

export const useAppStore = defineStore('app', () => {
  const locale = ref<AppLocale>((localStorage.getItem(LOCALE_KEY) as AppLocale) || 'zh-CN')
  const theme = ref<AppTheme>((localStorage.getItem(THEME_KEY) as AppTheme) || 'brand')
  const menuCollapsed = ref(false)
  const dark = computed(() => theme.value === 'dark')
  function setLocale(value: AppLocale) { locale.value = value; i18n.global.locale.value = value; localStorage.setItem(LOCALE_KEY, value) }
  function setTheme(value: AppTheme) { theme.value = value; localStorage.setItem(THEME_KEY, value) }
  return { locale, theme, dark, menuCollapsed, setLocale, setTheme }
})
