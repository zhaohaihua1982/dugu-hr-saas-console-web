<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, ChevronDown, ChevronLeft, ChevronRight, FileText, FolderOpen, Globe2, KeyRound, Languages, LogOut, Menu, MoreHorizontal, Palette, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Users, Wrench, X } from 'lucide-vue-next'
import { routes } from '../router/routes'
import { menuApi, type MenuItem } from '../api/menu'
import { useAuthStore } from '../store/modules/auth'
import { useAppStore, type AppTheme } from '../store/modules/app'
import { toServerMenuLocale, type AppLocale } from '../locales'

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
const expandedParents = ref<string[]>(['menu.auditLog'])
const tabScroller = ref<HTMLElement | null>(null)
const tabsOverflow = ref(false)
const serverNameByPath = ref<Record<string, string>>({})
const serverRootNameByPath = ref<Record<string, string>>({})
const serverParentNameByPath = ref<Record<string, string>>({})
const serverIconByPath = ref<Record<string, string>>({})
let tabsResizeObserver: ResizeObserver | undefined

const iconRegistry: Record<string, Component> = {
  Building2, FileText, FolderOpen, KeyRound, Languages, Menu, Settings, ShieldCheck, Users, Wrench,
}

function normalizePath(path: string) { return path.startsWith('/') ? path : `/${path}` }
function routeTitle(path: string, fallbackKey = '') { return serverNameByPath.value[normalizePath(path)] || t(fallbackKey) }
function groupChildren(group: string) { return children.value.filter(item => item.meta?.group === group) }
function groupTitle(group: string) {
  const firstPath = String(groupChildren(group)[0]?.path || '')
  return serverRootNameByPath.value[normalizePath(firstPath)] || t(group)
}
function directGroupChildren(group: string) { return groupChildren(group).filter(item => !item.meta?.parent) }
function groupParents(group: string) { return Array.from(new Set(groupChildren(group).map(item => item.meta?.parent).filter((parent): parent is string => Boolean(parent)))) }
function parentChildren(parent: string) { return groupChildren(activeGroup.value).filter(item => item.meta?.parent === parent) }
function parentTitle(parent: string) {
  const firstPath = String(parentChildren(parent)[0]?.path || '')
  return serverParentNameByPath.value[normalizePath(firstPath)] || t(parent)
}
function iconComponent(name: string | undefined): Component {
  return iconRegistry[String(name || '')] || Menu
}
function itemIcon(path: string, fallback = 'Menu') {
  return iconComponent(serverIconByPath.value[normalizePath(path)] || children.value.find(item => normalizePath(String(item.path)) === normalizePath(path))?.meta?.icon || fallback)
}
function groupIcon(group: string) {
  const item = groupChildren(group)[0]
  return iconComponent(String(item?.meta?.icon || serverIconByPath.value[normalizePath(String(item?.path || ''))] || 'Menu'))
}
function toggleParent(parent: string) { expandedParents.value = expandedParents.value.includes(parent) ? expandedParents.value.filter(item => item !== parent) : [...expandedParents.value, parent] }
function open(path: string) { const target = normalizePath(path); if (!tabs.value.includes(target)) tabs.value.push(target); router.push(target); mobile.value = false }
function close(path: string) { const target = normalizePath(path); const i = tabs.value.indexOf(target); tabs.value = tabs.value.filter(item => item !== target); if (route.path === target) router.push(tabs.value[Math.max(0, i - 1)] || '/welcome') }
function closeOthers(path: string) { const target = normalizePath(path); tabs.value = [target]; router.push(target) }
function closeAll() { tabs.value = []; router.push('/welcome') }
function scrollTabs(offset: number) { tabScroller.value?.scrollBy({ left: offset, behavior: 'smooth' }) }
function updateTabsOverflow() {
  const element = tabScroller.value
  const controlsWidth = tabsOverflow.value ? 96 : 0
  tabsOverflow.value = Boolean(element && element.scrollWidth > element.clientWidth + controlsWidth + 1)
}
async function revealActiveTab() {
  await nextTick()
  const button = tabScroller.value?.querySelector<HTMLElement>(`[data-tab-path="${CSS.escape(route.path)}"]`)
  button?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  updateTabsOverflow()
}
function setLocale(value: AppLocale) { if (app.setLocale(value)) languageOpen.value = false }
async function logout() { await auth.logout(); router.replace('/login') }
async function loadServerMenuNames() {
  try {
    const tree = await menuApi.tree(toServerMenuLocale(app.locale), true)
    const names: Record<string, string> = {}
    const roots: Record<string, string> = {}
    const parents: Record<string, string> = {}
    const icons: Record<string, string> = {}
    function visit(items: MenuItem[], rootName = '', parentName = '') {
      items.forEach(item => {
        const currentRoot = rootName || item.name
        if (item.path) {
          const path = normalizePath(item.path)
          names[path] = item.name
          roots[path] = currentRoot
          icons[path] = item.icon
          if (parentName) parents[path] = parentName
        }
        visit(item.children || [], currentRoot, item.name)
      })
    }
    visit(Array.isArray(tree) ? tree : [])
    serverNameByPath.value = names
    serverRootNameByPath.value = roots
    serverParentNameByPath.value = parents
    serverIconByPath.value = icons
  } catch {
    serverNameByPath.value = {}
    serverRootNameByPath.value = {}
    serverParentNameByPath.value = {}
    serverIconByPath.value = {}
  }
}

