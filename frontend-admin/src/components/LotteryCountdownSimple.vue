<template>
  <div class="lottery-countdown-simple">
    <el-card shadow="hover" :class="{ 'closed': isClosed }">
      <div class="countdown-content">
        <!-- 期号 -->
        <div class="info-item">
          <span class="label">{{ periodLabel }}</span>
          <span class="value period">{{ nextPeriod }}</span>
        </div>

        <!-- 状态 -->
        <div class="info-item">
          <span class="label">状态</span>
          <span class="value" :class="statusClass">
            <el-icon><component :is="statusIcon" /></el-icon>
            {{ statusText }}
          </span>
        </div>

        <!-- 倒计时文字 -->
        <div class="info-item">
          <span class="label">{{ countdownLabel }}</span>
          <span class="value time">
            <span class="time-value">{{ formatTime(countdown.minutes) }}</span>分
            <span class="time-value">{{ formatTime(countdown.seconds) }}</span>秒
          </span>
        </div>

        <!-- 进度条 -->
      
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Lock, SuccessFilled } from '@element-plus/icons-vue'
import { getLotteryStatus } from '@/api/lottery'
import type { LotteryStatusResponse } from '@/api/lottery'
import dayjs from 'dayjs'

const emits = defineEmits(['draw', 'close', 'open'])

// 状态
const lotteryStatus = ref<LotteryStatusResponse | null>(null)
const isLoading = ref(false)
const localCountdown = ref(0) // 本地倒计时（秒）
const serverTimeOffset = ref(0) // 服务器时间与本地时间的差值（毫秒）

let timer: any = null
let syncTimer: any = null // 定时同步定时器

// 计算属性
const currentPeriod = computed(() => lotteryStatus.value?.currentPeriod || '加载中...')
const nextPeriod = computed(() => lotteryStatus.value?.nextPeriod || '')
const isClosed = computed(() => lotteryStatus.value?.status === 'closed')
const countdown = computed(() => {
  const total = Math.max(0, localCountdown.value)
  return {
    minutes: Math.floor(total / 60),
    seconds: total % 60,
    total,
  }
})

const statusClass = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return 'status-closed'
  return 'status-open'
})

const statusIcon = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return Lock
  return SuccessFilled
})

const statusText = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return '已封盘'
  return '投注中'
})

const periodLabel = computed(() => {
  if (!lotteryStatus.value) return '当前期号'
  // 使用毫秒级时间戳进行比较，与倒计时计算保持一致
  const now = Date.now() + serverTimeOffset.value
  const closeTime = dayjs(lotteryStatus.value.currentCloseTime).valueOf()
  const drawTime = dayjs(lotteryStatus.value.currentDrawTime).valueOf()

  if (now < closeTime) {
    return '距封盘期号'
  } else if (now < drawTime) {
    return '距开奖期号'
  } else {
    return '正在开奖期号'
  }
})

const countdownLabel = computed(() => {
  if (!lotteryStatus.value) return '加载中'
  // 使用毫秒级时间戳进行比较，与倒计时计算保持一致
  const now = Date.now() + serverTimeOffset.value
  const closeTime = dayjs(lotteryStatus.value.currentCloseTime).valueOf()
  const drawTime = dayjs(lotteryStatus.value.currentDrawTime).valueOf()

  if (now < closeTime) {
    return '距离封盘'
  } else if (now < drawTime) {
    return '距离开奖'
  } else {
    return '正在开奖'
  }
})

// 格式化时间（补零）
const formatTime = (value: number): string => {
  return value.toString().padStart(2, '0')
}

