import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import enUS from './en-US'

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en-US'
export type ServerMenuLocale = AppLocale
export const LOCALE_KEY = 'dugu-lang'
export const localeOptions = [
  { value: 'zh-CN' as const, label: '中文' },
  { value: 'zh-TW' as const, label: '繁體中文' },
  { value: 'en-US' as const, label: 'English' },
]

export function toServerMenuLocale(locale: AppLocale): ServerMenuLocale {
  return locale
}

export const i18n = createI18n({ legacy: false, locale: (localStorage.getItem(LOCALE_KEY) as AppLocale) || 'zh-CN', fallbackLocale: 'zh-CN', messages: { 'zh-CN': zhCN, 'zh-TW': zhTW, 'en-US': enUS } })
