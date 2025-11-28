import dayjs from 'dayjs'

/**
 * 格式化日期时间
 */
export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化时间
 */
export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss')
}

/**
 * 格式化金额
 */
export const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00'
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) {
    return '0.00'
  }
  return num.toFixed(2)
}

/**
 * 格式化用户状态
 */
export const formatUserStatus = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '正常',
    2: '禁用',
    3: '冻结',
  }
  return statusMap[status] || '未知'
}

/**
 * 格式化下注类型
 */
export const formatBetType = (type: string): string => {
  const typeMap: Record<string, string> = {
    multiple: '倍数',
    combo: '组合',
  }
  return typeMap[type] || type
}

/**
 * 格式化下注状态
 */
export const formatBetStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待结算',
    win: '赢',
    loss: '输',
    cancelled: '取消',
  }
  return statusMap[status] || status
}

/**
 * 格式化积分类型
 */
export const formatPointType = (type: string): string => {
  const typeMap: Record<string, string> = {
    admin_add: '管理员充值',
    admin_deduct: '管理员扣除',
    bet: '下注扣除',
    fee: '手续费',
    win: '下注返还',
    recharge: '充值',
    withdraw: '提现',
  }
  return typeMap[type] || type
}

