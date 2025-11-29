<template>
  <div class="system-settings">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="180px"
        v-loading="loading"
      >
        <el-divider content-position="left">游戏控制</el-divider>

        <el-form-item label="游戏开关" prop="gameEnabled">
          <el-switch v-model="form.gameEnabled" />
          <span class="form-tip">关闭后用户将无法下注</span>
        </el-form-item>

        <el-form-item label="维护模式" prop="maintenanceMode">
          <el-switch v-model="form.maintenanceMode" />
          <span class="form-tip">开启后用户将无法访问系统</span>
        </el-form-item>

        <!-- <el-form-item label="自动结算" prop="autoSettleEnabled">
          <el-switch v-model="form.autoSettleEnabled" />
          <span class="form-tip">开启后系统将自动结算下注</span>
        </el-form-item> -->

        <el-divider content-position="left">封盘时间设置</el-divider>

        <el-form-item label="开奖间隔时间" prop="drawInterval">
          <el-input-number
            v-model="form.drawInterval"
            :min="60"
            :max="600"
            :step="10"
            placeholder="210"
          />
          <span class="form-tip">两次开奖的间隔时间（秒），范围：60-600秒</span>
        </el-form-item>

        <el-form-item label="封盘时间" prop="closeBeforeDraw">
          <el-input-number
            v-model="form.closeBeforeDraw"
            :min="0"
            :max="120"
            :step="5"
            placeholder="30"
          />
          <span class="form-tip">开奖前多少秒封盘（禁止下注），0表示不封盘，范围：0-120秒</span>
        </el-form-item>

        <el-alert
          title="配置说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <div style="font-size: 13px; line-height: 1.6">
              <p><strong>时间轴示例（默认配置）：</strong></p>
              <p>0秒 → 180秒（开放下注） → 封盘 → 210秒（开奖）</p>
              <p style="margin-top: 8px">
                • <strong>开放下注时间</strong> = 开奖间隔 - 封盘时间 = 210 - 30 = 180秒<br>
                • <strong>封盘期</strong> = 最后30秒禁止下注<br>
                • <strong>封盘时间为0</strong> = 可以下注到开奖瞬间（不封盘）
              </p>
            </div>
          </template>
        </el-alert>

        <el-divider content-position="left">系统公告</el-divider>

        <el-form-item label="系统公告" prop="systemNotice">
          <el-input
            v-model="form.systemNotice"
            type="textarea"
            :rows="5"
            placeholder="请输入系统公告"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            保存设置
          </el-button>
          <el-button @click="fetchSettings">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 清空数据 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>🗑️ 清空数据</span>
          <el-tag type="danger" size="small" style="margin-left: 10px">危险操作</el-tag>
        </div>
      </template>

      <el-alert
        title="重要提示"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="font-size: 13px; line-height: 1.8">
            <p><strong>⚠️ 此操作将永久删除选定时间范围内的数据，且无法恢复！</strong></p>
            <p style="margin-top: 8px">
              • <strong>不会删除</strong>：用户账户、用户积分<br>
              • <strong>可以删除</strong>：开奖历史、下注记录、积分变动记录<br>
              • <strong>建议</strong>：定期清理历史数据以优化系统性能
            </p>
          </div>
        </template>
      </el-alert>

      <el-form label-width="140px">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="clearDataForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
        </el-form-item>

        <el-form-item label="选择清空内容">
          <el-checkbox-group v-model="clearDataForm.clearOptions">
            <el-checkbox label="bets">下注记录（已结算）</el-checkbox>
            <el-checkbox label="pointRecords">积分变动记录</el-checkbox>
            <el-checkbox label="lotteryHistory">开奖历史（已结算）</el-checkbox>
          </el-checkbox-group>
          <div class="form-tip" style="margin-top: 8px">
            <el-icon><InfoFilled /></el-icon>
            至少选择一项
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="danger" 
            @click="handleClearData"
            :loading="clearLoading"
            :disabled="!canClearData"
          >
            <el-icon><Delete /></el-icon>
            确认清空数据
          </el-button>
          <el-button @click="resetClearDataForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { InfoFilled, Delete } from '@element-plus/icons-vue'
