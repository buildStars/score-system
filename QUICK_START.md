# 🚀 快速开始指南

最快速的方式启动计分系统！

---

## ⚡ 三步启动

### Windows 用户

1. **双击运行启动脚本**
   ```
   双击 start.bat 文件
   ```

2. **等待服务启动**（约 5-10 分钟）
   - 首次启动会自动下载镜像
   - 自动构建应用
   - 自动初始化数据库

3. **开始使用**
   - H5 用户端: http://localhost:8081
   - 管理后台: http://localhost:8080
   - 后端 API: http://localhost:3000

### macOS / Linux 用户

1. **运行启动脚本**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

2. **等待服务启动**（约 5-10 分钟）

3. **开始使用**
   - H5 用户端: http://localhost:8081
   - 管理后台: http://localhost:8080
   - 后端 API: http://localhost:3000

---

## 🔑 默认账号

### 管理员
- 用户名: `admin`
- 密码: `admin123`

### 测试用户
- 用户名: `user1`
- 密码: `123456`

---

## 📦 前置要求

### 必需安装
- ✅ Docker Desktop (20.10+)
- ✅ Docker Compose (2.0+)

### 下载安装
- Windows/Mac: https://www.docker.com/products/docker-desktop/
- Linux: 
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

---

## 🛠️ 常用命令

### 使用 Makefile（推荐）

```bash
# 查看所有命令
make help

# 启动服务
make up

# 停止服务
make down

# 查看日志
make logs

# 查看状态
make ps

# 重启服务
make restart
```

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

---

## 🔧 配置修改

### 修改端口

编辑 `.env` 文件：

```bash
# 管理后台端口（默认 8080）
ADMIN_PORT=9080

# H5 前端端口（默认 8081）
H5_PORT=9081

# 后端 API 端口（默认 3000）
BACKEND_PORT=4000
```

修改后重启：
```bash
docker-compose down
docker-compose up -d
```

### 修改密码

编辑 `.env` 文件：

```bash
# MySQL 密码
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_PASSWORD=your_db_password

# Redis 密码
REDIS_PASSWORD=your_redis_password

# JWT 密钥（至少32位）
JWT_SECRET=your-super-long-secret-key-here
```

---

## ❓ 常见问题

### 1. 端口被占用怎么办？

修改 `.env` 文件中的端口配置，然后重启服务。

### 2. 服务启动失败？

```bash
# 查看日志
docker-compose logs -f

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 3. 如何重置数据？

```bash
# ⚠️ 警告：会删除所有数据
docker-compose down -v
docker-compose up -d
```

### 4. 如何备份数据？

```bash
# 使用 Makefile
make db-backup

# 或手动备份
docker-compose exec mysql mysqldump -u root -p score_system > backup.sql
```

---

## 📚 详细文档

需要更多信息？查看完整文档：

- 📖 [Docker 部署指南](./DOCKER_DEPLOY.md) - 完整的部署文档
- 📋 [项目总览](./README.md) - 项目介绍和功能说明
- 🔌 [API 文档](./docs/API接口文档.md) - 接口说明
- 💾 [数据库设计](./docs/数据库设计.md) - 数据库结构

---

## 🆘 获取帮助

遇到问题？

1. 查看日志: `docker-compose logs -f`
2. 检查状态: `docker-compose ps`
3. 重启服务: `docker-compose restart`
4. 查阅文档: [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)

---

**祝你使用愉快！🎉**










