import http from '../utils/http'
import { endpoints } from './endpoints'

export type MenuType = 1 | 2 | 3
export interface MenuItem {
  id: string
  parent_id: string
  name: string
  names?: Record<string, string>
  type: MenuType
  path: string
  component: string
  icon: string
  sort: number
  id_path: string
  visible: boolean
  status: number
  code: string
  remark: string
  created_at: string
  children?: MenuItem[]
}
export interface MenuPayload {
  parent_id: string
  name: string
  names: Record<string, string>
  type: MenuType
  path: string
  component: string
  icon: string
  sort: number
  visible: boolean
  status: number
  code: string
  remark: string
}
export interface MenuSortItem { id: string; sort: number }
export interface MenuSortResult { id: string; success: boolean; code?: number }

export const menuApi = {
  tree: (lang: string, silentError = false) => http.get<never, MenuItem[]>(endpoints.menu.tree, { params: { lang }, silentError }),
  detail: (id: string) => http.get<never, MenuItem>(endpoints.menu.detail(id)),
  create: (data: MenuPayload) => http.post<never, MenuItem>(endpoints.menu.create, data),
  update: (id: string, data: MenuPayload) => http.put<never, MenuItem>(endpoints.menu.update(id), data),
  remove: (id: string) => http.delete(endpoints.menu.remove(id)),
  sort: (items: MenuSortItem[]) => http.post<never, MenuSortResult[]>(endpoints.menu.sort, { items }),
}
