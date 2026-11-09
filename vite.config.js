import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: env.VITE_HOST || '127.0.0.1',
      port: Number(env.VITE_PORT || 5173),
      strictPort: env.VITE_STRICT_PORT === 'true',
      open: env.VITE_OPEN === 'true',
      proxy: env.VITE_API_PROXY ? { '/api': { target: env.VITE_API_PROXY, changeOrigin: true, secure: false } } : undefined,
    },
    preview: {
      host: env.VITE_HOST || '127.0.0.1',
      port: Number(env.VITE_PREVIEW_PORT || env.VITE_PORT || 4173),
      strictPort: env.VITE_STRICT_PORT === 'true',
    },
  }
})
