<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { Activity, Bell, BookOpen, Building2, CalendarDays, ChevronDown, CircleHelp, Clock3, Copy, ExternalLink, FileText, Globe2, KeyRound, LayoutDashboard, LogOut, Mail, Menu, MoreHorizontal, Network, Palette, PanelLeftClose, PanelLeftOpen, Phone, Search, Settings2, ShieldCheck, UserRound, Users, X } from 'lucide-vue-next'
import menuData from './data/menu.json'
import API_ENDPOINTS from './config/api'
import { authService } from './services/authService'
import { request } from './services/httpClient'

const loggedIn = ref(localStorage.getItem('dugu-authenticated') === 'true')
const mode = ref('account')
const lang = ref(localStorage.getItem('dugu-language') || 'zh')
const theme = ref(localStorage.getItem('dugu-theme') || 'ocean')
const loading = ref(false)
const mobile = ref(false)
const languageOpen = ref(false)
const accountOpen = ref(false)
const sectionCollapsed = ref(false)
const activeModule = ref('organization-management')
const active = ref('user-management')
const openTabs = ref(['user-management'])
const tabMenuKey = ref(null)
const tabMoreOpen = ref(false)
const expandedDirectories = ref(['log-audit'])
const form = ref({ account: 'admin@dugu.com', password: '', phone: '', code: '' })
const captchaInput = ref('')
const captchaCode = ref('')
const captchaId = ref('')
const captchaImage = ref('')
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'
const userKeyword = ref('')
const userStatus = ref('all')
const userModalOpen = ref(false)
const userRefreshing = ref(false)
const selectedUserIds = ref([])
const userEditingId = ref(null)
const userForm = ref({ name: '', username: '', mobile: '', email: '', status: 1 })
const users = ref([
  { id: 1, name: '林晓', username: 'linxiao', mobile: '138****8000', email: 'lin.xiao@dugu.com', status: 1, lastLogin: '2024-11-06 14:32', ip: '10.20.1.18' },
  { id: 2, name: '周明', username: 'zhouming', mobile: '139****1268', email: 'zhou.ming@dugu.com', status: 1, lastLogin: '2024-11-06 10:08', ip: '10.20.1.24' },
  { id: 3, name: '陈可', username: 'chenke', mobile: '186****9077', email: 'chen.ke@dugu.com', status: 2, lastLogin: '2024-10-29 16:50', ip: '10.20.1.33' },
  { id: 4, name: '王岩', username: 'wangyan', mobile: '137****4112', email: 'wang.yan@dugu.com', status: 3, lastLogin: '2024-10-18 09:21', ip: '10.20.1.41' }
])
const filteredUsers = computed(() => users.value.filter(user => {
  const keywordMatch = !userKeyword.value || [user.name, user.username, user.mobile, user.email].some(value => value.toLowerCase().includes(userKeyword.value.toLowerCase()))
  return keywordMatch && (userStatus.value === 'all' || String(user.status) === userStatus.value)
}))

