import http from '../utils/http'
import { endpoints } from './endpoints'

export interface OperationLog {
  id: string
  operator_id: string | number
  operator_name: string
  module: string
  action: string
  method: string
  route: string
  path: string
  target_id: string
  detail: string | Record<string, unknown> | null
  biz_status: number
  success: boolean | number
  cost_ms: number
  ip: string
  ua: string
  created_at: string
}
export interface OperationLogPage { list: OperationLog[]; total: number; page: number; page_size: number }
export interface OperationLogQuery { page: number; page_size: number; operator_id?: string; module?: string; action?: string; success?: number; start?: string; end?: string; keyword?: string }

export const operationLogApi = {
  list: (params: OperationLogQuery) => http.get<never, OperationLogPage>(endpoints.operlog, { params }),
}
