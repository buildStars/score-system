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
          <el-input  v-model="searchForm.issue" placeholder="搜索期号" clearable style="width: 300px">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
        </div>
        <div style="display: flex; align-items: center; justify-content: flex-end;">

          <el-button :icon="Refresh" @click="handleReset">刷新</el-button>
   
          <el-button type="primary" @click="handleCreate">
            录入
          </el-button>
        </div>



      </div>

      <!-- 开奖历史列表 -->
      <div class="table-wrapper">
        <el-table :data="lotteryList" stripe v-loading="loading" :style="{ marginTop: '20px' }" size="small">
          <el-table-column prop="issue" label="期号" min-width="70" />
          <el-table-column label="开奖结果" min-width="150">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="lottery-numbers">
                  <span class="number">{{ row.number1 }}</span>
                  <span class="number">{{ row.number2 }}</span>
                  <span class="number">{{ row.number3 }}</span>
                </div>
                <span style="color: #409eff; font-weight: bold; font-size: 15px;">= {{ row.resultSum }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="时间" min-width="130">
            <template #default="{ row }">
              <span style="font-size: 13px;">{{ formatDateTime(row.drawTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isSettled === 1 ? 'success' : 'warning'" size="small">
                {{ row.isSettled === 1 ? '已结' : '未结' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="100">

            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="primary" size="small" @click="handleEdit(row)" link>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)" :disabled="row.isSettled === 1" link>
                  删除
                </el-button>
                <el-button v-if="row.isSettled === 0" type="success" size="small" @click="handleSettle(row)" link>
                  结算
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
        :total="pagination.total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchLotteryHistory" @size-change="fetchLotteryHistory"
        style="margin-top: 20px; justify-content: flex-end" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '手动录入开奖数据' : '编辑开奖数据'" width="500px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="期号" prop="issue">
          <el-input v-model="form.issue" placeholder="请输入期号（如：20240101001）" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="第一个号码" prop="number1">
          <el-input-number v-model="form.number1" :min="0" :max="9" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="第二个号码" prop="number2">
          <el-input-number v-model="form.number2" :min="0" :max="9" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="第三个号码" prop="number3">
          <el-input-number v-model="form.number3" :min="0" :max="9" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="总和">
          <el-input :value="form.number1 + form.number2 + form.number3" disabled style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { Search, Refresh, CircleCheck } from '@element-plus/icons-vue'
import { getLotteryHistory, createLottery, updateLottery, deleteLottery, settleLottery } from '@/api/lottery'
import { formatDateTime } from '@/utils/format'
import type { LotteryResult } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const lotteryList = ref<LotteryResult[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

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

// 表单
const form = reactive({
  issue: '',
  number1: 0,
  number2: 0,
  number3: 0,
})

// 表单验证规则
const formRules = {
  issue: [
    { required: true, message: '请输入期号', trigger: 'blur' },
  ],
  number1: [
    { required: true, message: '请输入第一个号码', trigger: 'blur' },
  ],
  number2: [
    { required: true, message: '请输入第二个号码', trigger: 'blur' },
  ],
  number3: [
    { required: true, message: '请输入第三个号码', trigger: 'blur' },
  ],
}

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

// 打开新增对话框
const handleCreate = () => {
  dialogMode.value = 'create'
  form.issue = ''
  form.number1 = 0
  form.number2 = 0
  form.number3 = 0
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: LotteryResult) => {
  dialogMode.value = 'edit'
  form.issue = row.issue
  form.number1 = row.number1
  form.number2 = row.number2
  form.number3 = row.number3
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (dialogMode.value === 'create') {
      await createLottery({
        issue: form.issue,
        number1: form.number1,
        number2: form.number2,
        number3: form.number3,
      })
      ElMessage.success('创建成功')
    } else {
      const res = await updateLottery(form.issue, {
        number1: form.number1,
        number2: form.number2,
        number3: form.number3,
      })

      if (res.data.needResettle) {
        ElMessage.warning({
          message: '修改成功！该期号已撤销旧结算记录，请手动重新结算',
          duration: 5000,
        })
      } else {
        ElMessage.success('修改成功')
      }
    }

    dialogVisible.value = false
    fetchLotteryHistory()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除
const handleDelete = async (row: LotteryResult) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除期号 ${row.issue} 的开奖数据吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteLottery(row.issue)
    ElMessage.success('删除成功')
    fetchLotteryHistory()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 手动结算
const handleSettle = async (row: LotteryResult) => {
  try {
    await ElMessageBox.confirm(
      `确定要结算期号 ${row.issue} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    const res = await settleLottery(row.issue)
    ElMessage.success({
      message: `结算成功！已结算 ${res.data.settledBets} 笔下注`,
      duration: 3000,
    })
    fetchLotteryHistory()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('结算失败:', error)
      ElMessage.error(error.response?.data?.message || '结算失败')
    }
  }
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

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .lottery-numbers {
    display: flex;
    gap: 4px;

    .number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 14px;
      font-weight: bold;
      border-radius: 50%;
    }
  }

  .action-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;

    .el-button {
      padding: 4px 8px;
      margin: 0;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .lottery-history {
    .toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .search-box {
     

        .el-input {
          width: 100% !important;
        }

      }

      >div:last-child {
        justify-content: center;
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

    .lottery-numbers {
      gap: 4px;

      .number {
        width: 28px;
        height: 28px;
        font-size: 13px;
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
  .lottery-history {
    :deep(.el-table) {
      font-size: 12px;

      .el-table__cell {
        padding: 6px 2px;
      }
    }

    .lottery-numbers {
      gap: 3px;

      .number {
        width: 26px;
        height: 26px;
        font-size: 12px;
      }
    }

    :deep(.el-button) {
      padding: 4px 8px;
      font-size: 12px;
    }

    :deep(.el-tag) {
      padding: 0 6px;
      font-size: 12px;
    }
  }
}
</style>
