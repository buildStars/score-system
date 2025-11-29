<template>
  <div class="point-records-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="积分账单" fixed placeholder>
      <template #left>
        <van-icon name="arrow-left" size="18" @click="goBack" />
      </template>
    </van-nav-bar>

    <!-- 汇总统计区域 -->
    <div class="summary-section">
      <div class="summary-title">上下分汇总</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">累计上分</div>
          <div class="summary-value positive">+{{ formatMoney(summaryData.totalRecharge,0) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">累计下分</div>
          <div class="summary-value negative">{{ formatMoney(summaryData.totalDeduct,0) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">净上分</div>
          <div :class="['summary-value', summaryData.netAmount >= 0 ? 'positive' : 'negative']">
            {{ formatMoney(summaryData.netAmount,0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 + 表头 -->
    <div class="fixed-header-wrapper">
      <div class="filter-section">
        <van-dropdown-menu>
          <van-dropdown-item v-model="filterType" :options="typeOptions" @change="onFilterChange" />
        </van-dropdown-menu>
      </div>

      <!-- 表头 -->
      <div class="table-header">
        <div class="header-col type-col">类型</div>
        <div class="header-col time-col">时间</div>
        <div class="header-col amount-col">数额</div>
        <div class="header-col balance-col">余额</div>
      </div>
    </div>

    <!-- 列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <!-- 骨架屏 -->
        <div v-if="loading && list.length === 0" class="skeleton-wrapper">
          <van-skeleton title :row="2" class="skeleton-item" />
          <van-skeleton title :row="2" class="skeleton-item" />
          <van-skeleton title :row="2" class="skeleton-item" />
        </div>

        <!-- 积分记录列表 - 紧凑布局 -->
        <div v-for="item in list" :key="item.id" class="record-item">
          <div class="item-row">
            <!-- 类型 -->
            <div class="data-col type-col">
              <van-tag :type="getTypeTag(item.displayType || item.type)">
                {{ item.displayType || getTypeName(item.type) }}
              </van-tag>
            </div>

            <!-- 时间 -->
            <div class="data-col time-col">
              <div class="time-text">{{ formatTime(item.createdAt) }}</div>
            </div>

            <!-- 金额 -->
            <div class="data-col amount-col">
              <div :class="['amount-text', item.amount >= 0 ? 'profit' : 'loss']">
                {{ formatPointChange(item.amount,0) }}
              </div>
            </div>

            <!-- 剩余积分 -->
            <div class="data-col balance-col">
              <div class="balance-text">
                {{ formatPoints(item.balanceAfter) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty
          v-if="!loading && list.length === 0"
          image="search"
          description="暂无积分记录"
        />
      </van-list>
    </van-pull-refresh>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" route fixed>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/bet-history">投注历史</van-tabbar-item>
      <van-tabbar-item icon="records-o" to="/lottery-history">开奖历史</van-tabbar-item>
      <van-tabbar-item icon="gold-coin-o" to="/point-records">积分账单</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { userApi } from '@/api'
import { formatPointChange, formatMoney, formatPoints } from '@/utils/format'
import type { PointRecord } from '@/types/bet'

const router = useRouter()
const activeTab = ref(3)

const list = ref<PointRecord[]>([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const filterType = ref('')

const pagination = reactive({
  page: 1,
  limit: 30, // 紧凑布局，增加每页显示数量
})

// 汇总数据
const summaryData = reactive({
  totalRecharge: 0,    // 累计上分
  totalDeduct: 0,      // 累计下分
  netAmount: 0,        // 净上分
})

// 类型筛选选项（简化为上分/下分）
const typeOptions = [
  { text: '全部类型', value: '' },
  { text: '上分', value: 'recharge,admin_add' },
  { text: '下分', value: 'deduct,admin_deduct' },
]

/**
 * 获取类型名称
 */
const getTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    recharge: '充值',
    deduct: '扣款',
    admin_add: '管理员加分',
    admin_deduct: '管理员扣分',
    bet: '下注',
    win: '中奖',
    loss: '未中奖',
    fee: '手续费',
  }
  return typeMap[type] || type
}

/**
 * 获取类型标签样式
 */
const getTypeTag = (type: string) => {
  // 如果是统一后的类型（上分/下分）
  if (type === '上分') return 'success'
  if (type === '下分') return 'danger'
  
  // 兼容旧的类型
  const tagMap: Record<string, 'success' | 'danger' | 'warning' | 'default' | 'primary'> = {
    recharge: 'success',       // 充值 - 绿色
    admin_add: 'success',      // 管理员加分 - 绿色
    win: 'success',            // 中奖 - 绿色
    deduct: 'danger',          // 扣款 - 红色
    admin_deduct: 'danger',    // 管理员扣分 - 红色
    loss: 'danger',            // 未中奖 - 红色
    bet: 'warning',            // 下注 - 橙色
    fee: 'warning',            // 手续费 - 橙色
  }
  return tagMap[type] || 'default'
}

/**
 * 格式化时间（完整格式：年-月-日 时:分:秒）
 */
const formatTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return '----:--:--'
  }
}

/**
 * 计算汇总数据
 */
const calculateSummary = (records: PointRecord[]) => {
  let totalRecharge = 0
  let totalDeduct = 0

  records.forEach(record => {
    const amount = Number(record.amount)
    
    // 根据金额正负判断
    if (amount >= 0) {
      totalRecharge += amount
    } else {
      totalDeduct += Math.abs(amount)
    }
  })

  summaryData.totalRecharge = totalRecharge
  summaryData.totalDeduct = totalDeduct
  summaryData.netAmount = totalRecharge - totalDeduct
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 加载数据
 */
const onLoad = async () => {
  try {
    const res = await userApi.getPointRecords({
      page: pagination.page,
      limit: pagination.limit,
      type: filterType.value || undefined,
    })

    const data = res.data.data || res.data

    if (pagination.page === 1) {
      list.value = data.list
    } else {
      list.value.push(...data.list)
    }

    // 计算汇总数据（基于已加载的记录）
    calculateSummary(list.value)

    loading.value = false
    refreshing.value = false

    // 判断是否已加载完所有数据
    if (list.value.length >= data.total) {
      finished.value = true
    } else {
      pagination.page++
    }
  } catch (error) {
    console.error('加载积分记录失败：', error)
    showToast({
      message: '加载失败，请重试',
      type: 'fail',
    })
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 页面初始化
 */
onMounted(() => {
  // 自动加载第一页数据
  onLoad()
})

/**
 * 下拉刷新
 */
const onRefresh = () => {
  pagination.page = 1
  finished.value = false
  onLoad()
}

/**
 * 筛选条件改变
 */
const onFilterChange = () => {
  pagination.page = 1
  finished.value = false
  list.value = []
  onLoad()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.point-records-page {
  min-height: 100vh;
  padding-bottom: 60px;
  background-color: #fff;
}

// 汇总统计区域
.summary-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px;
  margin: 10px 0;

  .summary-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
    text-align: center;
  }

  .summary-grid {
    display: flex;
    gap: 10px;

    .summary-item {
      flex: 1;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      padding: 12px;
      text-align: center;

      .summary-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
      }

      .summary-value {
        font-size: 16px;
        font-weight: 700;

        &.positive {
          color: $success-color;
        }

        &.negative {
          color: $danger-color;
        }
      }
    }
  }
}

// 固定头部区域（筛选 + 表头）
.fixed-header-wrapper {
  position: sticky;
  top: 46px;
  z-index: 99;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-section {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

// 表头
.table-header {
  display: flex;
  align-items: center;
  padding: 10px 10px;
  background: #f7f8fa;
  border-bottom: 2px solid #e5e5e5;

  .header-col {
    font-size: 12px;
    color: #666;
    font-weight: 600;
    text-align: center;
  }

  .type-col {
    width: 70px;
    flex-shrink: 0;
  }

  .time-col {
    flex: 1;
    min-width: 80px;
  }

  .amount-col {
    width: 70px;
    flex-shrink: 0;
  }

  .balance-col {
    width: 70px;
    flex-shrink: 0;
  }
}

.skeleton-wrapper {
  .skeleton-item {
    padding: 10px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }
}

// 紧凑布局样式
.record-item {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .item-row {
    display: flex;
    align-items: center;
    padding: 12px 10px;
  }

  .data-col {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  // 类型列
  .type-col {
    width: 70px;
    flex-shrink: 0;
    justify-content: flex-start;
  }

  // 时间列
  .time-col {
    flex: 1;
    min-width: 80px;

    .time-text {
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  }

  // 金额列
  .amount-col {
    width: 70px;
    flex-shrink: 0;

    .amount-text {
      font-size: 13px;
      font-weight: 700;
      text-align: center;

      &.profit {
        color: $success-color;
      }

      &.loss {
        color: $danger-color;
      }
    }
  }

  // 剩余积分列
  .balance-col {
    width: 70px;
    flex-shrink: 0;

    .balance-text {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      text-align: center;
    }
  }
}
</style>

