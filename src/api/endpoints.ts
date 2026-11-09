const ADMIN = '/api/v1/admin'
export const endpoints = {
  auth: { captcha: `${ADMIN}/auth/captcha`, smsSend: `${ADMIN}/auth/sms/send`, passwordLogin: `${ADMIN}/auth/login/password`, smsLogin: `${ADMIN}/auth/login/sms`, logout: `${ADMIN}/auth/logout`, me: `${ADMIN}/auth/me` },
  sysuser: { list: `${ADMIN}/sys-users`, create: `${ADMIN}/sys-users`, update: (id: string) => `${ADMIN}/sys-users/${id}`, disable: (id: string) => `${ADMIN}/sys-users/${id}`, unlock: (id: string) => `${ADMIN}/sys-users/${id}/unlock`, resetPassword: (id: string) => `${ADMIN}/sys-users/${id}/reset-password` },
  loginlog: `${ADMIN}/login-logs`,
  menuTree: `${ADMIN}/menus/tree`,
  configs: `${ADMIN}/configs`,
  dictTypes: `${ADMIN}/dict-types`,
}
