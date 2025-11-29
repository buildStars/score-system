import dayjs from 'dayjs'

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date, format = 'HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化金额（保留小数）
 */
export function formatMoney(amount: number | string, decimals = 2): string {
  if (amount === null || amount === undefined || amount === '') return '0.00'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0.00'
  
  return num.toFixed(decimals)
}

/**
 * 格式化积分（向下取整显示，内部计算用小数）
 * 例如：1085.66 → 1085
 */
export function formatPoints(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') return '0'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0'
  
  // 向下取整
  return Math.floor(num).toString()
}

/**
 * 格式化积分变动（带符号）
 */
export function formatPointChange(amount: number, decimals = 2): string {
  if (amount === 0) return '0'
  if (amount > 0) return `+${formatMoney(amount,decimals)}`
  return formatMoney(amount,decimals)
}

/**
 * 相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return ''
  
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'second')
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  
  return formatDateTime(date, 'MM-DD HH:mm')
}

/**
 * 格式化期号
 */
export function formatIssue(issue: string): string {
  if (!issue) return ''
  // 如果期号超过7位，只显示后7位
  if (issue.length > 7) {
    return issue.slice(-7)
  }
  return issue
}




