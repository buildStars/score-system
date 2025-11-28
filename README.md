# 🎯 二八预测计分系统

## 📋 项目简介

这是一个基于现有开奖数据源的**计分系统**，包含用户下注、积分管理、实时开奖等功能。系统采用前后端分离架构，提供移动端H5用户界面和PC端管理后台。

---

## 🏗️ 项目结构

```
score-system/
├── README.md                    # 主说明文档（当前文件）
├── docs/                        # 📚 完整文档
│   ├── 项目总览.md
│   ├── 数据库设计.md
│   ├── API接口文档.md
│   ├── 业务规则详解.md
│   ├── 前端H5开发指南.md
│   ├── 前端管理后台开发指南.md
│   └── 后端开发指南.md
│
├── frontend-h5/                 # 📱 H5用户端
│   ├── README.md               # H5项目说明
│   ├── package.json
│   └── src/
│
├── frontend-admin/              # 💻 PC管理后台
│   ├── README.md               # 管理后台项目说明
│   ├── package.json
│   └── src/
│
└── backend/                     # ⚙️ 后端API
    ├── README.md               # 后端项目说明
    ├── package.json
    ├── prisma/
    └── src/
```

---

## 🚀 快速开始

### 1. 克隆项目（或创建新目录）

```bash
mkdir score-system
cd score-system
```

### 2. 阅读文档

在开始开发前，请先阅读 `docs/` 目录下的文档：

1. **必读文档**（按顺序）：
   - [项目总览.md](./docs/项目总览.md) - 了解整体架构和功能
   - [业务规则详解.md](./docs/业务规则详解.md) - 理解核心业务逻辑
   - [数据库设计.md](./docs/数据库设计.md) - 了解数据结构
   - [API接口文档.md](./docs/API接口文档.md) - 了解接口定义

2. **开发文档**（按需阅读）：
   - [前端H5开发指南.md](./docs/前端H5开发指南.md) - H5端开发
   - [前端管理后台开发指南.md](./docs/前端管理后台开发指南.md) - 管理后台开发
   - [后端开发指南.md](./docs/后端开发指南.md) - 后端开发

### 3. 初始化各个子项目

#### 3.1 初始化前端H5
```bash
cd frontend-h5
pnpm install
pnpm dev
```

详见：[frontend-h5/README.md](./frontend-h5/README.md)

#### 3.2 初始化管理后台
```bash
cd frontend-admin
pnpm install
pnpm dev
```

详见：[frontend-admin/README.md](./frontend-admin/README.md)

#### 3.3 初始化后端
```bash
cd backend
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm start:dev
```

详见：[backend/README.md](./backend/README.md)

---

## 🛠️ 技术栈

### 前端H5用户端
- Vue 3 + TypeScript
- Vant UI 4.x
- Vite 5.x
- Pinia + Vue Router

### 前端管理后台
- Vue 3 + TypeScript
- Element Plus 2.x
- ECharts 5
- Vite 5.x
- Pinia + Vue Router

### 后端API
- NestJS 10.x
- TypeScript 5.x
- Prisma ORM
- MySQL 8.0
- Redis 7.x
- BullMQ

---

## 🎯 核心功能

### 📱 H5用户端
- ✅ 用户登录/注册
- ✅ 下注首页（倍数下注 + 组合下注）
- ✅ 开奖历史查询
- ✅ 积分记录查询
- ✅ 个人信息管理

### 💻 PC管理后台
- ✅ 管理员登录
- ✅ 首页统计（盈亏分析）
- ✅ 用户管理（新增/编辑/禁用/积分调整）
- ✅ 开奖历史管理
- ✅ 下单记录查询（实时刷新）
- ✅ 积分记录查询
- ✅ 模式设置（手续费/下注范围）
- ✅ 网站设置（游戏开关/数据清理）

### ⚙️ 后端API
- ✅ 用户认证（JWT）
- ✅ 下注管理
- ✅ 开奖数据同步
- ✅ 积分管理
- ✅ 统计报表
- ✅ 系统配置

---

## 📊 业务规则简介

### 回本判定（倍数下注核心规则）
满足以下任一条件即为"回本"：
1. **对子**：三个号码中有两个相同
2. **豹子**：三个号码完全相同
3. **顺子**：三个号码连续（包括089、019特殊顺子）
4. **总和13或14**：开奖总和等于13或14

### 倍数下注
- 回本：返还下注 - 手续费
- 不回本：损失80%下注 + 手续费

### 组合下注
- 中奖：返还下注 - 手续费
- 不中奖：损失全部下注

详细规则请查看：[docs/业务规则详解.md](./docs/业务规则详解.md)

---

## 🗄️ 数据库

### 核心数据表（8张）
1. `users` - 用户表
2. `admins` - 管理员表
3. `lottery_results` - 开奖结果表
4. `bets` - 下注记录表
5. `point_records` - 积分记录表
6. `bet_settings` - 下注设置表
7. `system_settings` - 系统设置表
8. `admin_logs` - 管理员操作日志表

详细设计请查看：[docs/数据库设计.md](./docs/数据库设计.md)

---

## 📡 API接口

### 用户端接口
- `POST /api/user/login` - 用户登录
- `GET /api/user/info` - 获取用户信息
- `POST /api/user/bet` - 提交下注
- `GET /api/user/bet-history` - 下注历史
- `GET /api/user/point-records` - 积分记录

