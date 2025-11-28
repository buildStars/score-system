<template>
  <div class="lottery-history">
    <!-- 封盘倒计时 -->
    <!-- <LotteryCountdown 
      @draw="handleDraw"
      @close="handleClose"
      @open="handleOpen"
      style="margin-bottom: 20px;"
    /> -->

    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="search-box">
          <el-input
            v-model="searchForm.issue"
            placeholder="搜索期号"
            clearable
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <el-tag type="success" effect="dark">
            <el-icon style="margin-right: 4px;"><CircleCheck /></el-icon>
            实时数据
          </el-tag>
          <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="loading">
            刷新数据
          </el-button>
        </div>
      </div>

      <!-- 开奖历史列表 -->
      <el-table :data="lotteryList" stripe v-loading="loading" :style="{ marginTop: '20px' }">
        <el-table-column prop="issue" label="期号" width="150" />
        <el-table-column label="开奖号码" width="200">
          <template #default="{ row }">
            <div class="lottery-numbers">
              <span class="number">{{ row.number1 }}</span>
              <span class="number">{{ row.number2 }}</span>
              <span class="number">{{ row.number3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="resultSum" label="总和" width="120" align="center" />
        <el-table-column label="开奖时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.drawTime) }}</template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchLotteryHistory"
        @size-change="fetchLotteryHistory"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, CircleCheck } from '@element-plus/icons-vue'
import { getLotteryHistory } from '@/api/lottery'
import { formatDateTime } from '@/utils/format'
import type { LotteryResult } from '@/types'
import LotteryCountdown from '@/components/LotteryCountdown.vue'

const loading = ref(false)
const lotteryList = ref<LotteryResult[]>([])

// 搜索表单
const searchForm = reactive({
  issue: '',
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 获取开奖历史
const fetchLotteryHistory = async () => {
  try {
    loading.value = true
    const res = await getLotteryHistory({
      page: pagination.page,
      limit: pagination.limit,
      issue: searchForm.issue || undefined,
    })
    lotteryList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取开奖历史失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchLotteryHistory()
}

// 重置
const handleReset = () => {
  searchForm.issue = ''
  pagination.page = 1
  fetchLotteryHistory()
}

// 刷新数据（直接获取最新数据）
const handleRefresh = () => {
  ElMessage.info('正在获取最新开奖数据...')
  fetchLotteryHistory()
}

// 处理开奖完成（自动刷新）
const handleDraw = (data: { period: string; nextPeriod: string }) => {
  console.log('🎰 收到开奖通知:', data)
  
  if (data.period && data.nextPeriod && data.period !== data.nextPeriod) {
    ElMessage.success(`第 ${data.period} 期已开奖，正在刷新数据...`)
  } else {
    ElMessage.info('正在刷新开奖数据...')
  }
  
  // 立即刷新（组件已经延迟了3-8秒）
  fetchLotteryHistory()
}

// 处理封盘
const handleClose = (data: { period: string; nextPeriod: string }) => {
  console.log('⚠️ 封盘通知:', data)
}

// 处理开盘
const handleOpen = (data: { period: string; nextPeriod: string }) => {
  console.log('✅ 开盘通知:', data)
}

onMounted(() => {
  fetchLotteryHistory()
})
</script>

<style scoped lang="scss">
.lottery-history {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .lottery-numbers {
    display: flex;
    gap: 8px;

    .number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 18px;
      font-weight: bold;
      border-radius: 50%;
    }
  }
}
</style>

