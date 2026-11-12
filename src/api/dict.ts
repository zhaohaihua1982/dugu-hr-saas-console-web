import http from '../utils/http'
import { endpoints } from './endpoints'

export interface DictType { id: string; code: string; name: string; status: number; remark?: string; itemCount?: number }
export interface DictItem { id?: string; typeId?: string; typeCode?: string; label: string; value: string; sort?: number; status?: number; remark?: string; labels?: Record<string, string> }
export interface DictTypePage { list?: DictType[]; items?: DictType[]; total: number; page: number; pageSize?: number; page_size?: number }
export interface DictItemPayload { typeCode: string; value: string; label: string; sort?: number; status?: number; remark?: string }

export const dictApi = {
  types: (params: Record<string, unknown>) => http.get(endpoints.dictTypes, { params }) as unknown as Promise<DictTypePage>,
  createType: (payload: Record<string, unknown>) => http.post(endpoints.dictTypes, payload),
  updateType: (id: string, payload: Record<string, unknown>) => http.put(`${endpoints.dictTypes}/${id}`, payload),
  setTypeStatus: (id: string, status: number) => http.post(`${endpoints.dictTypes}/${id}/status`, { status }),
  removeType: (id: string) => http.delete(`${endpoints.dictTypes}/${id}`),
  items: (params: Record<string, unknown>) => http.get(endpoints.dictItems, { params }) as unknown as Promise<DictItem[]>,
  item: (id: string) => http.get(`${endpoints.dictItems}/${id}`) as unknown as Promise<DictItem>,
  createItem: (payload: DictItemPayload) => http.post(endpoints.dictItems, payload),
  updateItem: (id: string, payload: DictItemPayload) => http.put(`${endpoints.dictItems}/${id}`, payload),
  setItemStatus: (id: string, status: number) => http.post(`${endpoints.dictItems}/${id}/status`, { status }),
  removeItem: (id: string) => http.delete(`${endpoints.dictItems}/${id}`),
}
