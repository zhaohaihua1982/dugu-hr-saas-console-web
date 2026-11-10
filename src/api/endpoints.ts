const ADMIN = '/api/v1/admin'
export const endpoints = {
  auth: { captcha: `${ADMIN}/auth/captcha`, smsSend: `${ADMIN}/auth/sms/send`, passwordLogin: `${ADMIN}/auth/login/password`, smsLogin: `${ADMIN}/auth/login/sms`, logout: `${ADMIN}/auth/logout`, me: `${ADMIN}/auth/me` },
  sysuser: { list: `${ADMIN}/sys-users`, create: `${ADMIN}/sys-users`, update: (id: string) => `${ADMIN}/sys-users/${id}`, disable: (id: string) => `${ADMIN}/sys-users/${id}`, batchFreeze: `${ADMIN}/sys-users/batch-freeze`, batchUnfreeze: `${ADMIN}/sys-users/batch-unfreeze`, resetPassword: (id: string) => `${ADMIN}/sys-users/${id}/reset-password` },
  loginlog: `${ADMIN}/login-logs`,
  menu: { tree: `${ADMIN}/menus/tree`, detail: (id: string) => `${ADMIN}/menus/${id}`, create: `${ADMIN}/menus`, update: (id: string) => `${ADMIN}/menus/${id}`, remove: (id: string) => `${ADMIN}/menus/${id}`, sort: `${ADMIN}/menus/sort` },
  i18n: { meta: `${ADMIN}/i18n/meta`, texts: `${ADMIN}/i18n/texts`, batchDelete: `${ADMIN}/i18n/texts/batch-delete`, pending: `${ADMIN}/i18n/pending` },
  configs: `${ADMIN}/configs`,
  dictTypes: `${ADMIN}/dict-types`,
}
