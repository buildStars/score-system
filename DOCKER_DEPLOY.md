# 🐳 Docker 部署指南

本文档介绍如何使用 Docker 快速部署计分系统的三端应用（后端 API + 管理后台 + H5 用户端）。

---

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [服务架构](#服务架构)
- [常用命令](#常用命令)
- [开发环境](#开发环境)
- [故障排查](#故障排查)
- [数据备份与恢复](#数据备份与恢复)
- [生产环境建议](#生产环境建议)

---

## 🔧 系统要求

### 必需软件
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### 硬件要求
- **CPU**: 2核心及以上
- **内存**: 4GB 及以上
- **磁盘**: 10GB 可用空间

### 安装 Docker

#### Windows / macOS
下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### Linux (Ubuntu)
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

---

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

#### Windows 用户
1. 双击运行 `start.bat`
2. 按照提示操作即可

#### macOS / Linux 用户
```bash
# 赋予执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法二：手动启动

```bash
# 1. 复制环境变量配置文件
cp env.example .env

# 2. 编辑 .env 文件（可选，建议修改密码）
nano .env  # 或使用其他编辑器

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

### 首次启动说明

首次启动时，Docker 会自动：
1. ✅ 拉取所需镜像（MySQL、Redis、Nginx 等）
2. ✅ 构建应用镜像（后端、管理后台、H5 前端）
3. ✅ 创建数据库并运行迁移
4. ✅ 初始化数据（创建默认管理员账号）
5. ✅ 启动所有服务

整个过程大约需要 **5-10 分钟**（取决于网络速度）。

---

## 🌐 访问地址

服务启动成功后，可以通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| **H5 用户端** | http://localhost:8081 | 移动端用户界面 |
| **管理后台** | http://localhost:8080 | PC 端管理界面 |
| **后端 API** | http://localhost:3000 | RESTful API 服务 |
| **API 文档** | http://localhost:3000/api-docs | Swagger API 文档 |
| **MySQL** | localhost:3306 | 数据库（外部访问） |
| **Redis** | localhost:6379 | 缓存（外部访问） |

### 默认账号

#### 管理员账号
- **用户名**: `admin`
- **密码**: `admin123`

#### 测试用户账号
- **用户名**: `user1`
- **密码**: `123456`

> ⚠️ **安全提示**: 生产环境请务必修改默认密码！

---

## ⚙️ 配置说明

### 环境变量配置（.env）

```bash
# MySQL 数据库配置
MYSQL_ROOT_PASSWORD=root123456      # MySQL root 密码
MYSQL_DATABASE=score_system         # 数据库名称
MYSQL_USER=scoreuser                # 数据库用户
MYSQL_PASSWORD=scorepass123         # 数据库用户密码
MYSQL_PORT=3306                     # MySQL 端口

# Redis 配置
REDIS_PASSWORD=redis123456          # Redis 密码
REDIS_PORT=6379                     # Redis 端口

# 后端服务配置
BACKEND_PORT=3000                   # 后端 API 端口
JWT_SECRET=your-jwt-secret-key      # JWT 密钥（至少32位）

# 前端服务端口配置
ADMIN_PORT=8080                     # 管理后台端口
H5_PORT=8081                        # H5 用户端端口
```

### 端口映射

如果默认端口被占用，可以修改 `.env` 文件中的端口配置：

```bash
# 示例：修改为其他端口
ADMIN_PORT=9080
H5_PORT=9081
BACKEND_PORT=4000
MYSQL_PORT=3307
REDIS_PORT=6380
```

修改后需重启服务：
```bash
docker-compose down
docker-compose up -d
```

---

## 🏗️ 服务架构

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                    │
│                   (score-network)                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Frontend   │  │   Frontend   │  │  Backend  │ │
│  │    Admin     │  │      H5      │  │    API    │ │
│  │  (Nginx:80)  │  │  (Nginx:80)  │  │   :3000   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │        │
│         └─────────────────┴────────┬────────┘        │
│                                    │                 │
│         ┌──────────────┐  ┌────────┴────────┐       │
│         │    MySQL     │  │      Redis      │       │
│         │    :3306     │  │      :6379      │       │
│         └──────────────┘  └─────────────────┘       │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓              ↓              ↓
    :8080 (Admin)  :8081 (H5)    :3000 (API)
```

### 服务说明

1. **mysql**: MySQL 8.0 数据库
   - 存储所有业务数据
   - 数据持久化到 Docker Volume

2. **redis**: Redis 7 缓存
   - 存储会话信息
   - 任务队列（开奖数据同步）

3. **backend**: NestJS 后端服务
   - 提供 RESTful API
   - 处理业务逻辑
   - 自动运行数据库迁移

4. **frontend-admin**: Vue 3 管理后台
   - Element Plus UI
   - 使用 Nginx 提供静态文件服务

5. **frontend-h5**: Vue 3 移动端
   - Vant UI
   - 使用 Nginx 提供静态文件服务

---

## 🛠️ 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose stop

# 重启所有服务
docker-compose restart

# 停止并删除所有容器（保留数据）
docker-compose down

# 停止并删除所有容器和数据卷（⚠️ 会删除数据）
docker-compose down -v

# 查看服务状态
docker-compose ps

# 查看资源使用情况
docker stats
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs backend
docker-compose logs frontend-admin
docker-compose logs frontend-h5
docker-compose logs mysql
docker-compose logs redis

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 服务操作

```bash
# 重启单个服务
docker-compose restart backend

# 重新构建并启动服务
docker-compose up -d --build

# 仅重新构建特定服务
docker-compose build backend
docker-compose up -d backend

# 进入容器终端
docker-compose exec backend sh
docker-compose exec mysql bash
docker-compose exec redis sh
```

### 数据库操作

```bash
# 连接到 MySQL
docker-compose exec mysql mysql -u root -p

# 导出数据库
docker-compose exec mysql mysqldump -u root -p score_system > backup.sql

# 导入数据库
docker-compose exec -T mysql mysql -u root -p score_system < backup.sql

# 运行数据库迁移（手动）
docker-compose exec backend npx prisma migrate deploy

# 查看数据库迁移状态
docker-compose exec backend npx prisma migrate status
```

### 清理命令

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes
```

---

## 💻 开发环境

如果你需要在本地开发，可以只启动基础服务（MySQL + Redis），然后在本地运行各个应用。

### 使用开发配置

```bash
# 启动 MySQL 和 Redis
docker-compose -f docker-compose.dev.yml up -d

# 本地运行后端
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# 本地运行管理后台（新终端）
cd frontend-admin
npm install
npm run dev

# 本地运行 H5 前端（新终端）
cd frontend-h5
npm install
npm run dev
```

### 连接配置

本地开发时，修改后端的 `.env` 文件：

```bash
# backend/.env
DATABASE_URL="mysql://scoreuser:scorepass123@localhost:3306/score_system"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123456
```

---

## 🔍 故障排查

### 1. 端口被占用

**错误信息**: 
```
Error: bind: address already in use
```

**解决方法**:
- 修改 `.env` 文件中的端口配置
- 或者停止占用端口的程序

```bash
# Windows 查看端口占用
netstat -ano | findstr :8080

# Linux/Mac 查看端口占用
lsof -i :8080

# 杀死占用端口的进程
# Windows: taskkill /PID <PID> /F
# Linux/Mac: kill -9 <PID>
```

### 2. 容器启动失败

**解决方法**:
```bash
# 查看详细日志
docker-compose logs -f [服务名]

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 3. 数据库连接失败

**解决方法**:
```bash
# 检查 MySQL 容器状态
docker-compose ps mysql

# 检查 MySQL 日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql

# 等待 MySQL 完全启动后重启后端
docker-compose restart backend
```

### 4. 前端无法连接后端

**问题**: 前端页面打开，但无法获取数据

**解决方法**:
1. 检查后端是否正常运行：`docker-compose logs backend`
2. 确认后端健康状态：`curl http://localhost:3000/api/health`
3. 检查网络配置：`docker network inspect score-network`

### 5. 权限问题（Linux）

**错误信息**: 
```
Permission denied
```

**解决方法**:
```bash
# 方法1: 使用 sudo
sudo docker-compose up -d

# 方法2: 将用户添加到 docker 组
sudo usermod -aG docker $USER
# 注销后重新登录
```

### 6. 内存不足

**错误信息**: 
```
Cannot allocate memory
```

**解决方法**:
- 增加 Docker 内存限制（Docker Desktop 设置）
- 或减少运行的服务数量

---

## 💾 数据备份与恢复

### 备份数据

```bash
# 1. 备份 MySQL 数据库
docker-compose exec mysql mysqldump -u root -p score_system > backup_$(date +%Y%m%d).sql

# 2. 备份 Redis 数据
docker-compose exec redis redis-cli -a redis123456 SAVE
docker cp score-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb

# 3. 备份 Docker 数据卷
docker run --rm -v score-system_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_volume_backup_$(date +%Y%m%d).tar.gz /data
```

### 恢复数据

```bash
# 1. 恢复 MySQL 数据库
docker-compose exec -T mysql mysql -u root -p score_system < backup_20241126.sql

# 2. 恢复 Redis 数据
docker cp redis_backup_20241126.rdb score-redis:/data/dump.rdb
docker-compose restart redis

# 3. 恢复 Docker 数据卷
docker run --rm -v score-system_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_volume_backup_20241126.tar.gz -C /
```

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u root -proot123456 score_system > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

设置定时任务（Linux/Mac）:
```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点自动备份
0 2 * * * /path/to/backup.sh
```

---

## 🔒 生产环境建议

### 1. 安全配置

```bash
# 修改所有默认密码
MYSQL_ROOT_PASSWORD=<强密码>
MYSQL_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
JWT_SECRET=<至少32位随机字符串>

# 生成随机密码示例
openssl rand -base64 32
```

### 2. 使用 HTTPS

生产环境建议使用 Nginx 反向代理并配置 SSL 证书：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 限制外部访问

修改 `docker-compose.yml`，移除不需要外部访问的端口映射：

```yaml
# 不要暴露 MySQL 和 Redis 到外部
mysql:
  # ports:
  #   - "3306:3306"  # 注释掉

redis:
  # ports:
  #   - "6379:6379"  # 注释掉
```

### 4. 资源限制

添加资源限制防止服务占用过多资源：

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 5. 日志管理

配置日志轮转：

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### 6. 健康检查

确保所有服务都配置了健康检查（已在 docker-compose.yml 中配置）。

### 7. 监控

推荐使用监控工具：
- **Prometheus + Grafana**: 性能监控
- **ELK Stack**: 日志分析
- **Portainer**: Docker 容器管理

---

## 📚 相关文档

- [项目主文档](./README.md)
- [API 接口文档](./docs/API接口文档.md)
- [数据库设计](./docs/数据库设计.md)
- [业务规则详解](./docs/业务规则详解.md)

---

## 🆘 获取帮助

遇到问题？尝试以下步骤：

1. 查看本文档的 [故障排查](#故障排查) 部分
2. 查看服务日志: `docker-compose logs -f`
3. 检查服务状态: `docker-compose ps`
4. 重新启动服务: `docker-compose restart`
5. 完全重建: `docker-compose down && docker-compose up -d --build`

---

## 📄 许可证

MIT License

---

**祝你部署顺利！🎉**

如有任何问题，请查阅相关文档或联系技术支持。



