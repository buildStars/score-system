# 📱 前端H5用户端

## ✅ 项目状态：100%完成 🎉

这是计分系统的H5移动端用户界面，**所有5个核心模块已100%开发完成**并可正常使用。

**完成时间**：2024年11月26日  
**项目版本**：v1.0  
**完成度**：100%

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

### 3. 打包生产版本

```bash
npm run build
```

---

## 🎯 已实现功能

### ✅ 核心功能
1. **用户登录** - JWT认证、状态持久化
2. **首页下注** - 倍数下注、组合下注、实时倒计时
3. **开奖历史** - 列表展示、搜索、分页加载
4. **积分记录** - 变动记录、类型筛选、分页加载
5. **个人中心** - 用户信息、修改密码、退出登录

### 📄 页面列表
- `/login` - 登录页 ✅
- `/` - 首页（下注页）✅
- `/history` - 开奖历史 ✅
- `/point-records` - 积分记录 ✅
- `/profile` - 个人中心 ✅

---

## 🛠️ 技术栈

### 核心技术
- **框架**：Vue 3.4+ (Composition API + `<script setup>`)
- **UI库**：Vant UI 4.x
- **构建**：Vite 5.x
- **语言**：TypeScript 5.x
- **路由**：Vue Router 4.x
- **状态**：Pinia (持久化)
- **HTTP**：Axios
- **样式**：Sass/SCSS

### 特性
- ✅ TypeScript类型系统
- ✅ Axios请求/响应拦截器
- ✅ 路由守卫（登录拦截）
- ✅ Pinia状态持久化
- ✅ Vant组件按需引入
- ✅ 移动端适配
- ✅ ESLint + Prettier

---

## 📂 项目结构

```
frontend-h5/
├── public/                     # 静态资源
├── src/
│   ├── api/                   # ✅ API接口封装
│   │   ├── index.ts
│   │   ├── request.ts        # Axios配置
│   │   ├── user.ts           # 用户API
│   │   └── lottery.ts        # 开奖API
│   ├── assets/               # ✅ 资源文件
│   │   └── styles/           # 全局样式
│   ├── router/               # ✅ 路由配置
│   │   └── index.ts          # 路由守卫
│   ├── stores/               # ✅ 状态管理
│   │   ├── user.ts           # 用户Store
│   │   └── lottery.ts        # 开奖Store
│   ├── types/                # ✅ TypeScript类型
│   │   ├── api.ts
│   │   ├── user.ts
│   │   └── bet.ts
│   ├── utils/                # ✅ 工具函数
│   │   ├── format.ts         # 格式化
│   │   └── validate.ts       # 验证
│   ├── views/                # ✅ 页面组件
│   │   ├── Login.vue         # 登录页
│   │   ├── Home.vue          # 首页
│   │   ├── History.vue       # 历史
│   │   ├── PointRecords.vue  # 积分
│   │   └── Profile.vue       # 我的
│   ├── App.vue
│   ├── main.ts
│   └── vite-env.d.ts
├── .eslintrc.cjs             # ESLint配置
├── .prettierrc.json          # Prettier配置
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── PROJECT.md                # 项目详细说明
└── README.md                 # 本文件
```

---

## 📡 API配置

### 开发环境
```
代理地址：http://localhost:8081
```

配置文件：`vite.config.ts`

### 接口列表
- `POST /userApi/login` - 用户登录
- `GET /userApi/info` - 获取用户信息
- `POST /userApi/bet` - 提交下注
- `GET /userApi/bet-history` - 下注历史
- `GET /userApi/point-records` - 积分记录
- `GET /userApi/current` - 当前期信息
- `GET /userApi/history` - 开奖历史
- `POST /userApi/change-password` - 修改密码

---

## 🎨 界面展示

### 核心功能
1. **登录页面**
   - 简洁美观的渐变背景
   - 表单验证
   - 加载状态

2. **首页下注**
   - 顶部信息栏（积分、期号）
   - 实时倒计时
   - 上期开奖结果
   - 倍数/组合下注切换
   - 手续费自动计算
   - 二次确认

3. **历史记录**
   - 开奖号码展示
   - 大小单双标签
   - 回本标记
   - 期号搜索

4. **积分记录**
   - 类型筛选
   - 余额变动
   - 加减分标记

5. **个人中心**
   - 用户信息
   - 积分统计
   - 功能菜单
   - 修改密码
   - 退出登录

---

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run build

# 预览构建结果
npm run preview
```

---

## 📝 使用说明

### 测试账号
请联系管理员获取测试账号

### 开发调试
1. 确保后端服务已启动（端口8081）
2. 启动前端：`npm run dev`
3. 浏览器打开：http://localhost:5173
4. 使用手机模式查看效果

### 部署流程
1. 修改生产环境API地址
2. 执行构建：`npm run build`
3. 上传`dist`目录到服务器
4. 配置Nginx

---

## 📖 相关文档

- [详细项目说明](./PROJECT.md)
- [API接口文档](../docs/API接口文档.md)
- [前端H5开发指南](../docs/前端H5开发指南.md)
- [业务规则详解](../docs/业务规则详解.md)

---

## ✨ 项目亮点

1. **完整的TypeScript支持**
   - 全面的类型定义
   - 类型安全的API调用
   - 智能代码提示

2. **优秀的用户体验**
   - 流畅的页面切换
   - 实时的数据更新
   - 友好的错误提示
   - 美观的UI设计

3. **规范的代码结构**
   - 清晰的目录划分
   - 统一的命名规范
   - 模块化的设计
   - 易于维护和扩展

4. **完善的功能实现**
   - 登录认证
   - 权限控制
   - 状态管理
   - 数据持久化
   - 错误处理

---

## 🎉 项目完成情况

- [x] 项目初始化和配置
- [x] API接口封装
- [x] 路由配置
- [x] 状态管理
- [x] 登录页面
- [x] 首页下注功能
- [x] 开奖历史页面
- [x] 积分记录页面
- [x] 个人中心页面
- [x] 底部导航栏
- [x] 代码规范配置

---

**项目版本**：v1.0  
**开发日期**：2024年11月26日  
**项目状态**：✅ 已完成  
**开发者**：AI Assistant

祝使用愉快！🚀

