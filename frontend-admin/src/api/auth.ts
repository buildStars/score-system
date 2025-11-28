import request from '@/utils/request'
import type { ApiResponse, LoginResponse } from '@/types'

/**
 * 管理员登录
 */
export const login = (data: { username: string; password: string }) => {
  return request.post<any, ApiResponse<LoginResponse>>('/admin/login', data)
}

/**
 * 退出登录
 */
export const logout = () => {
  return request.post<any, ApiResponse>('/admin/logout')
}



