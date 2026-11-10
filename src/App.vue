<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import { useAuthStore } from './store/modules/auth'
import { useAppStore } from './store/modules/app'

const auth = useAuthStore()
const app = useAppStore()
const themeTokens = computed(() => {
  if (app.theme === 'dark') return {
    colorPrimary: '#69a7ff', colorBgLayout: '#0d1117', colorBgContainer: '#171e27', colorBgElevated: '#1d2530',
    colorFillAlter: '#202a36', colorBorder: '#303946', colorBorderSecondary: '#303946', colorText: '#e7edf5',
    colorTextSecondary: '#9ba8b8', colorTextPlaceholder: '#738194',
  }
  if (app.theme === 'light') return {
    colorPrimary: '#287fb8', colorBgLayout: '#eaf0f4', colorBgContainer: '#fbfdfe', colorBgElevated: '#ffffff',
    colorFillAlter: '#f0f5f8', colorBorder: '#d3e0e8', colorBorderSecondary: '#e2ebf0', colorText: '#2b4052',
    colorTextSecondary: '#6f8292', colorTextPlaceholder: '#9aabb8',
  }
  return {
    colorPrimary: '#168bd2', colorBgLayout: '#edf5fa', colorBgContainer: '#ffffff', colorBgElevated: '#ffffff',
    colorFillAlter: '#e9f5fc', colorBorder: '#dce7ee', colorBorderSecondary: '#e4edf3', colorText: '#26394b',
    colorTextSecondary: '#718496', colorTextPlaceholder: '#93a4b3',
  }
})
const themeConfig = computed(() => ({
  algorithm: app.dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: { ...themeTokens.value, borderRadius: 6, fontSize: 13 },
  components: {
    Modal: {
      contentBg: themeTokens.value.colorBgElevated,
      headerBg: themeTokens.value.colorBgElevated,
      titleColor: themeTokens.value.colorText,
    },
  },
}))
onMounted(() => auth.restore())
</script>

<template><a-config-provider :theme="themeConfig"><router-view /></a-config-provider></template>
