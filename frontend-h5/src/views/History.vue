<template>
  <div class="history-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="开奖历史" fixed placeholder>
      <template #left>
        <van-icon name="arrow-left" size="18" @click="goBack" />
      </template>
    </van-nav-bar>

    <!-- 搜索栏 + 表头（固定区域） -->
    <div class="fixed-header-wrapper">
      <div class="search-section">
        <van-search
          v-model="searchIssue"
          placeholder="请输入期号搜索"
          @search="onSearch"
          @clear="onClear"
          @update:model-value="onSearchChange"
        />
      </div>

      <!-- 表头 -->
      <div class="table-header">
        <div class="header-col issue-header">期号</div>
        <div class="header-col time-header">时间</div>
        <div class="header-col result-header">号码</div>
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

        <!-- 开奖记录列表 - 紧凑布局 -->
        <div v-for="item in list" :key="item.id" class="history-item">
          <div class="item-row">
            <!-- 左侧：期号 -->
            <div class="issue-col">
              <div class="issue-num">{{ formatIssue(item.issue) }}</div>
            </div>

            <!-- 中间：时间 -->
            <div class="time-col">
              <div class="time-text">{{ formatDateTime(item.drawTime, 'HH:mm:ss') }}</div>
            </div>

            <!-- 右侧：号码和结果 -->
            <div class="result-col">
              <!-- 号码 -->
              <div class="numbers">
                <span class="number">{{ item.number1 }}</span>
                <span class="plus">+</span>
                <span class="number">{{ item.number2 }}</span>
                <span class="plus">+</span>
                <span class="number">{{ item.number3 }}</span>
                <span class="equal">=</span>
                <span class="sum">{{ item.resultSum }}</span>
              </div>

              <!-- 标签 -->
              <div class="tags">
                <span :class="['tag-circle', getSizeClass(item.sizeResult)]">
                  {{ item.sizeResult }}
                </span>
                <span :class="['tag-circle', getOddEvenClass(item.oddEvenResult)]">
                  {{ item.oddEvenResult }}
                </span>
                <span v-if="item.isReturn" class="tag-circle tag-return">
                  回
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty
          v-if="!loading && list.length === 0"
          image="search"
          description="暂无开奖记录"
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
import { lotteryApi } from '@/api'
import { formatDateTime, formatIssue } from '@/utils/format'
import { debounce } from '@/composables/useDebounce'
import type { LotteryResult } from '@/types/bet'

const router = useRouter()
const activeTab = ref(2)

const list = ref<LotteryResult[]>([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const searchIssue = ref('')

const pagination = reactive({
  page: 1,
  limit: 30, // 增加每页显示数量，紧凑布局可以显示更多
})

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
    const res = await lotteryApi.getLotteryHistory({
      page: pagination.page,
      limit: pagination.limit,
      issue: searchIssue.value || undefined,
    })

    const data = res.data

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
    console.error('加载开奖历史失败：', error)
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
 * 搜索
 */
const onSearch = () => {
  pagination.page = 1
  finished.value = false
  list.value = []
  onLoad()
}

/**
 * 清空搜索
 */
const onClear = () => {
  pagination.page = 1
  finished.value = false
  list.value = []
  onLoad()
}

/**
 * 搜索内容变化（防抖）
 */
const onSearchChange = debounce(() => {
  // 如果搜索框为空，不触发搜索
  if (searchIssue.value.trim()) {
    onSearch()
  }
}, 500)

/**
 * 获取大小样式类
 */
const getSizeClass = (size: string): string => {
  return size === '大' ? 'tag-big' : 'tag-small'
}

/**
 * 获取单双样式类
 */
const getOddEvenClass = (oddEven: string): string => {
  return oddEven === '单' ? 'tag-odd' : 'tag-even'
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.history-page {
  min-height: 100vh;
  padding-bottom: 60px;
  background-color: #fff;
}

// 固定头部区域（搜索框 + 表头）
.fixed-header-wrapper {
  position: sticky;
  top: 46px;
  z-index: 99;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-section {
  padding: 8px 10px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

// 表头
.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  background: #f7f8fa;
  border-bottom: 2px solid #e5e5e5;

  .header-col {
    font-size: 12px;
    color: #666;
    font-weight: 600;
  }

  .issue-header {
    width: 70px;
    flex-shrink: 0;
  }

  .time-header {
    width: 65px;
    flex-shrink: 0;
  }

  .result-header {
    flex: 1;
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
.history-item {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 10px;
  }

  // 期号列
  .issue-col {
    flex-shrink: 0;
    width: 70px;

    .issue-num {
      font-size: 13px;
      color: $text-color;
      font-weight: 500;
      line-height: 1.2;
    }
  }

  // 时间列
  .time-col {
    flex-shrink: 0;
    width: 65px;

    .time-text {
      font-size: 12px;
      color: #666;
      line-height: 1.2;
    }
  }

  // 结果列
  .result-col {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  // 号码
  .numbers {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    font-size: 13px;

    .number,
    .plus,
    .equal,
    .sum {
      font-weight: 500;
      color: $text-color;
    }

    .plus {
      font-size: 11px;
      color: #999;
      margin: 0 1px;
    }

    .equal {
      font-size: 11px;
      color: #999;
      margin: 0 2px;
    }

    .sum {
      font-size: 14px;
      font-weight: 700;
      color: #ff6b6b;
      min-width: 18px;
    }
  }

  // 标签圆圈
  .tags {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    .tag-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }

    .tag-big {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    }

    .tag-small {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .tag-odd {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .tag-even {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .tag-return {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }
}
</style>

