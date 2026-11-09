<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Globe2, LogOut, Menu, Palette, PanelLeftClose, PanelLeftOpen, X } from 'lucide-vue-next'
import { routes } from '../router/routes'
import { useAuthStore } from '../store/modules/auth'
import { useAppStore, type AppTheme } from '../store/modules/app'
import { localeOptions, type AppLocale } from '../locales'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()
const mobile = ref(false)
const languageOpen = ref(false)
const accountOpen = ref(false)
const themes = computed(() => [
  { value: 'brand' as const, label: t('layout.brandBlue') },
  { value: 'light' as const, label: t('layout.light') },
  { value: 'dark' as const, label: t('layout.dark') },
])
const children = computed(() => (routes.find(item => item.path === '/')?.children || [])
  .filter(item => !item.meta?.hidden)
  .sort((a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0)))
const groups = computed(() => Array.from(new Set(children.value.map(item => item.meta?.group || ''))))
const activeGroup = computed(() => String(route.meta.group || groups.value[0] || ''))
const tabs = ref<string[]>(route.meta.title && !route.meta.hidden ? [route.path] : [])

function title(key: string) { return t(key) }
function groupChildren(group: string) { return children.value.filter(item => item.meta?.group === group) }
function open(path: string) { if (!tabs.value.includes(path)) tabs.value.push(path); router.push(path); mobile.value = false }
function close(path: string) { const i = tabs.value.indexOf(path); tabs.value = tabs.value.filter(item => item !== path); if (route.path === path) router.push(tabs.value[Math.max(0, i - 1)] || '/welcome') }
function closeOthers(path: string) { tabs.value = [path]; router.push(path) }
function closeAll() { tabs.value = []; router.push('/welcome') }
function setLocale(value: AppLocale) { app.setLocale(value); languageOpen.value = false }
async function logout() { await auth.logout(); router.replace('/login') }

watch(() => route.path, (path) => {
  if (route.meta.title && !route.meta.hidden && !tabs.value.includes(path)) tabs.value.push(path)
})
</script>

<template>
  <a-config-provider :theme="{ algorithm: app.dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }">
    <main :class="['admin-shell', `theme-${app.theme}`]">
      <header class="topbar">
        <button class="mobile-menu" @click="mobile = !mobile"><Menu :size="20"/></button>
        <div class="top-logo"><div class="brand-mark small"><i/><i/><i/></div><b>{{ t('layout.product') }}</b></div>
        <div class="top-actions">
          <div class="language-control">
            <button @click="languageOpen = !languageOpen"><Globe2 :size="17"/></button>
            <div v-if="languageOpen" class="language-popover"><button v-for="item in localeOptions" :key="item.value" @click="setLocale(item.value)">{{ item.label }}</button></div>
          </div>
          <label class="theme-control"><Palette :size="16"/><select :value="app.theme" @change="app.setTheme(($event.target as HTMLSelectElement).value as AppTheme)"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <button class="account-button" @click="accountOpen = !accountOpen">{{ auth.user?.name?.slice(0, 1) || 'A' }}</button>
          <div v-if="accountOpen" class="account-popover"><strong>{{ auth.user?.name || t('user.title') }}</strong><button @click="logout"><LogOut :size="16"/>{{ t('common.logout') }}</button></div>
        </div>
      </header>
      <div class="admin-body">
        <aside :class="['global-nav', { open: mobile }]">
          <button v-for="group in groups" :key="group" :class="{ active: activeGroup === group }" @click="open(String(groupChildren(group)[0]?.path || '/'))"><Menu :size="17"/><span>{{ title(group) }}</span></button>
        </aside>
        <aside v-if="!app.menuCollapsed" class="section-nav">
          <div class="section-title"><strong>{{ title(activeGroup) }}</strong><button @click="app.menuCollapsed = true"><PanelLeftClose :size="17"/></button></div>
          <div class="section-group"><button v-for="item in groupChildren(activeGroup)" :key="String(item.path)" :class="{ active: route.path === item.path }" @click="open(String(item.path))">{{ title(String(item.meta?.title)) }}</button></div>
        </aside>
        <button v-else class="section-expand" @click="app.menuCollapsed = false"><PanelLeftOpen :size="17"/></button>
        <section class="admin-main">
          <div class="page-heading"><span>{{ title(activeGroup) }}</span><b>/</b><strong>{{ title(String(route.meta.title || 'layout.welcome')) }}</strong></div>
          <div class="page-tabs">
            <button v-for="path in tabs" :key="path" :class="{ active: route.path === path }" @click="router.push(path)">
              {{ title(String(children.find(item => item.path === path)?.meta?.title || '')) }}
              <a-dropdown :trigger="['click']"><X :size="13" @click.stop/><template #overlay><a-menu><a-menu-item @click="close(path)">{{ t('common.closeCurrent') }}</a-menu-item><a-menu-item @click="closeOthers(path)">{{ t('common.closeOthers') }}</a-menu-item><a-menu-item danger @click="closeAll">{{ t('common.closeAll') }}</a-menu-item></a-menu></template></a-dropdown>
            </button>
          </div>
          <router-view/>
        </section>
      </div>
    </main>
  </a-config-provider>
</template>
