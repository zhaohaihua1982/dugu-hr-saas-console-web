# AGENTS.md — 参考 vue3-antdv-admin 重构本前端项目

给 AI 的总指令。执行前先通读本文件，按「迁移策略」分步做，**每一步结束必须可构建、可运行**，不许一次性大爆炸重写后交付。

> 全项目通用规范见 `../dugu-hr-saas-admin/docs/AI开发规范.md`（铁律、接口契约、多语言与主题的一等能力约定），与本文件冲突时以规范为准。

## 1. 背景与路径

| 项 | 路径 |
|---|---|
| 本项目（要重构的前端） | `/Users/Admin1/Dugu/workspace/dugu-hr-saas-console-web` |
| 后端（Go，只读参照） | `/Users/Admin1/Dugu/workspace/dugu-hr-saas-admin` |
| 参考仓（只读） | `/Users/Admin1/Dugu/workspace/vue3-antdv-admin` |

现状：`src/App.vue` 214 行单页（登录 + 用户管理混在一起）、无路由、无状态管理、`src/services/httpClient.js` 手写 fetch、纯 JS。目标是改成参考仓那样的工程化中后台结构。

## 2. 参考仓使用规则（红线）

1. 参考仓**只读**。禁止从任何绝对/相对路径 import 参考仓代码；要复用的代码必须拷贝进本项目 `src/` 并适配。
2. 参考仓是 **pnpm monorepo**：它的 `src/components/BasicTable`、`BasicForm` 等会 import `packages/` 内部模块或 workspace 包。**拷贝任何组件前，先递归检查其全部 import**，把内部依赖内联进组件，或换成可从 npm 安装的等价包；断链依赖一律不允许出现。
3. 可以读参考仓根目录的 `AGENTS.md` 和 `docs/` 来理解它的工程约定，但**只学模式，不照抄视觉**——页面布局和配色由本项目自定，保持与现有 `admin.css` 风格一致即可。
4. 拷贝的代码必须裁剪：删掉本项目用不到的 props/插槽/逻辑，注释保留关键部分。禁止"整文件搬运、原样不动"。

## 3. 技术栈决策（已定死，不要自作主张换方案）

| 项 | 决策 | 说明 |
|---|---|---|
| 语言 | **TypeScript** | 新文件一律 `.ts` / `<script setup lang="ts">`；旧 `.js` 迁移完成后删除，不留双轨 |
| 路由 | **vue-router 4** | 静态路由 + meta 生成菜单（见 §5） |
| 状态 | **pinia** | auth store（token + 用户信息）+ app store（菜单折叠等） |
| 请求 | **axios** 替换手写 fetch | 拦截器模式对齐参考仓 `src/utils/http/axios/` |
| UI | ant-design-vue **4.2.6 保留** | 不升级、不降级；图标可继续用 lucide-vue-next |
| i18n | **vue-i18n**（框架一等能力，带切换入口） | 顶栏语言切换；选择持久化 localStorage `dugu-lang`；默认语言取后端 `site_lang`，缺失回退 zh-CN；zh-CN 全量，en-US 允许缺词条（回退 zh-CN），**禁止界面出现裸 key**；menu.json 的 zh/zh-TW/en 语义由语言包承接 |
| 主题 | **antdv ConfigProvider theme token**（框架一等能力） | 明/暗切换 + 品牌色 token；选择持久化 localStorage `dugu-theme`，默认取后端 `site_theme`；颜色一律走 token / CSS 变量，**组件内禁止写死色值**（含图表、图标、边框） |
| 包管理 | **npm**（保持现状） | 不换 pnpm，不改 lock 文件策略 |
| 明确不引入 | tailwind / unocss、MSW/mock、标签页缓存 | 多语言与主题是**必须做**的一等能力，不在不引入之列；其余为降低重构风险 |

## 4. 请求层规范

- 目录：`src/api/` 按后端模块分文件（`auth.ts`、`sysuser.ts`、`menu.ts`、`config.ts`、`dict.ts`、`loginlog.ts`），URL 端点集中在 `src/api/endpoints.ts`。
- axios 实例要求：
  - `baseURL` 读 `import.meta.env.VITE_API_BASE`，`.env.development` 默认 `http://localhost:8080`；
  - 超时 15s；
  - 请求拦截器：从 auth store 读 token，注入 `Authorization: Bearer <token>`；
  - 响应拦截器：后端包装为 `{status, msg, data}`（注意 status 是业务码）。`status === 200` 返回 `data`；`30001/30002`（登录失效/未登录）→ 清 token 跳 `/login`；其他非 200 → `message.error(msg)` 并抛出业务错误对象；
  - 保留现有 `ApiError` 语义（status + payload），方便页面按业务码分支。
- token 存储：pinia auth store + localStorage 持久化，**key 保持 `dugu-access-token`**（与后端现有联调不破坏）。

