<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { Activity, Bell, BookOpen, Building2, CalendarDays, ChevronDown, CircleHelp, Clock3, Copy, ExternalLink, FileText, Globe2, KeyRound, LayoutDashboard, LogOut, Mail, Menu, MoreHorizontal, Network, Palette, PanelLeftClose, PanelLeftOpen, Phone, Search, Settings2, ShieldCheck, UserRound, Users, X } from 'lucide-vue-next'
import menuData from './data/menu.json'

const loggedIn = ref(localStorage.getItem('dugu-authenticated') === 'true')
const mode = ref('account')
const lang = ref(localStorage.getItem('dugu-language') || 'zh')
const theme = ref(localStorage.getItem('dugu-theme') || 'ocean')
const loading = ref(false)
const mobile = ref(false)
const languageOpen = ref(false)
const accountOpen = ref(false)
const sectionCollapsed = ref(false)
const activeModule = ref('people')
const active = ref('dashboard')
const openTabs = ref(['dashboard'])
const form = ref({ account: 'admin@dugu.com', password: '', phone: '', code: '' })

const languages = [{ value: 'zh', label: '中文' }, { value: 'zh-TW', label: '繁體中文' }, { value: 'en', label: 'English' }]
const themes = [{ value: 'ocean', label: '深海蓝' }, { value: 'sky', label: '天空蓝' }, { value: 'graphite', label: '石墨灰' }]
const words = {
  zh: { welcome: '欢迎回来', hint: '登录独孤人事管理系统，开始今天的工作', account: '账号密码', sms: '手机短信', login: '登录', accountLabel: '账号', password: '密码', phone: '手机号', code: '短信验证码', forgot: '忘记密码？', getCode: '获取验证码', dashboard: '工作台', employees: '员工管理', organization: '组织架构', attendance: '考勤与假勤', payroll: '薪酬管理', settings: '系统设置', help: '帮助中心', greeting: '下午好', today: '今天也要高效地完成工作。', search: '搜索员工、部门或功能', workspace: '人事管理', calendar: '查看日历', overview: '总览', people: '人员', time: '考勤', salary: '薪酬', system: '系统' },
  'zh-TW': { welcome: '歡迎回來', hint: '登入獨孤人事管理系統，開始今天的工作', account: '帳號密碼', sms: '手機簡訊', login: '登入', accountLabel: '帳號', password: '密碼', phone: '手機號碼', code: '簡訊驗證碼', forgot: '忘記密碼？', getCode: '取得驗證碼', dashboard: '工作台', employees: '員工管理', organization: '組織架構', attendance: '考勤與假勤', payroll: '薪酬管理', settings: '系統設定', help: '幫助中心', greeting: '午安', today: '今天也要高效完成工作。', search: '搜尋員工、部門或功能', workspace: '人事管理', calendar: '查看日曆', overview: '總覽', people: '人員', time: '考勤', salary: '薪酬', system: '系統' },
  en: { welcome: 'Welcome back', hint: 'Sign in to Dugu People OS and start your day', account: 'Password', sms: 'SMS code', login: 'Sign in', accountLabel: 'Account', password: 'Password', phone: 'Phone number', code: 'Verification code', forgot: 'Forgot password?', getCode: 'Get code', dashboard: 'Dashboard', employees: 'Employees', organization: 'Organization', attendance: 'Attendance', payroll: 'Payroll', settings: 'Settings', help: 'Help center', greeting: 'Good afternoon', today: 'Make today productive.', search: 'Search people, teams or features', workspace: 'HR Management', calendar: 'View calendar', overview: 'Overview', people: 'People', time: 'Time', salary: 'Payroll', system: 'System' }
}
const t = computed(() => words[lang.value])
const iconMap = { Activity, Building2, Clock3, FileText, LayoutDashboard, Network, Settings2, Users }
const menuLabel = item => item.label?.[lang.value] || item.label?.zh || item.id
const currentModule = computed(() => menuData.find(item => item.id === activeModule.value) || menuData[0])
const nav = computed(() => menuData.flatMap(level1 =>
  (level1.children || []).flatMap(level2 =>
    (level2.children || []).map(level3 => ({
      k: level3.id,
      label: menuLabel(level3),
      icon: iconMap[level3.icon] || FileText
    }))
  )
))
const activeLabel = computed(() => nav.value.find(item => item.k === active.value)?.label || '')

function submit() { if ((mode.value === 'account' && (!form.value.account || !form.value.password)) || (mode.value === 'sms' && (!form.value.phone || !form.value.code))) return message.warning(lang.value === 'en' ? 'Please complete your login details' : '请完整填写登录信息'); loading.value = true; setTimeout(() => { loading.value = false; loggedIn.value = true; localStorage.setItem('dugu-authenticated', 'true') }, 350) }
function openTab(key) { active.value = key; if (!openTabs.value.includes(key)) openTabs.value.push(key); mobile.value = false }
function selectModule(item) { activeModule.value = item.id; if (item.children?.length) sectionCollapsed.value = false }
function closeTab(key) { if (openTabs.value.length === 1) return; const index = openTabs.value.indexOf(key); openTabs.value = openTabs.value.filter(item => item !== key); if (active.value === key) active.value = openTabs.value[Math.max(index - 1, 0)] }
function setLanguage(value) { lang.value = value; languageOpen.value = false }
function logout() { localStorage.removeItem('dugu-authenticated'); loggedIn.value = false; form.value.password = ''; form.value.code = '' }
function copyText(value) { navigator.clipboard?.writeText(value); message.success(lang.value === 'en' ? 'Copied' : '已复制') }
watch(lang, value => localStorage.setItem('dugu-language', value))
watch(theme, value => localStorage.setItem('dugu-theme', value))
watch(loggedIn, value => { if (!value) localStorage.removeItem('dugu-authenticated') })
</script>

