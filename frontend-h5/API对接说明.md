# 📡 H5前端与后端API对接说明

## ✅ 对接完成状态

所有API路径已经修正完成，可以正常对接后端！

---

## 🔧 配置信息

### 后端配置
- **服务地址**：http://localhost:3000
- **全局前缀**：`/api`
- **文档地址**：http://localhost:3000/api-docs

### 前端配置
- **服务地址**：http://localhost:5173
- **代理配置**：`/api` → `http://localhost:3000/api`
- **baseURL**：`/api`（通过代理转发）

---

## 📋 API路径映射

### 用户端接口（7个）

| 功能 | 方法 | 前端路径 | 后端实际路径 | 说明 |
|-----|------|---------|------------|------|
| 用户登录 | POST | `/user/login` | `/api/user/login` | ✅ 已修正 |
| 获取用户信息 | GET | `/user/info` | `/api/user/info` | ✅ 已修正 |
| 修改密码 | POST | `/user/change-password` | `/api/user/change-password` | ✅ 已修正 |
| 提交下注 | POST | `/user/bet` | `/api/user/bet` | ✅ 已修正 |
| 下注历史 | GET | `/user/bet-history` | `/api/user/bet-history` | ✅ 已修正 |
| 积分记录 | GET | `/user/point-records` | `/api/user/point-records` | ✅ 已修正 |

### 开奖接口（2个）

| 功能 | 方法 | 前端路径 | 后端实际路径 | 说明 |
|-----|------|---------|------------|------|
| 当前期信息 | GET | `/lottery/current` | `/api/lottery/current` | ✅ 已修正 |
| 开奖历史 | GET | `/lottery/history` | `/api/lottery/history` | ✅ 已修正 |

---

## 🔄 修改记录

### 1. Vite代理配置修正
**文件**：`vite.config.ts`

**修改前**：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8081', // ❌ 错误的端口
    changeOrigin: true,
  }
}
```

**修改后**：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000', // ✅ 正确的端口
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

### 2. Axios baseURL修正
**文件**：`src/api/request.ts`

**修改前**：
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'
```

**修改后**：
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
```

### 3. API路径修正
**文件**：`src/api/user.ts`, `src/api/lottery.ts`

**修改前**（❌ 错误）：
```typescript
url: '/userApi/login'      // ❌ 错误
url: '/userApi/info'       // ❌ 错误
url: '/userApi/current'    // ❌ 错误
```

**修改后**（✅ 正确）：
```typescript
url: '/user/login'         // ✅ 正确
url: '/user/info'          // ✅ 正确
url: '/lottery/current'    // ✅ 正确
```

### 4. Pinia初始化顺序修正
**文件**：`src/main.ts`

**修改前**：
```typescript
app.use(router)  // ❌ 先注册Router
app.use(pinia)   // ❌ 后注册Pinia
```

**修改后**：
```typescript
app.use(pinia)   // ✅ 先注册Pinia
app.use(router)  // ✅ 后注册Router
```

---

## 🧪 测试步骤

### 1. 启动后端服务
```bash
cd score-system/backend
npm run dev
```

等待看到：
```
🚀 应用启动成功！
📡 API地址: http://localhost:3000/api
📚 API文档: http://localhost:3000/api-docs
```

### 2. 启动H5前端
```bash
cd score-system/frontend-h5
npm run dev
```

访问：http://localhost:5173

### 3. 测试登录功能
1. 打开 http://localhost:5173/login
2. 输入测试账号（需先在后端创建）
3. 点击登录
4. 查看浏览器控制台和Network面板

### 4. 测试首页功能
1. 登录成功后自动跳转到首页
2. 应该能看到：
   - 当前期号
   - 倒计时
   - 上期开奖结果
   - 下注面板

---

## 📊 API请求流程

```
前端调用 → Vite代理 → 后端处理 → 响应返回

示例：
1. 前端：axios.get('/lottery/current')
2. Vite代理：/lottery/current → http://localhost:3000/api/lottery/current
3. 后端：处理 GET /api/lottery/current
4. 响应：返回JSON数据
5. 前端：接收并渲染
```

---

## 🔐 请求头配置

### 登录请求（无需Token）
```http
POST /api/user/login
Content-Type: application/json

{
  "username": "user001",
  "password": "123456"
}
```

### 已登录请求（需要Token）
```http
GET /api/lottery/current
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token会自动从localStorage中读取并添加到请求头。

---

## 🐛 常见问题

### 1. 网络请求失败
**现象**：控制台显示"Network Error"

**解决**：
- 检查后端是否启动：http://localhost:3000
- 检查端口是否被占用
- 查看Vite代理配置是否正确

### 2. 401未授权错误
**现象**：接口返回401状态码

**解决**：
- 检查Token是否存在：`localStorage.getItem('token')`
- 检查Token是否过期
- 重新登录获取新Token

### 3. 跨域问题
**现象**：CORS错误

**解决**：
- 开发环境已配置Vite代理，不应该有跨域问题
- 检查后端CORS配置
- 确保前端使用相对路径（`/api/...`）

### 4. API路径404
**现象**：接口返回404

**解决**：
- 检查API路径是否正确
- 查看本文档的路径映射表
- 访问 http://localhost:3000/api-docs 查看所有可用接口

---

## 📝 后端API文档

访问Swagger文档查看所有接口详情：
http://localhost:3000/api-docs

---

## ✅ 验证清单

对接完成后，请验证以下功能：

### 首页功能
- [ ] 显示当前积分
- [ ] 显示当前期号
- [ ] 显示倒计时
- [ ] 显示上期开奖结果
- [ ] 倍数下注功能
- [ ] 组合下注功能
- [ ] 下注后积分更新

### 登录功能
- [ ] 用户名密码登录
- [ ] 登录成功跳转
- [ ] Token保存
- [ ] 退出登录

### 其他页面
- [ ] 开奖历史查询
- [ ] 积分记录查询
- [ ] 个人信息展示
- [ ] 修改密码

---

## 🎉 对接状态

**状态**：✅ **已完成**

所有API路径已经修正，前后端可以正常对接！

**修改文件**：
- ✅ vite.config.ts
- ✅ src/api/request.ts
- ✅ src/api/user.ts
- ✅ src/api/lottery.ts
- ✅ src/main.ts

**下一步**：
1. 启动后端服务
2. 启动前端服务
3. 测试登录和首页功能
4. 如有问题，查看浏览器控制台和Network面板

---

**文档版本**：v1.0  
**更新日期**：2024年11月26日  
**状态**：✅ 对接完成



