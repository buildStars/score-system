<template>
  <div class="home-page">
    <!-- 顶部标语 -->
    <div class="slogan-bar">
      一分耕耘，一分收获
    </div>

    <!-- 精简信息栏 + 倒计时 -->
    <div class="compact-info-bar">
      <div class="info-row">
        <span class="info-label">距 {{ formatIssue(lotteryStore.currentIssue) }} 期</span>
        <span class="info-value">积分 {{ formatMoney(userStore.points) }}</span>
      </div>
      <!-- 倒计时行 -->
      <div v-if="lotteryStatus" class="countdown-row">
        <span class="countdown-label">{{ getCountdownTitle() }}</span>
        <van-count-down
          v-if="countdown > 0"
          :time="countdown * 1000"
          format="mm:ss"
          @finish="onCountdownFinish"
          class="countdown-timer"
        />
        <span v-else class="countdown-loading">--:--</span>
      </div>
    </div>

    <!-- 上期开奖结果（精简版）-->
    <div v-if="lotteryStore.lastResult" class="compact-last-result">
      <div class="result-row">
        <span class="result-label">第 {{ formatIssue(lotteryStore.lastResult.issue) }} 期</span>
        <div class="result-numbers">
          <span class="num">{{ lotteryStore.lastResult.number1 }}</span>
          <span class="num">{{ lotteryStore.lastResult.number2 }}</span>
          <span class="num">{{ lotteryStore.lastResult.number3 }}</span>
          <span class="num">{{ lotteryStore.lastResult.resultSum }}</span>
          <span :class="['tag', getSizeTagClass(lotteryStore.lastResult.sizeResult)]">
            {{ lotteryStore.lastResult.sizeResult }}
          </span>
          <span :class="['tag', getOddEvenTagClass(lotteryStore.lastResult.oddEvenResult)]">
            {{ lotteryStore.lastResult.oddEvenResult }}
          </span>
          <span v-if="lotteryStore.lastResult.isReturn" class="tag tag-return">回</span>
        </div>
      </div>
    </div>

    <!-- 当期下注展示（可取消）-->
    <div v-if="currentIssueBets && currentIssueBets.bets.length > 0" class="compact-current-bets">
      <div class="section-header">
        <span class="header-text">第{{formatIssue(currentIssueBets.issue)}}期</span>
        <span class="total-amount">总分：{{ getTotalBetAmount() }}分</span>
        <span class="result-amount">结果：{{ getTotalBetAmount() }}分</span>
      </div>
      <div class="bets-list">
        <div v-for="(bet, index) in currentIssueBets.bets" :key="index" class="bet-item-compact">
          <span class="bet-name">{{ formatBetDisplay(bet.betType, bet.betContent) }}</span>
          <span class="bet-amount">{{ formatMoney(bet.totalAmount) }}分</span>
          <van-icon
            v-if="currentIssueBets.canCancel"
            name="cross"
            size="16"
            class="cancel-icon"
            @click="handleCancelBet(bet.betType, bet.betContent)"
          />
          <span v-else class="locked-text">已封盘</span>
        </div>
      </div>
    </div>

    <!-- 精简下注面板 -->
    <div class="compact-bet-section">
      <!-- 组合选项按钮组 -->
      <div class="bet-options">
        <div class="options-row">
          <div 
            v-for="option in ['单', '双']"
            :key="option"
            :class="['option-btn', { 
              'active': selectedOption === option,
              'disabled': !isOptionEnabled(option)
            }]"
            @click="selectOption(option)"
          >
            {{ option }}
            <span v-if="!isOptionEnabled(option)" class="disabled-tag">已禁用</span>
          </div>
        </div>
        <div class="options-row">
          <div 
            v-for="option in ['大', '小']"
            :key="option"
            :class="['option-btn', { 
              'active': selectedOption === option,
              'disabled': !isOptionEnabled(option)
            }]"
            @click="selectOption(option)"
          >
            {{ option }}
            <span v-if="!isOptionEnabled(option)" class="disabled-tag">已禁用</span>
          </div>
        </div>
        <div class="options-row">
          <div 
            v-for="option in ['大单', '大双', '小单', '小双']"
            :key="option"
            :class="['option-btn', { 
              'active': selectedOption === option,
              'disabled': !isOptionEnabled(option)
            }]"
            @click="selectOption(option)"
          >
            {{ option }}
            <span v-if="!isOptionEnabled(option)" class="disabled-tag">已禁用</span>
          </div>
        </div>
        <div class="options-row">
          <div 
            :class="['option-btn', 'option-multiplier', { 
              'active': selectedOption === '倍数',
              'disabled': !isOptionEnabled('倍数')
            }]"
            @click="selectOption('倍数')"
          >
            倍数
            <span v-if="!isOptionEnabled('倍数')" class="disabled-tag">已禁用</span>
          </div>
        </div>
      </div>

      <div class="multiplier-input-section">
        <van-field
          v-model="betAmount"
          type="digit"
          placeholder="¥"
          :disabled="!lotteryStore.gameEnabled"
          class="amount-input"
        />
        <van-button 
          type="primary" 
          size="small"
          :disabled="!lotteryStore.gameEnabled || !selectedOption || !betAmount"
          :loading="submitting"
          @click="onCompactSubmitBet"
        >
          确定
        </van-button>
      </div>

      <!-- 快捷金额按钮 -->
      <div class="quick-amounts-row">
        <div 
          v-for="amount in quickAmounts"
          :key="amount"
          class="quick-amount-btn"
          @click="setQuickBetAmount(amount)"
        >
          {{ amount }}
        </div>
      </div>

      <!-- 本期最低积分提示 -->
      <div class="min-points-hint">
        本期选项最低积分：0
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" route fixed>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/bet-history">投注历史</van-tabbar-item>
      <van-tabbar-item icon="records-o" to="/lottery-history">开奖历史</van-tabbar-item>
      <van-tabbar-item icon="gold-coin-o" to="/point-records">积分账单</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <!-- 快捷金额设置弹窗 -->
    <van-dialog
      v-model:show="showQuickAmountSetting"
      title="快捷金额设置"
      show-cancel-button
      :before-close="onSaveQuickAmounts"
    >
      <div class="quick-amount-setting">
        <div class="setting-tip">
          <van-icon name="info-o" />
          <span>请设置5个快捷金额，方便快速下注</span>
        </div>
        <van-field
          v-for="(amount, index) in tempQuickAmounts"
          :key="index"
          v-model="tempQuickAmounts[index]"
          type="digit"
          :label="`金额 ${index + 1}`"
          placeholder="请输入金额"
          clearable
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { showToast, showConfirmDialog, closeToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useLotteryStore } from '@/stores/lottery'
import { userApi, getLotteryStatus, getBetTypeSettings } from '@/api'
import { getCurrentIssueBets, cancelBet, type CurrentIssueBetsData } from '@/api/bet'
import { formatMoney, formatIssue } from '@/utils/format'
import type { BetType } from '@/types/bet'
import type { LotteryStatus } from '@/api/lottery'
import type { BetTypeSetting } from '@/api/system'

