<template>
  <div class="lottery-countdown-simple">
    <el-card shadow="hover" :class="{ 'closed': isClosed }">
      <div class="countdown-content">
        <!-- 期号 -->
        <div class="info-item">
          <span class="label">当前期号</span>
          <span class="value period">{{ currentPeriod }}</span>
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

// 计算属性
const currentPeriod = computed(() => lotteryStatus.value?.currentPeriod || '加载中...')
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

const countdownLabel = computed(() => {
  if (!lotteryStatus.value) return '加载中'
  const now = dayjs().add(serverTimeOffset.value, 'millisecond')
  const closeTime = dayjs(lotteryStatus.value.currentCloseTime)
  const drawTime = dayjs(lotteryStatus.value.currentDrawTime)

  if (now.isBefore(closeTime)) {
    return '距离封盘'
  } else if (now.isBefore(drawTime)) {
    return '距离开奖'
  } else {
    return '正在开奖'
  }
})

const progressPercentage = computed(() => {
  if (!lotteryStatus.value) return 0
  const now = dayjs().add(serverTimeOffset.value, 'millisecond')
  const closeTime = dayjs(lotteryStatus.value.currentCloseTime)
  const drawTime = dayjs(lotteryStatus.value.currentDrawTime)
  const drawInterval = 210 // 开奖间隔
  const closeBeforeDraw = 30 // 封盘时间

  let percentage = 0
  if (now.isBefore(closeTime)) {
    // 开放下注阶段
    const totalOpenTime = drawInterval - closeBeforeDraw
    const elapsedOpenTime = closeTime.diff(now, 'second')
    percentage = ((totalOpenTime - elapsedOpenTime) / totalOpenTime) * 100
  } else if (now.isBefore(drawTime)) {
    // 封盘阶段
    const totalCloseTime = closeBeforeDraw
    const elapsedCloseTime = drawTime.diff(now, 'second')
    percentage = ((totalCloseTime - elapsedCloseTime) / totalCloseTime) * 100
  } else {
    // 已开奖
    percentage = 100
  }
  return Math.min(100, Math.max(0, percentage))
})

const progressColor = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return '#f56c6c'
  return '#67c23a'
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
    const now = dayjs().add(serverTimeOffset.value, 'millisecond')
    const closeTime = dayjs(newStatus.currentCloseTime)
    const drawTime = dayjs(newStatus.currentDrawTime)

    let calculatedCountdown = 0
    if (now.isBefore(closeTime)) {
      calculatedCountdown = closeTime.diff(now, 'second')
    } else if (now.isBefore(drawTime)) {
      calculatedCountdown = drawTime.diff(now, 'second')
    } else {
      calculatedCountdown = 0 // 已经开奖，等待刷新
    }
    localCountdown.value = Math.max(0, calculatedCountdown)
    
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
  
  // 倒计时结束，重新同步服务器
  if (localCountdown.value <= 0 && !wasZero) {
    handleDrawComplete()
  }
  
  // 每10秒校准一次（防止时间偏移）
  if (localCountdown.value > 0 && localCountdown.value % 10 === 0) {
    fetchLotteryStatus()
  }
}

// 处理开奖完成
const handleDrawComplete = async () => {
  const oldPeriod = lotteryStatus.value?.currentPeriod
  
  // 立即刷新获取最新状态
  await fetchLotteryStatus()
  
  let newPeriod = lotteryStatus.value?.currentPeriod
  
  if (newPeriod && oldPeriod !== newPeriod) {
    emits('draw', { period: oldPeriod || '', nextPeriod: newPeriod })
  } else {
    // 延迟5秒后再次刷新，给后端同步时间
    await sleep(5000)
    await fetchLotteryStatus()
    newPeriod = lotteryStatus.value?.currentPeriod
    
    if (newPeriod && oldPeriod !== newPeriod) {
      emits('draw', { period: oldPeriod || '', nextPeriod: newPeriod })
    } else {
      // 即使没有获取到新期号，也触发一次刷新
      emits('draw', { period: oldPeriod || '', nextPeriod: newPeriod || oldPeriod || '' })
    }
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

onMounted(async () => {
  await fetchLotteryStatus()
  startCountdown()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 暴露 currentPeriod 给父组件使用
defineExpose({
  currentPeriod
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




