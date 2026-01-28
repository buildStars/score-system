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

// ==================== Telegram 用户账号配置 ====================

/**
 * 发送验证码到Telegram用户账号
 */
export function sendTelegramUserCode(phone: string) {
  return request.post<{ success: boolean; phoneCodeHash?: string; message?: string }>(
    '/admin/telegram/user/send-code',
    { phone },
  )
}

/**
 * 使用验证码登录Telegram用户账号
 */
export function signInTelegramUser(phone: string, phoneCode: string, phoneCodeHash: string) {
  return request.post<{ success: boolean; message?: string }>('/admin/telegram/user/sign-in', {
    phone,
    phoneCode,
    phoneCodeHash,
  })
}

/**
 * 使用密码登录Telegram用户账号（两步验证）
 */
export function signInTelegramUserWithPassword(password: string) {
  return request.post<{ success: boolean; message?: string }>(
    '/admin/telegram/user/sign-in-password',
    { password },
  )
}

/**
 * 获取Telegram用户账号连接状态
 */
export function getTelegramUserStatus() {
  return request.get<{ connected: boolean; username?: string; message?: string }>(
    '/admin/telegram/user/status',
  )
}

/**
 * 测试Telegram用户账号连接
 */
export function testTelegramUserConnection() {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/user/test')
}

/**
 * 使用用户账号发送Telegram消息
 */
export function sendTelegramUserMessage(message: string) {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/user/send', {
    message,
  })
}

/**
 * 转发消息到指定聊天
 */
export function forwardTelegramMessage(fromChatId: string | number, messageIds: number[]) {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/user/forward', {
    fromChatId,
    messageIds,
  })
}

/**
 * 清除Telegram用户账号Session
 */
export function clearTelegramUserSession() {
  return request.post<{ success: boolean; message: string }>('/admin/telegram/user/clear-session')
}