const userStore = useUserStore()
const lotteryStore = useLotteryStore()

const activeTab = ref(0)
const betType = ref<BetType>('multiple')
const submitting = ref(false)
const countdown = ref(0)
const showQuickAmountSetting = ref(false)
const lotteryStatus = ref<LotteryStatus | null>(null)
const serverTimeOffset = ref(0) // 服务器时间与客户端时间的差值（毫秒）
const currentIssueBets = ref<CurrentIssueBetsData | null>(null) // 当前期下注记录

// 下注类型设置（从后端获取）
const betTypeSettings = ref<BetTypeSetting[]>([])

// 辅助函数：根据下注类型获取设置
const getBetTypeSetting = (betType: string): BetTypeSetting | null => {
  return betTypeSettings.value.find(s => s.betType === betType) || null
}

// 辅助函数：根据下注内容获取对应的 betType
const getBetTypeFromContent = (content: string): string => {
  if (content === '倍数') return 'multiple'
  if (content === '大') return 'big'
  if (content === '小') return 'small'
  if (content === '单') return 'odd'
  if (content === '双') return 'even'
  if (['大单', '大双', '小单', '小双'].includes(content)) return 'combo'
  return 'big' // 默认
}

// 辅助函数：检查选项是否可用
const isOptionEnabled = (content: string): boolean => {
  const betTypeName = getBetTypeFromContent(content)
  const setting = getBetTypeSetting(betTypeName)
  // 如果没有配置或配置为禁用，则不可用
  return setting ? setting.isEnabled : true // 默认可用（兼容配置未加载的情况）
}

// 精简版：选中的下注选项
const selectedOption = ref('')
const betAmount = ref('')

// 倍数下注表单（保留，兼容旧逻辑）
const multipleBet = reactive({
  perMultiplierAmount: 100,  // 每倍金额，默认100
  multiplier: 1,              // 倍数，默认1倍
  amount: '',                 // 总金额（自动计算）
})

// 组合下注表单（保留，兼容旧逻辑）
const comboBet = reactive({
  content: '大',
  amount: '',
})

// 快捷倍数选项
const quickMultipliers = ref([1, 2, 5, 10, 20, 50])

// 快捷金额选项（从localStorage读取，默认值）（组合下注用）
const getStoredQuickAmounts = () => {
  const stored = localStorage.getItem('quickAmounts')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // 确保是数组且有5个元素
      if (Array.isArray(parsed) && parsed.length === 5) {
        return parsed.map(Number)
      }
    } catch (e) {
      console.error('解析快捷金额配置失败', e)
    }
  }
  return [100, 500, 1000, 5000, 10000]
}

