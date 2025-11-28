import request from './request'
import type { ApiResponse, PageParams, PageData } from '@/types/api'

/**
 * 下注记录
 */
export interface BetRecord {
  id: number
  userId: number
  issue: string
  betType: string
  betContent: string
  amount: number
  fee: number
  isWin: number | null
  winAmount: number | null
  settleTime: string | null
  createdAt: string
}

/**
 * 提交下注参数
 */
export interface SubmitBetParams {
  issue: string
  betType: string
  betContent: string
  amount: number
}

/**
 * 获取用户下注历史参数
 */
export interface BetHistoryParams extends PageParams {
  status?: 'pending' | 'settled'  // pending: 未结算, settled: 已结算
  issue?: string
}

/**
 * 提交下注
 */
export function submitBet(data: SubmitBetParams) {
  return request<ApiResponse<any>>({
    url: '/user/bet',
    method: 'post',
    data,
  })
}

/**
 * 获取用户下注历史
 */
export function getUserBetHistory(params: BetHistoryParams) {
  return request<ApiResponse<PageData<BetRecord>>>({
    url: '/user/bet-history',
    method: 'get',
    params,
  })
}

/**
 * 当前期下注项（按玩法合并）
 */
export interface CurrentIssueBet {
  betType: string
  betContent: string
  totalAmount: number
  totalFee: number
  betIds: number[]
}

/**
 * 当前期下注数据
 */
export interface CurrentIssueBetsData {
  issue: string
  bets: CurrentIssueBet[]
  canCancel: boolean
}

/**
 * 获取当前期下注记录（按玩法合并）
 */
export function getCurrentIssueBets(): Promise<ApiResponse<CurrentIssueBetsData>> {
  return request({
    url: '/user/current-issue-bets',
    method: 'get',
  }) as Promise<ApiResponse<CurrentIssueBetsData>>
}

/**
 * 取消下注参数
 */
export interface CancelBetParams {
  issue: string
  betType: string
  betContent: string
}

/**
 * 取消当前期某个玩法的下注
 */
export function cancelBet(data: CancelBetParams): Promise<ApiResponse<{ message: string; refundAmount: number; newPoints: number }>> {
  return request({
    url: '/user/cancel-bet',
    method: 'post',
    data,
  }) as Promise<ApiResponse<{ message: string; refundAmount: number; newPoints: number }>>
}

