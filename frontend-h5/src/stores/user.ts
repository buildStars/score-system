import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginRequest } from '@/types/user'
import { userApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const points = computed(() => userInfo.value?.points || 0)
  const username = computed(() => userInfo.value?.username || '')
  const nickname = computed(() => userInfo.value?.nickname || '')

  // Actions
  /**
   * 用户登录
   */
  async function login(data: LoginRequest) {
    try {
      const res = await userApi.login(data)
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    try {
      const res = await userApi.getUserInfo()
      userInfo.value = res.data
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 更新用户积分（本地）
   */
  function updatePoints(points: number) {
    if (userInfo.value) {
      userInfo.value.points = points
    }
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    points,
    username,
    nickname,
    login,
    fetchUserInfo,
    updatePoints,
    logout,
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo'],
  },
})