const quickAmounts = ref(getStoredQuickAmounts())
const tempQuickAmounts = ref<string[]>([])

// 定时器
let countdownTimer: number | null = null

/**
 * 计算手续费（使用后端设置）
 */
const calculateFee = (type: string) => {
  const amount = type === 'multiple' ? Number(multipleBet.amount) : Number(comboBet.amount)
  if (!amount || amount <= 0) return '0.00'

  // 获取对应类型的设置
  const setting = getBetTypeSetting(type)
  if (!setting) return '0.00'

  // feeRate 是小数（如 0.03 表示 3%）
  const fee = Math.floor(amount * Number(setting.feeRate))
  return formatMoney(fee)
}

/**
 * 计算倍数下注的总金额
 */
const calculateMultipleAmount = () => {
  const total = multipleBet.perMultiplierAmount * multipleBet.multiplier
  multipleBet.amount = String(total)
  return formatMoney(total)
}

/**
 * 倍数变化时自动计算总金额
 */
const onMultiplierChange = () => {
  calculateMultipleAmount()
}

/**
 * 设置快捷倍数
 */
const setQuickMultiplier = (mult: number) => {
  multipleBet.multiplier = mult
  calculateMultipleAmount()
}

/**
 * 设置快捷金额（组合下注用）
 */
const setQuickAmount = (type: string, amount: number) => {
  if (type === 'multiple') {
    // 倍数下注已改为倍数选择，不再使用快捷金额
    multipleBet.amount = String(amount)
  } else {
    comboBet.amount = String(amount)
  }
}

/**
 * 精简版：选择下注选项
 */
const selectOption = (option: string) => {
  // 检查选项是否可用
  if (!isOptionEnabled(option)) {
    showToast({
      message: '⚠️ 该选项已被禁用，无法下注',
      type: 'fail',
      duration: 2000,
    })
    return
  }
  selectedOption.value = option
}

/**
 * 精简版：设置快捷金额
 */
const setQuickBetAmount = (amount: number) => {
  betAmount.value = String(amount)
}

/**
 * 精简版：计算当期总下注金额
 */
const getTotalBetAmount = () => {
  if (!currentIssueBets.value?.bets) return 0
  return currentIssueBets.value.bets.reduce((sum, bet) => sum + bet.totalAmount, 0)
}

/**
 * 精简版：获取大小标签样式
 */
const getSizeTagClass = (size: string) => {
  return size === '大' ? 'tag-big' : 'tag-small'
}

/**
 * 精简版：获取单双标签样式
 */
const getOddEvenTagClass = (oddEven: string) => {
  return oddEven === '单' ? 'tag-odd' : 'tag-even'
}

/**
 * 精简版：提交下注
 */
const onCompactSubmitBet = async () => {
  if (!selectedOption.value) {
    showToast({
      message: '⚠️ 请选择下注选项',
      type: 'fail',
      duration: 2000,
    })
    return
  }

  if (!betAmount.value || Number(betAmount.value) <= 0) {
    showToast({
      message: '⚠️ 请输入有效的金额',
      type: 'fail',
      duration: 2000,
    })
    return
  }

  const amount = Number(betAmount.value)

  // 验证金额范围（使用后端设置）
  const betTypeName = getBetTypeFromContent(selectedOption.value)
  const setting = getBetTypeSetting(betTypeName)
  
  if (setting) {
    if (amount < Number(setting.minBet)) {
      showToast({
        message: `⚠️ ${setting.name} 最小下注金额为 ${formatMoney(Number(setting.minBet))}`,
        type: 'fail',
        duration: 2000,
      })
      return
    }

    if (amount > Number(setting.maxBet)) {
      showToast({
        message: `⚠️ ${setting.name} 最大下注金额为 ${formatMoney(Number(setting.maxBet))}`,
        type: 'fail',
        duration: 2000,
      })
      return
    }
  }

  if (amount > userStore.points) {
    showToast({
      message: `⚠️ 积分不足\n当前积分：${formatMoney(userStore.points)}\n需要积分：${formatMoney(amount)}`,
      type: 'fail',
      duration: 2500,
    })
    return
  }

  try {
    submitting.value = true

    // 判断是倍数下注还是组合下注
    const betType = selectedOption.value === '倍数' ? 'multiple' : 'combo'
    const betContent = selectedOption.value === '倍数' ? String(amount) : selectedOption.value

    await userApi.submitBet({
      issue: lotteryStore.currentIssue,
      betType: betType,
      betContent: betContent,
      amount: amount,
    })

    showToast({
      message: '✅ 下注成功！',
      type: 'success',
      duration: 2000,
    })

    // 刷新用户信息和当前期下注
    await Promise.all([
      userStore.fetchUserInfo(),
      loadCurrentIssueBets(),
    ])

    // 清空表单
    selectedOption.value = ''
    betAmount.value = ''
  } catch (error: any) {
    console.error('下注失败：', error)
      
    let errorMessage = '下注失败，请重试'
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }
      
    showToast({
      message: `❌ ${errorMessage}`,
      type: 'fail',
      duration: 3000,
    })
  } finally {
    submitting.value = false
  }
}

