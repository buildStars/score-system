<template>
  <div class="dashboard">
    <!-- 日期选择器 -->
    <el-card class="date-selector" shadow="hover">
      <div class="date-picker-wrapper">
        <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间"
          end-placeholder="结束时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm:ss"
          @change="fetchStatistics" />
        <el-button type="primary" size="small" @click="resetToDefault">
          重置为20点周期
        </el-button>
      </div>
    </el-card>

    <!-- 核心数据统计 -->
    <el-row :gutter="20" class="core-stats">
      <el-col :xs="24" :sm="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">下注总额</div>
            <div class="stat-value">{{ formatMoney(statistics?.summary.totalBetAmount || 0) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">手续费</div>
            <div class="stat-value fee">{{ formatMoney(statistics?.summary.totalFee || 0) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总盈亏</div>
            <div class="stat-value" :class="totalProfit >= 0 ? 'profit' : 'loss'">
              {{ totalProfit >= 0 ? '+' : '' }}{{ formatMoney(totalProfit) }}
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">回本情况（所选周期）</div>
            <div class="stat-value return-stats">
              <span class="profit">回{{ statistics?.returnStats?.returnCount || 0 }}</span>
              <span class="separator">/</span>
              <span class="loss">不{{ statistics?.returnStats?.noReturnCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户总积分 -->
    <el-row :gutter="20" class="core-stats" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">用户总积分（实时存量）</div>
            <div class="stat-value points">{{ formatMoney(statistics?.summary.totalUserPoints || 0) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getStatistics } from '@/api/statistics'
import { formatMoney } from '@/utils/format'
import type { StatisticsData } from '@/types'

// 计算默认时间范围（从20点开始的24小时）
const getDefaultDateRange = (): [string, string] => {
  const now = dayjs()
  const currentHour = now.hour()

  let startTime: dayjs.Dayjs
  let endTime: dayjs.Dayjs

  if (currentHour >= 20) {
    // 当前时间 >= 今天20点：显示今天20:00 - 明天20:00
    startTime = now.hour(20).minute(0).second(0)
    endTime = now.add(1, 'day').hour(20).minute(0).second(0)
  } else {
    // 当前时间 < 今天20点：显示昨天20:00 - 今天20:00
    startTime = now.subtract(1, 'day').hour(20).minute(0).second(0)
    endTime = now.hour(20).minute(0).second(0)
  }

  return [
    startTime.format('YYYY-MM-DD HH:mm:ss'),
    endTime.format('YYYY-MM-DD HH:mm:ss'),
  ]
}

const loading = ref(false)
const dateRange = ref<[string, string]>(getDefaultDateRange())
const statistics = ref<StatisticsData>()

// 计算总盈亏（总赢 - 总输）
const totalProfit = computed(() => {
  const totalWin = statistics.value?.summary.totalWin || 0
  const totalLoss = statistics.value?.summary.totalLoss || 0
  return totalWin - totalLoss
})

// 获取统计数据
const fetchStatistics = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  try {
    loading.value = true
    console.log('📊 查询统计数据:')
    console.log('  开始时间:', dateRange.value[0])
    console.log('  结束时间:', dateRange.value[1])

    const res = await getStatistics({
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
    })
    statistics.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 重置为20点周期
const resetToDefault = () => {
  dateRange.value = getDefaultDateRange()
  fetchStatistics()
  ElMessage.success('已重置为20点周期统计')
}

onMounted(() => {
  console.log('🏠 Dashboard 初始化')
  console.log('  默认时间范围:', dateRange.value)
  fetchStatistics()
})
</script>

<style scoped lang="scss">
.dashboard {
  .date-selector {
    margin-bottom: 20px;

    .date-picker-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .core-stats {
    .stat-item {
      text-align: center;
      padding: 20px 0;

      .stat-label {
        font-size: 16px;
        color: #909399;
        margin-bottom: 16px;
        font-weight: 500;
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #303133;

        &.fee {
          color: #409eff;
        }

        &.profit {
          color: #67c23a;
        }

        &.loss {
          color: #f56c6c;
        }

        &.points {
          color: #e6a23c;
        }

        &.return-stats {
          font-size: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;

          .separator {
            color: #dcdfe6;
            font-size: 20px;
          }
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .dashboard {
    .date-selector {
      .date-picker-wrapper {
        flex-direction: column;
        align-items: stretch;

        .el-button {
          width: 100%;
        }
      }
    }

    .core-stats {
      .stat-item {
        padding: 16px 0;

        .stat-label {
          font-size: 14px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 26px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .dashboard {
    .core-stats {
      .stat-item {
        padding: 12px 0;

        .stat-label {
          font-size: 13px;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 22px;
        }
      }
    }
  }
}
</style>
