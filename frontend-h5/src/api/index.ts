import * as userApi from './user'
import * as lotteryApi from './lottery'
import * as betApi from './bet'

export { userApi, lotteryApi, betApi }

// 导出常用函数
export { getCurrentIssue, getLotteryStatus, canPlaceBet, getLotteryHistory } from './lottery'
export { login, getUserInfo, changePassword } from './user'
export { submitBet, getUserBetHistory } from './bet'

export default {
  ...userApi,
  ...lotteryApi,
  ...betApi,
}

