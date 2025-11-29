<template>
  <div class="lottery-countdown">
    <el-card shadow="hover" :class="{ 'closed': isClosed }">
      <div class="countdown-header">
        <div class="period-info">
          <span class="label">当前期号</span>
          <span class="period">{{ currentPeriod }}</span>
        </div>
        <div class="status-badge" :class="statusClass">
          <el-icon><component :is="statusIcon" /></el-icon>
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="countdown-body">
        <div class="countdown-text">
          {{ countdownText }}
        </div>

        <div class="time-display">
          <div class="time-block" v-if="countdown.minutes > 0">
            <span class="time-value">{{ formatTime(countdown.minutes) }}</span>
            <span class="time-label">分</span>
          </div>
          <div class="time-block">
            <span class="time-value">{{ formatTime(countdown.seconds) }}</span>
            <span class="time-label">秒</span>
          </div>
        </div>
      </div>

      <div class="countdown-footer">
        <div class="next-period">
          <span class="label">下期期号</span>
          <span class="value">{{ nextPeriod }}</span>
        </div>
        <div class="draw-time">
          <el-icon><Clock /></el-icon>
          <span>{{ nextDrawTime }}</span>
        </div>
      </div>
    </el-card>

    <!-- 封盘提示音 -->
    <audio ref="closeAudioRef" src="/sounds/close.mp3" preload="auto"></audio>
    <audio ref="openAudioRef" src="/sounds/open.mp3" preload="auto"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Clock, Warning, SuccessFilled, Lock } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { getLotteryStatus } from '@/api/lottery'
import type { LotteryStatusResponse } from '@/api/lottery'

// 状态
const lotteryStatus = ref<LotteryStatusResponse | null>(null)
const isLoading = ref(false)
const lastStatus = ref<'open' | 'closing' | 'closed'>('open')
const localCountdown = ref(0) // 本地倒计时（秒）
const serverTimeOffset = ref(0) // 服务器时间与本地时间的偏移量（毫秒）

let timer: any = null
const closeAudioRef = ref<HTMLAudioElement>()
const openAudioRef = ref<HTMLAudioElement>()

// 计算属性
const currentPeriod = computed(() => lotteryStatus.value?.currentPeriod || '加载中...')
const nextPeriod = computed(() => lotteryStatus.value?.nextPeriod || '计算中...')
const isClosed = computed(() => lotteryStatus.value?.status === 'closed')
const countdown = computed(() => {
  // 使用本地倒计时，更流畅
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
  if (status === 'closing') return 'status-warning'
  return 'status-open'
})

const statusIcon = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return Lock
  if (status === 'closing') return Warning
  return SuccessFilled
})

const statusText = computed(() => {
  const status = lotteryStatus.value?.status
  if (status === 'closed') return '已封盘'
  if (status === 'closing') return '即将封盘'
  return '投注中'
})

const countdownText = computed(() => {
  if (!lotteryStatus.value) return '加载中...'
  
  // 使用服务器时间校准后的客户端时间
  const now = Date.now() + serverTimeOffset.value
  const closeTime = parseTimeString(lotteryStatus.value.currentCloseTime)
  
  // 如果封盘时间还没到，显示"距离封盘"
  if (now < closeTime) {
    return '距离封盘还有...'
  }
  
  // 否则显示"距离开奖"
  return '距离开奖还有...'
})

const nextDrawTime = computed(() => {
  if (!lotteryStatus.value) return '--:--:--'
  const time = lotteryStatus.value.currentDrawTime
  return time.split(' ')[1] || time
})

// 格式化时间（补零）
const formatTime = (value: number): string => {
  return value.toString().padStart(2, '0')
}

// 解析时间字符串为时间戳（毫秒）
const parseTimeString = (timeStr: string): number => {
  try {
    // 格式：YYYY-MM-DD HH:mm:ss
    return new Date(timeStr.replace(' ', 'T')).getTime()
  } catch (error) {
    console.error('解析时间失败:', timeStr, error)
    return 0
  }
}

// 计算精确的倒计时（基于服务器时间）
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

// 从后端获取彩票状态
const fetchLotteryStatus = async () => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    const requestTime = Date.now()
    const res = await getLotteryStatus()
    const newStatus = res.data
    const responseTime = Date.now()
    
    // 计算服务器时间偏移量（假设网络延迟为请求往返时间的一半）
    const networkDelay = (responseTime - requestTime) / 2
    const serverTime = parseTimeString(newStatus.serverTime)
    serverTimeOffset.value = serverTime + networkDelay - responseTime
    
    // 使用精确计算初始化本地倒计时
    localCountdown.value = calculateCountdown()
    
    console.log('🕐 时间同步信息:', {
      服务器时间: newStatus.serverTime,
      客户端时间: new Date().toISOString(),
      偏移量: `${serverTimeOffset.value}ms`,
      封盘时间: newStatus.currentCloseTime,
      开奖时间: newStatus.currentDrawTime,
      倒计时: localCountdown.value + '秒',
    })
    
    // 检测状态变化
    if (lotteryStatus.value && lastStatus.value !== newStatus.status) {
      if (newStatus.status === 'closed' && lastStatus.value !== 'closed') {
        handleClosing(newStatus)
      } else if (newStatus.status === 'open' && lastStatus.value === 'closed') {
        handleOpening(newStatus)
      }
    }
    
    lotteryStatus.value = newStatus
    lastStatus.value = newStatus.status
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
  
  // 使用精确计算更新倒计时
  localCountdown.value = calculateCountdown()
  
  // 触发 tick 事件
  emits('tick', {
    minutes: countdown.value.minutes,
    seconds: countdown.value.seconds,
    total: countdown.value.total,
    isClosed: isClosed.value,
  })
  
  // 倒计时结束，重新同步服务器
  if (localCountdown.value === 0 && !wasZero) {
    console.log('⏰ 倒计时结束，重新同步服务器状态...')
    handleDrawComplete()
  }
  
  // 每60秒校准一次（防止时间偏移）
  if (localCountdown.value % 60 === 0 && localCountdown.value > 0) {
    console.log('🔄 定时校准服务器时间...')
    fetchLotteryStatus()
  }
}

