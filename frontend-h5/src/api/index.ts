import * as userApi from './user'
import * as lotteryApi from './lottery'
import * as betApi from './bet'
import * as systemApi from './system'
import * as messageApi from './message'

export { userApi, lotteryApi, betApi, systemApi, messageApi }

// 导出常用函数
export { getCurrentIssue, getLotteryStatus, canPlaceBet, getLotteryHistory } from './lottery'
export { login, getUserInfo, changePassword } from './user'
export { submitBet, getUserBetHistory } from './bet'
export { getBetTypeSettings, getSystemSettings } from './system'
export { submitMessage } from './message'

export default {
  ...userApi,
  ...lotteryApi,
  ...betApi,
  ...systemApi,
  ...messageApi,
}

