import http from '../utils/http'
import { endpoints } from './endpoints'
export const dictApi = { types: (params: Record<string, unknown>) => http.get(endpoints.dictTypes, { params }) }
