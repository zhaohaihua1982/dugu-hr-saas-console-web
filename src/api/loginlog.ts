import http from '../utils/http'
import { endpoints } from './endpoints'
export interface LoginLog { id: string; user_id: string; identifier_mask: string; login_type: string; ident_via: string; success: boolean; fail_reason: string; ip: string; ua: string; created_at: string }
export interface LoginLogPage { items: LoginLog[]; total: number; page: number; page_size: number }
export const loginLogApi = { list: (params: Record<string, unknown>) => http.get<never, LoginLogPage>(endpoints.loginlog, { params }) }
