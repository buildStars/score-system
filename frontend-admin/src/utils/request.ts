import axios, { AxiosError, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 30000, // 增加到30秒
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 如果状态码不是 200 或 201，视为错误
    if (res.code !== 200 && res.code !== 201) {
      ElMessage.error(res.message || '请求失败')
      
      // 401: 未授权
      if (res.code === 401) {
        const authStore = useAuthStore()
        authStore.clearAuth()
        router.push('/login')
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('响应错误:', error)

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          authStore.clearAuth()
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      // 检查是否是超时错误
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        ElMessage.error('请求超时，请稍后重试')
      } else {
        ElMessage.error('网络错误，请检查网络连接')
      }
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default request

