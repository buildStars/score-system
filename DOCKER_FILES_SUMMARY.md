# 📦 Docker 部署文件清单

本文档列出了为 score-system 项目创建的所有 Docker 相关文件及其说明。

---

## 📁 文件清单

### 🎯 核心配置文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `docker-compose.yml` | 根目录 | 生产环境 Docker Compose 配置，包含所有服务 |
| `docker-compose.dev.yml` | 根目录 | 开发环境配置，仅包含 MySQL 和 Redis |
| `env.example` | 根目录 | 环境变量配置模板 |
| `.gitignore` | 根目录 | Git 忽略文件配置 |
| `.dockerignore` | 根目录 | Docker 构建忽略文件配置 |

### 🐳 Dockerfile

| 文件 | 位置 | 说明 |
|------|------|------|
| `backend/Dockerfile` | backend/ | 后端 API 镜像构建配置 |
| `backend/.dockerignore` | backend/ | 后端构建忽略文件 |
| `frontend-admin/Dockerfile` | frontend-admin/ | 管理后台镜像构建配置 |
| `frontend-admin/.dockerignore` | frontend-admin/ | 管理后台构建忽略文件 |
| `frontend-admin/nginx.conf` | frontend-admin/ | 管理后台 Nginx 配置 |
| `frontend-h5/Dockerfile` | frontend-h5/ | H5 前端镜像构建配置 |
| `frontend-h5/.dockerignore` | frontend-h5/ | H5 前端构建忽略文件 |
| `frontend-h5/nginx.conf` | frontend-h5/ | H5 前端 Nginx 配置 |

### 🚀 启动脚本

| 文件 | 位置 | 说明 |
|------|------|------|
| `start.sh` | 根目录 | Linux/Mac 启动脚本 |
| `start.bat` | 根目录 | Windows 启动脚本 |
| `stop.sh` | 根目录 | Linux/Mac 停止脚本 |
| `stop.bat` | 根目录 | Windows 停止脚本 |
| `logs.sh` | 根目录 | Linux/Mac 日志查看脚本 |
| `logs.bat` | 根目录 | Windows 日志查看脚本 |
| `Makefile` | 根目录 | Make 命令配置（Linux/Mac） |

### 📚 文档

| 文件 | 位置 | 说明 |
|------|------|------|
| `DOCKER_DEPLOY.md` | 根目录 | 完整的 Docker 部署指南 |
| `QUICK_START.md` | 根目录 | 快速开始指南 |
| `docker-commands.md` | 根目录 | Docker 命令速查表 |
| `DOCKER_FILES_SUMMARY.md` | 根目录 | 本文档（文件清单） |

### 🔧 辅助文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `docker/mysql/init/01-init.sql` | docker/mysql/init/ | MySQL 初始化脚本 |
| `docker/README.md` | docker/ | Docker 配置说明 |

---

## 🏗️ 架构说明

### 服务组成

```
score-system/
├── MySQL 8.0          # 数据库
├── Redis 7            # 缓存和队列
├── Backend API        # NestJS 后端服务
├── Frontend Admin     # Vue 3 管理后台
└── Frontend H5        # Vue 3 移动端
```

### 网络架构

```
┌─────────────────────────────────────────────────────┐
│              Docker Network (bridge)                 │
│                                                      │
│  Frontend Admin (:8080) ──┐                        │
│  Frontend H5    (:8081) ──┼── Backend API (:3000)  │
│                            │        │               │
│                            │        ├── MySQL       │
│                            │        └── Redis       │
└─────────────────────────────────────────────────────┘
```

### 数据持久化

- `mysql_data`: MySQL 数据存储
- `redis_data`: Redis 数据存储
- `backend_logs`: 后端日志存储

---

## 🚀 快速使用

### 1. 一键启动（推荐）

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 2. 使用 Docker Compose

```bash
# 复制环境配置
cp env.example .env

# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 3. 使用 Makefile (Linux/Mac)

```bash
# 查看所有命令
make help

# 启动服务
make up

# 查看日志
make logs

