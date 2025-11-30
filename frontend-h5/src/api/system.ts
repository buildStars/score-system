import request from './request'
import type { ApiResponse } from '@/types/api'

/**
 * 下注类型设置（从 bet_type_settings 表）
 */
export interface BetTypeSetting {
  betType: string         // 下注类型（big, small, odd, even, combo, multiple等）
  name: string            // 显示名称
  minBet: number          // 最小下注金额
  maxBet: number          // 最大下注金额
  feeRate: number         // 手续费率（小数，如0.03表示3%）
  isEnabled: boolean      // 是否启用
  description: string     // 描述
}

/**
 * 系统设置（从 system_settings 表）
 */
export interface SystemSettings {
  siteTitle?: string        // 网站标题
  siteSubtitle?: string     // 网站副标题
  [key: string]: any
}

/**
 * 获取所有启用的下注类型设置（公开接口，无需认证）
 */
export function getBetTypeSettings(): Promise<ApiResponse<BetTypeSetting[]>> {
  return request.get('/lottery/bet-type-settings')
}

/**
 * 获取系统设置（公开接口，无需认证）
 */
export function getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
  return request.get('/system/settings/public')
}

