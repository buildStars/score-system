<template>
  <div class="point-records">
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

          <el-select
            v-model="searchForm.type"
            placeholder="操作类型"
            clearable
            style="width: 150px"
          >
            <el-option label="上分" value="admin_add" />
            <el-option label="下分" value="admin_deduct" />
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

      <!-- 积分记录列表 -->
      <el-table :data="pointRecordList" stripe v-loading="loading" :style="{ marginTop: '20px' }">
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div>
              <div>{{ row.user?.nickname || row.user?.username || '-' }}</div>
              <div style="font-size: 12px; color: #909399;">ID: {{ row.user?.id || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ formatPointType(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变动金额" width="150">
          <template #default="{ row }">
            <span :class="row.amount >= 0 ? 'profit-text' : 'loss-text'">
              {{ row.amount >= 0 ? '+' : '' }}¥{{ formatMoney(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动前余额" width="150">
          <template #default="{ row }">¥{{ formatMoney(row.balanceBefore) }}</template>
        </el-table-column>
        <el-table-column label="变动后余额" width="150">
          <template #default="{ row }">¥{{ formatMoney(row.balanceAfter) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="200" />
        <el-table-column label="操作员" width="150">
          <template #default="{ row }">
            {{ row.operator?.realName || row.operator?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchPointRecordList"
        @size-change="fetchPointRecordList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getPointRecordList } from '@/api/points'
import { formatMoney, formatDateTime, formatPointType } from '@/utils/format'
import type { PointRecord } from '@/types'

const loading = ref(false)
const pointRecordList = ref<PointRecord[]>([])

// 搜索表单
const searchForm = reactive({
  userId: undefined as number | undefined,
  type: '',
})

const dateRange = ref<[string, string]>()

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 获取类型标签颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, 'success' | 'danger'> = {
    admin_add: 'success',   // 上分 - 绿色
    admin_deduct: 'danger', // 下分 - 红色
  }
  return colorMap[type] || 'success'
}

// 获取积分记录
const fetchPointRecordList = async () => {
  try {
    loading.value = true
    const res = await getPointRecordList({
      page: pagination.page,
      limit: pagination.limit,
      userId: searchForm.userId,
      type: searchForm.type || undefined,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    })
    pointRecordList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取积分记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchPointRecordList()
}

// 重置
const handleReset = () => {
  searchForm.userId = undefined
  searchForm.type = ''
  dateRange.value = undefined
  pagination.page = 1
  fetchPointRecordList()
}

onMounted(() => {
  fetchPointRecordList()
})
</script>

<style scoped lang="scss">
.point-records {
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

