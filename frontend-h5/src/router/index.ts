import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: true },
  },
  {
    path: '/bet-history',
    name: 'BetHistory',
    component: () => import('@/views/BetHistory.vue'),
    meta: { title: '投注历史', requiresAuth: true },
  },
  {
    path: '/lottery-history',
    name: 'LotteryHistory',
    component: () => import('@/views/History.vue'),
    meta: { title: '开奖历史', requiresAuth: true },
  },
  {
    path: '/point-records',
    name: 'PointRecords',
    component: () => import('@/views/PointRecords.vue'),
    meta: { title: '积分账单', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true },
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || '计分系统'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    } else {
      next()
    }
  } else {
    // 如果已登录，访问登录页时跳转到首页
    if (to.path === '/login') {
      const token = localStorage.getItem('token')
      if (token) {
        next('/')
        return
      }
    }
    next()
  }
})

export default router

