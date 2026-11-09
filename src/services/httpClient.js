const TOKEN_KEY = 'dugu-access-token'

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) { super(message); this.name = 'ApiError'; this.status = status; this.payload = payload }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (response.status === 204) return null
  if (contentType.includes('application/json')) return response.json()
  return response.text()
}

export async function request(url, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 15000)
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body })
    const payload = await parseResponse(response)
    if (!response.ok || (payload && typeof payload === 'object' && payload.status !== undefined && payload.status !== 200)) {
      throw new ApiError(payload?.msg || payload?.message || payload?.error || `Request failed: ${response.status}`, payload?.status || response.status, payload)
    }
    return payload?.data ?? payload
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('请求超时，请稍后重试')
    throw error instanceof ApiError ? error : new ApiError('网络连接失败，请检查服务端状态')
  } finally { window.clearTimeout(timeout) }
}

export const http = {
  get: (url, params) => request(`${url}${params ? `?${new URLSearchParams(params)}` : ''}`),
  post: (url, body) => request(url, { method: 'POST', body }),
  put: (url, body) => request(url, { method: 'PUT', body }),
  delete: url => request(url, { method: 'DELETE' }),
}

export const tokenStore = { get: () => localStorage.getItem(TOKEN_KEY), set: value => localStorage.setItem(TOKEN_KEY, value), clear: () => localStorage.removeItem(TOKEN_KEY) }