const languages = [{ value: 'zh', label: '中文' }, { value: 'zh-TW', label: '繁體中文' }, { value: 'en', label: 'English' }]
const themes = [{ value: 'ocean', label: '深海蓝' }, { value: 'sky', label: '天空蓝' }, { value: 'graphite', label: '石墨灰' }]
const words = {
  zh: { welcome: '欢迎回来', hint: '登录独孤人事管理系统，开始今天的工作', account: '账号密码', sms: '手机短信', login: '登录', accountLabel: '账号', password: '密码', phone: '手机号', code: '短信验证码', forgot: '忘记密码？', getCode: '获取验证码', dashboard: '工作台', employees: '员工管理', organization: '组织架构', attendance: '考勤与假勤', payroll: '薪酬管理', settings: '系统设置', help: '帮助中心', greeting: '下午好', today: '今天也要高效地完成工作。', search: '搜索员工、部门或功能', workspace: '人事管理', calendar: '查看日历', overview: '总览', people: '人员', time: '考勤', salary: '薪酬', system: '系统' },
  'zh-TW': { welcome: '歡迎回來', hint: '登入獨孤人事管理系統，開始今天的工作', account: '帳號密碼', sms: '手機簡訊', login: '登入', accountLabel: '帳號', password: '密碼', phone: '手機號碼', code: '簡訊驗證碼', forgot: '忘記密碼？', getCode: '取得驗證碼', dashboard: '工作台', employees: '員工管理', organization: '組織架構', attendance: '考勤與假勤', payroll: '薪酬管理', settings: '系統設定', help: '幫助中心', greeting: '午安', today: '今天也要高效完成工作。', search: '搜尋員工、部門或功能', workspace: '人事管理', calendar: '查看日曆', overview: '總覽', people: '人員', time: '考勤', salary: '薪酬', system: '系統' },
  en: { welcome: 'Welcome back', hint: 'Sign in to Dugu People OS and start your day', account: 'Password', sms: 'SMS code', login: 'Sign in', accountLabel: 'Account', password: 'Password', phone: 'Phone number', code: 'Verification code', forgot: 'Forgot password?', getCode: 'Get code', dashboard: 'Dashboard', employees: 'Employees', organization: 'Organization', attendance: 'Attendance', payroll: 'Payroll', settings: 'Settings', help: 'Help center', greeting: 'Good afternoon', today: 'Make today productive.', search: 'Search people, teams or features', workspace: 'HR Management', calendar: 'View calendar', overview: 'Overview', people: 'People', time: 'Time', salary: 'Payroll', system: 'System' }
}
const t = computed(() => words[lang.value])
const iconMap = { Activity, BookOpen, Building2, Clock3, FileText, Globe2, KeyRound, LayoutDashboard, Menu, Network, Settings2, ShieldCheck, Users }
const menuLabel = item => item.label?.[lang.value] || item.label?.zh || item.id
const currentModule = computed(() => menuData.find(item => item.id === activeModule.value) || menuData[0])
const flattenMenu = items => items.flatMap(item => [
  ...(item.type === 'menu' ? [{ k: item.id, label: menuLabel(item), icon: iconMap[item.icon] || FileText }] : []),
  ...flattenMenu(item.children || [])
])
const nav = computed(() => flattenMenu(menuData))
const activeLabel = computed(() => nav.value.find(item => item.k === active.value)?.label || '')

