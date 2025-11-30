<template>
  <div class="users">
    <el-card shadow="hover">
      <!-- 搜索和操作栏 -->
      <div class="toolbar">
        <div class="search-box">
          <div style="display: flex; align-items: center; gap: 5px;">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名/昵称"
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
          </div>
          <div style="display: flex; align-items: center; gap: 5px;justify-content: flex-end;">
      
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
   

        <el-button type="primary" :icon="Plus" @click="handleCreate">
          创建用户
        </el-button>
      </div>
    </div>
      </div>

      <!-- 用户列表 -->
      <div class="table-wrapper">
        <el-table :data="userList" stripe v-loading="loading" :style="{ marginTop: '20px' }" size="small">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="当前积分" width="100" align="right">
          <template #default="{ row }">
            <span style="font-size: 14px; font-weight: 600;">{{ formatMoney(row.points) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="success" size="small" @click="handleAddPoints(row)">
                上分
              </el-button>
              <el-button link type="danger" size="small" @click="handleDeductPoints(row)">
                下分
              </el-button>
              <el-button link type="warning" size="small" @click="handleResetPassword(row)">
                改密码
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最后在线" min-width="140">
          <template #default="{ row }">
            <span style="font-size: 12px;">{{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '从未登录' }}</span>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchUserList"
        @size-change="fetchUserList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 创建用户对话框 -->
    <el-dialog 
      v-model="createDialog.visible" 
      title="创建用户" 
      width="90%" 
      class="mobile-dialog"
      style="max-width: 500px;"
    >
      <el-form ref="createFormRef" :model="createDialog.form" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createDialog.form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createDialog.form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createDialog.form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="初始积分" prop="points">
          <el-input-number v-model="createDialog.form.points" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateConfirm" :loading="createDialog.loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 调整积分对话框 -->
    <el-dialog 
      v-model="pointsDialog.visible" 
      :title="pointsDialog.type === 'add' ? '上分' : '下分'" 
      width="90%" 
      class="mobile-dialog"
      style="max-width: 500px;"
    >
      <el-alert 
        :type="pointsDialog.type === 'add' ? 'success' : 'warning'" 
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <span>
              {{ pointsDialog.type === 'add' ? '💰 为用户增加积分' : '⚠️ 为用户扣除积分' }}
            </span>
            <span style="font-weight: bold; font-size: 14px; margin-top: 4px;">
              当前: {{ formatMoney(pointsDialog.currentPoints) }}
            </span>
          </div>
        </template>
      </el-alert>

      <el-form ref="pointsFormRef" :model="pointsDialog.form" :rules="pointsRules" label-width="80px">
        <el-form-item 
          :label="pointsDialog.type === 'add' ? '上分金额' : '下分金额'" 
          prop="amount"
        >
          <el-input-number
            v-model="pointsDialog.form.amount"
            :precision="2"
            :step="100"
            :min="0.01"
            :max="999999"
            style="width: 100%"
            :placeholder="pointsDialog.type === 'add' ? '请输入上分金额' : '请输入下分金额'"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            操作后积分: {{ calculateNewPoints() }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialog.visible = false">取消</el-button>
        <el-button 
          :type="pointsDialog.type === 'add' ? 'success' : 'danger'" 
          @click="handleAdjustPointsConfirm" 
          :loading="pointsDialog.loading"
        >
          {{ pointsDialog.type === 'add' ? '确认上分' : '确认下分' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog 
      v-model="passwordDialog.visible" 
      title="重置密码" 
      width="90%" 
      class="mobile-dialog"
      style="max-width: 500px;"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordDialog.form"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordDialog.form.newPassword"
            type="password"
            placeholder="请输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleResetPasswordConfirm"
          :loading="passwordDialog.loading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getUserList,
  createUser,
  adjustUserPoints,
  resetUserPassword,
  deleteUser,
} from '@/api/users'
import { formatMoney, formatDateTime } from '@/utils/format'
import type { User } from '@/types'

const loading = ref(false)
const userList = ref<User[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 创建用户对话框
const createDialog = reactive({
  visible: false,
  loading: false,
  form: {
    username: '',
    password: '',
    nickname: '',
    points: 0,
  },
})

const createFormRef = ref<FormInstance>()
const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
  ],
}

// 调整积分对话框
const pointsDialog = reactive({
  visible: false,
  loading: false,
  userId: 0,
  type: 'add' as 'add' | 'deduct', // 操作类型：add=上分，deduct=下分
  currentPoints: 0, // 用户当前积分
  form: {
    amount: undefined as number | undefined,
    remark: '',
  },
})

const pointsFormRef = ref<FormInstance>()
const pointsRules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { 
      validator: (_rule: any, value: number, callback: Function) => {
        if (value <= 0) {
          callback(new Error('金额必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
}

// 计算操作后的积分
const calculateNewPoints = () => {
  const amount = pointsDialog.form.amount || 0
  const currentPoints = pointsDialog.currentPoints || 0
  const newPoints = pointsDialog.type === 'add' 
    ? currentPoints + amount 
    : currentPoints - amount
  return formatMoney(Math.max(0, newPoints))
}

// 重置密码对话框
const passwordDialog = reactive({
  visible: false,
  loading: false,
  userId: 0,
  form: {
    newPassword: '',
  },
})

const passwordFormRef = ref<FormInstance>()
const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
  ],
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    loading.value = true
    const res = await getUserList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword || undefined,
    })
    userList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  pagination.page = 1
  fetchUserList()
}

// 创建用户
const handleCreate = () => {
  createDialog.visible = true
  createDialog.form = {
    username: '',
    password: '',
    nickname: '',
    points: 0,
  }
}

// 确认创建用户
const handleCreateConfirm = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()
    createDialog.loading = true
    await createUser(createDialog.form)
    ElMessage.success('创建成功')
    createDialog.visible = false
    fetchUserList()
  } catch (error) {
    console.error('创建用户失败:', error)
  } finally {
    createDialog.loading = false
  }
}

// 上分
const handleAddPoints = (user: User) => {
  pointsDialog.visible = true
  pointsDialog.userId = user.id
  pointsDialog.type = 'add'
  pointsDialog.currentPoints = user.points
  pointsDialog.form = {
    amount: undefined,
    remark: '',
  }
  // 重置表单验证
  nextTick(() => {
    pointsFormRef.value?.clearValidate()
  })
}

// 下分
const handleDeductPoints = (user: User) => {
  pointsDialog.visible = true
  pointsDialog.userId = user.id
  pointsDialog.type = 'deduct'
  pointsDialog.currentPoints = user.points
  pointsDialog.form = {
    amount: undefined,
    remark: '',
  }
  // 重置表单验证
  nextTick(() => {
    pointsFormRef.value?.clearValidate()
  })
}

// 确认调整积分
const handleAdjustPointsConfirm = async () => {
  if (!pointsFormRef.value) return

  try {
    await pointsFormRef.value.validate()
    
        // 检查下分时余额是否足够
    if (pointsDialog.type === 'deduct') {
      const newPoints = pointsDialog.currentPoints - (pointsDialog.form.amount || 0)
      if (newPoints < 0) {
        ElMessage.error('用户积分不足，无法下分')
        return
      }
    }

    pointsDialog.loading = true
    
    // 根据类型调整金额正负
    const adjustAmount = pointsDialog.type === 'add' 
      ? (pointsDialog.form.amount || 0)
      : -(pointsDialog.form.amount || 0)
    
    await adjustUserPoints(pointsDialog.userId, {
      amount: adjustAmount,
      remark: pointsDialog.form.remark
    })
    
    ElMessage.success(pointsDialog.type === 'add' ? '上分成功' : '下分成功')
    pointsDialog.visible = false
    fetchUserList()
  } catch (error) {
    console.error('调整积分失败:', error)
  } finally {
    pointsDialog.loading = false
  }
}

// 重置密码
const handleResetPassword = (user: User) => {
  passwordDialog.visible = true
  passwordDialog.userId = user.id
  passwordDialog.form = {
    newPassword: '',
  }
}

// 确认重置密码
const handleResetPasswordConfirm = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    passwordDialog.loading = true
    await resetUserPassword(passwordDialog.userId, passwordDialog.form)
    ElMessage.success('重置成功')
    passwordDialog.visible = false
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    passwordDialog.loading = false
  }
}

// 删除用户
const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确认删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
      }
    )

    await deleteUser(user.id)
    ElMessage.success('用户删除成功')
    
    // 如果删除的是当前页最后一条，回到上一页
    if (userList.value.length === 1 && pagination.page > 1) {
      pagination.page--
    }
    
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error(error.response?.data?.message || '删除用户失败')
    }
  }
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped lang="scss">
.users {
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
  
  .action-buttons {
    display: flex;
  
    flex-wrap: wrap;
    
    .el-button {
      padding: 2px 4px;
      margin: 0;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .users {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .search-box {
        flex-direction: column;
        
        .el-input,
        .el-select {
          width: 100% !important;
          margin-left: 0 !important;
        }
        
        > * {
          width: 100%;
        }
      }
      
      > .el-button {
        width: 100%;
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
  .users {
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

