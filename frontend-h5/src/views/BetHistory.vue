<template>
  <div class="bet-history-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="投注历史" fixed placeholder />

    <!-- 表头 -->
    <div class="fixed-header-wrapper">
      <div class="table-header">
        <div class="header-col issue-col">期号</div>
        <div class="header-col lottery-col">开奖号码</div>
        <div class="header-col bet-col">下注</div>
        <div class="header-col result-col">结果</div>
        <div class="header-col balance-col">剩余</div>
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

        <!-- 投注记录列表 - 紧凑布局 -->
        <div v-for="item in list" :key="item.id" class="bet-item">
          <div class="item-row">
            <!-- 期号 -->
            <div class="data-col issue-col">
              <div class="issue-text">{{ formatIssue(item.issue) }}</div>
            </div>

            <!-- 开奖号码 -->
            <div class="data-col lottery-col">
              <div v-if="item.lottery" class="lottery-numbers">
                <span class="num">{{ item.lottery.number1 }}</span>
                <span class="num">{{ item.lottery.number2 }}</span>
                <span class="num">{{ item.lottery.number3 }}</span>
              </div>
              <div v-else class="pending-text">-</div>
            </div>

            <!-- 下注内容 -->
            <div class="data-col bet-col">
              <div class="bet-content">{{ formatBetContent(item.betContent, item.betType) }}</div>
            </div>

            <!-- 结果（总盈亏）-->
            <div class="data-col result-col">
              <div v-if="item.status === 'pending'" class="result-pending">
                未结算
              </div>
              <div v-else-if="item.status === 'cancelled'" class="result-cancelled">
                取消
              </div>
              <div v-else :class="['result-amount', getResultClass(getTotalProfitLoss(item))]">
                {{ formatResultAmount(getTotalProfitLoss(item)) }}
              </div>
            </div>

            <!-- 剩余积分 -->
            <div class="data-col balance-col">
              <div v-if="item.status === 'pending'" class="balance-pending">
                -
              </div>
              <div v-else-if="item.status === 'cancelled'" class="balance-cancelled">
                -
              </div>
              <div v-else class="balance-amount">
                {{ formatMoney(item.pointsAfter) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty
          v-if="!loading && list.length === 0"
          image="search"
          description="暂无投注记录"
        />
      </van-list>
    </van-pull-refresh>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeNavTab" route fixed>
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
import { showToast } from 'vant'
import { getBetHistory } from '@/api/user'
import { formatMoney } from '@/utils/format'

const activeNavTab = ref(1)

const list = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)

const pagination = reactive({
  page: 1,
  limit: 30,
})

/**
 * 格式化期号（只显示后6位）
 */
const formatIssue = (issue: string): string => {
  if (issue.length > 6) {
    return issue.slice(-6)
  }
  return issue
}

/**
 * 格式化下注内容（支持同一期合并显示）
 * 
 * 合并后的格式示例：
 * - 纯倍数：600 （500倍+100倍）
 * - 纯组合：100大单 （或 100大单 200小双）
 * - 混合：600 100小单
 * 
 * 显示策略：
 * - 倍数：直接显示数字（如 600）
 * - 组合：显示"金额+内容"（如 100大单）
 * - 混合：显示"倍数 金额+内容"（如 600 100小单）
 */
const formatBetContent = (content: string, betType: string): string => {
  if (!content) return '-'
  
  // 去掉可能存在的"倍数"、"倍"等文字
  let formatted = content.replace(/倍数|倍/g, '').trim()
  
  // 如果是混合类型（既有倍数又有组合）
  // 格式：600 100小单 → 显示为：600 100小单
  if (betType === 'mixed') {
    // 分割为倍数部分和组合部分
    const parts = formatted.split(' ')
    if (parts.length >= 2) {
      const multiple = parts[0] // 倍数
      const combos = parts.slice(1).join(' ') // 组合部分
      return `${multiple} ${combos}`
    }
    return formatted
  }
  
  // 如果是纯倍数下注（直接显示数字）
  if (betType === 'multiple') {
    return formatted
  }
  
  // 如果是纯组合下注
  // 格式：100大单 200小双 → 显示为：100大单 200小双
  if (betType === 'combo') {
    return formatted
  }
  
  return formatted
}

/**
 * 获取结果样式类
 */
const getResultClass = (amount: number | null): string => {
  if (amount === null || amount === undefined) return ''
  return Number(amount) >= 0 ? 'profit' : 'loss'
}

/**
 * 格式化结果金额
 */
/**
 * 计算总盈亏（结算后积分 - 下注前积分）
 */
const getTotalProfitLoss = (item: any): number => {
  if (!item.pointsBefore || !item.pointsAfter) return 0
  return Number(item.pointsAfter) - Number(item.pointsBefore)
}

const formatResultAmount = (amount: number | null): string => {
  if (amount === null || amount === undefined) return '-'
  const num = Number(amount)
  if (num > 0) {
    return `+${formatMoney(num)}`
  } else if (num < 0) {
    return formatMoney(num)
  }
  return formatMoney(num)
}

/**
 * 加载数据
 */
const onLoad = async () => {
  try {
    const res = await getBetHistory({
      page: pagination.page,
      limit: pagination.limit,
    })

    const data = res.data.data || res.data

    if (pagination.page === 1) {
      list.value = data.list
    } else {
      list.value.push(...data.list)
    }

    loading.value = false
    refreshing.value = false

    // 判断是否已加载完所有数据
    if (list.value.length >= data.total) {
      finished.value = true
    } else {
      pagination.page++
    }
  } catch (error) {
    console.error('加载投注历史失败：', error)
    showToast({
      message: '加载失败，请重试',
      type: 'fail',
    })
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 下拉刷新
 */
const onRefresh = () => {
  pagination.page = 1
  finished.value = false
  onLoad()
}

/**
 * 页面初始化
 */
onMounted(() => {
  onLoad()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bet-history-page {
  min-height: 100vh;
  padding-bottom: 60px;
  background-color: #fff;
}

// 固定表头区域
.fixed-header-wrapper {
  position: sticky;
  top: 46px;
  z-index: 99;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

  .issue-col {
    width: 55px;
    flex-shrink: 0;
  }

  .lottery-col {
    width: 75px;
    flex-shrink: 0;
  }

  .bet-col {
    flex: 1;
    min-width: 50px;
  }

  .result-col {
    width: 60px;
    flex-shrink: 0;
  }

  .balance-col {
    width: 60px;
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
.bet-item {
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

  // 期号列
  .issue-col {
    width: 55px;
    flex-shrink: 0;

    .issue-text {
      font-size: 12px;
      color: $text-color;
      font-weight: 500;
      text-align: center;
    }
  }

  // 开奖号码列
  .lottery-col {
    width: 75px;
    flex-shrink: 0;

    .lottery-numbers {
      display: flex;
      gap: 3px;
      justify-content: center;

      .num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 600;
      }
    }

    .pending-text {
      font-size: 12px;
      color: #999;
    }
  }

  // 下注内容列
  .bet-col {
    flex: 1;
    min-width: 50px;

    .bet-content {
      font-size: 12px;
      font-weight: 600;
      color: $primary-color;
      text-align: center;
    }
  }

  // 结果列
  .result-col {
    width: 60px;
    flex-shrink: 0;

    .result-pending {
      font-size: 12px;
      color: #999;
    }

    .result-cancelled {
      font-size: 12px;
      color: #ff976a;
      font-weight: 500;
    }

    .result-amount {
      font-size: 12px;
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
    width: 60px;
    flex-shrink: 0;

    .balance-pending {
      font-size: 12px;
      color: #999;
    }

    .balance-cancelled {
      font-size: 12px;
      color: #999;
    }

    .balance-amount {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      text-align: center;
    }
  }
}
</style>

