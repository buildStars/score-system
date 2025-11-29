<template>
  <div class="dashboard">
    <!-- 日期选择器 -->
    <el-card class="date-selector" shadow="hover">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="fetchStatistics"
      />
    </el-card>

    <!-- 核心数据统计 -->
    <el-row :gutter="20" class="core-stats">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">下注总额</div>
            <div class="stat-value">¥{{ formatMoney(statistics?.summary.totalBetAmount || 0) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">手续费</div>
            <div class="stat-value fee">¥{{ formatMoney(statistics?.summary.totalFee || 0) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总盈亏</div>
            <div class="stat-value" :class="totalProfit >= 0 ? 'profit' : 'loss'">
              {{ totalProfit >= 0 ? '+' : '' }}¥{{ formatMoney(totalProfit) }}
            </div>
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

const loading = ref(false)
const dateRange = ref<[string, string]>([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])
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

onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped lang="scss">
.dashboard {
  .date-selector {
    margin-bottom: 20px;
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
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .dashboard {
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




