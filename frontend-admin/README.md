# 🎛️ 云策28计分系统 - 管理后台

基于 Vue 3 + Element Plus 的现代化管理后台系统。

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
- **UI组件**: Element Plus 2.x
- **图表库**: ECharts 5.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **样式预处理**: Less
- **工具库**: Day.js
- **类型检查**: TypeScript 5.x
- **图标**: Element Plus Icons

---

## 项目结构

```
frontend-admin/
├── src/
│   ├── views/                    # 页面组件
│   │   ├── Login.vue            # 登录页
│   │   ├── Dashboard.vue        # 数据看板
│   │   ├── Users.vue            # 用户管理
│   │   ├── BetRecordsNew.vue    # 投注记录
│   │   ├── LotteryHistory.vue   # 开奖历史
│   │   ├── BetTypeSettings.vue  # 投注设置
│   │   ├── MessageList.vue      # 公告管理
│   │   └── PointRecords.vue     # 积分记录
│   │
│   ├── components/               # 公共组件
│   │   ├── Layout/              # 布局组件
│   │   │   ├── Sidebar.vue     # 侧边栏
│   │   │   ├── Header.vue      # 顶栏
│   │   │   └── Main.vue        # 主内容区
│   │   └── Charts/              # 图表组件
│   │       └── LineChart.vue
│   │
│   ├── api/                      # API接口
│   │   ├── request.ts           # Axios配置
│   │   ├── auth.ts              # 认证接口
│   │   ├── user.ts              # 用户接口
│   │   ├── bet.ts               # 投注接口
│   │   ├── lottery.ts           # 开奖接口
│   │   ├── system.ts            # 系统接口
│   │   └── message.ts           # 消息接口
│   │
│   ├── router/                   # 路由配置
│   │   └── index.ts
│   │
│   ├── utils/                    # 工具函数
│   │   ├── format.ts            # 格式化工具
│   │   └── validate.ts          # 验证工具
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
VITE_APP_TITLE=云策28管理后台
```

创建 `.env.production`:

```env
VITE_API_BASE_URL=/api
VITE_APP_TITLE=云策28管理后台
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5174

**默认管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

### 4. 构建生产版本

```bash
npm run build
```

---

## 功能模块

### 1. 数据看板

**路径**: `/dashboard`

**功能**:
- ✅ 实时统计数据
  - 总用户数
  - 活跃用户数
  - 今日投注额
  - 今日盈亏
- ✅ 数据趋势图表
  - 投注趋势（ECharts折线图）
  - 用户增长趋势
- ✅ 快捷操作入口

**图表示例**:
```vue
<template>
  <div ref="chartRef" style="height: 400px"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

const initChart = () => {
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: amounts }]
  })
}
</script>
```

---

### 2. 用户管理

**路径**: `/users`

**功能**:
- ✅ 用户列表（分页、搜索、筛选）
- ✅ 用户状态管理
  - 启用/禁用账户
  - 查看详细信息
- ✅ 积分调整
  - 上分/下分
  - 备注说明
- ✅ 批量操作
- ✅ 导出数据

**积分调整**:
```vue
<template>
  <el-dialog v-model="dialogVisible" title="调整积分">
    <el-form :model="form">
      <el-form-item label="调整类型">
        <el-radio-group v-model="form.type">
          <el-radio label="deposit">上分</el-radio>
          <el-radio label="withdraw">下分</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="调整金额">
        <el-input-number v-model="form.amount" :min="1" />
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="onSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>
```

---

### 3. 投注记录

**路径**: `/bet-records`

**功能**:
- ✅ 投注列表
  - 分页加载
  - 多条件筛选（用户、期号、状态、类型）
  - 时间范围筛选
- ✅ 详细信息展示
  - 投注内容
  - 结算结果
  - 积分变化
- ✅ 统计数据
  - 总投注额
  - 总手续费
  - 总盈亏
- ✅ 除数功能（方便查看实际金额）
- ✅ 导出报表

**筛选器**:
```vue
<template>
  <el-form inline>
    <el-form-item label="用户ID">
      <el-input v-model="filters.userId" />
    </el-form-item>
    
    <el-form-item label="期号">
      <el-input v-model="filters.issue" />
    </el-form-item>
    
    <el-form-item label="状态">
      <el-select v-model="filters.status">
        <el-option label="全部" value="" />
        <el-option label="待结算" value="pending" />
        <el-option label="已赢" value="win" />
        <el-option label="已输" value="loss" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="时间范围">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>
