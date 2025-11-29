import * as userApi from './user'
import * as lotteryApi from './lottery'
import * as betApi from './bet'
import * as systemApi from './system'

export { userApi, lotteryApi, betApi, systemApi }

// 导出常用函数
export { getCurrentIssue, getLotteryStatus, canPlaceBet, getLotteryHistory } from './lottery'
export { login, getUserInfo, changePassword } from './user'
export { submitBet, getUserBetHistory } from './bet'
export { getBetTypeSettings } from './system'

export default {
  ...userApi,
  ...lotteryApi,
  ...betApi,
  ...systemApi,
}

