import axios, { AxiosError, type AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'
import { TOKEN_KEY } from '../store/modules/auth'

declare module 'axios' {
  interface AxiosRequestConfig { silentError?: boolean }
}

interface ApiEnvelope<T> { status: number; msg: string; data: T }
export class ApiError extends Error {
  constructor(messageText: string, public status = 0, public payload: unknown = null) { super(messageText); this.name = 'ApiError' }
}

let redirecting = false
function localMessage(kind: 'timeout' | 'network') {
  const locale = localStorage.getItem('dugu-lang')
  if (locale === 'en-US') return kind === 'timeout' ? 'Request timed out. Please try again.' : 'Network connection failed. Check the server status.'
  if (locale === 'zh-TW') return kind === 'timeout' ? '請求逾時，請稍後重試' : '網路連線失敗，請檢查服務端狀態'
  return kind === 'timeout' ? '请求超时，请稍后重试' : '网络连接失败，请检查服务端状态'
}
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8080',
  timeout: 15000,
  transformResponse: [(raw: string) => {
    if (typeof raw !== 'string' || !raw) return raw
    return JSON.parse(raw.replace(/("(?:id|user_id)"\s*:\s*)(\d{16,})/g, '$1"$2"'))
  }],
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  const locale = localStorage.getItem('dugu-lang') || 'zh-CN'
  config.headers['Accept-Language'] = locale
  return config
})

http.interceptors.response.use(((response: AxiosResponse<ApiEnvelope<unknown>>) => {
  const payload = response.data
  if (!payload || typeof payload.status !== 'number') return response.data
  if (payload.status === 200) return payload.data
  const error = new ApiError(payload.msg || 'Request failed', payload.status, payload)
  if (payload.status === 30001 || payload.status === 30002) {
    localStorage.removeItem(TOKEN_KEY)
    if (!redirecting) { redirecting = true; window.setTimeout(() => { window.location.replace(`${import.meta.env.BASE_URL}login`) }, 0) }
  } else if (!response.config.silentError) message.error(error.message)
  return Promise.reject(error)
}) as never, (error: AxiosError<{ msg?: string }>) => {
  const apiError = new ApiError(error.code === 'ECONNABORTED' ? localMessage('timeout') : error.response?.data?.msg || localMessage('network'), error.response?.status || 0, error.response?.data)
  if (!error.config?.silentError) message.error(apiError.message)
  return Promise.reject(apiError)
})

export default http
