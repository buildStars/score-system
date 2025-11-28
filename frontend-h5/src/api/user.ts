import request from './request'
import type { ApiResponse, PageParams, PageData } from '@/types/api'
import type { LoginRequest, LoginResponse, UserInfo, ChangePasswordRequest } from '@/types/user'
import type { BetRequest, BetRecord, PointRecord } from '@/types/bet'

/**
 * 用户登录
 */
export function login(data: LoginRequest) {
  return request<ApiResponse<LoginResponse>>({
    url: '/user/login',
    method: 'post',
    data,
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request<ApiResponse<UserInfo>>({
    url: '/user/info',
    method: 'get',
  })
}

/**
 * 修改密码
 */
export function changePassword(data: ChangePasswordRequest) {
  return request<ApiResponse<void>>({
    url: '/user/change-password',
    method: 'post',
    data,
  })
}

/**
 * 提交下注
 */
export function submitBet(data: BetRequest) {
  return request<ApiResponse<BetRecord>>({
    url: '/user/bet',
    method: 'post',
    data,
  })
}

/**
 * 获取下注历史
 */
export function getBetHistory(params: PageParams & { status?: string; issue?: string }) {
  return request<ApiResponse<PageData<BetRecord>>>({
    url: '/user/bet-history',
    method: 'get',
    params,
  })
}

/**
 * 获取积分记录
 */
export function getPointRecords(params: PageParams & { type?: string }) {
  return request<ApiResponse<PageData<PointRecord>>>({
    url: '/user/point-records',
    method: 'get',
    params,
  })
}

