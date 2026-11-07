const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1/admin'

// Keep every server URL in one place so the UI can be wired to any backend environment.
export const API_BASE_URL = baseURL.replace(/\/$/, '')
export const API_ENDPOINTS = {
  auth: {
    captcha: `${API_BASE_URL}/auth/captcha`,
    smsSend: `${API_BASE_URL}/auth/sms/send`,
    passwordLogin: `${API_BASE_URL}/auth/login/password`,
    smsLogin: `${API_BASE_URL}/auth/login/sms`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },
  users: {
    list: `${API_BASE_URL}/sys-users`,
    create: `${API_BASE_URL}/sys-users`,
    update: id => `${API_BASE_URL}/sys-users/${id}`,
    disable: id => `${API_BASE_URL}/sys-users/${id}`,
    unlock: id => `${API_BASE_URL}/sys-users/${id}/unlock`,
    freeze: id => `${API_BASE_URL}/sys-users/${id}/freeze`,
    unfreeze: id => `${API_BASE_URL}/sys-users/${id}/unfreeze`,
    resetPassword: id => `${API_BASE_URL}/sys-users/${id}/reset-password`,
  },
  loginLogs: `${API_BASE_URL}/login-logs`,
}

export default API_ENDPOINTS
