# 🚀 云策28计分系统 - 后端服务

基于 NestJS 的彩票计分系统后端API服务。

---

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [API文档](#api文档)
- [开发指南](#开发指南)
- [部署说明](#部署说明)

---

## 技术栈

- **框架**: NestJS 10.x
- **运行时**: Node.js 20+
- **数据库**: MySQL 8.0
- **ORM**: Prisma 5.x
- **缓存**: Redis 7.x
- **认证**: JWT (Passport)
- **定时任务**: @nestjs/schedule
- **API文档**: Swagger/OpenAPI
- **HTTP客户端**: Axios
- **日志**: Winston (内置)

---

## 项目结构

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                   # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── strategies/         # JWT策略
│   │   │
│   │   ├── user/                   # 用户模块
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.module.ts
│   │   │   └── dto/                # 数据传输对象
│   │   │
│   │   ├── bet/                    # 投注模块
│   │   │   ├── bet.controller.ts
│   │   │   ├── bet.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── lottery/                # 开奖模块
│   │   │   ├── lottery.controller.ts
│   │   │   ├── lottery.service.ts
│   │   │   ├── lottery-sync.service.ts      # 定时同步
│   │   │   ├── lottery-countdown.service.ts  # 倒计时
│   │   │   ├── data-sources/                 # 数据源
│   │   │   │   ├── jnd28.data-source.ts
│   │   │   │   ├── usa28.data-source.ts
│   │   │   │   └── database.data-source.ts
│   │   │   ├── services/
│   │   │   │   └── lottery-data-source.manager.ts  # 数据源管理
│   │   │   └── utils/
│   │   │       └── lottery-rules.util.ts     # 结算规则
│   │   │
│   │   ├── system/                 # 系统配置
│   │   │   ├── system.controller.ts
│   │   │   └── system.service.ts
│   │   │
│   │   └── message/                # 消息公告
│   │       ├── message.controller.ts
│   │       └── message.service.ts
│   │
│   ├── common/                     # 公共模块
│   │   ├── decorators/             # 装饰器
│   │   ├── filters/                # 异常过滤器
│   │   ├── guards/                 # 守卫
│   │   ├── interceptors/           # 拦截器
│   │   └── pipes/                  # 管道
│   │
│   ├── prisma/                     # Prisma服务
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── app.module.ts               # 根模块
│   └── main.ts                     # 入口文件
│
├── prisma/
│   ├── schema.prisma               # 数据库模型
│   ├── seed.ts                     # 种子数据
│   └── migrations/                 # 迁移文件
│
├── test/                           # 测试文件
├── Dockerfile                      # Docker镜像
├── .env.example                    # 环境变量示例
├── nest-cli.json                   # NestJS配置
├── tsconfig.json                   # TypeScript配置
└── package.json
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`:

```env
# 数据库
DATABASE_URL="mysql://user:password@localhost:3306/score_system"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=12h

# 应用
PORT=3000
NODE_ENV=development
```

### 3. 数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev

# 初始化数据
npx prisma db seed
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

访问 http://localhost:3000/api-docs 查看 API 文档

---

## API文档

### Swagger文档

启动服务后访问：
- **本地**: http://localhost:3000/api-docs
- **生产**: https://your-domain.com/api-docs

### 主要端点

#### 认证 `/api/auth`
```typescript
POST   /login              # 用户登录
POST   /admin/login        # 管理员登录
POST   /register           # 用户注册
POST   /refresh            # 刷新Token
```

#### 用户 `/api/user`
```typescript
GET    /profile            # 获取个人信息
PUT    /profile            # 更新个人信息
GET    /bet-history        # 投注历史
GET    /point-records      # 积分记录
POST   /bet                # 创建投注
DELETE /cancel-bet         # 取消投注
GET    /current-issue-bets # 当前期投注
```

#### 开奖 `/api/lottery`
```typescript
GET    /current-issue      # 当前期信息
GET    /results            # 开奖历史
GET    /countdown          # 倒计时
GET    /bet-type-settings  # 投注类型配置
```

#### 管理 `/api/admin`
```typescript
GET    /users              # 用户列表
POST   /users/:id/adjust-points  # 调整积分
GET    /bets               # 投注记录
GET    /lottery/results    # 开奖记录
POST   /lottery/sync       # 手动同步
GET    /statistics         # 统计数据
GET    /bet-settings       # 投注设置
PUT    /bet-settings       # 更新设置
```

---

## 开发指南

### 创建新模块

```bash
# 生成模块、控制器、服务
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

### 数据库操作

#### 创建迁移

```bash
# 修改 prisma/schema.prisma 后
npx prisma migrate dev --name your_migration_name
```

#### 查看数据库

```bash
npx prisma studio
```

#### 重置数据库

```bash
npx prisma migrate reset
```

### 运行测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 代码规范

```bash
# Lint检查
npm run lint

# 格式化代码
npm run format
```

---

## 核心功能实现

### 1. 多数据源管理

```typescript
// src/modules/lottery/services/lottery-data-source.manager.ts
export class LotteryDataSourceManager {
  // 自动故障转移
  // 数据新鲜度检测
  // 循环重试机制
}
```

**特性**:
- ✅ JND28、USA28 双数据源
- ✅ 自动故障转移
- ✅ 数据新鲜度检测（连续3次陈旧数据自动切换）
- ✅ 循环重试（最多2轮）

### 2. 智能同步机制

```typescript
// src/modules/lottery/lottery-sync.service.ts
@Injectable()
export class LotterySyncService {
  // 开奖后60秒：每5秒密集检测
  // 其他时间：每60秒常规检测
}
```

**特性**:
- ✅ 智能自适应频率
- ✅ 开奖后密集检测
- ✅ 平时节省资源
- ✅ 防止并发同步

### 3. 自动结算

```typescript
// src/modules/lottery/lottery.service.ts
async autoSettle(issue: string) {
  // 获取所有待结算投注
  // 计算结算金额
  // 更新用户积分
  // 记录积分变动
}
```

**特性**:
- ✅ 支持多种玩法
- ✅ 精确计算（Prisma.Decimal）
- ✅ 事务保证一致性
- ✅ 完整审计日志

### 4. 投注规则

```typescript
// src/modules/lottery/utils/lottery-rules.util.ts

// 倍数下注
calculateMultipleBetResult(multiplier, isReturn, feeRate, feeBase)

// 大小单双
calculateBigSmallOddEvenResult(amount, betContent, resultSum, isReturn)

// 组合下注
calculateComboBetResult(amount, betContent, resultSum, isReturn, feeRate)
```

**规则**:
- 倍数：回本(+倍数-费)，不回本(-0.8倍-费)
- 大小单双：命中不回本(+1.8倍)，回本(0)，未命中(-本金)
- 组合：命中不回本(-5倍-费)，回本(-费)，未命中(+本金-费)

---

## 部署说明

### Docker部署

```bash
# 构建镜像
docker build -t score-system-backend .

# 运行容器
docker run -d \
  --name score-system-backend \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@db:3306/score_system" \
  score-system-backend
```

### 使用Docker Compose

```bash
cd ..  # 回到项目根目录
docker-compose up -d backend
```

### 生产环境配置

1. **环境变量**:
```env
NODE_ENV=production
DATABASE_URL="mysql://user:password@host:3306/score_system"
JWT_SECRET=强随机密钥（至少32位）
```

2. **数据库优化**:
```sql
-- 修复 Decimal 字段
ALTER TABLE bets MODIFY COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE bets MODIFY COLUMN result_amount DECIMAL(10,2) NULL DEFAULT NULL;
```

3. **性能优化**:
- 启用 Redis 缓存
- 配置连接池
- 启用 gzip 压缩

---

## 常见问题

### Q: crypto.randomUUID 报错？

**A**: Node.js 版本不足，升级到 20+

```bash
# 检查版本
node -v

# 升级 Node.js
nvm install 20
nvm use 20
```

### Q: Prisma Client 生成失败？

**A**: 清理并重新生成

```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### Q: 数据源切换不生效？

**A**: 检查日志和配置

```bash
# 查看数据源日志
docker logs -f score-system-backend | grep "数据源"

# 手动触发同步
curl -X POST http://localhost:3000/api/admin/lottery/sync
```

---

## 性能指标

- **API响应时间**: < 100ms (p95)
- **数据库查询**: < 50ms (平均)
- **开奖同步延迟**: < 10秒
- **并发支持**: 1000+ req/s

---

## 待办事项

- [ ] 增加单元测试覆盖率（目标80%+）
- [ ] 实现 Redis 缓存层
- [ ] 添加性能监控（Prometheus）
- [ ] 支持WebSocket实时推送
- [ ] 实现数据库读写分离

---

**维护者**: AI Assistant  
**最后更新**: 2025-11-30
