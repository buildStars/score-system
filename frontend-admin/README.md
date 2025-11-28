# 💻 前端管理后台

## 项目说明

这是计分系统的PC端管理后台界面。

## 快速开始

### 1. 创建项目

```bash
# 在当前目录(frontend-admin/)创建Vue项目
pnpm create vite . --template vue-ts
```

### 2. 安装依赖

```bash
# 安装基础依赖
pnpm install

# 安装Element Plus
pnpm add element-plus

# 安装图标库
pnpm add @element-plus/icons-vue

# 安装ECharts
pnpm add echarts vue-echarts

# 安装路由和状态管理
pnpm add vue-router pinia pinia-plugin-persistedstate

# 安装HTTP客户端
pnpm add axios

# 安装工具库
pnpm add dayjs

# 安装开发依赖
pnpm add -D unplugin-vue-components unplugin-auto-import sass
```

### 3. 配置项目

参考：[../docs/前端管理后台开发指南.md](../docs/前端管理后台开发指南.md)

### 4. 启动开发服务器

```bash
pnpm dev
```

访问：http://localhost:5174

## 技术栈

- Vue 3 + TypeScript
- Element Plus 2.x
- ECharts 5
- Vite 5.x
- Pinia + Vue Router
- Axios

## 目录结构

```
frontend-admin/
├── public/
├── src/
│   ├── api/              # API接口
│   ├── assets/           # 资源文件
│   ├── components/       # 公共组件
│   ├── layout/           # 布局组件
│   ├── router/           # 路由配置
│   ├── stores/           # 状态管理
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue
│   └── main.ts
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 页面列表

- `/login` - 登录页
- `/dashboard` - 首页（统计）
- `/users` - 用户管理
- `/lottery-history` - 开奖历史
- `/bet-records` - 下单记录
- `/point-records` - 积分记录
- `/bet-settings` - 模式设置
- `/system-settings` - 网站设置

## 打包部署

```bash
# 打包
pnpm build

# 预览
pnpm preview
```

## 更多文档

- [前端管理后台开发指南](../docs/前端管理后台开发指南.md)
- [API接口文档](../docs/API接口文档.md)
- [业务规则详解](../docs/业务规则详解.md)

---

**创建日期**：2024年11月26日



