<template>
  <div class="telegram-settings">
    <!-- Telegram 用户账号配置 -->
    <el-card shadow="hover" style="margin-top: 24px">
      <template #header>
        <div class="card-header">
          <el-icon :size="24"><ChatDotRound /></el-icon>
          <span>Telegram 用户账号配置</span>
        </div>
      </template>

      <el-alert
        title="配置说明"
        type="info"
        :closable="false"
        show-icon
        class="config-tips"
        style="margin-bottom: 24px"
      >
        <template #default>
          <div class="tips-content">
            <p>
              1. 访问 <a href="https://my.telegram.org/apps" target="_blank">https://my.telegram.org/apps</a>{' '}
              创建应用获取 API ID 和 API Hash
            </p>
            <p>2. 填写手机号（包含国家代码，如：+8613800138000）</p>
            <p>3. 点击"发送验证码"，输入收到的验证码完成登录</p>
            <p>4. 如果账号开启了两步验证，还需要输入密码</p>
            <p>5. 配置目标 Chat ID（频道或群组ID，如：@channel_name 或 -1001234567890）</p>
          </div>
        </template>
      </el-alert>

      <!-- 用户账号配置表单 -->
      <el-form
        ref="userFormRef"
        :model="userForm"
        label-width="140px"
        class="config-form"
      >
        <el-form-item label="启用用户账号">
          <el-switch
            v-model="userForm.enabled"
            active-text="开启"
            inactive-text="关闭"
          />
          <span class="form-tip">开启后，将使用用户账号模式发送/转发消息</span>
        </el-form-item>

        <el-form-item label="API ID">
          <el-input
            v-model="userForm.apiId"
            placeholder="请输入 API ID"
            clearable
            style="max-width: 300px"
          />
        </el-form-item>

        <el-form-item label="API Hash">
          <el-input
            v-model="userForm.apiHash"
            placeholder="请输入 API Hash"
            show-password
            clearable
            style="max-width: 500px"
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入手机号（包含国家代码，如：+8613800138000）"
            clearable
            style="max-width: 300px"
          />
        </el-form-item>

        <el-form-item label="目标 Chat ID">
          <el-input
            v-model="userForm.chatId"
            placeholder="用户名（@username）或ID（-1001234567890）"
            clearable
            style="max-width: 300px"
          />
          <span class="form-tip">
            支持格式：用户名（@channel_name 或 channel_name）、频道ID（-1001234567890）、用户ID（123456789）
          </span>
        </el-form-item>

        <el-form-item label="上报汇率">
          <el-input-number
            v-model="userForm.rate"
            :min="0.01"
            :max="10000"
            :precision="2"
            :step="0.1"
            style="width: 150px"
          />
          <span class="form-tip">金额除以此汇率后上报，例如汇率为10，下注1000则上报100</span>
        </el-form-item>

        <el-form-item label="倍数取整方式">
          <el-select
            v-model="userForm.multipleRound"
            placeholder="请选择倍数取整方式"
            style="width: 200px"
          >
            <el-option label="四舍五入" value="round" />
            <el-option label="向上取整" value="ceil" />
            <el-option label="向下取整" value="floor" />
          </el-select>
          <span class="form-tip">倍数下注金额取整方式</span>
        </el-form-item>

        <el-form-item label="组合取整方式">
          <el-select
            v-model="userForm.comboRound"
            placeholder="请选择组合取整方式"
            style="width: 200px"
          >
            <el-option label="四舍五入" value="round" />
            <el-option label="向上取整" value="ceil" />
            <el-option label="向下取整" value="floor" />
          </el-select>
          <span class="form-tip">组合下注（大单/大双/小单/小双）金额取整方式</span>
        </el-form-item>

        <el-alert
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #title>
            <strong>上报规则：</strong>倍数 + 组合（大单/大双/小单/小双），不上报单独的大/小/单/双
          </template>
        </el-alert>

        <!-- 登录状态显示 -->
        <el-form-item v-if="userStatus.connected" label="登录状态">
          <el-tag type="success" size="large">
            <el-icon><Check /></el-icon>
            已登录：{{ userStatus.username }}
          </el-tag>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleUserSave" :loading="userSaving">
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
          <el-button
            type="success"
            @click="handleSendUserCode"
            :loading="sendingCode"
            :disabled="!userForm.phone || !userForm.apiId || !userForm.apiHash"
          >
            <el-icon><Connection /></el-icon>
            发送验证码
          </el-button>
          <el-button
            v-if="phoneCodeHash"
            type="warning"
            @click="handleUserSignIn"
            :loading="signingIn"
          >
            登录
          </el-button>
          <el-button type="info" @click="handleUserTest" :loading="userTesting">
            测试连接
          </el-button>
          <el-button type="danger" @click="handleClearSession" :loading="clearingSession">
            清除Session
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 验证码输入对话框 -->
      <el-dialog v-model="codeDialogVisible" title="输入验证码" width="400px">
        <el-form>
          <el-form-item label="验证码">
            <el-input
              v-model="phoneCode"
              placeholder="请输入收到的验证码"
              maxlength="6"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item v-if="needPassword" label="两步验证密码">
            <el-input
              v-model="password"
              type="password"
              placeholder="请输入两步验证密码"
              show-password
              style="width: 200px"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="codeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUserSignIn" :loading="signingIn">
            确认登录
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ChatDotRound, Check, Connection, Promotion } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSettings,
  updateSystemSettings,
  sendTelegramUserCode,
  signInTelegramUser,
  signInTelegramUserWithPassword,
  getTelegramUserStatus,
  testTelegramUserConnection,
  clearTelegramUserSession,
} from '@/api/settings'

