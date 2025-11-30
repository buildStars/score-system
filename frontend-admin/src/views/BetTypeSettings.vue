<template>
  <div class="bet-type-settings">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>下注类型配置 - 模式设置</span>
          <el-button type="primary" :icon="Check" @click="handleSave" :loading="saving">
            保存配置
          </el-button>
        </div>
      </template>

      <el-alert 
        type="info" 
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          说明：配置每种下注类型的名称、说明、赔率、投注限额和手续费
        </template>
      </el-alert>

      <div class="table-wrapper">
        <el-table :data="settingsList" border v-loading="loading" size="small">
   
        <el-table-column label="名称" width="100">
          <template #default="{ row }">
            <el-input
              v-model="row.name"
              placeholder="请输入"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="赔率" width="100">
          <template #default="{ row }">
            <el-input-number
              v-model="row.odds"
              :min="0"
              :max="100"
              :precision="2"
              :step="0.1"
              size="small"
              controls-position="right"
            />
          </template>
        </el-table-column>

        <el-table-column label="最小" width="100">
          <template #default="{ row }">
            <el-input-number
              v-model="row.minBet"
              :min="0"
              :max="999999"
              :precision="2"
              :step="1"
              size="small"
              controls-position="right"
            />
          </template>
        </el-table-column>

        <el-table-column label="最大" width="100">
          <template #default="{ row }">
            <el-input-number
              v-model="row.maxBet"
              :min="0"
              :max="999999"
              :precision="2"
              :step="100"
              size="small"
              controls-position="right"
            />
          </template>
        </el-table-column>

        <el-table-column label="费率" width="110">
          <template #default="{ row }">
            <el-input-number
              v-model="row.feeRate"
              :min="0"
              :max="100"
              :precision="2"
              :step="0.1"
              size="small"
              controls-position="right"
            />
            <div style="color: #909399; font-size: 10px;">
              {{ (row.feeRate || 0).toFixed(2) }}%
            </div>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="60" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" size="small" />
          </template>
        </el-table-column>

        <!-- <el-table-column label="说明" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.description"
              placeholder="请输入说明"
              size="small"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleReset(row)"
            >
              重置
            </el-button>
          </template>
        </el-table-column> -->
        </el-table>
      </div>

      <div class="tips" style="margin-top: 20px;">
        <el-alert type="warning" :closable="false">
          <template #title>
            <div>
              <div>💡 配置说明：</div>
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li><strong>名称：</strong>下注类型的显示名称（如"倍数"、"大"、"小"等）</li>
                <li><strong>说明：</strong>下注规则的详细说明（如"总和≥14"、"总和为单数"等）</li>
                <li><strong>赔率：</strong>中奖时的赔付倍数（如1.95表示投100赢195元）</li>
                <li><strong>最小投注：</strong>单次下注的最小金额</li>
                <li><strong>最大投注：</strong>单次下注的最大金额</li>
                <li><strong>手续费：</strong>下注时扣除的费用比例（如3%表示投100扣3元手续费）</li>
                <li><strong>启用状态：</strong>关闭后用户无法选择此玩法</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { getBetTypeSettings, batchUpdateBetTypeSettings } from '@/api/settings'

interface BetTypeSetting {
  id: number
  betType: string
  name: string
  odds: number
  minBet: number
  maxBet: number
  feeRate: number
  isEnabled: boolean
  sortOrder: number
  description?: string
}

const loading = ref(false)
const saving = ref(false)
const settingsList = ref<BetTypeSetting[]>([])
const originalSettings = ref<BetTypeSetting[]>([])

// 获取配置列表
const fetchSettings = async () => {
  try {
    loading.value = true
    const res = await getBetTypeSettings()
    
    // 转换费率：数据库存储0-1，前端显示0-100
    // 同时确保所有数字字段都是 number 类型，防止 ElInputNumber 报警告
    settingsList.value = res.data.map((item: any) => ({
      ...item,
      id: Number(item.id),
      odds: Number(item.odds),
      minBet: Number(item.minBet),
      maxBet: Number(item.maxBet),
      feeRate: Number(item.feeRate) * 100, // 0.03 → 3
      sortOrder: Number(item.sortOrder),
      isEnabled: Boolean(item.isEnabled),
    }))
    
    // 备份原始数据
    originalSettings.value = JSON.parse(JSON.stringify(settingsList.value))
    
  } catch (error) {
    console.error('获取配置失败:', error)
    ElMessage.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

// 保存配置
const handleSave = async () => {
  try {
    await ElMessageBox.confirm(
      '确认保存所有配置吗？保存后立即生效',
      '确认保存',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    saving.value = true

    // 转换费率：前端显示0-100，数据库存储0-1
    const settings = settingsList.value.map((item) => ({
      betType: item.betType,
      name: item.name,
      odds: item.odds,
      minBet: item.minBet,
      maxBet: item.maxBet,
      feeRate: item.feeRate / 100, // 3 → 0.03
      isEnabled: item.isEnabled,
      sortOrder: item.sortOrder,
      description: item.description,
    }))

    await batchUpdateBetTypeSettings(settings)
    
    ElMessage.success('保存成功')
    
    // 重新获取数据
    await fetchSettings()
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 重置单项配置
const handleReset = async (row: BetTypeSetting) => {
  try {
    await ElMessageBox.confirm(
      `确认重置 "${row.name}" 的配置吗？`,
      '确认重置',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 找到原始配置
    const original = originalSettings.value.find((item) => item.betType === row.betType)
    if (original) {
      Object.assign(row, JSON.parse(JSON.stringify(original)))
      ElMessage.success('重置成功')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重置失败:', error)
    }
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped lang="scss">
.bet-type-settings {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-input-number) {
    width: 100%;
    
    .el-input__inner {
      text-align: left;
    }
  }

  .tips {
    ul {
      li {
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .bet-type-settings {
    .card-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      span {
        text-align: center;
      }
      
      .el-button {
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
      
      .el-input-number {
        .el-input__inner {
          font-size: 13px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .bet-type-settings {
    :deep(.el-table) {
      font-size: 12px;
      
      .el-table__cell {
        padding: 6px 2px;
      }
      
      .el-input-number {
        .el-input__inner {
          font-size: 12px;
        }
      }
    }
    
    :deep(.el-button) {
      padding: 6px 10px;
      font-size: 12px;
    }
  }
}
</style>

