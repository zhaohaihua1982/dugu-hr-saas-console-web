import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { TOKEN_KEY } from '../store/modules/auth'

export const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  const hasToken = Boolean(localStorage.getItem(TOKEN_KEY))
  if (!hasToken && to.path !== '/login') return { path: '/login', query: { redirect: to.fullPath } }
  if (hasToken && to.path === '/login') return '/'
  return true
})

declare module 'vue-router' { interface RouteMeta { title: string; group?: string; icon?: string; hidden?: boolean; sort?: number } }
