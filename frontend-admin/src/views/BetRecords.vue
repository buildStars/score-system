<template>
  <div class="bet-records">
    <!-- 倒计时组件 -->
    <LotteryCountdownSimple :style="{ marginBottom: '20px' }" />
    
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="search-box">
          <el-input
            v-model="searchForm.userId"
            placeholder="用户ID"
            clearable
            type="number"
            style="width: 120px"
          />

          <el-input
            v-model="searchForm.issue"
            placeholder="期号"
            clearable
            style="width: 150px"
          />

          <el-select
            v-model="searchForm.betType"
            placeholder="下注类型"
            clearable
            style="width: 120px"
          >
            <el-option label="倍数" value="multiple" />
            <el-option label="组合" value="combo" />
          </el-select>

          <el-select
            v-model="searchForm.status"
            placeholder="状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待结算" value="pending" />
            <el-option label="赢" value="win" />
            <el-option label="输" value="loss" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 300px"
          />

          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 下注记录列表 -->
      <el-table :data="betList" stripe v-loading="loading" style="margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="150">
          <template #default="{ row }">
            {{ row.user?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="issue" label="期号" width="120" />
        <el-table-column label="下注类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ formatBetType(row.betType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="betContent" label="下注内容" width="120" />
        <el-table-column label="下注金额" width="120">
          <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="手续费" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.fee) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ formatBetStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算金额" width="120">
          <template #default="{ row }">
            <span v-if="row.resultAmount !== null && row.resultAmount !== undefined">
              <span :class="row.resultAmount >= 0 ? 'profit-text' : 'loss-text'">
                ¥{{ formatMoney(row.resultAmount) }}
              </span>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="下注前积分" width="120">
          <template #default="{ row }">¥{{ formatMoney(row.pointsBefore) }}</template>
        </el-table-column>
        <el-table-column label="下注后积分" width="120">
          <template #default="{ row }">
            {{ row.pointsAfter !== null ? `¥${formatMoney(row.pointsAfter)}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="下注时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="结算时间" width="180">
          <template #default="{ row }">
            {{ row.settledAt ? formatDateTime(row.settledAt) : '-' }}
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
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getBetList } from '@/api/bets'
import { formatMoney, formatDateTime, formatBetType, formatBetStatus } from '@/utils/format'
import type { BetRecord } from '@/types'
import LotteryCountdownSimple from '@/components/LotteryCountdownSimple.vue'

const loading = ref(false)
const betList = ref<BetRecord[]>([])

// 搜索表单
const searchForm = reactive({
  userId: undefined as number | undefined,
  issue: '',
  betType: '',
  status: '',
})

const dateRange = ref<[string, string]>()

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    pending: 'info',
    win: 'success',
    loss: 'danger',
    cancelled: 'warning',
  }
  return typeMap[status] || 'info'
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
      betType: searchForm.betType || undefined,
      status: searchForm.status || undefined,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    })
    betList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取下注记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchBetList()
}

// 重置
const handleReset = () => {
  searchForm.userId = undefined
  searchForm.issue = ''
  searchForm.betType = ''
  searchForm.status = ''
  dateRange.value = undefined
  pagination.page = 1
  fetchBetList()
}

onMounted(() => {
  fetchBetList()
})
</script>

<style scoped lang="scss">
.bet-records {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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
}
</style>