watch(() => route.path, (path) => {
  if (route.meta.title && !route.meta.hidden && !tabs.value.includes(path)) tabs.value.push(path)
  revealActiveTab()
})
watch(() => tabs.value.length, () => nextTick(updateTabsOverflow))
watch(() => app.locale, loadServerMenuNames)
onMounted(() => { tabsResizeObserver = new ResizeObserver(updateTabsOverflow); if (tabScroller.value) tabsResizeObserver.observe(tabScroller.value); updateTabsOverflow(); loadServerMenuNames() })
onBeforeUnmount(() => tabsResizeObserver?.disconnect())
</script>

<template>
  <main :class="['admin-shell', `theme-${app.theme}`]">
      <header class="topbar">
        <button class="mobile-menu" @click="mobile = !mobile"><Menu :size="20"/></button>
        <div class="top-logo"><div class="brand-mark small"><i/><i/><i/></div><b>{{ t('layout.product') }}</b></div>
        <div class="top-actions">
          <div class="language-control">
            <button @click="languageOpen = !languageOpen"><Globe2 :size="17"/></button>
            <div v-if="languageOpen" class="language-popover"><button v-for="item in app.languageOptions" :key="item.value" :disabled="item.disabled" @click="setLocale(item.value)">{{ item.label }}</button></div>
          </div>
          <label class="theme-control"><Palette :size="16"/><select :value="app.theme" @change="app.setTheme(($event.target as HTMLSelectElement).value as AppTheme)"><option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <button class="account-button" @click="accountOpen = !accountOpen">{{ auth.user?.name?.slice(0, 1) || 'A' }}</button>
          <div v-if="accountOpen" class="account-popover"><strong>{{ auth.user?.name || t('user.title') }}</strong><button @click="logout"><LogOut :size="16"/>{{ t('common.logout') }}</button></div>
        </div>
      </header>
      <div class="admin-body">
        <aside :class="['global-nav', { open: mobile }]">
          <button v-for="group in groups" :key="group" :class="{ active: activeGroup === group }" @click="open(String(groupChildren(group)[0]?.path || '/'))"><component :is="groupIcon(group)" :size="17"/><span>{{ groupTitle(group) }}</span></button>
        </aside>
        <aside v-if="!app.menuCollapsed" class="section-nav">
          <div class="section-title"><strong>{{ groupTitle(activeGroup) }}</strong><button @click="app.menuCollapsed = true"><PanelLeftClose :size="17"/></button></div>
          <div class="section-group">
            <button v-for="item in directGroupChildren(activeGroup)" :key="String(item.path)" :class="{ active: route.path === item.path }" @click="open(String(item.path))"><component :is="itemIcon(String(item.path), String(item.meta?.icon || 'Menu'))" :size="15"/><span>{{ routeTitle(String(item.path), String(item.meta?.title)) }}</span></button>
            <template v-for="parent in groupParents(activeGroup)" :key="parent">
              <button class="directory-item" :class="{ active: route.meta.parent === parent }" @click="toggleParent(parent)"><component :is="itemIcon(String(parentChildren(parent)[0]?.path || ''), 'FileText')" :size="15"/><span>{{ parentTitle(parent) }}</span><ChevronDown :class="{ expanded: expandedParents.includes(parent) }" :size="14"/></button>
              <div v-if="expandedParents.includes(parent)" class="third-menu">
                <button v-for="item in parentChildren(parent)" :key="String(item.path)" :class="{ active: route.path === item.path }" @click="open(String(item.path))"><component :is="itemIcon(String(item.path), String(item.meta?.icon || 'FileText'))" :size="14"/><span>{{ routeTitle(String(item.path), String(item.meta?.title)) }}</span></button>
              </div>
            </template>
          </div>
        </aside>
        <button v-else class="section-expand" @click="app.menuCollapsed = false"><PanelLeftOpen :size="17"/></button>
        <section class="admin-main">
          <div class="page-heading"><span>{{ groupTitle(activeGroup) }}</span><template v-if="route.meta.parent"><b>/</b><span>{{ parentTitle(String(route.meta.parent)) }}</span></template><b>/</b><strong>{{ routeTitle(route.path, String(route.meta.title || 'layout.welcome')) }}</strong></div>
          <div class="page-tabs">
            <button v-if="tabsOverflow" class="tab-scroll-button" :title="t('common.scrollLeft')" @click="scrollTabs(-260)"><ChevronLeft :size="15"/></button>
            <div ref="tabScroller" class="tab-scroller">
              <button v-for="path in tabs" :key="path" :data-tab-path="path" :class="{ active: route.path === path }" @click="router.push(path)">
                {{ routeTitle(path, String(children.find(item => item.path === path)?.meta?.title || '')) }}
                <a-dropdown :trigger="['click']" overlay-class-name="tab-close-dropdown"><X :size="13" @click.stop/><template #overlay><a-menu><a-menu-item @click="close(path)">{{ t('common.closeCurrent') }}</a-menu-item><a-menu-item @click="closeOthers(path)">{{ t('common.closeOthers') }}</a-menu-item><a-menu-item danger @click="closeAll">{{ t('common.closeAll') }}</a-menu-item></a-menu></template></a-dropdown>
              </button>
            </div>
            <button v-if="tabsOverflow" class="tab-scroll-button" :title="t('common.scrollRight')" @click="scrollTabs(260)"><ChevronRight :size="15"/></button>
            <a-dropdown v-if="tabsOverflow" :trigger="['click']" overlay-class-name="tab-more-dropdown">
              <button class="tab-more-button" :title="t('common.moreTabs')"><MoreHorizontal :size="16"/></button>
              <template #overlay><a-menu><a-menu-item v-for="path in tabs" :key="path" @click="router.push(path)">{{ routeTitle(path, String(children.find(item => item.path === path)?.meta?.title || '')) }}</a-menu-item></a-menu></template>
            </a-dropdown>
          </div>
          <router-view/>
        </section>
      </div>
    </main>
</template>
