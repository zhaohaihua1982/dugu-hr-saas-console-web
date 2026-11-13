const ADMIN = '/api/v1/admin'
export const endpoints = {
  publicI18nLangs: '/api/v1/i18n/langs',
  auth: { captcha: `${ADMIN}/auth/captcha`, loginOptions: `${ADMIN}/login-options`, smsSend: `${ADMIN}/auth/sms/send`, passwordLogin: `${ADMIN}/auth/login/password`, smsLogin: `${ADMIN}/auth/login/sms`, logout: `${ADMIN}/auth/logout`, me: `${ADMIN}/auth/me` },
  sysuser: { list: `${ADMIN}/sys-users`, create: `${ADMIN}/sys-users`, update: (id: string) => `${ADMIN}/sys-users/${id}`, disable: (id: string) => `${ADMIN}/sys-users/${id}`, batchFreeze: `${ADMIN}/sys-users/batch-freeze`, batchUnfreeze: `${ADMIN}/sys-users/batch-unfreeze`, resetPassword: (id: string) => `${ADMIN}/sys-users/${id}/reset-password` },
  department: { tree: `${ADMIN}/departments`, create: `${ADMIN}/departments`, update: (id: string) => `${ADMIN}/departments/${id}`, remove: (id: string) => `${ADMIN}/departments/${id}` },
  loginlog: `${ADMIN}/login-logs`,
  operlog: `${ADMIN}/oper-logs`,
  menu: { tree: `${ADMIN}/menus/tree`, detail: (id: string) => `${ADMIN}/menus/${id}`, create: `${ADMIN}/menus`, update: (id: string) => `${ADMIN}/menus/${id}`, remove: (id: string) => `${ADMIN}/menus/${id}`, sort: `${ADMIN}/menus/sort` },
  i18n: { meta: `${ADMIN}/i18n/meta`, texts: `${ADMIN}/i18n/texts`, batchDelete: `${ADMIN}/i18n/texts/batch-delete`, pending: `${ADMIN}/i18n/pending`, publicLangs: '/api/v1/i18n/langs', adminLangs: `${ADMIN}/langs`, adminLang: (code: string) => `${ADMIN}/langs/${encodeURIComponent(code)}`, defaultLang: (code: string) => `${ADMIN}/langs/${encodeURIComponent(code)}/default` },
  configs: `${ADMIN}/configs`,
  loginConfigs: `${ADMIN}/login-configs`,
  loginConfigsAdmin: `${ADMIN}/login-configs-admin`,
  loginConfigsTenant: `${ADMIN}/login-configs-tenant`,
  dictTypes: `${ADMIN}/dict-types`,
  dictItems: `${ADMIN}/dict-items`,
}
