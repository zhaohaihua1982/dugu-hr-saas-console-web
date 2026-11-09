import http from '../utils/http'
import { endpoints } from './endpoints'

export const menuApi = {
  // TODO: 切换为后端动态路由，当前菜单由静态路由 meta 生成。
  tree: (lang: string) => http.get(endpoints.menuTree, { params: { lang } }),
}
