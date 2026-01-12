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

/**
 * 修改管理员密码
 */
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request.put<any, ApiResponse<{ message: string }>>('/admin/change-password', data)
}

/**
 * 获取当前管理员信息
 */
export const getAdminProfile = () => {
  return request.get<any, ApiResponse<{
    id: number
    username: string
    realName: string
    role: string
    status: number
    lastLoginAt: string
    lastLoginIp: string
    createdAt: string
  }>>('/admin/profile')
}









