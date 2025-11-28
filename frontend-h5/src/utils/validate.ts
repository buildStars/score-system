/**
 * 验证用户名
 */
export function validateUsername(username: string): boolean {
  if (!username) return false
  const reg = /^[a-zA-Z0-9_]{3,20}$/
  return reg.test(username)
}

/**
 * 验证密码
 */
export function validatePassword(password: string): boolean {
  if (!password) return false
  return password.length >= 6 && password.length <= 20
}

/**
 * 验证金额
 */
export function validateAmount(amount: number | string): boolean {
  if (amount === null || amount === undefined || amount === '') return false
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return false
  if (num <= 0) return false
  
  return true
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}




