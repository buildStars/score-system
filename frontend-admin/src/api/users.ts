import request from '@/utils/request'
import type { ApiResponse, PaginationResponse, User } from '@/types'

/**
 * 获取用户列表
 */
export const getUserList = (params: {
  page?: number
  limit?: number
  keyword?: string
  status?: number
}) => {
  return request.get<any, ApiResponse<PaginationResponse<User>>>('/admin/users', { params })
}

/**
 * 创建用户
 */
export const createUser = (data: {
  username: string
  password: string
  nickname?: string
  points?: number
}) => {
  return request.post<any, ApiResponse<User>>('/admin/users', data)
}

/**
 * 调整用户积分
 */
export const adjustUserPoints = (userId: number, data: { amount: number; remark: string }) => {
  return request.put<any, ApiResponse>(`/admin/users/${userId}/points`, data)
}

/**
 * 重置用户密码
 */
export const resetUserPassword = (userId: number, data: { newPassword: string }) => {
  return request.put<any, ApiResponse>(`/admin/users/${userId}/password`, data)
}

/**
 * 更新用户状态
 */
export const updateUserStatus = (userId: number, data: { status: number }) => {
  return request.put<any, ApiResponse>(`/admin/users/${userId}/status`, data)
}




