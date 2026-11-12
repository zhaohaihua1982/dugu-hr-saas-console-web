import http from '../utils/http'
import { endpoints } from './endpoints'

export interface LoginConfig {
  id?: string
  config_type: number
  scope_id?: string | number
  login_mask: number
  fail_threshold: number
  lock_minutes: number
  unlock_mode: number
  captcha_after_fails: number
  ip_fail_limit: number
  ip_rate_limit: number
  access_token_ttl: number
  refresh_token_ttl: number
  session_hard_ttl: number
  session_max_concurrent: number
  kick_on_pwd_change: number
  remember_days: number
  pwd_level: number
  pwd_min_length: number
  pwd_min_classes: number
  pwd_forbid_username: number
  pwd_max_age_days: number
  pwd_expire_action: number
  pwd_remind_days: number
  pwd_history_count: number
  pwd_force_first_change: number
  allow_self_change_pwd: number
  extras?: Record<string, unknown> | null
  version: number
  [key: string]: unknown
}

export const loginConfigApi = {
  getAdmin: async () => {
    const data = await http.get(endpoints.loginConfigsAdmin, { silentError: true }) as unknown as Omit<LoginConfig, 'config_type'>
    return { ...data, config_type: 1 } as LoginConfig
  },
  getTenant: async () => {
    const data = await http.get(endpoints.loginConfigsTenant, { silentError: true }) as unknown as Omit<LoginConfig, 'config_type'>
    const tenantRefreshTTL = 86400 * 30
    return {
      ...data,
      config_type: 2,
      refresh_token_ttl: tenantRefreshTTL,
      session_hard_ttl: Math.max(Number(data.session_hard_ttl || 0), tenantRefreshTTL),
    } as LoginConfig
  },
  update: (type: number, payload: LoginConfig) => http.put(`${endpoints.loginConfigs}/${type}`, payload) as unknown as Promise<{ version: number }>,
  reset: (type: number) => http.post(`${endpoints.loginConfigs}/${type}/reset`) as unknown as Promise<{ version: number }>,
}
