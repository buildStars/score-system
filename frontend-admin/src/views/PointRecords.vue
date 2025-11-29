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
      <div class="table-wrapper">
        <el-table :data="pointRecordList" stripe v-loading="loading" :style="{ marginTop: '20px' }" size="small">
        <el-table-column label="用户" min-width="100">
          <template #default="{ row }">
            <div>
              <div style="font-size: 13px;">{{ row.user?.nickname || row.user?.username || '-' }}</div>
              <div style="font-size: 11px; color: #909399;">ID: {{ row.user?.id || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="70">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ formatPointType(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="95" align="right">
          <template #default="{ row }">
            <span :class="row.amount >= 0 ? 'profit-text' : 'loss-text'" style="font-size: 13px;">
              {{ row.amount >= 0 ? '+' : '' }}{{ formatMoney(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="前" width="85" align="right">
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ formatMoney(row.balanceBefore) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="后" width="85" align="right">
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ formatMoney(row.balanceAfter) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="100">
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ row.remark }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作员" min-width="80">
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ row.operator?.realName || row.operator?.username || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="130">
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        </el-table>
      </div>

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
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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

// 移动端适配
@media (max-width: 768px) {
  .point-records {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .search-box {
        flex-direction: column;
        
        .el-input,
        .el-select,
        .el-date-picker {
          width: 100% !important;
        }
        
        > * {
          width: 100%;
        }
      }
    }
    
    .table-wrapper {
      margin: 0 -16px;
      padding: 0 16px;
    }
    
    :deep(.el-table) {
      font-size: 13px;
      
      .el-table__cell {
        padding: 8px 4px;
      }
      
      .cell {
        padding: 0 4px;
      }
    }
    
    :deep(.el-pagination) {
      justify-content: center;
      
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}

@media (max-width: 480px) {
  .point-records {
    :deep(.el-table) {
      font-size: 12px;
      
      .el-table__cell {
        padding: 6px 2px;
      }
    }
    
    :deep(.el-button) {
      padding: 6px 10px;
      font-size: 12px;
    }
  }
}
</style>

