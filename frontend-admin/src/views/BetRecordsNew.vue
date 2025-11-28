<template>
  <div class="bet-records-page">
    <!-- 倒计时组件 -->
    <LotteryCountdownSimple :style="{ marginBottom: '20px' }" />
    
    <!-- 主内容区 -->
    <el-card shadow="hover">
      <!-- 查询区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.issue"
          placeholder="期号"
          clearable
          style="width: 200px"
        />
        <el-input
          v-model="searchForm.userId"
          placeholder="用户ID或用户名"
          clearable
          style="width: 200px"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <!-- 列表与汇总区域 -->
      <div class="content-wrapper">
        <!-- 下注列表 -->
        <div class="bet-list-section">
          <el-table :data="betList" stripe v-loading="loading" border>
            <el-table-column prop="issue" label="期号" width="120" fixed />
            <el-table-column label="用户" width="150">
              <template #default="{ row }">
                <div>
                  <div>{{ row.user?.nickname || row.user?.username || '-' }}</div>
                  <div style="font-size: 12px; color: #909399;">ID: {{ row.user?.id }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="下注内容" min-width="300">
              <template #default="{ row }">
                <div class="bet-content">
                  <span style="color: #409eff; font-weight: 600; font-size: 15px;">
                    {{ row.betContent }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="结算结果" width="150" align="center">
              <template #default="{ row }">
                <div v-if="row.status === 'pending'" style="color: #909399;">
                  未结算
                </div>
                <div v-else-if="row.status === 'cancelled'" style="color: #ff976a;">
                  已取消
                </div>
                <div v-else :class="row.resultAmount >= 0 ? 'profit-text' : 'loss-text'">
                  {{ row.resultAmount >= 0 ? '+' : '' }}¥{{ formatMoney(row.resultAmount) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="剩余" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.pointsAfter !== null" style="font-weight: 600;">
                  ¥{{ formatMoney(row.pointsAfter) }}
                </span>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchBetList"
            @size-change="fetchBetList"
            :style="{ marginTop: '16px', justifyContent: 'flex-end' }"
          />
        </div>

        <!-- 所有人下注总和 -->
        <div class="summary-section">
          <div class="summary-header">
            <h3>所有人下注总和</h3>
            <el-alert 
              v-if="!searchForm.issue" 
              type="info" 
              :closable="false"
              :style="{ marginBottom: '12px', fontSize: '12px' }"
            >
              请输入期号进行查询
            </el-alert>
          </div>

          <!-- 除数控制 -->
          <div class="summary-controls" v-if="searchForm.issue">
            <el-switch 
              v-model="divideEnabled" 
              active-text="启用除数" 
              size="small"
            />
            <el-input-number
              v-model="divideNumber"
              :min="0.01"
              :max="1000"
              :precision="2"
              :step="0.1"
              :disabled="!divideEnabled"
              placeholder="除数"
              size="small"
              style="width: 100%"
              :style="{ marginTop: '8px' }"
            />
          </div>

          <div class="summary-content" v-loading="summaryLoading">
            <el-empty 
              v-if="!searchForm.issue" 
              description="请先输入期号查询" 
              :image-size="80"
            />
            <el-empty 
              v-else-if="!hasSummaryData" 
              description="该期号暂无下注数据" 
              :image-size="80"
            />
            <div v-else class="summary-items">
              <div 
                v-for="(value, key) in displaySummary" 
                :key="key" 
                class="summary-item"
              >
                <div class="item-label">{{ formatBetContentLabel(key) }}</div>
                <div class="item-value">{{ formatSummaryValue(value) }}</div>
              </div>
            </div>
          </div>

          <div class="summary-footer" v-if="hasSummaryData">
            <el-tag type="info" size="small">
              期号：{{ searchForm.issue }}
            </el-tag>
            <el-tag type="success" size="small" v-if="divideEnabled && divideNumber > 0">
              显示：÷ {{ divideNumber }}
            </el-tag>
            <el-tag type="warning" size="small" v-else>
              显示：原始值
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getBetList, getBetSummary } from '@/api/bets'
import { formatMoney, formatDateTime, formatBetType } from '@/utils/format'
import type { BetRecord } from '@/types'
import LotteryCountdownSimple from '@/components/LotteryCountdownSimple.vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const summaryLoading = ref(false)
const betList = ref<BetRecord[]>([])
const summaryData = ref<Record<string, number>>({})

// 除数设置
const divideEnabled = ref(false)
const divideNumber = ref(1)

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

// 是否有汇总数据
const hasSummaryData = computed(() => {
  return Object.keys(summaryData.value).length > 0
})

// 格式化下注内容显示
const formatBetContentDisplay = (content: string, betType: string): string => {
  // 如果是倍数，添加"倍"后缀
  if (betType === 'multiple' || !isNaN(Number(content))) {
    return `${content}倍`
  }
  // 组合玩法直接显示
  return content
}

// 格式化下注内容标签
const formatBetContentLabel = (key: string): string => {
  const labelMap: Record<string, string> = {
    // 倍数
    '2': '2倍',
    '3': '3倍',
    '5': '5倍',
    '10': '10倍',
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
const formatSummaryValue = (value: number): string => {
  if (divideEnabled.value && divideNumber.value > 0) {
    return value.toFixed(2)
  }
  return value.toFixed(0)
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

// 获取下注汇总
const fetchSummary = async () => {
  if (!searchForm.issue) {
    summaryData.value = {}
    return
  }

  try {
    summaryLoading.value = true
    const res = await getBetSummary({
      issue: searchForm.issue,
      userId: searchForm.userId,
    })
    summaryData.value = res.data || {}
  } catch (error) {
    console.error('获取下注汇总失败:', error)
    ElMessage.error('获取下注汇总失败')
    summaryData.value = {}
  } finally {
    summaryLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchBetList()
  fetchSummary()
}

// 重置
const handleReset = () => {
  searchForm.userId = undefined
  searchForm.issue = ''
  pagination.page = 1
  summaryData.value = {}
  fetchBetList()
}

// 监听期号变化，自动获取汇总
watch(() => searchForm.issue, (newVal) => {
  if (newVal) {
    fetchSummary()
  } else {
    summaryData.value = {}
  }
})

onMounted(() => {
  fetchBetList()
})
</script>

<style scoped lang="scss">
.bet-records-page {
  .search-area {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .content-wrapper {
    display: flex;
    gap: 20px;
  }

  .bet-list-section {
    flex: 1;
    min-width: 0;
  }

  .bet-content {
    display: flex;
    align-items: center;
  }

  .profit-text {
    color: #67c23a;
    font-weight: bold;
    font-size: 16px;
  }

  .loss-text {
    color: #f56c6c;
    font-weight: bold;
    font-size: 16px;
  }

  // 汇总面板
  .summary-section {
    width: 320px;
    flex-shrink: 0;
    border: 2px solid #409eff;
    border-radius: 8px;
    background: #ecf5ff;
    padding: 16px;
    height: fit-content;
    position: sticky;
    top: 20px;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);

    .summary-header {
      margin-bottom: 12px;

      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #303133;
        font-weight: 600;
        text-align: center;
      }
    }

    .summary-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 6px;
    }

    .summary-content {
      min-height: 200px;
      background: #fff;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .summary-items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .summary-item {
      background: #f0f2f5;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
      transition: all 0.3s;

      &:hover {
        background: #e4e7ed;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .item-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .item-value {
        font-size: 18px;
        font-weight: 700;
        color: #409eff;
      }
    }

    .summary-footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}

// 响应式布局
@media (max-width: 1400px) {
  .bet-records-page {
    .content-wrapper {
      flex-direction: column;
    }

    .summary-section {
      width: 100%;
      position: static;
      order: -1; // 移动到列表上方

      .summary-items {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  }
}

@media (max-width: 768px) {
  .bet-records-page {
    .search-area {
      flex-direction: column;
      align-items: stretch;

      > * {
        width: 100%;
      }
    }

    .summary-section {
      .summary-items {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  }
}

@media (max-width: 480px) {
  .bet-records-page {
    .summary-section .summary-items {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>

