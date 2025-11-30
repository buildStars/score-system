# 📱 云策28计分系统 - H5用户端

基于 Vue 3 + Vant 4 的移动端彩票投注应用。

---

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [功能模块](#功能模块)
- [开发指南](#开发指南)
- [部署说明](#部署说明)

---

## 技术栈

- **框架**: Vue 3.3+ (Composition API)
- **构建工具**: Vite 5.x
- **UI组件**: Vant 4.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **样式预处理**: Less
- **工具库**: Day.js
- **类型检查**: TypeScript 5.x

---

## 项目结构

```
frontend-h5/
├── src/
│   ├── views/                    # 页面组件
│   │   ├── Login.vue            # 登录页
│   │   ├── Home.vue             # 首页（投注）
│   │   ├── BetHistory.vue       # 投注历史
│   │   ├── PointRecords.vue     # 积分记录
│   │   ├── Profile.vue          # 个人中心
│   │   └── MessageList.vue      # 消息公告
│   │
│   ├── components/               # 公共组件
│   │   ├── Navbar.vue           # 顶部导航
│   │   └── TabBar.vue           # 底部导航
│   │
│   ├── stores/                   # 状态管理
│   │   └── user.ts              # 用户状态
│   │
│   ├── api/                      # API接口
│   │   ├── request.ts           # Axios配置
│   │   ├── auth.ts              # 认证接口
│   │   ├── user.ts              # 用户接口
│   │   ├── lottery.ts           # 开奖接口
│   │   ├── bet.ts               # 投注接口
│   │   ├── system.ts            # 系统接口
│   │   └── message.ts           # 消息接口
│   │
│   ├── router/                   # 路由配置
│   │   └── index.ts
│   │
│   ├── utils/                    # 工具函数
│   │   └── format.ts            # 格式化工具
│   │
│   ├── types/                    # TypeScript类型
│   │   └── index.ts
│   │
│   ├── App.vue                   # 根组件
│   └── main.ts                   # 入口文件
│
├── public/                       # 静态资源
├── Dockerfile                    # Docker镜像
├── nginx.conf                    # Nginx配置
├── .env.development              # 开发环境变量
├── .env.production               # 生产环境变量
├── vite.config.ts                # Vite配置
└── package.json
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.development`:

```env
# API地址
VITE_API_BASE_URL=http://localhost:3000/api

# 应用标题
VITE_APP_TITLE=云策28计分系统
```

创建 `.env.production`:

```env
VITE_API_BASE_URL=/api
VITE_APP_TITLE=云策28计分系统
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

---

## 功能模块

### 1. 用户认证

**路径**: `/login`

**功能**:
- ✅ 用户名/密码登录
- ✅ 自动跳转
- ✅ Token本地存储
- ✅ 自动续期

**实现**:
```vue
<script setup lang="ts">
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const onLogin = async () => {
  const res = await authApi.login(form.value)
  userStore.setUser(res.data.user)
  userStore.setToken(res.data.token)
  router.push('/')
}
</script>
```

---

### 2. 首页投注

**路径**: `/`

**功能**:
- ✅ 实时倒计时（精确到秒）
- ✅ 多种玩法：倍数、大小单双、组合
- ✅ 动态加载配置（费率、限额）
- ✅ 智能封盘（开奖前30秒）
- ✅ 余额检查
- ✅ 实时显示当前期投注

**核心代码**:
```typescript
// 倒计时
const countdown = ref(0)
const polling = setInterval(async () => {
  const res = await lotteryApi.getCountdown()
  countdown.value = res.data.remainingSeconds
}, 1000)

// 投注
const placeBet = async () => {
  await betApi.createBet({
    betType: 'multiple',
    betContent: '100',
    amount: 100
  })
  showToast('投注成功')
}
```

**UI特性**:
- 📱 响应式布局
- 🎨 动态主题色
- ⚡ 流畅动画
- 🔔 Toast提示

---

### 3. 投注历史

**路径**: `/bet-history`

**功能**:
- ✅ 分期显示投注记录
- ✅ 合并同期多笔投注
- ✅ 显示结算结果
- ✅ 积分变化明细
- ✅ 下拉刷新
- ✅ 上拉加载

**数据展示**:
```vue
<template>
  <van-list
    v-model:loading="loading"
    :finished="finished"
    @load="onLoad"
  >
    <div v-for="bet in bets" :key="bet.id">
      <div class="bet-card">
        <div>期号: {{ bet.issue }}</div>
        <div>金额: {{ formatMoney(bet.amount) }}</div>
        <div>结果: {{ formatMoney(bet.resultAmount) }}</div>
      </div>
    </div>
  </van-list>
</template>
```

---

### 4. 积分记录

**路径**: `/point-records`

**功能**:
- ✅ 完整积分变动记录
- ✅ 类型筛选（全部/上分/下分/赢/输）
- ✅ 显示变动前后余额
- ✅ 关联投注/充值记录
- ✅ 分页加载

**筛选逻辑**:
```typescript
const filterType = ref('all')
const filteredRecords = computed(() => {
  if (filterType.value === 'all') return records.value
  return records.value.filter(r => r.type === filterType.value)
})
```

---

### 5. 个人中心

**路径**: `/profile`

**功能**:
- ✅ 显示用户信息
- ✅ 当前积分余额
- ✅ 账户统计
- ✅ 退出登录

**界面**:
```vue
<template>
  <div class="profile">
    <div class="user-info">
      <div class="username">{{ user.username }}</div>
      <div class="points">{{ formatMoney(user.points) }}</div>
    </div>
    
    <van-cell-group>
      <van-cell title="投注历史" is-link to="/bet-history" />
      <van-cell title="积分记录" is-link to="/point-records" />
      <van-cell title="消息公告" is-link to="/messages" />
    </van-cell-group>
    
    <van-button @click="onLogout">退出登录</van-button>
  </div>
</template>
```

---

### 6. 消息公告

**路径**: `/messages`

**功能**:
- ✅ 查看系统公告
- ✅ 标记已读/未读
- ✅ 富文本内容
- ✅ 按时间倒序

---

## 开发指南

### 添加新页面

1. **创建页面组件**:
```vue
<!-- src/views/NewPage.vue -->
<template>
  <div class="new-page">
    <h1>New Page</h1>
  </div>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style scoped lang="less">
.new-page {
  padding: 16px;
}
</style>
```

2. **添加路由**:
```typescript
// src/router/index.ts
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('@/views/NewPage.vue'),
  meta: { 
    requiresAuth: true,  // 需要登录
    title: '新页面'
  }
}
```

### 调用API

1. **定义API**:
```typescript
// src/api/your-api.ts
import request from './request'

export const yourApi = {
  getData: () => request.get('/your-endpoint'),
  postData: (data: any) => request.post('/your-endpoint', data),
}
```

2. **使用API**:
```vue
<script setup lang="ts">
import { yourApi } from '@/api/your-api'

const getData = async () => {
  const res = await yourApi.getData()
  console.log(res.data)
}
</script>
```

### 使用状态管理

```typescript
// src/stores/your-store.ts
import { defineStore } from 'pinia'

export const useYourStore = defineStore('your', {
  state: () => ({
    data: null
  }),
  actions: {
    setData(data: any) {
      this.data = data
    }
  }
})
```

### 样式规范

```less
// 使用 Less 变量
@primary-color: #1989fa;
@text-color: #323233;

// 使用 BEM 命名
.bet-card {
  &__header { }
  &__content { }
  &--active { }
}
```

---

## 部署说明

### 方式一：Docker部署

```bash
# 构建镜像
docker build -t score-system-h5 .

# 运行容器
docker run -d -p 5173:80 score-system-h5
```

### 方式二：Nginx部署

1. **构建项目**:
```bash
npm run build
```

2. **配置Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/h5/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

3. **部署文件**:
```bash
cp -r dist/* /var/www/h5/
```

---

## 性能优化

### 1. 路由懒加载

```typescript
const routes = [
  {
    path: '/bet-history',
    component: () => import('@/views/BetHistory.vue')  // 懒加载
  }
]
```

### 2. 图片优化

```vue
<img 
  :src="imageUrl" 
  loading="lazy"  <!-- 懒加载 -->
  alt="description"
>
```

### 3. 组件按需引入

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [VantResolver()]  // 按需引入Vant组件
    })
  ]
}
```

### 4. Gzip压缩

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression'

export default {
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240  // 超过10KB才压缩
    })
  ]
}
```

---

## 常见问题

### Q: 开发环境跨域问题？

**A**: 配置Vite代理

```typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
```

### Q: 生产环境白屏？

**A**: 检查路由配置和base路径

```typescript
// vite.config.ts
export default {
  base: '/',  // 确保base路径正确
}
```

### Q: Toast/Dialog不显示？

**A**: 确保已引入样式

```typescript
// main.ts
import 'vant/es/toast/style'
import 'vant/es/dialog/style'
```

---

## 浏览器兼容性

- Chrome >= 90
- Safari >= 14
- iOS Safari >= 14
- Android WebView >= 90

---

**维护者**: AI Assistant  
**最后更新**: 2025-11-30
