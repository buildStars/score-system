import request from '@/utils/request'
import type { BetSettings, SystemSettings, BetTypeSetting } from '@/types'

// ==================== 系统设置 ====================

/**
 * 获取所有设置（下注设置+系统设置）
 */
export function getSettings() {
  return request.get<{ betSettings: BetSettings; systemSettings: SystemSettings }>('/admin/settings')
}

/**
 * 更新下注设置
 */
export function updateBetSettings(data: Partial<BetSettings>) {
  return request.put('/admin/bet-settings', data)
}

/**
 * 更新系统设置
 */
export function updateSystemSettings(data: Partial<SystemSettings>) {
  return request.put('/admin/system-settings', data)
}

/**
 * 清空数据
 */
export function clearData(data: {
  startDate: string
  endDate: string
  clearBets?: boolean
  clearPointRecords?: boolean
  clearLotteryHistory?: boolean
}) {
  return request.post<{
    message: string
    deletedBets: number
    deletedPointRecords: number
    deletedLotteryHistory: number
  }>('/admin/clear-data', data)
}

// ==================== 下注类型配置 ====================

/**
 * 获取所有下注类型配置
 */
export function getBetTypeSettings() {
  return request.get<BetTypeSetting[]>('/admin/bet-type-settings')
}

/**
 * 获取指定下注类型配置
 */
export function getBetTypeSetting(betType: string) {
  return request.get<BetTypeSetting>(`/admin/bet-type-settings/${betType}`)
}

/**
 * 更新指定下注类型配置
 */
export function updateBetTypeSetting(betType: string, data: Partial<BetTypeSetting>) {
  return request.put(`/admin/bet-type-settings/${betType}`, data)
}

/**
 * 批量更新下注类型配置
 */
export function batchUpdateBetTypeSettings(settings: Array<Partial<BetTypeSetting> & { betType: string }>) {
  return request.post('/admin/bet-type-settings/batch', { settings })
}

// ==================== Telegram 配置 ====================

/**
 * 测试 Telegram 连接
 */
export function testTelegramConnection() {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/test')
}

/**
 * 发送 Telegram 消息
 */
export function sendTelegramMessage(message: string) {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/send', { message })
}
