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

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon user">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">用户总数</div>
              <div class="stat-value">{{ statistics?.summary.totalUsers || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon :size="32"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">活跃用户</div>
              <div class="stat-value">{{ statistics?.summary.activeUsers || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bet">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">下注总数</div>
              <div class="stat-value">{{ statistics?.summary.totalBets || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon profit">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">净利润</div>
              <div class="stat-value profit">
                ¥{{ formatMoney(statistics?.summary.netProfit || 0) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计 -->
    <el-row :gutter="20" class="detail-stats">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="detail-item">
            <span>下注总额</span>
            <span class="value">¥{{ formatMoney(statistics?.summary.totalBetAmount || 0) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="detail-item">
            <span>手续费</span>
            <span class="value">¥{{ formatMoney(statistics?.summary.totalFee || 0) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="detail-item">
            <span>总赢</span>
            <span class="value win">¥{{ formatMoney(statistics?.summary.totalWin || 0) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <div class="detail-item">
            <span>总输</span>
            <span class="value loss">¥{{ formatMoney(statistics?.summary.totalLoss || 0) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20" class="charts">
      <!-- 每日统计趋势图 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>每日统计趋势</span>
            </div>
          </template>
          <v-chart :option="dailyChartOption" style="height: 400px" />
        </el-card>
      </el-col>

      <!-- 下注类型分布 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>下注类型分布</span>
            </div>
          </template>
          <v-chart :option="betTypeChartOption" style="height: 400px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户排行榜 -->
    <el-card shadow="hover" class="ranking">
      <template #header>
        <div class="card-header">
          <span>用户排行榜 Top 10</span>
        </div>
      </template>
      <el-table :data="statistics?.userRanking || []" stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="下注总额">
          <template #default="{ row }">¥{{ formatMoney(row.totalBet) }}</template>
        </el-table-column>
        <el-table-column label="总赢">
          <template #default="{ row }">¥{{ formatMoney(row.totalWin) }}</template>
        </el-table-column>
        <el-table-column label="总输">
          <template #default="{ row }">¥{{ formatMoney(row.totalLoss) }}</template>
        </el-table-column>
        <el-table-column label="净盈利">
          <template #default="{ row }">
            <span :class="row.netProfit >= 0 ? 'profit-text' : 'loss-text'">
              ¥{{ formatMoney(row.netProfit) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  UserFilled,
  Document,
  TrendCharts,
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import dayjs from 'dayjs'
import { getStatistics } from '@/api/statistics'
import { formatMoney } from '@/utils/format'
import type { StatisticsData } from '@/types'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const loading = ref(false)
const dateRange = ref<[string, string]>([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])
const statistics = ref<StatisticsData>()

// 每日统计趋势图配置
const dailyChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['下注金额', '手续费', '利润'],
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: statistics.value?.dailyData.map((item) => item.date) || [],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '下注金额',
      type: 'line',
      data: statistics.value?.dailyData.map((item) => item.betAmount) || [],
      smooth: true,
    },
    {
      name: '手续费',
      type: 'line',
      data: statistics.value?.dailyData.map((item) => item.fee) || [],
      smooth: true,
    },
    {
      name: '利润',
      type: 'line',
      data: statistics.value?.dailyData.map((item) => item.profit) || [],
      smooth: true,
    },
  ],
}))

// 下注类型分布饼图配置
const betTypeChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: '下注类型',
      type: 'pie',
      radius: '50%',
      data: [
        {
          value: statistics.value?.betTypeStats.multiple.amount || 0,
          name: '倍数下注',
        },
        {
          value: statistics.value?.betTypeStats.combo.amount || 0,
          name: '组合下注',
        },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))

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

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: white;

        &.user {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.active {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.bet {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.profit {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #999;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;

          &.profit {
            color: #67c23a;
          }
        }
      }
    }
  }

  .detail-stats {
    margin-bottom: 20px;

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;

      .value {
        font-weight: bold;
        color: #333;

        &.win {
          color: #67c23a;
        }

        &.loss {
          color: #f56c6c;
        }
      }
    }
  }

  .charts {
    margin-bottom: 20px;

    .card-header {
      font-weight: bold;
      font-size: 16px;
    }
  }

  .ranking {
    .profit-text {
      color: #67c23a;
      font-weight: bold;
    }

    .loss-text {
      color: #f56c6c;
      font-weight: bold;
    }
  }
}
</style>