/**
 * 保存快捷金额配置
 */
const onSaveQuickAmounts = async (action: string) => {
  if (action === 'confirm') {
    try {
      // 验证输入
      const amounts = tempQuickAmounts.value
        .map(v => Number(v))
        .filter(v => v > 0)
      
      if (amounts.length !== 5) {
        showToast({
          message: '请输入5个有效的金额',
          type: 'fail',
        })
        return false
      }

      // 检查是否有重复
      const uniqueAmounts = [...new Set(amounts)]
      if (uniqueAmounts.length !== 5) {
        showToast({
          message: '金额不能重复',
          type: 'fail',
        })
        return false
      }

      // 排序并保存
      const sortedAmounts = amounts.sort((a, b) => a - b)
      quickAmounts.value = sortedAmounts
      localStorage.setItem('quickAmounts', JSON.stringify(sortedAmounts))
      
      showToast({
        message: '保存成功',
        type: 'success',
      })
      
      return true
    } catch (error) {
      console.error('保存快捷金额失败：', error)
      showToast({
        message: '保存失败',
        type: 'fail',
      })
      return false
    }
  } else {
    // 取消，恢复原值
    tempQuickAmounts.value = quickAmounts.value.map(String)
    return true
  }
}

/**
 * 打开快捷金额设置时初始化
 */
const openQuickAmountSetting = () => {
  tempQuickAmounts.value = quickAmounts.value.map(String)
  showQuickAmountSetting.value = true
}

// 监听弹窗显示状态
watch(showQuickAmountSetting, (show) => {
  if (show) {
    tempQuickAmounts.value = quickAmounts.value.map(String)
  }
})

/**
 * 加载当前期下注记录
 */
const loadCurrentIssueBets = async () => {
  try {
    const res = await getCurrentIssueBets()
    // res 是 ApiResponse<CurrentIssueBetsData> 类型
    // res.data 才是 CurrentIssueBetsData 类型
    currentIssueBets.value = res.data
  } catch (error) {
    console.error('加载当前期下注失败：', error)
    currentIssueBets.value = null
  }
}

/**
 * 取消当前期某个玩法的下注
 */
const handleCancelBet = async (betType: string, betContent: string) => {
  if (!currentIssueBets.value) return
  
  // 检查是否可以取消
  if (!currentIssueBets.value.canCancel) {
    showToast({
      message: '已封盘，无法取消下注',
      type: 'fail',
      duration: 2000,
    })
    return
  }

  try {
    // 确认取消
    await showConfirmDialog({
      title: '确认取消',
      message: `确定要取消 ${betType === 'multiple' ? betContent + '倍数' : betContent} 的下注吗？`,
      confirmButtonText: '确定取消',
      confirmButtonColor: '#ee0a24',
      cancelButtonText: '我再想想',
    })

    const res = await cancelBet({
      issue: currentIssueBets.value.issue,
      betType,
      betContent,
    })

    // res 是 ApiResponse<{ message, cancelledCount, currentPoints }> 类型
    // res.data 才是实际的数据对象
    showToast({
      message: `✅ 取消成功！\n已取消 ${res.data.cancelledCount} 笔下注`,
      type: 'success',
      duration: 2500,
    })

    // 刷新用户信息和当前期下注
    await Promise.all([
      userStore.fetchUserInfo(),
      loadCurrentIssueBets(),
    ])
  } catch (error: any) {
    if (error === 'cancel') {
      // 用户取消操作
      return
    } else {
      console.error('取消下注失败：', error)
      
      let errorMessage = '取消失败，请重试'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showToast({
        message: `❌ ${errorMessage}`,
        type: 'fail',
        duration: 3000,
      })
    }
  }
}

/**
 * 格式化玩法显示
 */
const formatBetDisplay = (betType: string, betContent: string) => {
  if (betType === 'multiple') {
    // 如果是合并后的倍数下注，betContent 为 'multiple'，只显示"倍数"
    // 如果是单独的倍数下注，betContent 为具体数值，显示"xxx倍数"
    return betContent === 'multiple' ? '倍数' : `${betContent}倍数`
  } else {
    return betContent
  }
}

/**
 * 切换下注类型
 */
const onBetTypeChange = () => {
  // 清空表单
  multipleBet.multiplier = 1
  multipleBet.amount = ''
  comboBet.amount = ''
  calculateMultipleAmount()
}

/**
 * 提交下注
 */
