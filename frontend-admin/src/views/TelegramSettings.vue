<template>
  <div class="telegram-settings">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="24"><ChatDotRound /></el-icon>
          <span>Telegram 机器人配置</span>
        </div>
      </template>

      <!-- 配置说明 -->
      <!-- <el-alert
        title="配置说明"
        type="info"
        :closable="false"
        show-icon
        class="config-tips"
      >
        <template #default>
          <div class="tips-content">
            <p>1. 在 Telegram 中搜索 <b>@BotFather</b>，发送 <code>/newbot</code> 创建机器人</p>
            <p>2. 获取 Bot Token（格式如：<code>123456789:ABCdefGHI...</code>）</p>
            <p>3. 将机器人添加到群组，发送一条消息后获取 Chat ID</p>
            <p>4. 获取 Chat ID 方法：访问 <code>https://api.telegram.org/bot{TOKEN}/getUpdates</code></p>
          </div>
        </template>
      </el-alert> -->

      <!-- 配置表单 -->
      <el-form
        ref="formRef"
        :model="form"
        label-width="140px"
        class="config-form"
      >
        <el-form-item label="启用 Telegram">
          <el-switch
            v-model="form.enabled"
            active-text="开启"
            inactive-text="关闭"
          />
          <span class="form-tip">开启后，用户下注会自动推送到 Telegram</span>
        </el-form-item>

        <el-form-item label="Bot Token">
          <el-input
            v-model="form.botToken"
            placeholder="请输入 Telegram Bot Token"
            show-password
            clearable
            style="max-width: 500px"
          />
        </el-form-item>

        <el-form-item label="Chat ID">
          <el-input
            v-model="form.chatId"
            placeholder="请输入群组/频道的 Chat ID"
            clearable
            style="max-width: 300px"
          />
          <span class="form-tip">群组 ID 通常为负数，如 <code>-1001234567890</code></span>
        </el-form-item>

        <el-form-item label="上报汇率">
          <el-input-number
            v-model="form.rate"
            :min="0.01"
            :max="10000"
            :precision="2"
            :step="0.1"
            style="width: 150px"
          />
          <span class="form-tip">金额除以此汇率后上报，例如汇率为10，下注1000则上报100</span>
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

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
          <el-button type="success" @click="handleTest" :loading="testing">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 消息测试 -->
      <el-divider>发送测试消息</el-divider>

      <div class="test-message-section">
        <el-input
          v-model="testMessage"
          type="textarea"
          :rows="3"
          placeholder="输入要发送的测试消息..."
          style="max-width: 500px; margin-bottom: 16px"
        />
        <div>
          <el-button type="warning" @click="handleSendTest" :loading="sending" :disabled="!testMessage">
            <el-icon><Promotion /></el-icon>
            发送测试消息
          </el-button>
        </div>
      </div>

      <!-- 消息格式预览 -->
      <el-divider>消息格式预览</el-divider>

      <div class="message-preview">
        <div class="preview-title">消息格式预览</div>
        <div class="preview-content">
          <pre>🎰 <b>新下注</b>

📋 期号: 20250112001
👤 用户: 张三
💰 下注: <b>{{ previewAmount }}倍</b>

📊 <b>当期汇总</b>
├ 倍数: <b>5000.00</b>
├ 大单: <b>1000.00</b>
├ 大双: <b>800.00</b>
└ 小单: <b>500.00</b>

🕐 2025/1/12 14:30:00</pre>
        </div>
        <div class="preview-note">
          <p>✅ 上报：倍数、大单、大双、小单、小双</p>
          <p>❌ 不上报：大、小、单、双</p>
          <p>📌 汇总只显示有下注的类型</p>
          <p>💱 汇率 {{ form.rate }}：原始 1000 → 上报 {{ (1000 / form.rate).toFixed(2) }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ChatDotRound, Check, Connection, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSystemSettings, testTelegramConnection, sendTelegramMessage } from '@/api/settings'

const saving = ref(false)
const testing = ref(false)
const sending = ref(false)
const testMessage = ref('这是一条测试消息 🎉')

// 表单数据
const form = reactive({
  enabled: false,
  botToken: '',
  chatId: '',
  rate: 1, // 上报汇率，默认为1
})

// 预览金额（示例1000除以汇率）
const previewAmount = computed(() => {
  return (1000 / form.rate).toFixed(2)
})

// 加载配置
const loadSettings = async () => {
  try {
    const res = await getSettings()
    const settings = res.data?.systemSettings || {}
    // 后端返回驼峰格式
    form.enabled = settings.telegramEnabled === true || settings.telegramEnabled === 'true'
    form.botToken = settings.telegramBotToken || ''
    form.chatId = settings.telegramChatId || ''
    form.rate = parseFloat(settings.telegramRate) || 1
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 保存配置
const handleSave = async () => {
  try {
    saving.value = true
    await updateSystemSettings({
      telegram_enabled: form.enabled ? 'true' : 'false',
      telegram_bot_token: form.botToken,
      telegram_chat_id: form.chatId,
      telegram_rate: String(form.rate),
    } as any)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 测试连接
const handleTest = async () => {
  if (!form.botToken || !form.chatId) {
    ElMessage.warning('请先填写 Bot Token 和 Chat ID')
    return
  }

  // 先保存配置
  await handleSave()

  try {
    testing.value = true
    const res = await testTelegramConnection()
    if (res.data?.success) {
      ElMessage.success(res.data.message || '连接测试成功')
    } else {
      ElMessage.error(res.data?.message || '连接测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '测试失败')
  } finally {
    testing.value = false
  }
}

// 发送测试消息
const handleSendTest = async () => {
  if (!testMessage.value) {
    ElMessage.warning('请输入测试消息')
    return
  }

  try {
    sending.value = true
    const res = await sendTelegramMessage(testMessage.value)
    if (res.data?.success) {
      ElMessage.success('消息发送成功')
    } else {
      ElMessage.error(res.data?.message || '发送失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送失败')
  } finally {
    sending.value = false
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

