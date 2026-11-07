import API_ENDPOINTS from '../config/api'
import { http, tokenStore } from './httpClient'

export const authService = {
  passwordLogin: async payload => { const data = await http.post(API_ENDPOINTS.auth.passwordLogin, payload); if (data?.token) tokenStore.set(data.token); return data },
  smsLogin: async payload => { const data = await http.post(API_ENDPOINTS.auth.smsLogin, payload); if (data?.token) tokenStore.set(data.token); return data },
  sendSms: payload => http.post(API_ENDPOINTS.auth.smsSend, payload),
  currentUser: () => http.get(API_ENDPOINTS.auth.me),
  logout: async () => { try { await http.post(API_ENDPOINTS.auth.logout) } finally { tokenStore.clear() } },
}
