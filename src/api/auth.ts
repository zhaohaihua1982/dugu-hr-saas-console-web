import http from '../utils/http'
import { endpoints } from './endpoints'

export interface User { id: string; username: string; name: string; email: string; mobile: string; status: number; created_at: string }
export interface CaptchaResponse { captcha_id: string; image: string }
export interface LoginResponse { token: string; expires_in: number; user: User; password_stale: boolean }
export interface PublicLoginConfig { login_mask: number }

export const authApi = {
  captcha: () => http.post<never, CaptchaResponse>(endpoints.auth.captcha),
  loginOptions: () => http.get<never, PublicLoginConfig>(endpoints.auth.loginOptions, { silentError: true }),
  passwordLogin: (data: { identifier: string; password: string; captcha_id: string; captcha_code: string }) => http.post<never, LoginResponse>(endpoints.auth.passwordLogin, data),
  sendSms: (data: { mobile: string; captcha_id: string; captcha_code: string }) => http.post<never, string>(endpoints.auth.smsSend, data),
  smsLogin: (data: { mobile: string; code: string }) => http.post<never, LoginResponse>(endpoints.auth.smsLogin, data),
  logout: () => http.post(endpoints.auth.logout),
  me: () => http.get<never, { user: User; password_stale: boolean }>(endpoints.auth.me),
}
