import type { RouteRecordRaw } from 'vue-router'
import BasicLayout from '../layouts/BasicLayout.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/login/LoginView.vue'), meta: { title: 'login.title', hidden: true } },
  { path: '/', component: BasicLayout, redirect: '/welcome', children: [
    { path: '/welcome', name: 'welcome', component: () => import('../views/shared/WelcomeView.vue'), meta: { title: 'layout.welcome', hidden: true } },
    { path: '/organization/users', name: 'users', component: () => import('../views/sysuser/UserListView.vue'), meta: { title: 'menu.user', group: 'menu.organization', icon: 'Users', sort: 10 } },
    { path: '/organization/departments', name: 'departments', component: () => import('../views/dept/DeptListView.vue'), meta: { title: 'menu.department', group: 'menu.organization', icon: 'Building2', sort: 20 } },
    { path: '/permission/menus', name: 'menus', component: () => import('../views/menu/MenuView.vue'), meta: { title: 'menu.menu', group: 'menu.permission', icon: 'ShieldCheck', sort: 20 } },
    { path: '/tenant/list', name: 'tenants', component: () => import('../views/tenant/TenantView.vue'), meta: { title: 'menu.tenantList', group: 'menu.tenant', icon: 'Building2', sort: 30 } },
    { path: '/tools/files', name: 'files', component: () => import('../views/file/FileView.vue'), meta: { title: 'menu.file', group: 'menu.tools', icon: 'FolderOpen', sort: 40 } },
    { path: '/tools/i18n', name: 'i18n-texts', component: () => import('../views/i18n/I18nView.vue'), meta: { title: 'menu.i18n', group: 'menu.tools', icon: 'Languages', sort: 41 } },
    { path: '/operations/site', name: 'site-config', component: () => import('../views/config/SiteConfigView.vue'), meta: { title: 'menu.siteConfig', group: 'menu.operations', icon: 'Settings', sort: 50 } },
    { path: '/operations/login', name: 'login-config', component: () => import('../views/config/LoginConfigView.vue'), meta: { title: 'menu.loginConfig', group: 'menu.operations', icon: 'KeyRound', sort: 51 } },
    { path: '/operations/dictionary', name: 'dictionary', component: () => import('../views/dict/DictView.vue'), meta: { title: 'menu.dictionary', group: 'menu.operations', icon: 'BookOpen', sort: 52 } },
    { path: '/operations/login-logs', name: 'login-logs', component: () => import('../views/loginlog/LoginLogView.vue'), meta: { title: 'menu.loginLog', group: 'menu.operations', parent: 'menu.auditLog', icon: 'FileText', sort: 53 } },
    { path: '/operations/operation-logs', name: 'operation-logs', component: () => import('../views/operlog/OperationLogView.vue'), meta: { title: 'menu.operationLog', group: 'menu.operations', parent: 'menu.auditLog', icon: 'FileText', sort: 54 } },
  ] },
]