const onSubmitBet = async (type: BetType) => {
  if (!lotteryStore.gameEnabled) {
    showToast({
      message: '⚠️ 游戏已暂停',
      type: 'fail',
      duration: 2000,
    })
    return
  }

  const amount = type === 'multiple' ? Number(multipleBet.amount) : Number(comboBet.amount)
  const content = type === 'multiple' ? multipleBet.amount : comboBet.content

  // 验证
  if (!amount || amount <= 0) {
    showToast({
      message: '⚠️ 请输入有效的金额',
      type: 'fail',
      duration: 2000,
    })
    return
  }

  // 验证金额范围（使用后端设置）
  const setting = getBetTypeSetting(type)
  if (setting) {
    if (amount < Number(setting.minBet)) {
      showToast({
        message: `⚠️ ${setting.name} 最小下注金额为 ${formatMoney(Number(setting.minBet))}`,
        type: 'fail',
        duration: 2000,
      })
      return
    }

    if (amount > Number(setting.maxBet)) {
      showToast({
        message: `⚠️ ${setting.name} 最大下注金额为 ${formatMoney(Number(setting.maxBet))}`,
        type: 'fail',
        duration: 2000,
      })
      return
    }
  }

  if (amount > userStore.points) {
    showToast({
      message: `⚠️ 积分不足\n当前积分：${formatMoney(userStore.points)}\n需要积分：${formatMoney(amount)}`,
      type: 'fail',
      duration: 2500,
    })
    return
  }

  try {
    const fee = calculateFee(type)
    await showConfirmDialog({
      title: '确认下注',
      message: `下注内容：${content}\n下注金额：${formatMoney(amount)}\n手续费：${fee}\n\n确认提交吗？`,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })

    submitting.value = true

    await userApi.submitBet({
      issue: lotteryStore.currentIssue,
      betType: type,
      betContent: content,
      amount: amount,
    })

    // 下注成功提示
    showToast({
      message: '✅ 下注成功！',
      type: 'success',
      duration: 2000,
    })

    // 刷新用户信息和当前期下注
    await Promise.all([
      userStore.fetchUserInfo(),
      loadCurrentIssueBets(),
    ])

    // 清空表单
    if (type === 'multiple') {
      multipleBet.multiplier = 1
      multipleBet.amount = ''
      calculateMultipleAmount()
    } else {
      comboBet.amount = ''
    }
  } catch (error: any) {
    if (error === 'cancel') {
      // 用户取消下注（不显示toast，用户主动取消无需提示）
      return
    } else {
      // 下注失败
      console.error('下注失败：', error)
      
      // 提取错误信息
      let errorMessage = '下注失败，请重试'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showToast({
        message: `❌ ${errorMessage}`,
        type: 'fail',
        duration: 3000,
      })
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 获取倒计时标题
 */
const getCountdownTitle = () => {
  if (!lotteryStatus.value) return '距离开奖'
  
  // 使用服务器时间校准后的客户端时间
  const now = Date.now() + serverTimeOffset.value
  const closeTime = parseTimeString(lotteryStatus.value.currentCloseTime)
  
  // 如果封盘时间还没到，显示"距离封盘"
  if (now < closeTime) {
    return '距离封盘'
  }
  
  // 否则显示"距离开奖"
  return '距离开奖'
}



/**
 * 格式化开奖时间（只显示时分秒）
 */
const formatDrawTime = (timeStr: string) => {
  if (!timeStr) return '--:--:--'
  
  try {
    // 提取时分秒部分（格式：2025-11-27 05:56:30 -> 05:56:30）
    const timePart = timeStr.split(' ')[1]
    return timePart || '--:--:--'
  } catch (error) {
    return '--:--:--'
  }
}

/**
 * 解析时间字符串为时间戳（毫秒）
 */
const parseTimeString = (timeStr: string): number => {
  try {
    // 格式：YYYY-MM-DD HH:mm:ss
    return new Date(timeStr.replace(' ', 'T')).getTime()
  } catch (error) {
    console.error('解析时间失败:', timeStr, error)
    return 0
  }
}

/**
 * 计算精确的倒计时（基于服务器时间）
 */
const calculateCountdown = (): number => {
  if (!lotteryStatus.value) return 0
  
  // 使用服务器时间校准后的客户端时间
  const now = Date.now() + serverTimeOffset.value
  
  // 解析封盘时间和开奖时间
  const closeTime = parseTimeString(lotteryStatus.value.currentCloseTime)
  const drawTime = parseTimeString(lotteryStatus.value.currentDrawTime)
  
  // 如果封盘时间还没到，显示距离封盘的倒计时
  if (now < closeTime) {
    // 使用 Math.ceil 向上取整，避免倒计时快1秒
    return Math.max(0, Math.ceil((closeTime - now) / 1000))
  }
  
  // 如果开奖时间还没到，显示距离开奖的倒计时
  if (now < drawTime) {
    // 使用 Math.ceil 向上取整，避免倒计时快1秒
    return Math.max(0, Math.ceil((drawTime - now) / 1000))
  }
  
  // 开奖时间已过，返回0
  return 0
}

/**
 * 倒计时结束
 */
const onCountdownFinish = () => {
  if (!lotteryStatus.value) {
    loadCurrentData()
    return
  }

  // 使用服务器时间校准后的客户端时间
  const now = Date.now() + serverTimeOffset.value
  const closeTime = parseTimeString(lotteryStatus.value.currentCloseTime)
  const drawTime = parseTimeString(lotteryStatus.value.currentDrawTime)
  
  // 判断是哪个倒计时结束了
  if (now < closeTime) {
    // 不应该到这里，理论上封盘时间还没到
    console.warn('倒计时异常：封盘时间还没到')
    loadCurrentData()
  } else if (now < drawTime) {
    // 封盘倒计时结束，现在距离开奖
    console.log('✅ 封盘倒计时结束，切换到开奖倒计时')
    
    // 不需要重新请求接口，直接重新计算倒计时即可
    // calculateCountdown() 会自动判断并返回距离开奖的时间
    countdown.value = calculateCountdown()
    
    // 更新游戏状态为不可下注
    lotteryStore.gameEnabled = false
  } else {
    // 开奖倒计时结束，需要加载新一期数据
    console.log('✅ 开奖倒计时结束，加载新一期数据')
    
    // 显示刷新提示
    showToast({
      message: '🎲 正在开奖，即将刷新最新期数...',
      type: 'loading',
      duration: 0, // 持续显示直到手动关闭
      forbidClick: true,
    })
    
    // 延迟3秒刷新，等待后端同步新开奖数据
    setTimeout(() => {
      loadCurrentData()
    }, 3000)
  }
}

/**
 * 加载当前期数据（使用封盘接口）
 */
const loadCurrentData = async () => {
  try {
    // 记录请求开始时间
    const requestTime = Date.now()
    
    // 使用封盘接口获取精确的倒计时和状态
    const res = await getLotteryStatus()
    const statusData = res.data as unknown as LotteryStatus
    
    // 保存状态信息
    lotteryStatus.value = statusData
    
    // 计算服务器时间偏移量（假设网络延迟为请求往返时间的一半）
    const responseTime = Date.now()
    const networkDelay = (responseTime - requestTime) / 2
    const serverTime = parseTimeString(statusData.serverTime)
    serverTimeOffset.value = serverTime + networkDelay - responseTime
    
    console.log('🕐 时间同步信息:', {
      服务器时间: statusData.serverTime,
      客户端时间: new Date().toISOString(),
      偏移量: `${serverTimeOffset.value}ms`,
      封盘时间: statusData.currentCloseTime,
      开奖时间: statusData.currentDrawTime,
    })
    
    // 检测期号是否变化
    const oldIssue = lotteryStore.currentIssue
    const newIssue = statusData.currentPeriod
    
    // 更新期号信息
    lotteryStore.currentIssue = newIssue
    
    // 如果期号变化了，清空当前期下注记录
    if (oldIssue && oldIssue !== newIssue) {
      console.log('🔄 期号已更新:', oldIssue, '->', newIssue, '清空下注记录')
      currentIssueBets.value = null
    }
    
    // 计算初始倒计时
    countdown.value = calculateCountdown()
    
    // 更新游戏状态（根据封盘状态）
    lotteryStore.gameEnabled = statusData.canBet
    
    // 同时获取用户信息、上期开奖结果和当前期下注
    await Promise.all([
      userStore.fetchUserInfo(),
      lotteryStore.fetchCurrentIssue(), // 获取上期开奖结果和系统公告
      loadCurrentIssueBets(), // 加载当前期下注记录
    ])
    
    // 关闭加载提示
    closeToast()
    
   
    
    // 启动倒计时
    startCountdown()
  } catch (error) {
    console.error('加载数据失败：', error)
    showToast({
      message: '加载失败，请稍后重试',
      type: 'fail',
    })
  }
}

/**
 * 启动倒计时
 */
const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  countdownTimer = window.setInterval(() => {
    // 使用精确计算的倒计时
    const newCountdown = calculateCountdown()
    countdown.value = newCountdown
    lotteryStore.updateCountdown(newCountdown)
    
    // 倒计时结束，刷新数据
    if (newCountdown === 0) {
      console.log('⏰ 倒计时结束，刷新数据...')
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      // 延迟3秒后刷新，等待后端同步新开奖数据
      setTimeout(() => {
        loadCurrentData()
      }, 3000)
    }
  }, 1000)
}

/**
 * 加载下注类型设置
 */
const loadBetTypeSettings = async () => {
  try {
    const res = await getBetTypeSettings()
    if (res.data) {
      betTypeSettings.value = res.data
      console.log('✅ 下注类型设置加载成功:', betTypeSettings.value)
    }
  } catch (error) {
    console.error('❌ 加载下注类型设置失败:', error)
    // 出错时使用空数组，前端将无法验证
  }
}

onMounted(async () => {
  // 先加载下注类型设置
  await loadBetTypeSettings()
  // loadCurrentData() 会自动加载 loadCurrentIssueBets()
  loadCurrentData()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.home-page {
  min-height: 100vh;
  padding-bottom: 60px;
  background-color: #fff;
}

// 顶部标语
.slogan-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 500;
}

// 精简信息栏
.compact-info-bar {
  background: #fff;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    margin-bottom: 8px;

    .info-label {
      color: #333;
      font-weight: 500;
    }

    .info-value {
      color: #ff4444;
      font-weight: 600;
    }
  }

  .countdown-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 6px;

    .countdown-label {
      font-size: 13px;
      color: #fff;
      font-weight: 500;
    }

    .countdown-timer {
      flex: 1;
      text-align: right;
      color: #fff;
      font-size: 16px;
      font-weight: 600;

      :deep(.van-count-down) {
        color: #fff;
      }
    }

    .countdown-loading {
      flex: 1;
      text-align: right;
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      font-weight: 600;
    }
  }
}

// 精简上期开奖结果
.compact-last-result {
  background: #fff;
  padding: 10px 15px;
  margin-bottom: 8px;

  .result-row {
    display: flex;
    align-items: center;
    gap: 10px;

    .result-label {
      font-size: 13px;
      color: #666;
      min-width: 100px;
    }

    .result-numbers {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;

      .num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        padding: 0 6px;
      }

      .tag {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;

        &.tag-big, &.tag-small {
          background: #e8f5e9;
          color: #4caf50;
        }

        &.tag-odd, &.tag-even {
          background: #e3f2fd;
          color: #2196f3;
        }

        &.tag-return {
          background: #fff3e0;
          color: #ff9800;
        }
      }
    }
  }
}

