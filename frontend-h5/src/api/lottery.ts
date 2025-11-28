import request from './request'
import type { ApiResponse, PageParams, PageData } from '@/types/api'
import type { CurrentIssueInfo, LotteryResult } from '@/types/bet'

/**
 * 开奖状态信息（封盘接口）
 */
export interface LotteryStatus {
  currentPeriod: string              // 当前期号
  nextPeriod: string                 // 下期期号
  currentCloseTime: string           // 当前期封盘时间（YYYY-MM-DD HH:mm:ss）
  currentDrawTime: string            // 当前期开奖时间（YYYY-MM-DD HH:mm:ss）
  serverTime: string                 // 服务器当前时间（YYYY-MM-DD HH:mm:ss）
  status: 'open' | 'closing' | 'closed'  // 状态：开盘、即将封盘、已封盘
  canBet: boolean                    // 是否可以下注
  countdown: number                  // 倒计时秒数（兼容字段，建议使用时间字段自己计算）
  countdownText: string              // 倒计时文本（兼容字段）
  progressPercentage: number         // 进度百分比（兼容字段）
}

/**
 * 获取当前期信息
 */
export function getCurrentIssue() {
  return request<ApiResponse<CurrentIssueInfo>>({
    url: '/lottery/current',
    method: 'get',
  })
}

/**
 * 获取开奖状态（封盘接口）- 推荐使用
 */
export function getLotteryStatus() {
  return request<ApiResponse<LotteryStatus>>({
    url: '/lottery/status',
    method: 'get',
  })
}

/**
 * 检查是否可以下注
 */
export function canPlaceBet() {
  return request<ApiResponse<{ canBet: boolean; reason?: string }>>({
    url: '/lottery/can-bet',
    method: 'get',
  })
}

/**
 * 获取开奖历史
 */
export function getLotteryHistory(params: PageParams & { issue?: string }) {
  return request<ApiResponse<PageData<LotteryResult>>>({
    url: '/lottery/history',
    method: 'get',
    params,
  })
}

