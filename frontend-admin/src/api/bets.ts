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

