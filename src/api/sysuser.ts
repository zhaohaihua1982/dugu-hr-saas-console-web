import http from '../utils/http'
import { endpoints } from './endpoints'
export interface SysUser { id: string; username: string; name: string; email: string; mobile: string; status: number; created_at: string; is_current: boolean; dept_id?: string | null; dept_name?: string | null }
export interface UserPage { items: SysUser[]; total: number; page: number; page_size: number }
export interface BatchItemResult { id: string; success: boolean; code?: number }
export interface BatchResult { items: BatchItemResult[]; succeeded: number; failed: number }
export const sysuserApi = {
  list: (params: Record<string, unknown>) => http.get<never, UserPage>(endpoints.sysuser.list, { params }),
  create: (data: Record<string, unknown>) => http.post(endpoints.sysuser.create, data),
  update: (id: string, data: Record<string, unknown>) => http.put(endpoints.sysuser.update(id), data),
  setStatus: (id: string, status: 1 | 2) => http.put(endpoints.sysuser.update(id), { status }),
  batchFreeze: (ids: string[], minutes: number) => http.post<never, BatchResult>(endpoints.sysuser.batchFreeze, { ids, minutes }),
  batchUnfreeze: (ids: string[]) => http.post<never, BatchResult>(endpoints.sysuser.batchUnfreeze, { ids }),
  resetPassword: (id: string, password: string) => http.post(endpoints.sysuser.resetPassword(id), { password }),
}
