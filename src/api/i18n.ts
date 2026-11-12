import http from '../utils/http'
import { endpoints } from './endpoints'

export type I18nResourceType = 'menu' | 'dict_item'

export interface I18nMeta {
  resType: I18nResourceType
  label: string
  fields: Record<string, number>
  langs: string[]
  defaultLang: string
}

export interface I18nTexts {
  resType: I18nResourceType
  resId: string
  label: string
  defaultLang: string
  defaultValue: Record<string, string>
  langs: string[]
  texts: Record<string, Record<string, string>>
}

export interface I18nTextsItem {
  id: string | number
  res_type: string
  res_id: string
  field: string
  texts: string
  lang_mask: number
  complete: number
  deleted_at: number
  created_at: string
  updated_at: string
}

export interface I18nTextsList {
  items: I18nTextsItem[]
  total: number
  page: number
  page_size: number
}

export interface I18nTextPayload {
  resType: I18nResourceType
  resId: string
  texts: Record<string, Record<string, string>>
}

export interface I18nDeleteItem {
  resType: I18nResourceType
  resId: string
  field: string
  lang: string
}

export interface I18nPendingItem {
  id?: string | number
  res_type?: string
  res_id?: string
  resId: string
  key: string
  field: string
  texts?: string
  lang_mask?: number
  complete?: number
  source?: string
  content?: string
}

export interface I18nPendingResult {
  resType: I18nResourceType
  lang: string
  items: I18nPendingItem[]
  total: number
  page: number
  page_size: number
}

export const i18nApi = {
  meta: (resType: I18nResourceType, silentError = false) =>
    http.get<never, I18nMeta>(endpoints.i18n.meta, { params: { resType }, silentError }),
  texts: (resType: I18nResourceType, resId: string) =>
    http.get<never, I18nTexts>(endpoints.i18n.texts, { params: { resType, resId } }),
  textsList: (resType: I18nResourceType, page: number, pageSize: number, field?: string) =>
    http.get<never, I18nTextsList>(endpoints.i18n.texts, { params: { resType, page, page_size: pageSize, field } }),
  save: (data: I18nTextPayload) => http.put<never, I18nTexts>(endpoints.i18n.texts, data),
  remove: (item: I18nDeleteItem) => http.delete(endpoints.i18n.texts, { params: item }),
  batchDelete: (items: I18nDeleteItem[]) =>
    http.post<never, { deleted: number }>(endpoints.i18n.batchDelete, { items }),
  pending: (resType: I18nResourceType, lang: string, page: number, pageSize: number) =>
    http.get<never, I18nPendingResult>(endpoints.i18n.pending, { params: { resType, lang, page, page_size: pageSize } }),
}
