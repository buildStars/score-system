import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CurrentIssueInfo, LotteryResult } from '@/types/bet'
import { lotteryApi } from '@/api'

export const useLotteryStore = defineStore('lottery', () => {
  // State
  const currentIssue = ref<string>('')
  const countdown = ref<number>(0)
  const lastResult = ref<LotteryResult | null>(null)
  const gameEnabled = ref<boolean>(true)
  const systemNotice = ref<string>('')

  // Actions
  /**
   * 获取当前期信息
   */
  async function fetchCurrentIssue() {
    try {
      const res = await lotteryApi.getCurrentIssue()
      const data = res.data
      
      currentIssue.value = data.currentIssue
      countdown.value = data.countdown
      lastResult.value = data.lastResult
      gameEnabled.value = data.gameEnabled
      systemNotice.value = data.systemNotice
      
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 更新倒计时
   */
  function updateCountdown(seconds: number) {
    countdown.value = seconds
  }

  /**
   * 重置store
   */
  function reset() {
    currentIssue.value = ''
    countdown.value = 0
    lastResult.value = null
    gameEnabled.value = true
    systemNotice.value = ''
  }

  return {
    currentIssue,
    countdown,
    lastResult,
    gameEnabled,
    systemNotice,
    fetchCurrentIssue,
    updateCountdown,
    reset,
  }
})




