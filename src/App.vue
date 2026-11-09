<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import { useAuthStore } from './store/modules/auth'
import { useAppStore } from './store/modules/app'

const auth = useAuthStore()
const app = useAppStore()
const themeConfig = computed(() => ({ algorithm: app.dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, token: { colorPrimary: app.theme === 'light' ? '#1677ff' : '#2f91ff', borderRadius: 6 } }))
onMounted(() => auth.restore())
</script>

<template><a-config-provider :theme="themeConfig"><router-view /></a-config-provider></template>
