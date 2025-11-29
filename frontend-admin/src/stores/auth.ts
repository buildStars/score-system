import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AdminInfo } from '@/types'

export interface AuthState {
  token: string | null
  admin: AdminInfo | null
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const token = ref<string | null>(null)
    const admin = ref<AdminInfo | null>(null)

    // Getters
    const isLoggedIn = computed(() => !!token.value)
    const adminName = computed(() => admin.value?.realName || admin.value?.username || '')

    // Actions
    /**
     * 设置认证信息
     */
    function setAuth(newToken: string, newAdmin: AdminInfo) {
      token.value = newToken
      admin.value = newAdmin
    }

    /**
     * 清除认证信息
     */
    function clearAuth() {
      token.value = null
      admin.value = null
    }

    return {
      token,
      admin,
      isLoggedIn,
      adminName,
      setAuth,
      clearAuth,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'auth',
      storage: localStorage,
      paths: ['token', 'admin'],
    },
  }
)




