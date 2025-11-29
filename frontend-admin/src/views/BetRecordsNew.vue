<template>
  <div class="bet-records-page">
    <!-- 倒计时组件 -->
    <LotteryCountdownSimple 
      ref="countdownRef"
      :style="{ marginBottom: '12px' }"
      @draw="handleDraw"
    />
    
    <!-- 当期下注统计（紧凑版）-->
    <div class="compact-summary">
      <div class="summary-header">
     
        <div class="summary-controls">
          <span  style="font-size: 14px;">是否开启除数：</span>
          <el-switch 
            v-model="divideEnabled" 
            size="small"
          
          />
          <span style="font-size: 14px;margin-left: 20px;">选择除数倍数：</span>
          <el-input-number
            v-model="divideNumber"
            :min="0.01"
            :max="1000"
            :precision="2"
            :step="0.1"
            :disabled="!divideEnabled"
            size="small"
            style="width: 90px"
          />
        </div>
      </div>
      <div class="summary-grid">
        <div 
          v-for="(value, key) in displaySummary" 
          :key="key" 
          class="summary-item"
        >
          <span class="item-label">{{ formatBetContentLabel(key) }}</span>
          <span class="item-value">{{ formatSummaryValue(value) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <el-card shadow="hover" :body-style="{ padding: '12px' }">
      <!-- 查询区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.issue"
          placeholder="期号"
          clearable
          size="small"
          style="width: 120px"
        />
        <el-input
          v-model="searchForm.userId"
          placeholder="用户ID"
          clearable
          size="small"
          style="width: 120px"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch" size="small">
          搜索
        </el-button>
        <!-- <el-button :icon="Refresh" @click="handleReset" size="small">重置</el-button> -->
      </div>

      <!-- 列表区域 -->
      <div class="content-wrapper">
        <div class="table-wrapper">
          <el-table :data="betList" stripe v-loading="loading" size="small">
          <el-table-column prop="issue" label="期号" width="80" />
          <el-table-column label="用户" width="100">
            <template #default="{ row }">
              <div>
                <div style="font-size: 12px;">{{ row.user?.nickname || row.user?.username || '-' }}</div>
                <div style="font-size: 10px; color: #909399;">{{ row.user?.id }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="下注内容" min-width="120">
            <template #default="{ row }">
              <span style="color: #409eff; font-weight: 600; font-size: 12px;">
                {{ row.betContent }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="85" align="center">
            <template #default="{ row }">
              <div v-if="row.status === 'pending'" style="color: #909399; font-size: 11px;">
                未结算
              </div>
              <div v-else-if="row.status === 'cancelled'" style="color: #ff976a; font-size: 11px;">
                已取消
              </div>
              <div v-else :class="row.resultAmount >= 0 ? 'profit-text' : 'loss-text'" style="font-size: 12px;">
                {{ row.resultAmount >= 0 ? '+' : '' }}{{ formatMoney(row.resultAmount) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="剩余" width="75" align="right">
            <template #default="{ row }">
              <span v-if="row.pointsAfter !== null" style="font-weight: 600; font-size: 12px;">
                {{ formatMoney(row.pointsAfter) }}
              </span>
              <span v-else style="color: #909399; font-size: 11px;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="120">
            <template #default="{ row }">
              <span style="font-size: 11px;">{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchBetList"
          @size-change="fetchBetList"
          size="small"
          :style="{ marginTop: '12px', justifyContent: 'flex-end' }"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getBetList, getBetSummary } from '@/api/bets'
import { getLotteryStatus } from '@/api/lottery'
import { formatMoney, formatDateTime } from '@/utils/format'
import type { BetRecord } from '@/types'
import LotteryCountdownSimple from '@/components/LotteryCountdownSimple.vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const summaryLoading = ref(false)
const betList = ref<BetRecord[]>([])
const summaryData = ref<Record<string, number>>({})
const countdownRef = ref<InstanceType<typeof LotteryCountdownSimple>>()
const currentIssue = ref<string>('') // 下注期号（nextPeriod，正在接受下注的期号）

// 轮询相关
const pollingTimer = ref<number | null>(null)
const pollingTimeout = ref<number | null>(null)
const isPolling = ref(false)

// 上次的汇总数据（用于检测变化）
const lastSummaryData = ref<Record<string, number>>({})

// 定期轮询汇总数据的定时器
const pollSummaryTimer = ref<number | null>(null)

// 除数设置（从本地存储加载）
const STORAGE_KEY_DIVIDE_ENABLED = 'bet-records-divide-enabled'
const STORAGE_KEY_DIVIDE_NUMBER = 'bet-records-divide-number'

const divideEnabled = ref(localStorage.getItem(STORAGE_KEY_DIVIDE_ENABLED) === 'true')
const divideNumber = ref(Number(localStorage.getItem(STORAGE_KEY_DIVIDE_NUMBER)) || 1)

// 搜索表单
const searchForm = reactive({
  userId: undefined as number | undefined,
  issue: '',
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 计算显示的汇总数据（应用除数）
const displaySummary = computed(() => {
  if (!divideEnabled.value || divideNumber.value <= 0) {
    return summaryData.value
  }

  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(summaryData.value)) {
    result[key] = value / divideNumber.value
  }
  return result
})

// 格式化下注内容标签
const formatBetContentLabel = (key: string): string => {
  if (key === 'multiple') {
    return '倍数' // 所有倍数类型的汇总
  }
  
  const labelMap: Record<string, string> = {
    // 组合
    '大': '大',
    '小': '小',
    '单': '单',
    '双': '双',
    '大单': '大单',
    '大双': '大双',
    '小单': '小单',
    '小双': '小双',
  }
  return labelMap[key] || key
}

// 格式化汇总值显示
const formatSummaryValue = (value: number | string): string => {
  // 后端返回的可能是字符串，需要先转换为数字
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (divideEnabled.value && divideNumber.value > 0) {
    const divided = numValue / divideNumber.value
    return divided.toFixed(2)
  }
  return numValue.toFixed(0)
}

// 获取下注记录
const fetchBetList = async () => {
  try {
    loading.value = true
    const res = await getBetList({
      page: pagination.page,
      limit: pagination.limit,
      userId: searchForm.userId,
      issue: searchForm.issue || undefined,
      merged: true, // 启用合并显示
    })
    betList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取下注记录失败:', error)
    ElMessage.error('获取下注记录失败')
  } finally {
    loading.value = false
  }
}

// 获取下注汇总（下一期所有用户的未结算下注总和）
const fetchSummary = async () => {
  if (!currentIssue.value) {
    console.log('下注期号未加载，跳过汇总查询')
    return
  }
  
  try {
    summaryLoading.value = true
    console.log(`📊 统计第${currentIssue.value}期（投注中）的未结算下注`)
    // 统计下注期号所有用户的未结算（pending）下注总和
    const res = await getBetSummary({ issue: currentIssue.value })
    const newData = res.data || {}
    summaryData.value = newData
    lastSummaryData.value = { ...newData } // 保存当前汇总，用于后续对比
    console.log('📊 汇总统计结果:', summaryData.value)
  } catch (error) {
    console.error('获取下注汇总失败:', error)
    ElMessage.error('获取下注汇总失败')
    summaryData.value = {}
    lastSummaryData.value = {}
  } finally {
    summaryLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchBetList()
  // 有搜索条件时停止自动刷新
  stopPollSummary()
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
  if (pollingTimeout.value) {
    clearTimeout(pollingTimeout.value)
    pollingTimeout.value = null
  }
  isPolling.value = false
}

// 轮询汇总数据并检测变化
const pollSummaryAndCheck = async () => {
  if (!currentIssue.value) return
  
  try {
    // 轮询汇总接口（轻量级）
    const res = await getBetSummary({ issue: currentIssue.value })
    const newSummary = res.data || {}
    
    // 检测是否有变化
    const hasChanged = isSummaryChanged(lastSummaryData.value, newSummary)
    
    if (hasChanged) {
      console.log(`📊 检测到汇总数据变化，刷新表格`)
      console.log(`  - 上次汇总:`, lastSummaryData.value)
      console.log(`  - 当前汇总:`, newSummary)
      
      // 更新汇总数据
      summaryData.value = newSummary
      lastSummaryData.value = { ...newSummary }
      
      // 刷新表格数据（只在第一页时刷新）
      if (pagination.page === 1) {
        await fetchBetList()
      }
    }
  } catch (error) {
    console.error('轮询汇总数据失败:', error)
  }
}

// 判断两个汇总对象是否有变化
const isSummaryChanged = (oldSummary: Record<string, number>, newSummary: Record<string, number>): boolean => {
  // 检查键的数量
  const oldKeys = Object.keys(oldSummary).sort()
  const newKeys = Object.keys(newSummary).sort()
  
  if (oldKeys.length !== newKeys.length) {
    return true
  }
  
  // 检查每个键的值（转换为数字比较，避免字符串和数字的差异）
  for (const key of newKeys) {
    if (Number(oldSummary[key]) !== Number(newSummary[key])) {
      return true
    }
  }
  
  return false
}

// 启动汇总数据轮询（每3秒轮询一次）
const startPollSummary = () => {
  // 清除之前的定时器
  stopPollSummary()
  
  // 只在没有搜索条件时启动轮询
  if (searchForm.issue || searchForm.userId) {
    console.log('⏸️ 有搜索条件，不启动汇总轮询')
    return
  }
  
  console.log('🔄 启动汇总数据轮询（3秒间隔）')
  pollSummaryTimer.value = window.setInterval(() => {
    pollSummaryAndCheck()
  }, 3000)
}

// 停止汇总轮询
const stopPollSummary = () => {
  if (pollSummaryTimer.value) {
    clearInterval(pollSummaryTimer.value)
    pollSummaryTimer.value = null
    console.log('⏹ 停止汇总轮询')
  }
}

// 开奖后轮询获取新期号数据
const startPolling = () => {
  console.log('🔔 开奖倒计时结束，开始轮询获取新期号...')
  console.log(`当前下注期号: ${currentIssue.value}`)
  
  // 停止刷新列表，避免干扰轮询
  stopPollSummary()
  
  // 清除之前的轮询
  stopPolling()
  
  const startTime = Date.now()
  const maxDuration = 60 * 1000 // 1分钟超时
  const pollingInterval = 5000 // 每5秒轮询一次
  
  isPolling.value = true
  
  // 立即执行第一次轮询
  console.log('⏰ 立即执行第一次轮询，获取最新期号...')
  fetchSummaryWithNewIssue()
  
  // 设置轮询定时器
  pollingTimer.value = window.setInterval(() => {
    const elapsed = Date.now() - startTime
    
    if (elapsed >= maxDuration) {
      console.log('⏱️ 轮询超时（1分钟），停止轮询')
      stopPolling()
      ElMessage.warning('获取新期号数据超时，请手动刷新')
      return
    }
    
    console.log(`🔄 轮询中... (已用时 ${Math.floor(elapsed / 1000)}秒)`)
    fetchSummaryWithNewIssue()
  }, pollingInterval)
  
  // 设置超时定时器
  pollingTimeout.value = window.setTimeout(() => {
    if (isPolling.value) {
      console.log('⏱️ 轮询超时，强制停止')
      stopPolling()
      ElMessage.error('获取新期号超时，请刷新页面')
    }
  }, maxDuration)
}

// 获取新期号的汇总数据
const fetchSummaryWithNewIssue = async () => {
  try {
    // 主动请求 lottery status 获取最新期号
    const res = await getLotteryStatus()
    const newNextPeriod = res.data.nextPeriod // 下一期（可以投注的期号）
    
    if (!newNextPeriod) {
      console.log('⏳ 下注期号未返回，继续等待...')
      return
    }
    
    console.log(`🔍 轮询检测: 当前=${currentIssue.value}, 服务器下注期=${newNextPeriod}`)
    
    // 如果下注期号已更新，说明新的一期已开始
    if (newNextPeriod !== currentIssue.value) {
      console.log(`✅ 检测到新下注期号: ${newNextPeriod}，更新统计面板`)
      currentIssue.value = newNextPeriod
      
      // 立即刷新倒计时组件UI
      if (countdownRef.value?.fetchLotteryStatus) {
        console.log('🔄 通知倒计时组件更新UI')
        await countdownRef.value.fetchLotteryStatus()
      }
      
      // 刷新统计数据
      await fetchSummary()
      
      // 刷新下注记录列表
      await fetchBetList()
      
      stopPolling()
      
      // 重置汇总记录
      lastSummaryData.value = {}
      
      // 重新启动刷新列表
      startPollSummary()
      
      ElMessage.success(`🎉 已更新到新期号: ${newNextPeriod}`)
    } else {
      console.log(`⏳ 期号未变化，继续轮询...`)
    }
  } catch (error) {
    console.error('❌ 轮询获取期号失败:', error)
  }
}

// 开奖事件处理
const handleDraw = (eventData: any) => {
  console.log('🎉 收到开奖事件:', eventData)
  console.log(`事件数据 - period: ${eventData?.period}, nextPeriod: ${eventData?.nextPeriod}`)
  startPolling()
}

// 监听下一期号变化（正在接受下注的期号），自动更新汇总数据
watch(() => countdownRef.value?.nextPeriod, (newIssue) => {
  if (newIssue && newIssue !== currentIssue.value && !isPolling.value) {
    console.log(`📊 下注期号变化: ${currentIssue.value} → ${newIssue}`)
    currentIssue.value = newIssue
    lastSummaryData.value = {} // 重置汇总记录
    fetchSummary()
    // 重新启动汇总轮询
    startPollSummary()
  }
}, { immediate: false })

// 监听除数设置变化，保存到本地存储
watch(divideEnabled, (newValue) => {
  localStorage.setItem(STORAGE_KEY_DIVIDE_ENABLED, String(newValue))
  console.log('💾 保存除数启用状态:', newValue)
})

watch(divideNumber, (newValue) => {
  if (newValue > 0) {
    localStorage.setItem(STORAGE_KEY_DIVIDE_NUMBER, String(newValue))
    console.log('💾 保存除数值:', newValue)
  }
})

onMounted(() => {
  // 打印从本地存储加载的设置
  console.log('📂 从本地存储加载除数设置:')
  console.log('  - 启用状态:', divideEnabled.value)
  console.log('  - 除数值:', divideNumber.value)
  
  fetchBetList()
  
  // 等待倒计时组件加载完成后获取下注期号（nextPeriod）
  setTimeout(() => {
    const nextIssue = countdownRef.value?.nextPeriod
    console.log('🎯 初始化下注期号:', nextIssue)
    if (nextIssue) {
      currentIssue.value = nextIssue
      fetchSummary()
      // 启动汇总数据轮询
      startPollSummary()
    }
  }, 1000)
})

onUnmounted(() => {
  // 组件卸载时清除所有定时器
  stopPolling()
  stopPollSummary()
})
</script>

<style scoped lang="scss">
.bet-records-page {
  // 紧凑统计面板
  .compact-summary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    color: #fff;

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);

      .header-title {
        font-size: 15px;
        font-weight: 600;
      }

      .summary-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;

      .summary-item {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 6px;
        padding: 8px;
        text-align: center;
        transition: all 0.2s;
        border: 1px solid rgba(255, 255, 255, 0.2);

        &:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .item-label {
          font-size: 11px;
          opacity: 0.9;
          display: block;
          margin-bottom: 4px;
        }

        .item-value {
          font-size: 16px;
          font-weight: 700;
          display: block;
        }
      }
    }
  }

  .search-area {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .content-wrapper {
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  .profit-text {
    color: #67c23a;
    font-weight: bold;
  }

  .loss-text {
    color: #f56c6c;
    font-weight: bold;
  }

  :deep(.el-table) {
    .el-table__cell {
      padding: 8px 0;
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .bet-records-page {
    .compact-summary {
      .summary-grid {
        grid-template-columns: repeat(4, 1fr);

        .summary-item {
          padding: 6px 4px;

          .item-label {
            font-size: 10px;
          }

          .item-value {
            font-size: 14px;
          }
        }
      }
    }

    .search-area {
      > * {
        flex: 1;
        min-width: 100px;
      }
    }

    .content-wrapper .table-wrapper {
      margin: 0 -12px;
      padding: 0 12px;
    }

    :deep(.el-table) {
      font-size: 11px;
      
      .el-table__cell {
        padding: 6px 0;
      }
    }
  }
}

@media (max-width: 480px) {
  .bet-records-page {
    .compact-summary .summary-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .search-area {
      // flex-direction: column;
      
      > * {
        width: 100%;
      }
    }
    
    :deep(.el-pagination) {
      justify-content: center;
      flex-wrap: wrap;
      
      .el-pagination__sizes {
        display: none;
      }
      
      .btn-next,
      .btn-prev,
      .el-pager li {
        min-width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 11px;
      }
    }
  }
}
</style>