// 当期下注展示（精简版 - 带取消功能）
.compact-current-bets {
  background: #4caf50;
  color: #fff;
  padding: 10px 15px;
  margin: 8px 0;
  border-radius: 6px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);

    .header-text {
      font-weight: 600;
    }

    .total-amount,
    .result-amount {
      font-size: 12px;
      opacity: 0.9;
    }
  }

  .bets-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .bet-item-compact {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      font-size: 13px;

      .bet-name {
        color: #333;
        font-weight: 500;
      }

      .bet-amount {
        color: #ff6600;
        font-weight: 600;
      }

      .cancel-icon {
        color: #ff0000;
        cursor: pointer;
        transition: transform 0.2s;

        &:active {
          transform: scale(0.85);
        }
      }

      .locked-text {
        font-size: 11px;
        color: #999;
      }
    }
  }
}

// 精简下注面板
.compact-bet-section {
  background: #fff;
  padding: 15px;

  .bet-options {
    margin-bottom: 15px;

    .options-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;

      .option-btn {
        flex: 1;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 6px;
        text-align: center;
        font-size: 15px;
        font-weight: 500;
        color: #333;
        cursor: pointer;
        transition: all 0.3s;

        &:active {
          transform: scale(0.95);
        }

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        &.disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
          opacity: 0.6;
          position: relative;

          &:active {
            transform: none;
          }

          .disabled-tag {
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 10px;
            background: #ff4d4f;
            color: #fff;
            padding: 2px 4px;
            border-radius: 3px;
          }
        }
      }
    }
  }

  .multiplier-input-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;

    .input-label {
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }

    :deep(.amount-input) {
      flex: 1;

      .van-field__control {
        text-align: center;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .quick-amounts-row {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    .quick-amount-btn {
      flex: 1;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: center;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;

      &:active {
        background: #e0e0e0;
        transform: scale(0.95);
      }
    }
  }

  .min-points-hint {
    font-size: 13px;
    color: #999;
    text-align: center;
  }
}

// 旧样式保留（兼容）
.info-bar {
  display: flex;
  background: #fff;
  padding: 15px;
  position: relative;

  .info-item {
    flex: 1;
    text-align: center;

    .label {
      display: block;
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }

    .value {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: $primary-color;
    }
  }

  .setting-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #999;
    padding: 5px;

    &:active {
      opacity: 0.6;
    }
  }
}