// 用户账号表单数据
const userForm = reactive({
  enabled: false,
  apiId: '',
  apiHash: '',
  phone: '',
  chatId: '',
  rate: 1, // 上报汇率，默认为1
  multipleRound: 'round', // 倍数取整方式：round(四舍五入)、floor(向下)、ceil(向上)
  comboRound: 'round', // 组合取整方式：round(四舍五入)、floor(向下)、ceil(向上)
})

// 用户账号状态
const userStatus = reactive({
  connected: false,
  username: '',
  message: '',
})

// 登录相关
const phoneCodeHash = ref('')
const phoneCode = ref('')
const password = ref('')
const needPassword = ref(false)
const codeDialogVisible = ref(false)
const sendingCode = ref(false)
const signingIn = ref(false)
const userSaving = ref(false)
const userTesting = ref(false)
const clearingSession = ref(false)

// 加载配置
const loadSettings = async () => {
  try {
    const res = await getSettings()
    const settings = res.data?.systemSettings || {}
    
    // 用户账号配置
    userForm.enabled = settings.telegramUserEnabled === true || settings.telegramUserEnabled === 'true'
    userForm.apiId = settings.telegramUserApiId || ''
    userForm.apiHash = settings.telegramUserApiHash || ''
    userForm.phone = settings.telegramUserPhone || ''
    userForm.chatId = settings.telegramUserChatId || ''
    userForm.rate = parseFloat(settings.telegramRate) || 1
    userForm.multipleRound = settings.telegramMultipleRound || 'round'
    userForm.comboRound = settings.telegramComboRound || 'round'

    // 加载用户状态
    if (userForm.enabled) {
      await loadUserStatus()
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 加载用户账号状态
const loadUserStatus = async () => {
  try {
    const res = await getTelegramUserStatus()
    if (res.data) {
      userStatus.connected = res.data.connected
      userStatus.username = res.data.username || ''
      userStatus.message = res.data.message || ''
    }
  } catch (error) {
    console.error('加载用户状态失败:', error)
  }
}

// 保存用户账号配置
const handleUserSave = async () => {
  try {
    userSaving.value = true
    await updateSystemSettings({
      telegram_user_enabled: userForm.enabled ? 'true' : 'false',
      telegram_user_api_id: userForm.apiId,
      telegram_user_api_hash: userForm.apiHash,
      telegram_user_phone: userForm.phone,
      telegram_user_chat_id: userForm.chatId,
      telegram_rate: String(userForm.rate),
      telegram_multiple_round: userForm.multipleRound,
      telegram_combo_round: userForm.comboRound,
    } as any)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    userSaving.value = false
  }
}

// 发送验证码
const handleSendUserCode = async () => {
  if (!userForm.phone || !userForm.apiId || !userForm.apiHash) {
    ElMessage.warning('请先填写手机号、API ID 和 API Hash')
    return
  }

  // 先保存配置
  await handleUserSave()

  try {
    sendingCode.value = true
    const res = await sendTelegramUserCode(userForm.phone)
    if (res.data?.success && res.data.phoneCodeHash) {
      phoneCodeHash.value = res.data.phoneCodeHash
      codeDialogVisible.value = true
      needPassword.value = false
      phoneCode.value = ''
      password.value = ''
      ElMessage.success('验证码已发送，请查收')
    } else {
      ElMessage.error(res.data?.message || '发送验证码失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

// 用户登录
const handleUserSignIn = async () => {
  if (!phoneCode.value) {
    ElMessage.warning('请输入验证码')
    return
  }

  try {
    signingIn.value = true

    // 如果不需要密码，直接使用验证码登录
    if (!needPassword.value) {
      const res = await signInTelegramUser(
        userForm.phone,
        phoneCode.value,
        phoneCodeHash.value,
      )

      if (res.data?.success) {
        ElMessage.success('登录成功')
        codeDialogVisible.value = false
        await loadUserStatus()
      } else {
        // 如果需要两步验证
        if (res.data?.message?.includes('密码')) {
          needPassword.value = true
          ElMessage.warning('需要两步验证密码')
        } else {
          ElMessage.error(res.data?.message || '登录失败')
        }
      }
    } else {
      // 使用密码登录
      if (!password.value) {
        ElMessage.warning('请输入两步验证密码')
        return
      }

      const res = await signInTelegramUserWithPassword(password.value)
      if (res.data?.success) {
        ElMessage.success('登录成功')
        codeDialogVisible.value = false
        await loadUserStatus()
      } else {
        ElMessage.error(res.data?.message || '登录失败')
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    signingIn.value = false
  }
}

// 测试用户账号连接
const handleUserTest = async () => {
  try {
    userTesting.value = true
    const res = await testTelegramUserConnection()
    if (res.data?.success) {
      ElMessage.success(res.data.message || '连接测试成功')
      await loadUserStatus()
    } else {
      ElMessage.error(res.data?.message || '连接测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '测试失败')
  } finally {
    userTesting.value = false
  }
}

// 清除Session
const handleClearSession = async () => {
  try {
    await ElMessageBox.confirm('确定要清除Session吗？清除后需要重新登录。', '确认操作', {
      type: 'warning',
    })

    clearingSession.value = true
    await clearTelegramUserSession()
    ElMessage.success('Session已清除')
    userStatus.connected = false
    userStatus.username = ''
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '清除失败')
    }
  } finally {
    clearingSession.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.telegram-settings {
  max-width: 900px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .config-tips {
    margin-bottom: 24px;

    .tips-content {
      p {
        margin: 6px 0;
        font-size: 13px;
        color: #606266;

        code {
          background: #f4f4f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
      }
    }
  }

  .config-form {
    .form-tip {
      margin-left: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .test-message-section {
    padding: 0 20px;
  }

  .message-preview {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    margin: 0 20px;

    .preview-title {
      color: #909399;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .preview-content {
      pre {
        margin: 0;
        color: #fff;
        font-family: 'SF Pro Text', -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.8;
        white-space: pre-wrap;

        b {
          color: #67c23a;
        }
      }
    }

    .preview-note {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #333;
      font-size: 12px;
      color: #909399;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .telegram-settings {
    .config-form {
      :deep(.el-form-item__label) {
        width: 100px !important;
      }

      .form-tip {
        display: block;
        margin-left: 0;
        margin-top: 6px;
      }
    }

    .message-preview {
      margin: 0;
    }
  }
}
</style>

