import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'DataAnalysis' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'lottery-history',
        name: 'LotteryHistory',
        component: () => import('@/views/LotteryHistory.vue'),
        meta: { title: '开奖历史', icon: 'TrendCharts' },
      },
      {
        path: 'bet-records',
        name: 'BetRecords',
        component: () => import('@/views/BetRecordsNew.vue'),
        meta: { title: '下单记录', icon: 'Document' },
      },
      {
        path: 'user-bet-summary',
        name: 'UserBetSummary',
        component: () => import('@/views/UserBetSummary.vue'),
        meta: { title: '用户投注汇总', icon: 'DataLine' },
      },
      {
        path: 'point-records',
        name: 'PointRecords',
        component: () => import('@/views/PointRecords.vue'),
        meta: { title: '积分记录', icon: 'Coin' },
      },
      {
        path: 'bet-settings',
        name: 'BetSettings',
        component: () => import('@/views/BetTypeSettings.vue'),
        meta: { title: '模式设置', icon: 'Setting' },
      },
      {
        path: 'system-settings',
        name: 'SystemSettings',
        component: () => import('@/views/SystemSettings.vue'),
        meta: { title: '网站设置', icon: 'Tools' },
      },
      {
        path: 'telegram-settings',
        name: 'TelegramSettings',
        component: () => import('@/views/TelegramSettings.vue'),
        meta: { title: 'Telegram配置', icon: 'ChatDotRound' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/MessageList.vue'),
        meta: { title: '留言管理', icon: 'ChatDotRound' },
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: () => import('@/views/ChangePassword.vue'),
        meta: { title: '修改密码', icon: 'Lock' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router