.countdown-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  text-align: center;
  color: #fff;
  transition: all 0.3s ease;

  // 不同状态的背景色
  &.status-open {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); // 蓝紫色-开盘
  }

  &.status-closing {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); // 粉红色-即将封盘
  }

  &.status-closed {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); // 橙黄色-已封盘
  }

  .countdown-title {
    font-size: 14px;
    margin-bottom: 15px;
    opacity: 0.9;
  }

  .status-hint {
    margin-top: 10px;
    font-size: 12px;
    opacity: 0.8;
  }

  .draw-time-info {
    margin-top: 15px;
    font-size: 13px;
    opacity: 0.9;

    .time-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .time-label {
        opacity: 0.8;
      }

      .time-value {
        font-weight: bold;
        font-size: 16px;
      }
    }
  }

  .block {
    display: inline-block;
    width: 50px;
    height: 50px;
    line-height: 50px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: $border-radius-md;
    font-size: 24px;
    font-weight: bold;
  }

  .colon {
    margin: 0 8px;
    font-size: 24px;
    font-weight: bold;
  }

  .countdown-loading {
    font-size: 18px;
    padding: 10px;
  }
}

// 当期下注展示区域
.current-bets-section {
  margin: 10px;
  padding: 12px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: $border-radius-md;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);

    .title-text {
      font-size: 14px;
      font-weight: bold;
      color: #fff;
    }

    .issue-text {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
    }
  }

  .bets-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .bet-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

      .bet-content {
        display: flex;
        align-items: center;
        gap: 8px;

        .bet-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .bet-amount {
          font-size: 14px;
          font-weight: bold;
          color: $primary-color;
        }
      }

      .cancel-icon {
        margin-left: 8px;
        color: #ee0a24;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.2);
        }

        &:active {
          transform: scale(0.9);
        }
      }

      .locked-hint {
        margin-left: 8px;
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.last-result {
  margin: 10px;

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .label {
      font-size: 14px;
      color: #999;
    }

    .issue {
      font-size: 14px;
      color: $primary-color;
      font-weight: bold;
    }
  }

  .numbers {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;

    .number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 45px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-radius: 50%;
      font-size: 20px;
      font-weight: bold;
    }

    .plus, .equal {
      margin: 0 8px;
      font-size: 16px;
      color: #999;
    }

    .sum {
      font-size: 28px;
      font-weight: bold;
      color: $primary-color;
      margin-left: 10px;
    }
  }

  .result-tags {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}

