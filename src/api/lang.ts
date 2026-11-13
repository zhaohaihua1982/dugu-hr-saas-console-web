import http from '../utils/http'
import { endpoints } from './endpoints'

export interface PublicLanguage { code: string; nativeName: string; isDefault?: boolean; sort?: number }
export interface PublicLanguageResult { items: PublicLanguage[]; defaultLang: string; version: string }
export interface AdminLanguage extends PublicLanguage { id: string; name: string; bitIndex: number; enabled: boolean | number; remark?: string; usage?: number }

export const langApi = {
  public: () => http.get<never, PublicLanguageResult>(endpoints.i18n.publicLangs, { silentError: true }),
  list: () => http.get<never, { items: AdminLanguage[]; total?: number; defaultLang?: string; version?: string }>(endpoints.i18n.adminLangs),
  create: (payload: { code: string; name: string; nativeName: string; sort?: number; remark?: string }) => http.post(endpoints.i18n.adminLangs, payload),
  update: (code: string, payload: { name?: string; nativeName?: string; sort?: number; enabled?: number; remark?: string }) => http.put(endpoints.i18n.adminLang(code), payload),
  setDefault: (code: string) => http.put(endpoints.i18n.defaultLang(code)),
  usage: (code: string) => http.get(endpoints.i18n.adminLang(code) + '/usage'),
}
