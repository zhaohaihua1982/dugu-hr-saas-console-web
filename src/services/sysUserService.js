import API_ENDPOINTS from '../config/api'
import { http } from './httpClient'

export const sysUserService = {
  list: params => http.get(API_ENDPOINTS.users.list, params),
  create: payload => http.post(API_ENDPOINTS.users.create, payload),
  update: (id, payload) => http.put(API_ENDPOINTS.users.update(id), payload),
  disable: id => http.delete(API_ENDPOINTS.users.disable(id)),
  unlock: id => http.post(API_ENDPOINTS.users.unlock(id)),
  freeze: id => http.post(API_ENDPOINTS.users.freeze(id)),
  unfreeze: id => http.post(API_ENDPOINTS.users.unfreeze(id)),
  resetPassword: id => http.post(API_ENDPOINTS.users.resetPassword(id)),
}