.bet-section {
  background: #fff;
  margin: 10px;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.bet-panel {
  padding: 15px;

  .combo-options {
    :deep(.van-radio-group) {
      display: flex;
      gap: 10px;

      .van-radio {
        flex: 1;
        padding: 10px;
        background: $background-color;
        border-radius: $border-radius-sm;
        text-align: center;
      }
    }
  }

  // 快捷金额按钮
  // 每倍金额设置
  .per-multiplier-setting {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: $background-color;
    border-radius: 8px;
    margin-bottom: 12px;

    .label {
      font-size: 14px;
      color: $text-color-secondary;
      margin-right: 12px;
      min-width: 80px;
    }

    .van-stepper {
      flex: 1;
    }

    .unit {
      font-size: 14px;
      color: $text-color-secondary;
      margin-left: 8px;
    }
  }

  // 倍数选择器
  .multiplier-selector {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: $background-color;
    border-radius: 8px;
    margin-bottom: 12px;

    .label {
      font-size: 14px;
      color: $text-color-secondary;
      margin-right: 12px;
      min-width: 80px;
    }

    .van-stepper {
      flex: 1;
    }

    .unit {
      font-size: 14px;
      color: $text-color-secondary;
      margin-left: 8px;
      font-weight: 600;
    }
  }

  // 快捷倍数按钮
  .quick-multiplier-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0;

    .van-button {
      flex: 1;
      min-width: 60px;
      font-weight: 500;
    }
  }

  // 总金额显示
  .total-amount-display {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 12px;

    .label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-right: 8px;
    }

    .value {
      flex: 1;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      text-align: right;
    }

    .unit {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-left: 8px;
    }
  }

  .quick-amount-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0;

    .van-button {
      flex: 1;
      min-width: 60px;
      font-weight: 500;
    }
  }

  .fee-info {
    padding: 10px 16px;
    background: $background-color;
    border-radius: $border-radius-sm;
    margin: 10px 0;
    display: flex;
    justify-content: space-between;

    .label {
      color: #999;
      font-size: 14px;
    }

    .value {
      color: $danger-color;
      font-size: 14px;
      font-weight: bold;
    }
  }

  .tips {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 0;
    font-size: 12px;
    color: #999;

    :deep(.van-icon) {
      font-size: 14px;
    }
  }

  :deep(.van-button) {
    margin-top: 10px;
  }
}

// 快捷金额设置弹窗
.quick-amount-setting {
  padding: 20px;

  .setting-tip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px;
    margin-bottom: 15px;
    background: #fff7e6;
    border-radius: 4px;
    font-size: 12px;
    color: #ff976a;

    :deep(.van-icon) {
      font-size: 14px;
    }
  }

  .van-field {
    margin-bottom: 10px;
  }
}
</style>

