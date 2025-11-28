import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { showToast, showDialog } from 'vant'
import router from '@/router'
import type { ApiResponse } from '@/types/api'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 根据code判断
    if (res.code !== 200) {
      showToast({
        message: res.message || '请求失败',
        type: 'fail',
      })

      // 401: Token过期或未登录
      if (res.code === 401) {
        showDialog({
          title: '提示',
          message: '登录已过期，请重新登录',
          confirmButtonText: '确定',
        }).then(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          router.push('/login')
        })
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      return res
    }
  },
  (error: AxiosError) => {
    console.error('响应错误：', error)
    
    let message = '网络错误'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未登录或登录已过期'
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          router.push('/login')
          break
        case 403:
          message = '没有权限访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = error.message || '未知错误'
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    }

    showToast({
      message,
      type: 'fail',
    })
    return Promise.reject(error)
  }
)

export default service

