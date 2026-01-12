/**
 * 通用响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  error?: string
}

/**
 * 分页响应结构
 */
export interface PaginationResponse<T = any> {
  list: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 管理员信息
 */
export interface AdminInfo {
  id: number
  username: string
  realName: string
  role: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  admin: AdminInfo
  token: string
  expiresIn: number
}

/**
 * 用户信息
 */
export interface User {
  id: number
  username: string
  nickname: string
  points: number
  status: number
  lastLoginAt?: string
  createdAt: string
}

/**
 * 开奖结果
 */
export interface LotteryResult {
  id: number
  issue: string
  number1: number
  number2: number
  number3: number
  resultSum: number
  isReturn: number
  returnReason?: string
  sizeResult: string
  oddEvenResult: string
  comboResult: string
  drawTime: string
}

/**
 * 下注记录
 */
export interface BetRecord {
  id: number
  user?: {
    id: number
    username: string
    nickname: string
  }
  issue: string
  betType: string
  betContent: string
  amount: number
  fee: number
  status: string
  resultAmount?: number
  pointsBefore: number
  pointsAfter?: number
  lotteryResult?: LotteryResult
  createdAt: string
  settledAt?: string
}

/**
 * 积分记录
 */
export interface PointRecord {
  id: number
  user?: {
    id: number
    username: string
    nickname: string
  }
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  remark: string
  operator?: {
    id: number
    username: string
    realName: string
  }
  createdAt: string
}

/**
 * 下注设置
 */
export interface BetSettings {
  multipleFeeRate: number
  multipleFeeBase: number
  comboFeeRate: number
  comboFeeBase: number
  minBetAmount: number
  maxBetAmount: number
  maxBetsPerIssue: number
  multipleLossRate: number
}

/**
 * 系统设置
 */
export interface SystemSettings {
  siteTitle?: string // 网站标题
  siteSubtitle?: string // 网站副标题
  gameEnabled: boolean
  maintenanceMode: boolean
  systemNotice: string
  lotteryDataSource: string
  autoSettleEnabled: boolean
  drawInterval: number // 开奖间隔时间（秒）
  closeBeforeDraw: number // 封盘时间（秒，0表示不封盘）
  // Telegram 配置
  telegram_enabled?: string
  telegram_bot_token?: string
  telegram_chat_id?: string
  // 允许其他动态字段
  [key: string]: any
}

/**
 * 下注类型设置
 */
export interface BetTypeSetting {
  id: number
  betType: string
  name: string
  odds: number
  minBet: number
  maxBet: number
  feeRate: number
  isEnabled: boolean
  sortOrder: number
  description?: string
}

/**
 * 统计数据
 */
export interface StatisticsData {
  summary: {
    totalUsers: number
    activeUsers: number
    totalBets: number
    totalBetAmount: number
    totalFee: number
    totalWin: number
    totalLoss: number
    netProfit: number
    totalUserPoints: number
  }
  dailyData: Array<{
    date: string
    bets: number
    betAmount: number
    fee: number
    win: number
    loss: number
    profit: number
  }>
  betTypeStats: {
    multiple: {
      count: number
      amount: number
      fee: number
    }
    combo: {
      count: number
      amount: number
      fee: number
    }
  }
  userRanking: Array<{
    userId: number
    username: string
    totalBet: number
    totalWin: number
    totalLoss: number
    netProfit: number
  }>
}

/**
 * 操作日志
 */
export interface OperationLog {
  id: number
  admin: {
    id: number
    username: string
    realName: string
  }
  action: string
  resourceType: string
  resourceId: string
  description: string
  ipAddress: string
  createdAt: string
}

