import request from '@/utils/request'
import type { ApiResponse, PaginationResponse, BetRecord } from '@/types'

/**
 * 获取下注记录
 */
export const getBetList = (params: {
  page?: number
  limit?: number
  userId?: number
  issue?: string
  status?: string
  betType?: string
  startDate?: string
  endDate?: string
  merged?: boolean // 是否合并显示
}) => {
  const requestParams = {
    ...params,
    merged: params.merged ? 'true' : undefined,
  }
  return request.get<any, ApiResponse<PaginationResponse<BetRecord>>>('/admin/bets', { params: requestParams })
}

/**
 * 获取下注汇总（所有期号所有用户的下注总和）
 * @returns 返回格式：{ multiple: 1500, '大单': 100, '小双': 200, ... }
 */
export const getBetSummary = (params?: {
  issue?: string
}) => {
  return request.get<any, ApiResponse<Record<string, number>>>('/admin/bets/summary', { params })
}

/**
 * 获取单用户日期范围内的下注汇总
 * 支持通过userId或username（模糊搜索）查找用户
 * @returns 返回格式：{ summary: "5000倍 5000大单", details: {...}, totalAmount, totalBets, user }
 */
export const getUserBetSummary = (params: {
  userId?: number
  username?: string
  startDate?: string
  endDate?: string
}) => {
  return request.get<any, ApiResponse<{
    summary: string
    details: Record<string, number>
    totalAmount: number
    totalBets: number
    user: { id: number; username: string; nickname: string } | null
    message?: string
  }>>('/admin/bets/user-summary', { params })
}

