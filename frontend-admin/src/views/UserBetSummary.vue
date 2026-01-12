<template>
  <div class="user-bet-summary">
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-form">
          <!-- 用户搜索（支持ID或用户名模糊搜索） -->
          <el-select
            v-model="selectedUser"
            filterable
            remote
            reserve-keyword
            placeholder="输入用户ID/用户名/昵称搜索"
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            clearable
            style="width: 280px"
            value-key="id"
            @change="handleUserSelect"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.nickname || user.username} (ID: ${user.id})`"
              :value="user"
            >
              <div class="user-option">
                <span class="user-name">{{ user.nickname || user.username }}</span>
                <span class="user-account">@{{ user.username }}</span>
                <span class="user-id">ID: {{ user.id }}</span>
              </div>
            </el-option>
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
            :shortcuts="dateShortcuts"
          />

          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 查询结果 -->
      <div v-if="hasSearched" class="result-section">
        <!-- 用户信息 -->
        <div v-if="resultData.user" class="user-info">
          <el-descriptions :column="4" border>
            <el-descriptions-item label="用户ID">
              <el-tag type="primary">{{ resultData.user.id }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户名">
              {{ resultData.user.username }}
            </el-descriptions-item>
            <el-descriptions-item label="昵称">
              {{ resultData.user.nickname || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="查询日期范围">
              <span v-if="dateRange">
                {{ dateRange[0] }} 至 {{ dateRange[1] }}
              </span>
              <span v-else>全部时间</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 无数据提示 -->
        <div v-if="!resultData.user" class="no-data">
          <el-empty description="未找到该用户" />
        </div>

        <!-- 汇总统计卡片 -->
        <div v-else class="summary-section">
          <!-- 统计概览 -->
          <div class="stats-overview">
            <div class="stat-card total-bets">
              <div class="stat-label">总下注次数</div>
              <div class="stat-value">{{ resultData.totalBets }}</div>
            </div>
            <div class="stat-card total-amount">
              <div class="stat-label">总下注金额</div>
              <div class="stat-value">¥{{ formatMoney(resultData.totalAmount) }}</div>
            </div>
          </div>

          <!-- 汇总字符串（核心展示） -->
          <div class="summary-display">
            <div class="summary-title">
              <el-icon><DataLine /></el-icon>
              投注汇总
            </div>
            <div class="summary-content" v-if="resultData.summary">
              {{ resultData.summary }}
            </div>
            <div class="summary-empty" v-else>
              该时间范围内暂无投注记录
            </div>
          </div>

          <!-- 详细分类统计 -->
          <div class="detail-section" v-if="Object.keys(resultData.details).length > 0">
            <div class="detail-title">
              <el-icon><PieChart /></el-icon>
              分类明细
            </div>
            <div class="detail-grid">
              <div 
                v-for="(value, key) in orderedDetails" 
                :key="key" 
                class="detail-item"
                :class="getDetailClass(key)"
              >
                <span class="detail-label">{{ formatDetailLabel(key) }}</span>
                <span class="detail-value">¥{{ formatMoney(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 初始状态提示 -->
      <div v-else class="initial-hint">
        <el-empty description="请输入用户ID并选择日期范围后点击搜索">
          <template #image>
            <el-icon :size="60" color="#909399"><Search /></el-icon>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Refresh, DataLine, PieChart } from '@element-plus/icons-vue'
import { getUserBetSummary } from '@/api/bets'
import { getUserList } from '@/api/users'
import { formatMoney } from '@/utils/format'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const hasSearched = ref(false)
const userSearchLoading = ref(false)

// 用户搜索相关
const selectedUser = ref<{ id: number; username: string; nickname: string } | null>(null)
const userOptions = ref<{ id: number; username: string; nickname: string }[]>([])

const dateRange = ref<[string, string] | null>(null)

// 搜索用户（模糊匹配）
const searchUsers = async (query: string) => {
  if (!query || query.length < 1) {
    userOptions.value = []
    return
  }

  try {
    userSearchLoading.value = true
    const res = await getUserList({
      keyword: query,
      limit: 20,
    })
    userOptions.value = res.data.list.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname || '',
    }))
  } catch (error) {
    console.error('搜索用户失败:', error)
    userOptions.value = []
  } finally {
    userSearchLoading.value = false
  }
}

// 选择用户
const handleUserSelect = (user: { id: number; username: string; nickname: string } | null) => {
  selectedUser.value = user
}

// 查询结果
const resultData = ref<{
  summary: string
  details: Record<string, number>
  totalAmount: number
  totalBets: number
  user: { id: number; username: string; nickname: string } | null
}>({
  summary: '',
  details: {},
  totalAmount: 0,
  totalBets: 0,
  user: null,
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = new Date()
      return [today, today]
    },
  },
  {
    text: '昨天',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    },
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    },
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    },
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(1)
      return [start, end]
    },
  },
  {
    text: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    },
  },
]

// 按顺序排列的详情
const orderedDetails = computed(() => {
  const order = ['multiple', '大', '小', '单', '双', '大单', '大双', '小单', '小双']
  const result: Record<string, number> = {}
  
  // 先按顺序添加
  for (const key of order) {
    if (resultData.value.details[key]) {
      result[key] = resultData.value.details[key]
    }
  }
  
  // 添加其他未在顺序中的
  for (const [key, value] of Object.entries(resultData.value.details)) {
    if (!order.includes(key) && value > 0) {
      result[key] = value
    }
  }
  
  return result
})

// 格式化详情标签
const formatDetailLabel = (key: string): string => {
  if (key === 'multiple') return '倍数'
  return key
}

// 获取详情项的样式类
const getDetailClass = (key: string): string => {
  const classMap: Record<string, string> = {
    'multiple': 'type-multiple',
    '大': 'type-big',
    '小': 'type-small',
    '单': 'type-odd',
    '双': 'type-even',
    '大单': 'type-big-odd',
    '大双': 'type-big-even',
    '小单': 'type-small-odd',
    '小双': 'type-small-even',
  }
  return classMap[key] || ''
}

// 搜索
const handleSearch = async () => {
  if (!selectedUser.value) {
    ElMessage.warning('请先选择用户')
    return
  }

  try {
    loading.value = true
    const res = await getUserBetSummary({
      userId: selectedUser.value.id,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    })
    resultData.value = res.data
    hasSearched.value = true
  } catch (error) {
    console.error('获取用户投注汇总失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 重置
const handleReset = () => {
  selectedUser.value = null
  userOptions.value = []
  dateRange.value = null
  hasSearched.value = false
  resultData.value = {
    summary: '',
    details: {},
    totalAmount: 0,
    totalBets: 0,
    user: null,
  }
}
</script>

<style scoped lang="scss">
.user-bet-summary {
  .search-bar {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;

    .search-form {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
  }

  .result-section {
    .user-info {
      margin-bottom: 24px;
    }

    .no-data {
      padding: 60px 0;
    }

    .summary-section {
      .stats-overview {
        display: flex;
        gap: 20px;
        margin-bottom: 24px;

        .stat-card {
          flex: 1;
          padding: 20px;
          border-radius: 12px;
          text-align: center;

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 28px;
            font-weight: 700;
          }

          &.total-bets {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;

            .stat-label {
              color: rgba(255, 255, 255, 0.8);
            }
          }

          &.total-amount {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;

            .stat-label {
              color: rgba(255, 255, 255, 0.8);
            }
          }
        }
      }

      .summary-display {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        color: white;

        .summary-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          opacity: 0.9;
        }

        .summary-content {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 2px;
          word-break: break-all;
          line-height: 1.6;
        }

        .summary-empty {
          font-size: 16px;
          opacity: 0.8;
        }
      }

      .detail-section {
        background: #f5f7fa;
        border-radius: 12px;
        padding: 20px;

        .detail-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;

          .detail-item {
            background: white;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            transition: transform 0.2s, box-shadow 0.2s;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .detail-label {
              display: block;
              font-size: 13px;
              color: #909399;
              margin-bottom: 8px;
            }

            .detail-value {
              display: block;
              font-size: 18px;
              font-weight: 700;
              color: #303133;
            }

            // 不同类型的颜色
            &.type-multiple {
              border-left: 4px solid #409eff;
              .detail-value { color: #409eff; }
            }
            &.type-big {
              border-left: 4px solid #e6a23c;
              .detail-value { color: #e6a23c; }
            }
            &.type-small {
              border-left: 4px solid #67c23a;
              .detail-value { color: #67c23a; }
            }
            &.type-odd {
              border-left: 4px solid #f56c6c;
              .detail-value { color: #f56c6c; }
            }
            &.type-even {
              border-left: 4px solid #909399;
              .detail-value { color: #909399; }
            }
            &.type-big-odd {
              border-left: 4px solid #e74c3c;
              .detail-value { color: #e74c3c; }
            }
            &.type-big-even {
              border-left: 4px solid #3498db;
              .detail-value { color: #3498db; }
            }
            &.type-small-odd {
              border-left: 4px solid #9b59b6;
              .detail-value { color: #9b59b6; }
            }
            &.type-small-even {
              border-left: 4px solid #1abc9c;
              .detail-value { color: #1abc9c; }
            }
          }
        }
      }
    }
  }

  .initial-hint {
    padding: 60px 0;
  }
}

// 用户下拉选项样式
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-name {
    font-weight: 600;
    color: #303133;
  }

  .user-account {
    font-size: 12px;
    color: #909399;
  }

  .user-id {
    font-size: 11px;
    color: #c0c4cc;
    margin-left: auto;
  }
}

// 响应式
@media (max-width: 768px) {
  .user-bet-summary {
    .search-bar .search-form {
      flex-direction: column;
      align-items: stretch;

      > * {
        width: 100% !important;
      }
    }

    .result-section .summary-section {
      .stats-overview {
        flex-direction: column;
      }

      .summary-display .summary-content {
        font-size: 18px;
      }

      .detail-section .detail-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}
</style>

