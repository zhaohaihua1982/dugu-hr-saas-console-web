import http from '../utils/http'
import { endpoints } from './endpoints'
export interface SysUser { id: string; username: string; name: string; email: string; mobile: string; status: number; created_at: string }
export interface UserPage { items: SysUser[]; total: number; page: number; page_size: number }
export const sysuserApi = {
  list: (params: Record<string, unknown>) => http.get<never, UserPage>(endpoints.sysuser.list, { params }),
  create: (data: Record<string, unknown>) => http.post(endpoints.sysuser.create, data),
  update: (id: string, data: Record<string, unknown>) => http.put(endpoints.sysuser.update(id), data),
  disable: (id: string) => http.delete(endpoints.sysuser.disable(id)),
  unlock: (id: string) => http.post(endpoints.sysuser.unlock(id)),
  resetPassword: (id: string, password: string) => http.post(endpoints.sysuser.resetPassword(id), { password }),
}
