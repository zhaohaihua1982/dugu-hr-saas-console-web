import http from '../utils/http'
import { endpoints } from './endpoints'

export interface Department {
  id: string
  parent_id: string
  path: string
  name: string
  sort: number
  status: number
  remark: string
  created_at: string
  children?: Department[]
}
export interface DepartmentPayload { parent_id: string; name: string; sort: number; status?: number; remark: string }

export const departmentApi = {
  tree: (silentError = false) => http.get<never, Department[]>(endpoints.department.tree, { silentError }),
  create: (data: DepartmentPayload) => http.post<never, Department>(endpoints.department.create, data),
  update: (id: string, data: Required<DepartmentPayload>) => http.put<never, Department>(endpoints.department.update(id), data),
  remove: (id: string) => http.delete(endpoints.department.remove(id)),
}