import { getSettings, updateSystemSettings, clearData } from '@/api/settings'
import type { SystemSettings } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const clearLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<SystemSettings>({
  gameEnabled: true,
  maintenanceMode: false,
  systemNotice: '',
  lotteryDataSource: '', // 保留字段但不显示，由后端配置文件管理
  autoSettleEnabled: true,
  drawInterval: 210,
  closeBeforeDraw: 30,
})

const rules = {
  systemNotice: [{ max: 500, message: '公告内容不能超过500字', trigger: 'blur' }],
  drawInterval: [
    { required: true, message: '请输入开奖间隔时间', trigger: 'blur' },
    { type: 'number' as const, min: 60, max: 600, message: '开奖间隔时间必须在60-600秒之间', trigger: 'blur' },
  ],
  closeBeforeDraw: [
    { required: true, message: '请输入封盘时间', trigger: 'blur' },
    { type: 'number' as const, min: 0, max: 120, message: '封盘时间必须在0-120秒之间，0表示不封盘', trigger: 'blur' },
  ],
}

// 获取设置
const fetchSettings = async () => {
  try {
    loading.value = true
    const res = await getSettings()
    Object.assign(form, res.data.systemSettings)
  } catch (error) {
    console.error('获取设置失败:', error)
  } finally {
    loading.value = false
  }
}

// 提交设置
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 移除 lotteryDataSource，由后端配置文件管理
    const { lotteryDataSource, ...settingsToUpdate } = form
    await updateSystemSettings(settingsToUpdate)
    
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 清空数据表单
const clearDataForm = reactive({
  dateRange: [] as string[],
  clearOptions: ['bets', 'pointRecords', 'lotteryHistory'] as string[],
})

// 是否可以清空数据
const canClearData = computed(() => {
  return clearDataForm.dateRange.length === 2 && clearDataForm.clearOptions.length > 0
})

// 重置清空数据表单
const resetClearDataForm = () => {
  const today = new Date()
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  clearDataForm.dateRange = [
    lastMonth.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  ]
  clearDataForm.clearOptions = ['bets', 'pointRecords', 'lotteryHistory']
}

// 清空数据
const handleClearData = async () => {
  if (!canClearData.value) {
    ElMessage.warning('请选择时间范围和清空内容')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认清空 ${clearDataForm.dateRange[0]} 至 ${clearDataForm.dateRange[1]} 的数据吗？此操作不可恢复！`,
      '⚠️ 危险操作确认',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    clearLoading.value = true

    const params = {
      startDate: clearDataForm.dateRange[0],
      endDate: clearDataForm.dateRange[1],
      clearBets: clearDataForm.clearOptions.includes('bets'),
      clearPointRecords: clearDataForm.clearOptions.includes('pointRecords'),
      clearLotteryHistory: clearDataForm.clearOptions.includes('lotteryHistory'),
    }

    const res = await clearData(params)
    
    ElMessage.success({
      message: `数据清空成功！已删除：
        下注记录 ${res.data.deletedBets} 条
        积分记录 ${res.data.deletedPointRecords} 条
        开奖历史 ${res.data.deletedLotteryHistory} 条`,
      duration: 5000,
      showClose: true,
    })

    // 重置表单
    resetClearDataForm()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('清空数据失败:', error)
      ElMessage.error(error.response?.data?.message || '清空数据失败')
    }
  } finally {
    clearLoading.value = false
  }
}

onMounted(() => {
  fetchSettings()
  resetClearDataForm()
})
</script>

<style scoped lang="scss">
.system-settings {
  max-width: 900px;

  .card-header {
    font-weight: bold;
    font-size: 18px;
  }

  .form-tip {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
  }
}
</style>

