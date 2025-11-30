# 🎲 云策28计分系统

一个基于 NestJS + Vue3 + MySQL 的全栈加拿大28彩票计分系统，支持多种投注玩法、实时开奖同步、智能数据源切换等功能。

---

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🛠️ 技术栈](#️-技术栈)
- [📁 项目结构](#-项目结构)
- [🚀 快速开始](#-快速开始)
- [📦 部署指南](#-部署指南)
- [🔧 开发指南](#-开发指南)
- [📖 API文档](#-api文档)
- [❓ 常见问题](#-常见问题)

---

## ✨ 功能特性

### 🎯 核心功能

#### 用户端 (H5)
- ✅ **用户登录注册**：支持用户名/密码登录，JWT鉴权
- ✅ **多种玩法投注**：
  - 倍数投注（赔率1.95）
  - 大小单双（赔率1.8）
  - 组合投注：大单/大双/小单/小双（赔率-5倍）
- ✅ **实时倒计时**：精确到秒的开奖倒计时
- ✅ **智能封盘**：开奖前30秒自动封盘
- ✅ **下注历史**：查看个人投注记录和结算结果
- ✅ **积分记录**：详细的积分变动历史
- ✅ **公告通知**：查看系统公告和重要通知

#### 管理端
- ✅ **用户管理**：用户列表、状态管理、积分调整
- ✅ **投注管理**：查看所有投注记录、统计数据
- ✅ **开奖管理**：查看开奖历史、手动触发同步
- ✅ **系统设置**：投注规则配置、费率调整
- ✅ **公告管理**：发布/编辑/删除系统公告
- ✅ **数据统计**：实时统计用户数、投注额、盈亏等

#### 后端服务
- ✅ **多数据源支持**：JND28、USA28双数据源，自动故障转移
- ✅ **智能同步机制**：
  - 开奖后60秒密集检测（每5秒）
  - 平时常规检测（每60秒）
  - 数据新鲜度检测，自动切换数据源
- ✅ **自动结算**：开奖后自动结算所有投注
- ✅ **交易记录**：完整的积分变动审计日志
- ✅ **权限控制**：基于角色的访问控制（RBAC）

### 🎨 特色功能

- **动态配置**：投注规则、费率、赔率等可通过管理端动态调整
- **小数精度**：使用 Prisma.Decimal 确保金额计算精度
- **循环重试**：数据源失败时自动循环重试多轮
- **容错机制**：前端轮询错误处理，避免连续失败
- **响应式设计**：H5端完美适配移动设备

---

## 🛠️ 技术栈

### 后端
- **框架**: NestJS 10.x (Node.js 20+)
- **数据库**: MySQL 8.0
- **ORM**: Prisma 5.x
- **缓存**: Redis 7.x
- **定时任务**: @nestjs/schedule
- **认证**: JWT (Passport)
- **文档**: Swagger/OpenAPI

### 前端 (H5)
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5.x
- **UI组件**: Vant 4.x
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **样式**: Less + CSS3

### 管理端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5.x
- **UI组件**: Element Plus
- **图表**: ECharts 5.x
- **HTTP客户端**: Axios

### DevOps
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **进程管理**: PM2
- **CI/CD**: 一键部署脚本

---

## 📁 项目结构

```
score-system/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # 认证模块
│   │   │   ├── user/          # 用户模块
│   │   │   ├── bet/           # 投注模块
│   │   │   ├── lottery/       # 开奖模块
│   │   │   ├── system/        # 系统配置
│   │   │   └── message/       # 消息公告
│   │   ├── common/            # 公共模块
│   │   ├── prisma/            # Prisma配置
│   │   └── main.ts            # 入口文件
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库模型
│   │   └── seed.ts            # 初始数据
│   ├── Dockerfile
│   └── package.json
│
├── frontend-h5/                # H5用户端
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   ├── components/        # 公共组件
│   │   ├── api/               # API接口
│   │   ├── stores/            # 状态管理
│   │   ├── router/            # 路由配置
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend-admin/             # 管理后台
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   ├── components/        # 公共组件
│   │   ├── api/               # API接口
│   │   ├── router/            # 路由配置
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Docker编排配置
├── .env.example               # 环境变量示例
├── deploy-backend.sh          # 后端部署脚本
├── deploy-h5.sh               # H5部署脚本
├── deploy-admin.sh            # 管理端部署脚本
├── deploy-all.sh              # 一键全部署
└── README.md
```

---

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (本地开发)
- MySQL 8.0+ (本地开发)

### 方式一：Docker 一键部署（推荐）

#### 1. 克隆项目

```bash
git clone <repository-url>
cd score-system
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库密码、JWT密钥等
```

#### 3. 一键启动

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 初始化数据库

```bash
# 进入后端容器
docker exec -it score-system-backend sh

# 运行数据库迁移
npx prisma migrate deploy

# 初始化种子数据
npx prisma db seed

# 退出容器
exit
```

#### 5. 访问系统

- **H5用户端**: http://localhost:5173
- **管理后台**: http://localhost:5174
- **API文档**: http://localhost:3000/api-docs

**默认管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

---

### 方式二：本地开发

#### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# H5前端
cd ../frontend-h5
npm install

# 管理端
cd ../frontend-admin
npm install
```

#### 2. 配置数据库

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE score_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 配置 backend/.env
DATABASE_URL="mysql://root:password@localhost:3306/score_system"
```

#### 3. 运行数据库迁移

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

#### 4. 启动服务

```bash
# 后端（终端1）
cd backend
npm run start:dev

# H5前端（终端2）
cd frontend-h5
npm run dev

# 管理端（终端3）
cd frontend-admin
npm run dev
```

---

## 📦 部署指南

### 生产环境部署

#### 1. 服务器准备

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 上传项目

```bash
# 压缩项目
tar -czf score-system.tar.gz score-system/

# 上传到服务器
scp score-system.tar.gz user@server:/root/

# 解压
ssh user@server
cd /root
tar -xzf score-system.tar.gz
```

#### 3. 配置环境变量

```bash
cd /root/score-system
cp .env.example .env
vim .env
```

**重要配置**:
```env
# 数据库
MYSQL_ROOT_PASSWORD=你的强密码
MYSQL_PASSWORD=你的强密码

# JWT
JWT_SECRET=你的随机密钥（至少32位）

# 端口（可选）
BACKEND_PORT=3000
H5_PORT=5173
ADMIN_PORT=5174
```

#### 4. 一键部署

```bash
# 赋予执行权限
chmod +x deploy-*.sh

# 部署所有服务
./deploy-all.sh

# 或分别部署
./deploy-backend.sh   # 只部署后端
./deploy-h5.sh        # 只部署H5
./deploy-admin.sh     # 只部署管理端
```

#### 5. 初始化数据库

```bash
# 进入数据库容器
docker exec -it score-system-mysql mysql -u root -p

# 使用数据库
USE score_system;

# 修复 Decimal 字段精度（重要！）
ALTER TABLE bets MODIFY COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE bets MODIFY COLUMN result_amount DECIMAL(10,2) NULL DEFAULT NULL;

exit;
```

#### 6. 配置防火墙

```bash
# 允许HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许应用端口
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 5174/tcp

sudo ufw enable
```

#### 7. 配置Nginx反向代理（可选）

```nginx
# /etc/nginx/sites-available/score-system
server {
    listen 80;
    server_name your-domain.com;

    # H5前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 管理后台
    location /admin {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 开发指南

### 后端开发

#### 添加新模块

```bash
cd backend
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

#### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name your_migration_name

# 应用迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset
```

#### 运行测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 前端开发

#### 添加新页面

```typescript
// frontend-h5/src/router/index.ts
{
  path: '/your-page',
  name: 'YourPage',
  component: () => import('@/views/YourPage.vue'),
  meta: { requiresAuth: true }
}
```

#### 调用API

```typescript
// frontend-h5/src/api/your-api.ts
import request from './request'

export const yourApi = {
  getData: () => request.get('/api/your-endpoint'),
  postData: (data) => request.post('/api/your-endpoint', data),
}
```

### 常用命令

```bash
# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend-h5
docker-compose logs -f frontend-admin

# 重启服务
docker-compose restart backend
docker-compose restart frontend-h5

# 进入容器
docker exec -it score-system-backend sh
docker exec -it score-system-mysql mysql -u root -p

# 清理数据
docker-compose down -v  # ⚠️ 会删除所有数据
```

---

## 📖 API文档

### Swagger文档

启动后端服务后，访问：
```
http://localhost:3000/api-docs
```

### 主要API端点

#### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/admin/login` - 管理员登录
- `POST /api/auth/register` - 用户注册

#### 用户
- `GET /api/user/profile` - 获取个人信息
- `PUT /api/user/profile` - 更新个人信息
- `GET /api/user/bet-history` - 投注历史
- `GET /api/user/point-records` - 积分记录

#### 投注
- `POST /api/user/bet` - 创建投注
- `DELETE /api/user/cancel-bet` - 取消投注
- `GET /api/user/current-issue-bets` - 当前期投注

#### 开奖
- `GET /api/lottery/current-issue` - 当前期信息
- `GET /api/lottery/results` - 开奖历史
- `GET /api/lottery/countdown` - 倒计时

#### 管理端
- `GET /api/admin/users` - 用户列表
- `POST /api/admin/users/:id/adjust-points` - 调整积分
- `GET /api/admin/bets` - 投注记录
- `GET /api/admin/statistics` - 统计数据

---

## ❓ 常见问题

### Q: Docker 容器启动失败？

**A**: 检查端口占用和日志

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :5174

# 查看容器日志
docker-compose logs backend
```

### Q: 数据库连接失败？

**A**: 检查配置和容器状态

```bash
# 查看容器状态
docker-compose ps

# 测试数据库连接
docker exec -it score-system-mysql mysql -u root -p

# 检查环境变量
docker exec score-system-backend env | grep DATABASE
```

### Q: 前端API请求失败？

**A**: 检查后端服务和API地址

```bash
# 检查后端是否运行
curl http://localhost:3000/api-docs

# 检查前端环境变量
cat frontend-h5/.env.production
```

### Q: 手续费/结算金额显示不正确？

**A**: 执行数据库字段修复

```sql
USE score_system;

-- 修复 fee 字段
ALTER TABLE bets MODIFY COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 修复 result_amount 字段
ALTER TABLE bets MODIFY COLUMN result_amount DECIMAL(10,2) NULL DEFAULT NULL;
```

### Q: 数据源切换不生效？

**A**: 检查数据源配置

```bash
# 查看数据源日志
docker logs -f score-system-backend | grep "数据源"

# 手动触发同步
curl -X POST http://localhost:3000/api/admin/lottery/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Q: 如何清空测试数据？

**A**: 使用管理端的清空功能或手动清理

```bash
# 进入数据库
docker exec -it score-system-mysql mysql -u root -p

USE score_system;

-- 清空投注记录
TRUNCATE TABLE bets;

-- 清空开奖记录
TRUNCATE TABLE lottery_results;

-- 清空积分记录
TRUNCATE TABLE point_records;

-- 重置用户积分
UPDATE users SET points = 10000 WHERE role = 'user';
```

---

## 📄 许可证

本项目仅供学习交流使用。

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题，请通过以下方式联系：

- Issue: [GitHub Issues](https://github.com/your-repo/issues)
- Email: your-email@example.com

---

**最后更新**: 2025-11-30
