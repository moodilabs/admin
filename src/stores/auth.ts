import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.api'
import { tokenStorage } from '@/utils/token'
import type { AdminLoginRequest, AdminMe } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const me = ref<AdminMe | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => me.value !== null)
  const isSuper = computed(() => me.value?.role === 'SUPER')

  async function login(body: AdminLoginRequest) {
    const token = await authApi.login(body)
    tokenStorage.setTokens(token.accessToken, token.refreshToken)
    me.value = await authApi.me()
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      tokenStorage.clearTokens()
      me.value = null
    }
  }

  /** 새로고침 시 저장된 토큰으로 세션 복원 */
  async function restore() {
    if (initialized.value) return
    initialized.value = true
    if (!tokenStorage.getAccessToken()) return
    try {
      me.value = await authApi.me()
    } catch {
      tokenStorage.clearTokens()
      me.value = null
    }
  }

  return { me, isAuthenticated, isSuper, login, logout, restore }
})
