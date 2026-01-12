<template>
  <div class="change-password-page">
    <el-card shadow="hover" class="password-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="24"><Lock /></el-icon>
          <span>修改密码</span>
        </div>
      </template>

      <!-- 管理员信息 -->
      <div class="admin-info" v-if="adminProfile">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">
            <el-tag type="primary">{{ adminProfile.username }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ adminProfile.realName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="adminProfile.role === 'superadmin' ? 'danger' : 'success'">
              {{ adminProfile.role === 'superadmin' ? '超级管理员' : '管理员' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ adminProfile.lastLoginAt ? formatDateTime(adminProfile.lastLoginAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 修改密码表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="password-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            :prefix-icon="Key"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（6-32位）"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            <el-icon><Check /></el-icon>
            确认修改
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 密码要求提示 -->
      <div class="password-tips">
        <el-alert
          title="密码要求"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul>
              <li>密码长度为 6-32 位</li>
              <li>新密码不能与原密码相同</li>
              <li>修改成功后需要重新登录</li>
            </ul>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Lock, Key, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { changePassword, getAdminProfile } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

// 管理员信息
const adminProfile = ref<{
  id: number
  username: string
  realName: string
  role: string
  status: number
  lastLoginAt: string
  lastLoginIp: string
  createdAt: string
} | null>(null)

// 表单数据
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 确认密码验证
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为 6-32 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 获取管理员信息
const fetchAdminProfile = async () => {
  try {
    const res = await getAdminProfile()
    adminProfile.value = res.data
  } catch (error) {
    console.error('获取管理员信息失败:', error)
  }
}

// 提交修改
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    loading.value = true
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })

    ElMessage.success('密码修改成功，请重新登录')

    // 延迟后退出登录
    setTimeout(() => {
      authStore.clearAuth()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

onMounted(() => {
  fetchAdminProfile()
})
</script>

<style scoped lang="scss">
.change-password-page {
  max-width: 600px;
  margin: 0 auto;

  .password-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .admin-info {
      margin-bottom: 30px;
    }

    .password-form {
      max-width: 450px;
      margin: 0 auto;

      :deep(.el-input) {
        max-width: 320px;
      }

      :deep(.el-form-item:last-child) {
        margin-top: 30px;
        margin-bottom: 0;
      }
    }

    .password-tips {
      margin-top: 30px;

      ul {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: #909399;

        li {
          margin-bottom: 4px;
        }
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .change-password-page {
    .password-card {
      .password-form {
        :deep(.el-form-item) {
          .el-form-item__label {
            width: 80px !important;
          }
        }

        :deep(.el-input) {
          max-width: 100%;
        }
      }
    }
  }
}
</style>

