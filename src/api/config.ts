import http from '../utils/http'
import { endpoints } from './endpoints'
export const configApi = { get: () => http.get(endpoints.configs) }
