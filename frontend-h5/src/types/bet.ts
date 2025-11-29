// 下注类型
export type BetType = 'multiple' | 'big' | 'small' | 'odd' | 'even' | 'big_odd' | 'big_even' | 'small_odd' | 'small_even'

// 组合下注内容
export type ComboContent = '大' | '小' | '单' | '双' | '大单' | '大双' | '小单' | '小双'

// 下注请求
export interface BetRequest {
  issue: string
  betType: BetType
  betContent: string
  amount: number
}

// 下注记录
export interface BetRecord {
  id: number
  issue: string
  betType: BetType
  betContent: string
  amount: number
  fee: number
  status: 'pending' | 'win' | 'loss'
  resultAmount: number | null
  pointsBefore: number
  pointsAfter: number | null
  lotteryResult?: LotteryResult
  createdAt: string
  settledAt?: string | null
}

// 开奖结果
export interface LotteryResult {
  id: number
  issue: string
  number1: number
  number2: number
  number3: number
  resultSum: number
  isReturn: number
  returnReason: string | null
  sizeResult: string
  oddEvenResult: string
  comboResult: string
  drawTime: string
}

// 当前期信息
export interface CurrentIssueInfo {
  currentIssue: string
  nextIssue: string
  countdown: number
  lastResult: LotteryResult | null
  userPoints: number
  gameEnabled: boolean
  systemNotice: string
}

// 积分记录
export interface PointRecord {
  id: number
  type: string
  displayType?: string  // 显示类型："上分" 或 "下分"
  originalType?: string  // 原始类型：recharge, deduct等
  amount: number
  balanceBefore: number
  balanceAfter: number
  remark: string
  createdAt: string
}