# 停止服务
make down
```

---

## 📊 端口映射

| 服务 | 容器内端口 | 主机端口 | 说明 |
|------|-----------|---------|------|
| MySQL | 3306 | 3306 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| Backend | 3000 | 3000 | 后端 API |
| Frontend Admin | 80 | 8080 | 管理后台 |
| Frontend H5 | 80 | 8081 | H5 前端 |

> 💡 端口可以通过修改 `.env` 文件自定义

---

## 🔧 环境变量

### 必需配置

```bash
# MySQL
MYSQL_ROOT_PASSWORD=root123456
MYSQL_DATABASE=score_system
MYSQL_USER=scoreuser
MYSQL_PASSWORD=scorepass123

# Redis
REDIS_PASSWORD=redis123456

# 后端
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# 端口
ADMIN_PORT=8080
H5_PORT=8081
BACKEND_PORT=3000
```

### 可选配置

所有配置项都有默认值，可以根据需要修改。详见 `env.example` 文件。

---

## 🛠️ 常用操作

### 启动和停止

```bash
# 启动
docker-compose up -d        # 或 ./start.sh 或 make up

# 停止
docker-compose stop         # 或 ./stop.sh 或 make stop

# 重启
docker-compose restart      # 或 make restart

# 停止并删除
docker-compose down         # 或 make down
```

### 查看状态和日志

```bash
# 查看状态
docker-compose ps           # 或 make ps

# 查看日志
docker-compose logs -f      # 或 ./logs.sh 或 make logs

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mysql
```

### 数据库操作

```bash
# 连接 MySQL
docker-compose exec mysql mysql -u root -p

# 备份数据库
make db-backup
# 或
docker-compose exec mysql mysqldump -u root -p score_system > backup.sql

# 运行迁移
make db-migrate
# 或
docker-compose exec backend npx prisma migrate deploy
```

---

## 📖 文档导航

| 需求 | 推荐文档 |
|------|---------|
| 快速开始 | [QUICK_START.md](./QUICK_START.md) |
| 完整部署指南 | [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md) |
| Docker 命令 | [docker-commands.md](./docker-commands.md) |
| 项目说明 | [README.md](./README.md) |
| API 文档 | [docs/API接口文档.md](./docs/API接口文档.md) |

---

## ✅ 特性

### 🎯 开箱即用
- ✅ 一键启动所有服务
- ✅ 自动初始化数据库
- ✅ 自动运行数据库迁移
- ✅ 预配置的开发和生产环境

### 🔒 安全性
- ✅ 环境变量管理密码
- ✅ Docker 网络隔离
- ✅ 支持自定义配置

### 📦 可维护性
- ✅ 多阶段构建优化镜像大小
- ✅ 健康检查确保服务可用
- ✅ 日志轮转和管理
- ✅ 数据持久化

### 🚀 开发体验
- ✅ 热重载支持（开发模式）
- ✅ 便捷的命令行工具
- ✅ 详细的文档和注释
- ✅ 跨平台支持（Windows/Mac/Linux）

---

## 🔍 故障排查

### 常见问题

1. **端口被占用**
   - 修改 `.env` 文件中的端口配置

2. **容器启动失败**
   - 查看日志：`docker-compose logs -f`
   - 重新构建：`docker-compose build --no-cache`

3. **数据库连接失败**
   - 等待 MySQL 完全启动
   - 检查日志：`docker-compose logs mysql`

详细故障排查请参考：[DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md#故障排查)

---

## 📝 开发说明

### 开发模式

如果需要在本地开发，使用开发配置：

```bash
# 仅启动 MySQL 和 Redis
docker-compose -f docker-compose.dev.yml up -d
# 或
make dev-up

# 然后在本地运行应用
cd backend && npm run start:dev
cd frontend-admin && npm run dev
cd frontend-h5 && npm run dev
```

### 修改代码后重新构建

```bash
# 重新构建特定服务
docker-compose build backend
docker-compose up -d backend

# 或使用 Makefile
make rebuild
```

---

## 🎓 学习资源

### Docker 基础
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

### 项目相关
- [NestJS 文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [Vue 3 文档](https://vuejs.org/)

---

## 📄 许可证

MIT License

---

## 🎉 总结

通过这套 Docker 配置，你可以：

1. ✅ **快速部署**：一键启动所有服务
2. ✅ **环境一致**：开发、测试、生产环境完全一致
3. ✅ **易于维护**：清晰的文件结构和详细的文档
4. ✅ **跨平台**：支持 Windows、macOS、Linux
5. ✅ **生产就绪**：包含健康检查、日志管理、数据备份等

---

**祝你部署顺利！如有问题，请参考相关文档。** 🚀