### 管理端接口
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/users` - 用户列表
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/:id/points` - 调整积分
- `GET /api/admin/bets` - 下单记录
- `GET /api/admin/statistics` - 统计数据

完整接口文档：[docs/API接口文档.md](./docs/API接口文档.md)

---

## 🔧 开发环境配置

### 环境要求
- Node.js 18+
- pnpm 8+
- MySQL 8.0+
- Redis 7+

### 安装pnpm
```bash
npm install -g pnpm
```

### 配置数据库
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE score_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'scoreuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON score_system.* TO 'scoreuser'@'localhost';
FLUSH PRIVILEGES;
```

### 配置Redis
```bash
# 启动Redis
redis-server

# 测试连接
redis-cli ping
```

---

## 📝 开发规范

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 代码规范
- 使用 ESLint + Prettier
- TypeScript 严格模式
- 组件命名 PascalCase
- 函数命名 camelCase
- 常量命名 UPPER_SNAKE_CASE

---

## 🚢 部署

### 🐳 Docker 部署（推荐）

**一键启动所有服务！**

#### Windows 用户
```bash
# 双击运行
start.bat
```

#### macOS / Linux 用户
```bash
# 赋予执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

#### 使用 Docker Compose
```bash
# 复制环境配置
cp env.example .env

# 启动所有服务（后端 + 管理后台 + H5前端 + MySQL + Redis）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**访问地址：**
- H5 用户端: http://localhost:8081
- 管理后台: http://localhost:8080
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api-docs

**详细文档：**
- 📖 [Docker 部署完整指南](./DOCKER_DEPLOY.md)
- 🚀 [快速开始指南](./QUICK_START.md)

### 传统部署方式

#### 前端部署
```bash
# 打包
cd frontend-h5 && pnpm build
cd frontend-admin && pnpm build

# 上传到服务器（Nginx）
```

#### 后端部署
```bash
# 打包
cd backend && pnpm build

# 使用PM2管理
pm2 start dist/main.js --name score-api
```

---

## 📖 详细文档导航

### 快速开始
| 文档 | 说明 | 路径 |
|------|------|------|
| 🚀 快速开始指南 | 3分钟快速启动项目 | [QUICK_START.md](./QUICK_START.md) |
| 🐳 Docker部署指南 | 完整的Docker部署文档 | [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md) |

### 业务文档
| 文档 | 说明 | 路径 |
|------|------|------|
| 项目总览 | 整体架构、功能规划、技术栈 | [docs/项目总览.md](./docs/项目总览.md) |
| 数据库设计 | 表结构、索引、关系、SQL | [docs/数据库设计.md](./docs/数据库设计.md) |
| API接口文档 | 接口定义、请求响应、示例 | [docs/API接口文档.md](./docs/API接口文档.md) |
| 业务规则详解 | 业务逻辑、计算公式、例子 | [docs/业务规则详解.md](./docs/业务规则详解.md) |

### 开发文档
| 文档 | 说明 | 路径 |
|------|------|------|
| 前端H5开发指南 | H5项目配置、组件、页面 | [docs/前端H5开发指南.md](./docs/前端H5开发指南.md) |
| 前端管理后台开发指南 | 管理后台配置、组件、页面 | [docs/前端管理后台开发指南.md](./docs/前端管理后台开发指南.md) |
| 后端开发指南 | NestJS配置、模块、服务 | [docs/后端开发指南.md](./docs/后端开发指南.md) |

---

## 🎓 学习路径

### 第1天：了解项目
1. 阅读 [项目总览.md](./docs/项目总览.md)
2. 阅读 [业务规则详解.md](./docs/业务规则详解.md)
3. 熟悉业务流程

### 第2天：数据库设计
1. 阅读 [数据库设计.md](./docs/数据库设计.md)
2. 创建数据库
3. 运行数据库迁移

### 第3天：API接口
1. 阅读 [API接口文档.md](./docs/API接口文档.md)
2. 启动后端项目
3. 测试API接口

### 第4-5天：前端开发
1. 阅读前端开发指南
2. 启动前端项目
3. 开发页面和功能

---

## 🆘 常见问题

### Q1: 如何启动项目？
A: 按照上面的"快速开始"章节，依次启动后端、前端H5、管理后台。

### Q2: 数据库连接失败？
A: 检查 `backend/.env` 中的 `DATABASE_URL` 配置是否正确。

### Q3: 前端跨域问题？
A: 在 `vite.config.ts` 中配置了代理，开发环境不会有跨域问题。

### Q4: 如何修改手续费比例？
A: 在管理后台的"模式设置"中修改，或直接修改数据库 `bet_settings` 表。

---

## 📞 技术支持

- 查看文档：[docs/](./docs/)
- 查看代码注释
- 查看API文档：启动后端后访问 http://localhost:3000/api-docs

---

## 📄 许可证

MIT License

---

## 🎉 开始开发

现在你已经了解了项目的基本信息，让我们开始开发吧！

**推荐步骤**：
1. ✅ 阅读所有文档（docs/ 目录）
2. ✅ 配置开发环境（Node.js、MySQL、Redis）
3. ✅ 创建数据库
4. ✅ 启动后端项目
5. ✅ 启动前端项目
6. ✅ 开始开发功能

---

**项目版本**：v1.0  
**创建日期**：2024年11月26日  
**最后更新**：2024年11月26日

祝你开发愉快！🚀

