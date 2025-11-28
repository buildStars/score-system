import { defineStore } from 'pinia'
import type { AdminInfo } from '@/types'

interface AuthState {
  token: string | null
  admin: AdminInfo | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    admin: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    adminName: (state) => state.admin?.realName || state.admin?.username || '',
  },

  actions: {
    /**
     * 设置认证信息
     */
    setAuth(token: string, admin: AdminInfo) {
      this.token = token
      this.admin = admin
    },

    /**
     * 清除认证信息
     */
    clearAuth() {
      this.token = null
      this.admin = null
    },
  },

  // 持久化配置
  persist: {
    key: 'auth',
    storage: localStorage,
    paths: ['token', 'admin'],
  },
})