async function refreshCaptcha() { if (useMock) { captchaCode.value = Math.random().toString(36).slice(2, 6).toUpperCase(); captchaImage.value = ''; return } try { const data = await request(API_ENDPOINTS.auth.captcha); captchaId.value = data?.captchaId || data?.id || ''; captchaImage.value = data?.image || data?.imageBase64 || data?.captchaImage || (typeof data === 'string' && (data.startsWith('data:') || data.startsWith('http')) ? data : ''); captchaCode.value = data?.code || data?.captcha || data?.captchaCode || (typeof data === 'string' && !captchaImage.value ? data : '') } catch (error) { message.error(error.message) } }
async function submit() { if (mode.value === 'account' && (!form.value.account || !form.value.password || !captchaInput.value)) return message.warning(lang.value === 'en' ? 'Please complete account, password and captcha' : '请填写账号、密码和验证码'); if (mode.value === 'sms' && (!form.value.phone || !form.value.code)) return message.warning(lang.value === 'en' ? 'Please complete your login details' : '请完整填写登录信息'); if (mode.value === 'account' && captchaInput.value.toUpperCase() !== captchaCode.value) { refreshCaptcha(); captchaInput.value = ''; return message.error(lang.value === 'en' ? 'Invalid captcha' : '验证码错误') } loading.value = true; try { if (!useMock && mode.value === 'account') await authService.passwordLogin({ identifier: form.value.account, password: form.value.password, captcha_token: captchaInput.value }); if (!useMock && mode.value === 'sms') await authService.smsLogin({ mobile: form.value.phone, code: form.value.code }); loggedIn.value = true; localStorage.setItem('dugu-authenticated', 'true') } catch (error) { message.error(error.message); refreshCaptcha() } finally { loading.value = false } }
function openTab(key) { if (!nav.value.some(item => item.k === key)) return; active.value = key; if (!openTabs.value.includes(key)) openTabs.value.push(key); mobile.value = false }
function selectModule(item) { activeModule.value = item.id; if (item.type === 'directory') sectionCollapsed.value = false; else openTab(item.id) }
function handleMenuItem(item) { if (item.type === 'menu') openTab(item.id); else toggleDirectory(item.id) }
function toggleDirectory(key) { expandedDirectories.value = expandedDirectories.value.includes(key) ? expandedDirectories.value.filter(item => item !== key) : [...expandedDirectories.value, key] }
function closeCurrent(key) { const index = openTabs.value.indexOf(key); openTabs.value = openTabs.value.filter(item => item !== key); if (active.value === key) active.value = openTabs.value[Math.max(index - 1, 0)] || ''; tabMenuKey.value = null }
function closeOthers(key) { openTabs.value = [key]; active.value = key; tabMenuKey.value = null }
function closeAll() { openTabs.value = []; active.value = ''; tabMenuKey.value = null }
function selectTab(key) { active.value = key; tabMoreOpen.value = false }
function setLanguage(value) { lang.value = value; languageOpen.value = false }
function logout() { localStorage.removeItem('dugu-authenticated'); loggedIn.value = false; form.value.password = ''; form.value.code = '' }
function copyText(value) { navigator.clipboard?.writeText(value); message.success(lang.value === 'en' ? 'Copied' : '已复制') }
function openUserModal(user = null) { userEditingId.value = user?.id || null; userForm.value = user ? { name: user.name, username: user.username, mobile: user.mobile.replace(/\*/g, ''), email: user.email, status: user.status } : { name: '', username: '', mobile: '', email: '', status: 1 }; userModalOpen.value = true }
function saveUser() { if (!userForm.value.name || !userForm.value.username || !userForm.value.mobile) return message.warning('请填写姓名、账号和手机号'); if (userEditingId.value) { const index = users.value.findIndex(user => user.id === userEditingId.value); users.value[index] = { ...users.value[index], ...userForm.value, mobile: userForm.value.mobile.length > 8 ? `${userForm.value.mobile.slice(0, 3)}****${userForm.value.mobile.slice(-4)}` : userForm.value.mobile }; message.success('用户信息已更新') } else { users.value.unshift({ id: Date.now(), ...userForm.value, mobile: `${userForm.value.mobile.slice(0, 3)}****${userForm.value.mobile.slice(-4)}`, lastLogin: '-', ip: '-' }); message.success('用户已创建') } userModalOpen.value = false }
function updateUserStatus(user) { user.status = user.status === 1 ? 2 : 1; message.success(user.status === 1 ? '账号已启用' : '账号已停用') }
function unlockUser(user) { user.status = 1; message.success('账号已解锁') }
function freezeUser(user) { user.status = 3; message.success('账号已冻结') }
function unfreezeUser(user) { user.status = 1; message.success('账号已解冻') }
function resetPassword(user) { message.success(`${user.name} 的密码重置链接已生成`) }
function refreshUsers() { userRefreshing.value = true; setTimeout(() => { users.value = [...users.value]; userRefreshing.value = false; message.success('列表已刷新') }, 350) }
function toggleUserSelection(user, row) { if (user.status === 3) return; const selected = selectedUserIds.value.includes(user.id); selectedUserIds.value = selected ? selectedUserIds.value.filter(id => id !== user.id) : [...selectedUserIds.value, user.id]; row.classList.toggle('selected-row', !selected) }
function selectedUsers(status) { return users.value.filter(user => selectedUserIds.value.includes(user.id) && user.status === status) }
function batchFreeze() { selectedUsers(1).forEach(freezeUser); selectedUserIds.value = []; message.success('已冻结选中账号') }
function batchUnfreeze() { selectedUsers(3).forEach(unfreezeUser); selectedUserIds.value = []; message.success('已解冻选中账号') }
onMounted(() => { document.querySelector('.user-table-wrap')?.addEventListener('click', event => { const row = event.target.closest('tbody tr'); if (!row || event.target.closest('button,a')) return; const user = filteredUsers.value[row.sectionRowIndex]; if (user) toggleUserSelection(user, row) }) })
watch(lang, value => localStorage.setItem('dugu-language', value))
watch(theme, value => localStorage.setItem('dugu-theme', value))
watch(loggedIn, value => { if (!value) localStorage.removeItem('dugu-authenticated') })
refreshCaptcha()
</script>