// 从后端获取彩票状态
const fetchLotteryStatus = async () => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    const clientRequestTime = Date.now()
    const res = await getLotteryStatus()
    const newStatus = res.data
    
    // 计算服务器时间差（用于校准）
    const serverTime = dayjs(newStatus.serverTime).valueOf()
    serverTimeOffset.value = serverTime - clientRequestTime
    
    // 根据服务器返回的时间点计算本地倒计时
    // 使用毫秒级时间戳计算，并使用 Math.ceil 向上取整，避免倒计时快1秒
    const now = Date.now() + serverTimeOffset.value
    const closeTime = dayjs(newStatus.currentCloseTime).valueOf()
    const drawTime = dayjs(newStatus.currentDrawTime).valueOf()

    let calculatedCountdown = 0
    if (now < closeTime) {
      // 使用 Math.ceil 向上取整，避免倒计时快1秒
      calculatedCountdown = Math.ceil((closeTime - now) / 1000)
    } else if (now < drawTime) {
      // 使用 Math.ceil 向上取整，避免倒计时快1秒
      calculatedCountdown = Math.ceil((drawTime - now) / 1000)
    } else {
      calculatedCountdown = 0 // 已经开奖，等待刷新
    }
    localCountdown.value = Math.max(0, calculatedCountdown)
    
    // 检测期号变化
    const oldPeriod = lotteryStatus.value?.currentPeriod
    const newPeriod = newStatus.currentPeriod
    
    if (oldPeriod && oldPeriod !== newPeriod) {
      console.log(`🎉 检测到新期号: ${oldPeriod} → ${newPeriod}`)
      emits('draw', { period: oldPeriod, nextPeriod: newPeriod })
    }
    
    // 检测状态变化并触发事件
    const oldStatus = lotteryStatus.value?.status
    if (oldStatus !== newStatus.status) {
      if (newStatus.status === 'closed' && oldStatus === 'open') {
        emits('close', { period: newStatus.currentPeriod, nextPeriod: newStatus.nextPeriod })
      } else if (newStatus.status === 'open' && oldStatus === 'closed') {
        emits('open', { period: newStatus.currentPeriod, nextPeriod: newStatus.nextPeriod })
      }
    }
    
    lotteryStatus.value = newStatus
  } catch (error) {
    console.error('获取彩票状态失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 本地倒计时更新
const updateLocalCountdown = () => {
  if (!lotteryStatus.value) return
  
  const wasZero = localCountdown.value === 0
  
  // 每秒递减
  localCountdown.value = Math.max(0, localCountdown.value - 1)
  
  // 倒计时结束，立即触发开奖事件并开始轮询
  if (localCountdown.value <= 0 && !wasZero) {
    console.log('⏱️ 倒计时结束，立即触发开奖事件')
    const currentPeriodValue = lotteryStatus.value?.currentPeriod
    // 立即触发 draw 事件，让父组件开始轮询
    emits('draw', { 
      period: currentPeriodValue, 
      nextPeriod: lotteryStatus.value?.nextPeriod,
      isCountdownEnd: true 
    })
    // 同时启动本组件的轮询检测
    handleDrawComplete()
  }
  
  // 每15秒校准一次（防止时间偏移）
  if (localCountdown.value > 0 && localCountdown.value % 15 === 0) {
    console.log('🔄 每15秒校准一次')
    fetchLotteryStatus()
  }
}

// 处理开奖完成
const handleDrawComplete = async () => {
  const oldPeriod = lotteryStatus.value?.currentPeriod
  console.log('🎲 开奖完成处理，当前期号:', oldPeriod)
  
  // 立即刷新获取最新状态
  await fetchLotteryStatus()
  
  let newPeriod = lotteryStatus.value?.currentPeriod
  console.log('🔍 获取到期号:', newPeriod)
  
  if (newPeriod && oldPeriod !== newPeriod) {
    console.log('✅ 期号已变化，触发 draw 事件')
    // 期号变化已在 fetchLotteryStatus 中触发了 draw 事件，这里不需要重复触发
    return
  }
  
  // 如果期号未变化，延迟5秒后再次刷新
  console.log('⏳ 期号未变化，5秒后重试...')
  await sleep(5000)
  await fetchLotteryStatus()
  newPeriod = lotteryStatus.value?.currentPeriod
  
  if (newPeriod && oldPeriod !== newPeriod) {
    console.log('✅ 延迟检测到期号变化')
    // 期号变化已在 fetchLotteryStatus 中触发了 draw 事件
  } else {
    console.log('⚠️ 仍未检测到新期号，等待下次同步')
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 启动倒计时
const startCountdown = () => {
  if (timer) {
    clearInterval(timer)
  }
  timer = setInterval(updateLocalCountdown, 1000)
}

// 启动定时同步（每30秒强制同步服务器状态）
const startSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
  }
  syncTimer = setInterval(() => {
    console.log('⏰ 定时同步服务器状态...')
    fetchLotteryStatus()
  }, 30000) // 30秒同步一次
}

// 监听页面可见性变化
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('👁️ 页面变为可见，立即同步状态')
    fetchLotteryStatus()
  }
}

onMounted(async () => {
  console.log('🚀 LotteryCountdownSimple 组件初始化')
  await fetchLotteryStatus()
  startCountdown()
  startSync()
  
  // 添加页面可见性监听
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (syncTimer) {
    clearInterval(syncTimer)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 暴露给父组件使用
defineExpose({
  currentPeriod,
  nextPeriod,
  fetchLotteryStatus, // 暴露刷新方法
})
</script>

<style scoped lang="scss">
.lottery-countdown-simple {
  .el-card {
    border-radius: 8px;
    transition: all 0.3s ease;

    &.closed {
      border-color: #f56c6c;
      background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
    }
  }

  .countdown-content {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #909399;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #303133;

      &.period {
        color: #409eff;
        font-size: 18px;
      }

      &.time {
        color: #409eff;
        font-size: 18px;

        .time-value {
          display: inline-block;
          min-width: 24px;
          text-align: center;
          background: #ecf5ff;
          padding: 2px 6px;
          border-radius: 4px;
          margin: 0 2px;
        }
      }

      &.status-open {
        color: #67c23a;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      &.status-closed {
        color: #f56c6c;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .progress-wrapper {
    flex: 1;
    min-width: 200px;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .lottery-countdown-simple {
    .countdown-content {
      gap: 16px;
    }

    .info-item {
      .value {
        font-size: 14px;

        &.period, &.time {
          font-size: 16px;
        }
      }
    }
  }
}
</style>




