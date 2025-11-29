# 🐳 Docker 常用命令速查表

快速参考 Docker 和 Docker Compose 常用命令。

---

## 📦 服务管理

### 启动和停止

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 启动所有服务（前台运行，查看日志）
docker-compose up

# 停止所有服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（⚠️ 会删除数据）
docker-compose down -v

# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
```

### 构建

```bash
# 构建所有镜像
docker-compose build

# 构建单个服务
docker-compose build backend

# 强制重新构建（不使用缓存）
docker-compose build --no-cache

# 构建并启动
docker-compose up -d --build
```

---

## 📊 查看状态

```bash
# 查看服务状态
docker-compose ps

# 查看所有容器（包括停止的）
docker-compose ps -a

# 查看服务资源使用情况
docker stats

# 查看服务详细信息
docker-compose config
```

---

## 📝 日志管理

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend-admin
docker-compose logs frontend-h5
docker-compose logs mysql
docker-compose logs redis

# 查看最近 100 行日志
docker-compose logs --tail=100 backend

# 查看特定时间的日志
docker-compose logs --since 2024-01-01
docker-compose logs --since 1h  # 最近1小时
```

---

## 🔧 容器操作

```bash
# 进入容器终端
docker-compose exec backend sh
docker-compose exec mysql bash
docker-compose exec redis sh

# 在容器中执行命令
docker-compose exec backend node -v
docker-compose exec mysql mysql -u root -p

# 查看容器进程
docker-compose top

# 查看容器资源使用
docker-compose stats
```

---

## 💾 数据库操作

### MySQL

```bash
# 连接到 MySQL
docker-compose exec mysql mysql -u root -p

# 导出数据库
docker-compose exec mysql mysqldump -u root -p score_system > backup.sql

# 导入数据库
docker-compose exec -T mysql mysql -u root -p score_system < backup.sql

# 查看数据库列表
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# 查看表列表
docker-compose exec mysql mysql -u root -p score_system -e "SHOW TABLES;"
```

### Prisma 迁移

```bash
# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 查看迁移状态
docker-compose exec backend npx prisma migrate status

# 生成 Prisma 客户端
docker-compose exec backend npx prisma generate

# 运行数据库种子
docker-compose exec backend npx prisma db seed
```

### Redis

```bash
# 连接到 Redis
docker-compose exec redis redis-cli -a redis123456

# 查看所有键
docker-compose exec redis redis-cli -a redis123456 KEYS '*'

# 清空所有数据
docker-compose exec redis redis-cli -a redis123456 FLUSHALL

# 查看 Redis 信息
docker-compose exec redis redis-cli -a redis123456 INFO
```

---

## 🧹 清理操作

```bash
# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除容器和数据卷
docker-compose down -v

# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes

# 查看磁盘使用
docker system df
```

---

## 🔍 调试命令

```bash
# 检查服务健康状态
docker-compose ps

# 查看服务配置
docker-compose config

# 验证配置文件
docker-compose config --quiet

# 查看容器详细信息
docker inspect score-backend

# 查看网络信息
docker network ls
docker network inspect score-network

# 查看数据卷信息
docker volume ls
docker volume inspect score-system_mysql_data
```

---

## 📦 镜像管理

```bash
# 查看所有镜像
docker images

# 删除镜像
docker rmi score-system-backend

# 删除所有悬空镜像
docker image prune

# 删除所有未使用的镜像
docker image prune -a

# 导出镜像
docker save score-system-backend > backend.tar

# 导入镜像
docker load < backend.tar
```

---

## 🌐 网络管理

```bash
# 查看所有网络
docker network ls

# 查看网络详情
docker network inspect score-network

# 创建网络
docker network create my-network

# 删除网络
docker network rm my-network

# 清理未使用的网络
docker network prune
```

---

## 💿 数据卷管理

```bash
# 查看所有数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect score-system_mysql_data

# 删除数据卷
docker volume rm score-system_mysql_data

# 清理未使用的数据卷
docker volume prune

# 备份数据卷
docker run --rm -v score-system_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

---

## 🚀 快速操作

### 完全重启

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 重置所有数据

```bash
# ⚠️ 警告：会删除所有数据
docker-compose down -v
docker-compose up -d
```

### 仅重启应用（保留数据库）

```bash
docker-compose restart backend frontend-admin frontend-h5
```

### 查看实时日志（多个服务）

```bash
docker-compose logs -f backend mysql redis
```

---

## 🔐 安全操作

```bash
# 查看容器的环境变量
docker-compose exec backend env

# 限制容器资源
docker-compose up -d --scale backend=2

# 查看容器资源限制
docker inspect score-backend | grep -i memory
```

---

## 📚 帮助命令

```bash
# Docker 帮助
docker --help
docker COMMAND --help

# Docker Compose 帮助
docker-compose --help
docker-compose COMMAND --help

# 查看版本
docker --version
docker-compose --version
```

---

## 💡 使用技巧

### 1. 使用别名简化命令

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
alias dcp='docker-compose ps'
```

### 2. 使用 Makefile

项目已包含 `Makefile`，可以使用：

```bash
make up      # 启动服务
make down    # 停止服务
make logs    # 查看日志
make ps      # 查看状态
```

### 3. 使用快捷脚本

```bash
./start.sh   # 启动
./stop.sh    # 停止
./logs.sh    # 查看日志
```

---

## 🆘 常见问题

### 1. 端口被占用

```bash
# 查看端口占用（Linux/Mac）
lsof -i :8080

# 查看端口占用（Windows）
netstat -ano | findstr :8080

# 修改端口：编辑 .env 文件
```

### 2. 容器启动失败

```bash
# 查看详细日志
docker-compose logs -f [服务名]

# 重新构建
docker-compose build --no-cache [服务名]
```

### 3. 数据库连接失败

```bash
# 检查 MySQL 是否就绪
docker-compose exec mysql mysqladmin ping -h localhost

# 重启 MySQL
docker-compose restart mysql

# 等待启动后重启后端
sleep 10 && docker-compose restart backend
```

---

**提示**：将此文件保存为书签，方便随时查阅！📖





