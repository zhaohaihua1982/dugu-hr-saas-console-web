import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type LoginResponse, type User } from '../../api/auth'

export const TOKEN_KEY = 'dugu-access-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<User | null>(null)
  const authenticated = computed(() => Boolean(token.value))
  function setSession(data: LoginResponse) { token.value = data.token; user.value = data.user; localStorage.setItem(TOKEN_KEY, data.token) }
  function clearSession() { token.value = ''; user.value = null; localStorage.removeItem(TOKEN_KEY) }
  async function restore() { if (!token.value) return false; try { const data = await authApi.me(); user.value = data.user; return true } catch { clearSession(); return false } }
  async function logout() { try { if (token.value) await authApi.logout() } finally { clearSession() } }
  return { token, user, authenticated, setSession, clearSession, restore, logout }
})