<template>
  <main v-if="!loggedIn" :class="['login-page', theme]">
    <section class="login-shell">
      <div class="brand-panel"><div class="brand-lockup"><div class="brand-mark"><i/><i/><i/></div><b>独孤</b></div><div class="brand-copy"><small>DUGU · PEOPLE OS</small><h1>让每一位<br><em>人才</em> 都被看见</h1><p>连接组织、人才与业务，<br>让人事管理回归简单。</p></div><div class="brand-features"><span><ShieldCheck :size="15"/> 数据安全</span><span><Users :size="15"/> 智能协同</span></div></div>
      <section class="login-panel"><div class="login-tools"><label><Globe2 :size="15"/><select v-model="lang"><option v-for="item in languages" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label><Palette :size="15"/><select v-model="theme"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label></div><div class="login-card"><div class="heading"><div><small>WELCOME BACK</small><h2>{{ t.welcome }}</h2><p>{{ t.hint }}</p></div><CircleHelp :size="19"/></div><div class="tabs"><button :class="{ active: mode === 'account' }" @click="mode = 'account'">{{ t.account }}</button><button :class="{ active: mode === 'sms' }" @click="mode = 'sms'">{{ t.sms }}</button></div><form @submit.prevent="submit"><template v-if="mode === 'account'"><label>{{ t.accountLabel }}</label><a-input v-model:value="form.account" size="large" placeholder="admin@dugu.com"><template #prefix><Mail :size="16"/></template></a-input><div class="label-row"><label>{{ t.password }}</label><button type="button">{{ t.forgot }}</button></div><a-input-password v-model:value="form.password" size="large" placeholder="••••••••"><template #prefix><ShieldCheck :size="16"/></template></a-input-password></template><template v-else><label>{{ t.phone }}</label><a-input v-model:value="form.phone" size="large"><template #prefix><Phone :size="16"/></template></a-input><label>{{ t.code }}</label><a-input v-model:value="form.code" size="large"><template #prefix><ShieldCheck :size="16"/></template><template #suffix><button type="button">{{ t.getCode }}</button></template></a-input></template><a-button html-type="submit" type="primary" block size="large" :loading="loading" class="submit">{{ t.login }}</a-button></form></div><footer>© 2024 独孤科技有限公司 <span>浙ICP备2024012345号</span></footer></section>
    </section>
  </main>

  <div v-if="!loggedIn && mode === 'account'" class="captcha-fallback"><label>验证码</label><div class="captcha-row"><a-input v-model:value="captchaInput" size="large" maxlength="4" placeholder="请输入验证码"/><button type="button" class="captcha-image" @click="refreshCaptcha"><img v-if="captchaImage" :src="captchaImage" alt="验证码"/><span v-else>{{ captchaCode }}</span></button></div></div>

  <main v-else :class="['admin-shell', `theme-${theme}`]">
    <header class="topbar">
      <button class="mobile-menu" @click="mobile = !mobile"><Menu :size="20"/></button>
      <div class="top-logo"><div class="brand-mark small"><i/><i/><i/></div><b>独孤云</b><small>PEOPLE CLOUD</small></div>
      <div class="top-search"><Search :size="16"/><input :placeholder="t.search"/></div>
      <div class="top-actions">
        <button><CircleHelp :size="16"/><span>{{ t.help }}</span></button>
        <div class="language-control"><button title="Language" @click="languageOpen = !languageOpen"><Globe2 :size="18"/></button><div v-if="languageOpen" class="language-popover"><div>{{ lang === 'en' ? 'Language' : '语言' }}</div><button v-for="item in languages" :key="item.value" :class="{ selected: lang === item.value }" @click="setLanguage(item.value)">{{ item.label }}</button></div></div>
        <label class="theme-control"><Palette :size="17"/><select v-model="theme"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
        <div class="account-control">
          <button class="avatar" @click="accountOpen = !accountOpen">林</button>
          <div v-if="accountOpen" class="account-backdrop" @click="accountOpen = false"/>
          <div v-if="accountOpen" class="account-popover">
            <div class="account-summary"><div class="account-name"><strong>100014830391</strong><span>主账号</span></div><p>账号 ID：100014830391 <button @click="copyText('100014830391')"><Copy :size="15"/></button></p><p>企业标识：dugu <button @click="copyText('dugu')"><Copy :size="15"/></button></p></div>
            <div class="account-links"><button><UserRound :size="18"/>账号中心</button><button><KeyRound :size="18"/>访问控制</button></div>
            <div class="account-links"><button><BookOpen :size="18"/>帮助文档</button><button><ExternalLink :size="18"/>获取支持</button></div>
            <button class="account-logout" @click="logout"><LogOut :size="17"/>退出</button>
          </div>
        </div>
      </div>
    </header>

    <div class="admin-body">
      <aside :class="['global-nav', { open: mobile }]">
        <button v-for="item in menuData" :key="item.id" :class="{ active: activeModule === item.id }" @click="selectModule(item)"><component :is="iconMap[item.icon] || FileText" :size="19"/><span>{{ menuLabel(item) }}</span></button>
      </aside>
      <aside :class="['section-nav', { open: mobile, collapsed: sectionCollapsed }]">
        <div class="section-title"><strong>{{ menuLabel(currentModule) }}</strong><button title="收起菜单" @click="sectionCollapsed = true"><PanelLeftClose :size="17"/></button></div>
        <div class="section-group"><template v-for="item in currentModule.children || []" :key="item.id"><button :class="{ active: active === item.id, directory: item.type === 'directory' }" @click="handleMenuItem(item)"><component :is="iconMap[item.icon] || FileText" :size="16"/>{{ menuLabel(item) }}<ChevronDown v-if="item.type === 'directory'" :class="['submenu-arrow', { expanded: expandedDirectories.includes(item.id) }]" :size="14"/></button><div v-if="item.type === 'directory' && expandedDirectories.includes(item.id)" class="third-menu"><button v-for="child in item.children || []" :key="child.id" :class="{ active: active === child.id }" @click="handleMenuItem(child)"><component :is="iconMap[child.icon] || FileText" :size="15"/>{{ menuLabel(child) }}</button></div></template></div>
      </aside>
      <button v-if="sectionCollapsed" class="section-expand" title="展开菜单" @click="sectionCollapsed = false"><PanelLeftOpen :size="17"/></button>
      <div v-if="mobile" class="mobile-overlay" @click="mobile = false"/>

      <section class="admin-main">
        <div class="page-heading"><div><span>{{ menuLabel(currentModule) }}</span><b>/</b><strong>{{ activeLabel }}</strong></div></div>
        <div v-if="tabMenuKey || tabMoreOpen" class="tab-menu-backdrop" @click="tabMenuKey = null; tabMoreOpen = false"/><div class="page-tabs"><button class="tab-scroll-arrow" title="向左滚动" @click="$refs.tabScroller.scrollBy({ left: -260, behavior: 'smooth' })">‹</button><div ref="tabScroller" class="tab-scroller"><div v-for="key in openTabs" :key="key" :class="['page-tab', { active: active === key }]" @click="selectTab(key)"><component :is="nav.find(item => item.k === key)?.icon" :size="15"/><span>{{ nav.find(item => item.k === key)?.label }}</span><button class="tab-close" title="关闭当前" @click.stop="closeCurrent(key)"><X :size="13"/></button><div v-if="tabMenuKey === key" class="tab-menu"><button @click.stop="closeCurrent(key)">关闭当前</button><button @click.stop="closeOthers(key)">关闭其他</button><button @click.stop="closeAll">关闭所有</button></div></div></div><button class="tab-scroll-arrow" title="向右滚动" @click="$refs.tabScroller.scrollBy({ left: 260, behavior: 'smooth' })">›</button><div class="tab-more-control"><button class="tab-more-button" title="更多标签" @click.stop="tabMoreOpen = !tabMoreOpen">···</button><div v-if="tabMoreOpen" class="tab-more-menu"><button v-for="key in openTabs" :key="key" :class="{ active: active === key }" @click="selectTab(key)">{{ nav.find(item => item.k === key)?.label }}</button></div></div></div>
        <div v-if="active === 'user-management'" class="page-content user-page">
          <div class="user-toolbar"><div class="user-filters"><a-input v-model:value="userKeyword" placeholder="搜索姓名、账号、手机号或邮箱" allow-clear><template #prefix><Search :size="15"/></template></a-input><a-select v-model:value="userStatus" style="width:130px"><a-select-option value="all">全部状态</a-select-option><a-select-option value="1">正常</a-select-option><a-select-option value="2">停用</a-select-option><a-select-option value="3">锁定</a-select-option></a-select><a-button class="refresh-list" :loading="userRefreshing" title="刷新列表" @click="refreshUsers"><Activity :size="15"/>刷新</a-button></div><a-button type="primary" @click="openUserModal()">+ 新增管理账号</a-button></div>
          <div class="user-summary"><span>安全策略：密码错误 5 次锁定 15 分钟</span><span class="status-actions"><a-button size="small" @click="users.filter(user => user.status === 1).forEach(freezeUser)">批量冻结</a-button><a-button size="small" @click="users.filter(user => user.status === 3).forEach(unfreezeUser)">批量解冻</a-button></span></div>
          <div class="user-table-wrap"><table class="user-table"><thead><tr><th>姓名</th><th>账号</th><th>手机号</th><th>邮箱</th><th>状态</th><th>最后登录</th><th>登录 IP</th><th>操作</th></tr></thead><tbody><tr v-for="user in filteredUsers" :key="user.id"><td><div class="user-name"><span>{{ user.name.slice(0, 1) }}</span><strong>{{ user.name }}</strong></div></td><td>{{ user.username }}</td><td>{{ user.mobile }}</td><td>{{ user.email || '-' }}</td><td><span :class="['status-tag', `status-${user.status}`]">{{ user.status === 1 ? '正常' : user.status === 2 ? '停用' : '锁定' }}</span></td><td>{{ user.lastLogin }}</td><td>{{ user.ip }}</td><td><button class="row-action" @click="openUserModal(user)">编辑</button><button v-if="user.status !== 3" class="row-action" @click="updateUserStatus(user)">{{ user.status === 1 ? '停用' : '启用' }}</button><button v-else class="row-action" @click="unlockUser(user)">解锁</button><button class="row-action" @click="resetPassword(user)">重置密码</button></td></tr><tr v-if="!filteredUsers.length"><td colspan="8" class="empty-users">暂无匹配的管理账号</td></tr></tbody></table></div>
          <div class="user-foot"><span>共 {{ filteredUsers.length }} 条记录</span><a-pagination size="small" :total="filteredUsers.length" :page-size="10" :show-size-changer="false"/></div>
        </div>
        <div v-else class="page-content">
          <div class="welcome-row"><div><small>MONDAY, 06 NOVEMBER 2024</small><h1>{{ t.greeting }}，林晓</h1><p>{{ t.today }}</p></div><a-button><CalendarDays :size="16"/>{{ t.calendar }}</a-button></div>
          <div class="metric-grid"><div v-for="(item, index) in [['在职员工','286','+12'],['组织部门','18','—'],['今日出勤率','96.8%','+1.4%'],['待审批事项','12','待处理']]" :key="item[0]" class="metric-card"><div :class="`metric-icon c${index}`"><component :is="[Users, Building2, Clock3, FileText][index]" :size="20"/></div><div><small>{{ item[0] }}</small><strong>{{ item[1] }}</strong><em>{{ item[2] }}</em></div><MoreHorizontal :size="18"/></div></div>
          <div class="data-grid"><section><div class="panel-head"><div><h3>员工规模趋势</h3><p>近 6 个月员工数量变化</p></div><ChevronDown :size="16"/></div><div class="chart-placeholder"><div v-for="h in [42,55,50,68,76,88]" :key="h" :style="{height:`${h}%`}"><span/></div></div></section><section><div class="panel-head"><div><h3>待办事项</h3><p>需要及时处理的事项</p></div><a>查看全部</a></div><div v-for="item in ['审批 3 条请假申请','完成新员工入职资料','确认本月薪资核算']" :key="item" class="todo-row"><i/><div><b>{{ item }}</b><small>10 分钟前</small></div><ChevronDown :size="15"/></div></section></div>
        </div>
      </section>
    </div>
  </main>
  <div v-if="userModalOpen" class="user-modal-mask" @click.self="userModalOpen = false"><div class="user-modal"><div class="user-modal-head"><div><h3>{{ userEditingId ? '编辑管理账号' : '新增管理账号' }}</h3><p>管理账号可访问 SaaS 平台运营后台</p></div><button @click="userModalOpen = false"><X :size="18"/></button></div><div class="user-form-grid"><label>姓名<a-input v-model:value="userForm.name" placeholder="请输入姓名"/></label><label>登录账号<a-input v-model:value="userForm.username" placeholder="不可使用 11 位纯数字"/></label><label>手机号<a-input v-model:value="userForm.mobile" placeholder="请输入手机号"/></label><label>邮箱<a-input v-model:value="userForm.email" placeholder="选填"/></label><label>状态<a-select v-model:value="userForm.status"><a-select-option :value="1">正常</a-select-option><a-select-option :value="2">停用</a-select-option></a-select></label></div><div class="user-modal-foot"><a-button @click="userModalOpen = false">取消</a-button><a-button type="primary" @click="saveUser">保存</a-button></div></div></div>
</template>
