<template>
  <div class="bet-settings">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>下注模式设置</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="180px"
        v-loading="loading"
      >
        <el-divider content-position="left">倍数下注设置</el-divider>
        
        <el-form-item label="倍数手续费比例" prop="multipleFeeRate">
          <el-input-number
            v-model="form.multipleFeeRate"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.1"
          />
          <span class="form-tip">%（手续费计算公式：下注金额 × 倍数 / 手续费基数 × 手续费比例）</span>
        </el-form-item>

        <el-form-item label="倍数手续费基数" prop="multipleFeeBase">
          <el-input-number
            v-model="form.multipleFeeBase"
            :min="1"
            :precision="0"
          />
          <span class="form-tip">（基数越大，手续费越低）</span>
        </el-form-item>

        <el-form-item label="不回本损失比例" prop="multipleLossRate">
          <el-input-number
            v-model="form.multipleLossRate"
            :min="0"
            :max="1"
            :precision="2"
            :step="0.01"
          />
          <span class="form-tip">（0-1之间，表示损失比例。例如0.8表示损失80%）</span>
        </el-form-item>

        <el-divider content-position="left">组合下注设置</el-divider>

        <el-form-item label="组合手续费比例" prop="comboFeeRate">
          <el-input-number
            v-model="form.comboFeeRate"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.1"
          />
          <span class="form-tip">%（手续费计算公式：下注金额 / 手续费基数 × 手续费比例）</span>
        </el-form-item>

        <el-form-item label="组合手续费基数" prop="comboFeeBase">
          <el-input-number
            v-model="form.comboFeeBase"
            :min="1"
            :precision="0"
          />
          <span class="form-tip">（基数越大，手续费越低）</span>
        </el-form-item>

        <el-divider content-position="left">通用设置</el-divider>

        <el-form-item label="最小下注金额" prop="minBetAmount">
          <el-input-number
            v-model="form.minBetAmount"
            :min="1"
            :precision="2"
          />
          <span class="form-tip">元</span>
        </el-form-item>

        <el-form-item label="最大下注金额" prop="maxBetAmount">
          <el-input-number
            v-model="form.maxBetAmount"
            :min="1"
            :precision="2"
          />
          <span class="form-tip">元</span>
        </el-form-item>

        <el-form-item label="单期最大下注次数" prop="maxBetsPerIssue">
          <el-input-number
            v-model="form.maxBetsPerIssue"
            :min="1"
            :precision="0"
          />
          <span class="form-tip">次</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            保存设置
          </el-button>
          <el-button @click="fetchSettings">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { getSettings, updateBetSettings } from '@/api/settings'
import type { BetSettings } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<BetSettings>({
  multipleFeeRate: 3,
  multipleFeeBase: 100,
  comboFeeRate: 5,
  comboFeeBase: 100,
  minBetAmount: 10,
  maxBetAmount: 10000,
  maxBetsPerIssue: 10,
  multipleLossRate: 0.8,
})

const rules = {
  multipleFeeRate: [{ required: true, message: '请输入倍数手续费比例', trigger: 'blur' }],
  multipleFeeBase: [{ required: true, message: '请输入倍数手续费基数', trigger: 'blur' }],
  comboFeeRate: [{ required: true, message: '请输入组合手续费比例', trigger: 'blur' }],
  comboFeeBase: [{ required: true, message: '请输入组合手续费基数', trigger: 'blur' }],
  minBetAmount: [{ required: true, message: '请输入最小下注金额', trigger: 'blur' }],
  maxBetAmount: [{ required: true, message: '请输入最大下注金额', trigger: 'blur' }],
  maxBetsPerIssue: [{ required: true, message: '请输入单期最大下注次数', trigger: 'blur' }],
  multipleLossRate: [{ required: true, message: '请输入不回本损失比例', trigger: 'blur' }],
}

// 获取设置
const fetchSettings = async () => {
  try {
    loading.value = true
    const res = await getSettings()
    Object.assign(form, res.data.betSettings)
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
    await updateBetSettings(form)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped lang="scss">
.bet-settings {
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