<template>
  <main v-if="!loggedIn" :class="['login-page', theme]">
    <section class="login-shell">
      <div class="brand-panel"><div class="brand-lockup"><div class="brand-mark"><i/><i/><i/></div><b>独孤</b></div><div class="brand-copy"><small>DUGU · PEOPLE OS</small><h1>让每一位<br><em>人才</em> 都被看见</h1><p>连接组织、人才与业务，<br>让人事管理回归简单。</p></div><div class="brand-features"><span><ShieldCheck :size="15"/> 数据安全</span><span><Users :size="15"/> 智能协同</span></div></div>
      <section class="login-panel"><div class="login-tools"><label><Globe2 :size="15"/><select v-model="lang"><option v-for="item in languages" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label><Palette :size="15"/><select v-model="theme"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label></div><div class="login-card"><div class="heading"><div><small>WELCOME BACK</small><h2>{{ t.welcome }}</h2><p>{{ t.hint }}</p></div><CircleHelp :size="19"/></div><div class="tabs"><button :class="{ active: mode === 'account' }" @click="mode = 'account'">{{ t.account }}</button><button :class="{ active: mode === 'sms' }" @click="mode = 'sms'">{{ t.sms }}</button></div><form @submit.prevent="submit"><template v-if="mode === 'account'"><label>{{ t.accountLabel }}</label><a-input v-model:value="form.account" size="large" placeholder="admin@dugu.com"><template #prefix><Mail :size="16"/></template></a-input><div class="label-row"><label>{{ t.password }}</label><button type="button">{{ t.forgot }}</button></div><a-input-password v-model:value="form.password" size="large" placeholder="••••••••"><template #prefix><ShieldCheck :size="16"/></template></a-input-password></template><template v-else><label>{{ t.phone }}</label><a-input v-model:value="form.phone" size="large"><template #prefix><Phone :size="16"/></template></a-input><label>{{ t.code }}</label><a-input v-model:value="form.code" size="large"><template #prefix><ShieldCheck :size="16"/></template><template #suffix><button type="button">{{ t.getCode }}</button></template></a-input></template><a-button html-type="submit" type="primary" block size="large" :loading="loading" class="submit">{{ t.login }}</a-button></form></div><footer>© 2024 独孤科技有限公司 <span>浙ICP备2024012345号</span></footer></section>
    </section>
  </main>

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
        <template v-for="group in currentModule.children || []" :key="group.id"><div class="section-group"><small>{{ menuLabel(group) }}</small><button v-for="item in group.children || []" :key="item.id" :class="{ active: active === item.id }" @click="openTab(item.id)"><component :is="iconMap[item.icon] || FileText" :size="16"/>{{ menuLabel(item) }}</button></div></template>
      </aside>
      <button v-if="sectionCollapsed" class="section-expand" title="展开菜单" @click="sectionCollapsed = false"><PanelLeftOpen :size="17"/></button>
      <div v-if="mobile" class="mobile-overlay" @click="mobile = false"/>

      <section class="admin-main">
        <div class="page-heading"><div><span>{{ t.workspace }}</span><b>/</b><strong>{{ activeLabel }}</strong></div><div><a-button><Settings2 :size="15"/>{{ t.settings }}</a-button></div></div>
        <div class="page-tabs"><button v-for="key in openTabs" :key="key" :class="{ active: active === key }" @click="active = key"><component :is="nav.find(item => item.k === key)?.icon" :size="15"/><span>{{ nav.find(item => item.k === key)?.label }}</span><X v-if="openTabs.length > 1" :size="13" @click.stop="closeTab(key)"/></button></div>
        <div class="page-content">
          <div class="welcome-row"><div><small>MONDAY, 06 NOVEMBER 2024</small><h1>{{ t.greeting }}，林晓</h1><p>{{ t.today }}</p></div><a-button><CalendarDays :size="16"/>{{ t.calendar }}</a-button></div>
          <div class="metric-grid"><div v-for="(item, index) in [['在职员工','286','+12'],['组织部门','18','—'],['今日出勤率','96.8%','+1.4%'],['待审批事项','12','待处理']]" :key="item[0]" class="metric-card"><div :class="`metric-icon c${index}`"><component :is="[Users, Building2, Clock3, FileText][index]" :size="20"/></div><div><small>{{ item[0] }}</small><strong>{{ item[1] }}</strong><em>{{ item[2] }}</em></div><MoreHorizontal :size="18"/></div></div>
          <div class="data-grid"><section><div class="panel-head"><div><h3>员工规模趋势</h3><p>近 6 个月员工数量变化</p></div><ChevronDown :size="16"/></div><div class="chart-placeholder"><div v-for="h in [42,55,50,68,76,88]" :key="h" :style="{height:`${h}%`}"><span/></div></div></section><section><div class="panel-head"><div><h3>待办事项</h3><p>需要及时处理的事项</p></div><a>查看全部</a></div><div v-for="item in ['审批 3 条请假申请','完成新员工入职资料','确认本月薪资核算']" :key="item" class="todo-row"><i/><div><b>{{ item }}</b><small>10 分钟前</small></div><ChevronDown :size="15"/></div></section></div>
        </div>
      </section>
    </div>
  </main>
</template>