## 5. 路由与菜单

- 静态路由定义在 `src/router/routes.ts`，每条路由 meta 携带 `{ title, icon, hidden, sort }`；侧边菜单树由路由表推导，**替代现有 `src/data/menu.json`**（menu.json 删除）。
- 保持 menu.json 现有的分组语义：组织管理 → 用户管理；系统运维 → 网站配置 / 登录配置 / 登录日志；权限管控 → 菜单管理；租户管理、文件管理为骨架页。
- 路由守卫：无 token 一律跳 `/login`（白名单仅 `/login`）；登录后访问 `/login` 跳首页。
- **本期不接后端动态菜单**（后端 `GET /api/v1/admin/menus/tree` 方案未定稿）：在 `src/api/menu.ts` 里留好 service 方法与 `// TODO: 切换为后端动态路由` 注释即可，不实现切换逻辑。

## 6. 布局与页面

- `src/layouts/BasicLayout.vue`：左侧菜单（分组可折叠）+ 顶栏（**语言切换、主题切换**、当前用户、退出登录）+ `<router-view>` 内容区。语言与主题的读取顺序：localStorage 本地选择 > 后端 `site_lang` / `site_theme`（登录后从 `GET /configs` 的 site 组取）> 内置默认；两个选择入口在顶栏，切换即时生效并持久化。
- `/login`：账号密码 / 短信验证码两个 tab。**先读后端 `api/v1/auth/` 的 handler 与 DTO 确认字段名和验证码流程**（captcha 接口、图形码返回方式），不要凭参考仓猜。
- 页面清单（按后端接口是否已实现分两种处理）：
  1. **登录页**、**用户管理**（列表分页 + 新建 + 编辑 + 重置密码 + 停用/启用）：后端已有，接真实接口；
  2. 菜单管理、网站配置、登录配置、字典、登录日志：先读后端 `routes/router.go`——路由存在则接真实接口，不存在则建**骨架页**（antd 空态 Empty + "接口待后端实现"文案），禁止 mock 假数据假装完成。
- 后端接口的字段命名以 Go 侧 JSON tag 为准，先读 `api/v1/` 各 DTO 再写前端类型，不许凭空定义。

## 7. 目录结构（目标形态，对齐参考仓分法）

```
src/
├── api/            按模块的接口封装 + endpoints.ts
├── components/     通用组件（从参考仓拷贝并裁剪的 BasicTable 等）
├── hooks/          usePagination、useLoading 等
├── layouts/        BasicLayout.vue
├── locales/        vue-i18n 语言包（zh-CN 全量；en-US 可渐进补全，机制必须完整）
├── router/         routes.ts + index.ts（守卫在这里）
├── store/          modules/auth.ts、app.ts
├── utils/          http 实例、工具函数
└── views/          login/、sysuser/、menu/、config/、dict/、loginlog/
```

## 8. 迁移策略（必须按顺序分步交付）

- **P0 基建**：引入 TS 配置、router、pinia、axios 封装、vue-i18n、BasicLayout、登录页迁移。完成标志：`npm run build` 通过，登录 → 进入空布局 → 退出全链路可用。
- **P1 用户管理**：列表（分页、搜索）、新建/编辑 Modal 表单、重置密码、停用。完成标志：连本地后端全流程手工可走。
- **P2 其余页面**：按 §6 第 2 类处理（真实接口或骨架页）。
- 每步完成后删除对应的旧代码（`src/services/*`、`src/data/menu.json` 在 P0/P1 完成后移除），**不许新旧两套并存到收尾**。

## 9. 验收标准

1. `npm run build` 通过、`vue-tsc`（如引入）无类型错误；
2. 登录（密码 + 短信）→ 布局 → 用户管理增改查 → 退出，全链路连本地后端可用；
3. 401/登录失效自动跳 `/login` 并清 token；接口报错统一右上角 message，页面不白屏；
4. 顶栏可切换语言与明暗主题：切换即时生效、刷新后保持（localStorage）；界面无裸 key、组件无写死色值；默认值跟随后端 `site_lang` / `site_theme`（缺失回退内置）；
5. 目录结构与 §7 一致；全项目 grep 不到对参考仓路径的任何引用；
6. 旧文件（App.vue 单页、services/、menu.json）已删除，不留死代码。

## 10. 明确不做

- 不改后端仓库 `/Users/Admin1/Dugu/workspace/dugu-hr-saas-admin`（发现接口不满足需求，在产出说明里列出，等后端补）；
- 不做按钮级权限指令（后端 action_code 方案未上线）；
- 不做动态路由切换、标签页缓存；i18n 与主题的**机制必须完整**（切换、持久化、回退），en-US 词条与更多主题预设允许渐进补全。

---

执行中有与本文件冲突的决策（例如后端实际字段与假设不符），**停下来说明差异并给出建议，不要自行猜测兜底**。
