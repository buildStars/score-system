import request from '@/utils/request'
import type { LotteryResult } from '@/types'

export interface QueryLotteryParams {
  page: number
  limit: number
  issue?: string
}

export interface LotteryHistoryResponse {
  list: LotteryResult[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LotteryStatusResponse {
  currentPeriod: string              // 当前期号
  nextPeriod: string                 // 下期期号
  currentCloseTime: string           // 当前期封盘时间（YYYY-MM-DD HH:mm:ss）
  currentDrawTime: string            // 当前期开奖时间（YYYY-MM-DD HH:mm:ss）
  serverTime: string                 // 服务器当前时间（YYYY-MM-DD HH:mm:ss）
  status: 'open' | 'closing' | 'closed'  // 状态：开盘、即将封盘、已封盘
  canBet: boolean                    // 是否可以下注
  countdown: number                  // 倒计时秒数（兼容字段）
  countdownText: string              // 倒计时文本（兼容字段）
  progressPercentage: number         // 进度百分比（兼容字段）
}

export interface CanBetResponse {
  canBet: boolean
  reason?: string
}

/**
 * 获取开奖历史
 */
export function getLotteryHistory(params: QueryLotteryParams) {
  return request.get<LotteryHistoryResponse>('/lottery/history', { params })
}

/**
 * 同步开奖数据
 */
export function syncLottery() {
  return request.post('/lottery/sync')
}

/**
 * 获取彩票状态（倒计时、封盘状态等）
 */
export function getLotteryStatus() {
  return request.get<LotteryStatusResponse>('/lottery/status')
}

/**
 * 检查当前是否可以下注
 */
export function canPlaceBet() {
  return request.get<CanBetResponse>('/lottery/can-bet')
}

/**
 * 手动创建开奖数据
 */
export function createLottery(data: {
  issue: string
  number1: number
  number2: number
  number3: number
}) {
  return request.post('/lottery/admin/create', data)
}

/**
 * 修改开奖数据
 */
export function updateLottery(issue: string, data: {
  number1: number
  number2: number
  number3: number
}) {
  return request.put(`/lottery/admin/update/${issue}`, data)
}

/**
 * 删除开奖数据
 */
export function deleteLottery(issue: string) {
  return request.delete(`/lottery/admin/delete/${issue}`)
}

/**
 * 手动结算指定期号
 */
export function settleLottery(issue: string) {
  return request.post('/lottery/settle', { issue })
}