// 处理开奖完成
const handleDrawComplete = async () => {
  const oldPeriod = lotteryStatus.value?.currentPeriod
  
  console.log('⏰ 倒计时结束，开始检查新开奖...')
  
  // 延迟3秒后检查（给后端时间同步数据）
  setTimeout(async () => {
    // 重新同步服务器状态
    await fetchLotteryStatus()
    
    const newPeriod = lotteryStatus.value?.currentPeriod
    
    // 如果期号变化，说明已经开奖
    if (newPeriod && oldPeriod !== newPeriod) {
      console.log('🎰 开奖完成！期号已变化', {
        已开奖期号: oldPeriod,
        当前期号: newPeriod,
      })
      
      // 触发开奖事件，让父组件刷新开奖结果
      emits('draw', {
        period: oldPeriod || '',
        nextPeriod: newPeriod,
      })
    } else {
      console.log('⚠️ 期号未变化，5秒后重试...')
      // 如果期号没变，5秒后再试一次
      setTimeout(async () => {
        await fetchLotteryStatus()
        const retryPeriod = lotteryStatus.value?.currentPeriod
        
        if (retryPeriod && retryPeriod !== oldPeriod) {
          console.log('🎰 开奖完成！重试成功', {
            已开奖期号: oldPeriod,
            当前期号: retryPeriod,
          })
          
          emits('draw', {
            period: oldPeriod || '',
            nextPeriod: retryPeriod,
          })
        } else {
          console.log('❌ 仍未获取到新期号，请手动刷新')
          // 即使没有新期号，也触发一次刷新（可能有新数据但期号相同）
          emits('draw', {
            period: oldPeriod || '',
            nextPeriod: retryPeriod || '',
          })
        }
      }, 5000)
    }
  }, 3000)
}

// 处理封盘
const handleClosing = (status: LotteryStatusResponse) => {
  console.log('⚠️ 封盘！')
  
  // 播放封盘提示音
  closeAudioRef.value?.play().catch(() => {})
  
  // 显示通知
  ElNotification({
    title: '封盘提示',
    message: `第 ${status.currentPeriod} 期已封盘，请等待开奖`,
    type: 'warning',
    duration: 3000,
  })

  // 触发封盘事件
  emits('close', {
    period: status.currentPeriod,
    nextPeriod: status.nextPeriod,
  })
}

// 处理开盘
const handleOpening = (status: LotteryStatusResponse) => {
  console.log('✅ 开盘！')
  
  // 播放开盘提示音
  openAudioRef.value?.play().catch(() => {})
  
  // 显示通知
  ElNotification({
    title: '开盘提示',
    message: `第 ${status.currentPeriod} 期开始投注`,
    type: 'success',
    duration: 3000,
  })

  // 触发开盘事件
  emits('open', {
    period: status.currentPeriod,
    nextPeriod: status.nextPeriod,
  })
}

// 定义事件
const emits = defineEmits<{
  close: [data: { period: string; nextPeriod: string }]
  open: [data: { period: string; nextPeriod: string }]
  tick: [countdown: { minutes: number; seconds: number; total: number; isClosed: boolean }]
  draw: [data: { period: string; nextPeriod: string }] // 开奖事件
}>()

// 启动倒计时（本地每秒更新）
const startCountdown = () => {
  if (timer) clearInterval(timer)
  
  // 每秒更新本地倒计时
  timer = setInterval(() => {
    updateLocalCountdown()
  }, 1000)
}

// 暴露方法和状态给父组件
defineExpose({
  refresh: fetchLotteryStatus,
  isClosed,
  currentPeriod,
  nextPeriod,
})

// 生命周期
onMounted(async () => {
  // 首次加载
  await fetchLotteryStatus()
  // 启动定时器
  startCountdown()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.lottery-countdown {
  .el-card {
    transition: all 0.3s ease;
    
    &.closed {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      border-color: #f56c6c;
    }
  }

  .countdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .period-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        color: #909399;
      }

      .period {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        font-family: 'Courier New', monospace;
      }
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;
      font-size: 14px;

      &.status-open {
        background: #f0f9ff;
        color: #67c23a;
        border: 2px solid #67c23a;
      }

      &.status-warning {
        background: #fdf6ec;
        color: #e6a23c;
        border: 2px solid #e6a23c;
        animation: pulse 1s infinite;
      }

      &.status-closed {
        background: #fef0f0;
        color: #f56c6c;
        border: 2px solid #f56c6c;
      }
    }
  }

  .countdown-body {
    text-align: center;
    padding: 20px 0;

    .countdown-text {
      font-size: 16px;
      color: #606266;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .time-display {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 16px;

      .time-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .time-value {
          font-size: 48px;
          font-weight: bold;
          color: #303133;
          font-family: 'Courier New', monospace;
          min-width: 80px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .time-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .countdown-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .next-period {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        color: #909399;
      }

      .value {
        font-size: 18px;
        font-weight: bold;
        color: #409eff;
        font-family: 'Courier New', monospace;
      }
    }

    .draw-time {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      font-size: 14px;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>

