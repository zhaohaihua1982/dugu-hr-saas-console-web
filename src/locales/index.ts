import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import enUS from './en-US'
import jaJP from './ja-JP'
import koKR from './ko-KR'
import esES from './es-ES'

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES'
export type ServerMenuLocale = 'zh-CN' | 'zh-TW' | 'en-US'
export const LOCALE_KEY = 'dugu-lang'
export const localeOptions = [
  { value: 'zh-CN' as const, label: '中文' },
  { value: 'zh-TW' as const, label: '繁體中文' },
  { value: 'en-US' as const, label: 'English' },
  { value: 'ja-JP' as const, label: '日本語' },
  { value: 'ko-KR' as const, label: '한국어' },
  { value: 'es-ES' as const, label: 'Español' },
]

export function normalizeLocaleCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, '-').replace(/\.(ts|js|json)$/i, '')
}

const bundledLocaleCodes = new Set(localeOptions.map(item => normalizeLocaleCode(item.value)))
export function hasLocalePack(code: string) {
  const normalized = normalizeLocaleCode(code)
  return bundledLocaleCodes.has(normalized) || bundledLocaleCodes.has(normalized.split('-')[0])
}

export function toServerMenuLocale(locale: AppLocale): ServerMenuLocale {
  return locale === 'zh-CN' || locale === 'zh-TW' || locale === 'en-US' ? locale : 'en-US'
}

export const i18n = createI18n({ legacy: false, locale: (localStorage.getItem(LOCALE_KEY) as AppLocale) || 'zh-CN', fallbackLocale: 'zh-CN', messages: { 'zh-CN': zhCN, 'zh-TW': zhTW, 'en-US': enUS, 'ja-JP': jaJP, 'ko-KR': koKR, 'es-ES': esES } })