```

---

### 4. 开奖历史

**路径**: `/lottery-history`

**功能**:
- ✅ 开奖记录列表
- ✅ 开奖详情
  - 期号、时间
  - 开奖号码
  - 和值、大小、单双
  - 是否回本
- ✅ 手动同步开奖
- ✅ 数据源状态监控
- ✅ 分页加载

**开奖详情**:
```vue
<template>
  <el-table :data="lotteryList">
    <el-table-column prop="issue" label="期号" />
    <el-table-column label="开奖号码">
      <template #default="{ row }">
        <el-tag>{{ row.number1 }}</el-tag>
        <el-tag>{{ row.number2 }}</el-tag>
        <el-tag>{{ row.number3 }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="resultSum" label="和值" />
    <el-table-column label="是否回本">
      <template #default="{ row }">
        <el-tag :type="row.isReturn ? 'success' : 'info'">
          {{ row.isReturn ? '回本' : '不回本' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="drawTime" label="开奖时间" />
  </el-table>
</template>
```

---

### 5. 投注设置

**路径**: `/bet-type-settings`

**功能**:
- ✅ 投注类型配置
  - 倍数投注
  - 大小单双
  - 组合投注
- ✅ 动态调整
  - 赔率设置
  - 费率设置
  - 最小/最大投注额
  - 启用/禁用
- ✅ 实时生效
- ✅ 配置历史

**配置表单**:
```vue
<template>
  <el-table :data="settings">
    <el-table-column prop="name" label="投注类型" />
    
    <el-table-column label="费率(%)">
      <template #default="{ row }">
        <el-input-number
          v-model="row.feeRate"
          :min="0"
          :max="1"
          :step="0.0001"
          :precision="4"
          @change="onUpdate(row)"
        />
      </template>
    </el-table-column>
    
    <el-table-column label="最小金额">
      <template #default="{ row }">
        <el-input-number
          v-model="row.minBet"
          :min="1"
          @change="onUpdate(row)"
        />
      </template>
    </el-table-column>
    
    <el-table-column label="最大金额">
      <template #default="{ row }">
        <el-input-number
          v-model="row.maxBet"
          :min="row.minBet"
          @change="onUpdate(row)"
        />
      </template>
    </el-table-column>
    
    <el-table-column label="状态">
      <template #default="{ row }">
        <el-switch
          v-model="row.isEnabled"
          @change="onUpdate(row)"
        />
      </template>
    </el-table-column>
  </el-table>
</template>
```

---

### 6. 公告管理

**路径**: `/messages`

**功能**:
- ✅ 公告列表
- ✅ 新增公告
- ✅ 编辑公告
- ✅ 删除公告
- ✅ 富文本编辑器
- ✅ 发布/下线

**编辑器**:
```vue
<template>
  <el-dialog v-model="dialogVisible" title="编辑公告">
    <el-form :model="form">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      
      <el-form-item label="内容">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="10"
        />
      </el-form-item>
      
      <el-form-item label="状态">
        <el-switch
          v-model="form.isActive"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
```

---

### 7. 积分记录

**路径**: `/point-records`

**功能**:
- ✅ 积分变动记录
- ✅ 多维度筛选
  - 用户
  - 类型（充值/提现/投注结算）
  - 时间范围
- ✅ 详细信息
  - 变动金额
  - 变动前后余额
  - 关联记录
  - 操作人
- ✅ 导出报表

---

## 开发指南

### 添加新页面

1. **创建页面组件**:
```vue
<!-- src/views/NewPage.vue -->
<template>
  <div class="new-page">
    <el-card>
      <template #header>
        <span>新页面</span>
      </template>
      <div>页面内容</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style scoped lang="less">
.new-page {
  padding: 20px;
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
    requiresAuth: true,
    title: '新页面',
    icon: 'Document'
  }
}
```

3. **添加菜单**:
```vue
<!-- src/components/Layout/Sidebar.vue -->
<el-menu-item index="/new-page">
  <el-icon><Document /></el-icon>
  <span>新页面</span>
</el-menu-item>
```

### 使用图表

```vue
<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, ref } from 'vue'

const chartRef = ref<HTMLElement>()

onMounted(() => {
  const chart = echarts.init(chartRef.value)
  
  chart.setOption({
    title: { text: '趋势图' },
    tooltip: {},
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [120, 200, 150, 80, 70],
      type: 'line'
    }]
  })
})
</script>

<template>
  <div ref="chartRef" style="height: 400px"></div>
</template>
```

### 表单验证

```vue
<script setup lang="ts">
const formRef = ref()
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '金额必须大于0', trigger: 'blur' }
  ]
}

const onSubmit = async () => {
  await formRef.value.validate()
  // 提交逻辑
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    
    <el-form-item label="金额" prop="amount">
      <el-input-number v-model="form.amount" />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="onSubmit">提交</el-button>
    </el-form-item>
  </el-form>
</template>
```

---

## 部署说明

### 方式一：Docker部署

```bash
# 构建镜像
docker build -t score-system-admin .

# 运行容器
docker run -d -p 5174:80 score-system-admin
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
    server_name admin.your-domain.com;
    root /var/www/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **部署文件**:
```bash
cp -r dist/* /var/www/admin/
```

---

## 性能优化

### 1. 组件按需引入

```typescript
// 已配置自动按需引入
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
```

### 2. 图表优化

```typescript
// 使用 ECharts 按需引入
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'

echarts.use([LineChart, GridComponent, TooltipComponent])
```

### 3. 虚拟滚动

```vue
<!-- 大数据量表格使用虚拟滚动 -->
<el-table-v2
  :columns="columns"
  :data="largeDataList"
  :width="800"
  :height="600"
/>
```

---

## 常见问题

### Q: Element Plus 样式不生效？

**A**: 确保引入了样式

```typescript
// main.ts
import 'element-plus/dist/index.css'
```

### Q: 图表不显示？

**A**: 确保容器有高度

```vue
<div ref="chartRef" style="height: 400px"></div>
```

### Q: 表格导出乱码？

**A**: 设置正确的编码

```typescript
import { utils, writeFile } from 'xlsx'

const exportToExcel = () => {
  const ws = utils.json_to_sheet(data)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Sheet1')
  writeFile(wb, 'export.xlsx', { bookType: 'xlsx' })
}
```

---

## 浏览器兼容性

- Chrome >= 90
- Edge >= 90
- Firefox >= 88
- Safari >= 14

---

**维护者**: AI Assistant  
**最后更新**: 2025-11-30
