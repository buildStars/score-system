# 🐳 Docker配置避免冲突说明

## 完全独立的资源配置

本项目的Docker配置使用完全独立的命名空间，**不会和任何其他Docker项目冲突**！

---

## 🎯 独立性保证

### 1. 独立的容器名称 ✅

所有容器都使用 `score-system-` 前缀：

| 服务 | 容器名称 | 你的其他项目 |
|------|----------|--------------|
| MySQL | `score-system-mysql` | `your-project-mysql` |
| Redis | `score-system-redis` | `your-project-redis` |
| Backend | `score-system-backend` | `your-project-backend` |
| H5前端 | `score-system-h5` | - |
| 管理后台 | `score-system-admin` | - |

✅ **不同的容器名 = 不会冲突**

### 2. 独立的端口映射 ✅

使用不同的宿主机端口：

| 服务 | 本项目端口 | 默认端口 | 说明 |
|------|------------|----------|------|
| MySQL | `3307:3306` | 3306 | 避免和默认MySQL冲突 |
| Redis | `6380:6379` | 6379 | 避免和默认Redis冲突 |
| Backend API | `3000:3000` | - | 可自定义 |
| H5前端 | `5173:80` | - | 可自定义 |
| 管理后台 | `5174:80` | - | 可自定义 |

✅ **不同的端口 = 不会冲突**

### 3. 独立的网络 ✅

创建专用的Docker网络：

```yaml
networks:
  score-network:  # 独立网络名称
    name: score-network
    driver: bridge
```

- 你的其他项目：`your-network`
- 本项目：`score-network`

✅ **独立的网络 = 完全隔离**

### 4. 独立的数据卷 ✅

使用带前缀的数据卷名称：

```yaml
volumes:
  score-mysql-data:      # MySQL数据
  score-redis-data:      # Redis数据
  score-backend-logs:    # 后端日志
```

- 你的其他项目：`your-project-mysql-data`
- 本项目：`score-mysql-data`

✅ **不同的数据卷 = 数据完全独立**

### 5. 独立的数据库名称 ✅

数据库名称：`yunce_score_system`

- 你的其他项目：`your_database`
- 本项目：`yunce_score_system`

✅ **不同的数据库名 = 数据不会混淆**

---

## 🔍 验证独立性

### 查看所有容器

```bash
# 查看所有运行的容器
docker ps

# 你会看到：
# your-project-mysql      <- 你的其他项目
# your-project-redis
# score-system-mysql      <- 计分系统（独立）
# score-system-redis
# score-system-backend
# score-system-h5
# score-system-admin
```

### 查看网络

```bash
docker network ls

# 你会看到：
# your-network           <- 你的其他项目网络
# score-network          <- 计分系统网络（独立）
```

### 查看数据卷

```bash
docker volume ls

# 你会看到：
# your-mysql-data        <- 你的其他项目数据
# score-mysql-data       <- 计分系统数据（独立）
# score-redis-data
# score-backend-logs
```

### 查看端口占用

```bash
# Windows
netstat -ano | findstr "3307"
netstat -ano | findstr "6380"
netstat -ano | findstr "3000"

# Linux/Mac
lsof -i :3307
lsof -i :6380
lsof -i :3000
```

---

## 🚀 同时运行两个项目

### 完全可以同时运行！

```bash
# 终端1：启动你的其他项目
cd your-project
docker-compose up -d

# 终端2：启动计分系统
cd score-system
./docker-start.sh
# 或者
docker-compose up -d
```

### 验证同时运行

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 输出示例：
# NAMES                    STATUS              PORTS
# your-project-mysql       Up 2 hours          0.0.0.0:3306->3306/tcp
# your-project-redis       Up 2 hours          0.0.0.0:6379->6379/tcp
# score-system-mysql       Up 5 minutes        0.0.0.0:3307->3306/tcp
# score-system-redis       Up 5 minutes        0.0.0.0:6380->6379/tcp
# score-system-backend     Up 5 minutes        0.0.0.0:3000->3000/tcp
# score-system-h5          Up 5 minutes        0.0.0.0:5173->80/tcp
# score-system-admin       Up 5 minutes        0.0.0.0:5174->80/tcp
```

✅ **完全不冲突，和平共处！**

---

## 📊 资源对比表

| 资源类型 | 你的其他项目 | 计分系统 | 冲突？ |
|----------|--------------|----------|--------|
| **容器名** | your-project-* | score-system-* | ❌ 不冲突 |
| **网络** | your-network | score-network | ❌ 不冲突 |
| **MySQL端口** | 3306 | 3307 | ❌ 不冲突 |
| **Redis端口** | 6379 | 6380 | ❌ 不冲突 |
| **数据库名** | your_database | yunce_score_system | ❌ 不冲突 |
| **数据卷** | your-*-data | score-*-data | ❌ 不冲突 |

---

## 🛠️ 自定义端口（如果需要）

如果默认端口也被占用，可以修改 `.env` 文件：

```env
# 修改端口
MYSQL_PORT=3308      # 改为3308
REDIS_PORT=6381      # 改为6381
BACKEND_PORT=3001    # 改为3001
H5_PORT=5175         # 改为5175
ADMIN_PORT=5176      # 改为5176
```

然后重启：
```bash
docker-compose down
docker-compose up -d
```

---

## 🔄 管理两个项目

### 查看特定项目的容器

```bash
# 查看你的其他项目
docker ps | grep "your-project"

# 查看计分系统
docker ps | grep "score-system"
```

### 停止特定项目

```bash
# 停止你的其他项目
cd your-project
docker-compose down

# 停止计分系统
cd score-system
docker-compose down
```

### 查看特定项目日志

```bash
# 你的其他项目日志
cd your-project
docker-compose logs -f

# 计分系统日志
cd score-system
docker-compose logs -f backend
```

---

## ⚠️ 唯一可能的冲突

### 端口冲突

如果你的其他项目已经使用了以下端口：
- 3307（MySQL）
- 6380（Redis）
- 3000（Backend）
- 5173（H5）
- 5174（Admin）

**解决方法**：修改 `.env` 文件中的端口配置

### 检查端口是否被占用

```bash
# Windows
netstat -ano | findstr "3307"

# Linux/Mac
lsof -i :3307

# 如果有输出，说明端口被占用，需要换一个端口
```

---

## 🎯 最佳实践

### 1. 使用独立的工作目录

```
D:/download/yunce/
├── yunce/                    <- 你的其他项目
│   └── docker-compose.yml
└── score-system/             <- 计分系统
    └── docker-compose.yml
```

### 2. 使用描述性的容器名

- ✅ `score-system-mysql` - 清晰明了
- ❌ `mysql` - 容易混淆

### 3. 使用独立的网络

每个项目都应该有自己的网络，避免容器之间不必要的通信。

### 4. 定期清理

```bash
# 清理未使用的容器
docker container prune

# 清理未使用的镜像
docker image prune

# 清理未使用的数据卷
docker volume prune

# 清理未使用的网络
docker network prune
```

---

## 🔍 故障排查

### 问题1：容器启动失败

```bash
# 查看日志
docker-compose logs [服务名]

# 常见原因：
# - 端口被占用
# - 数据卷权限问题
# - 环境变量配置错误
```

### 问题2：无法访问服务

```bash
# 检查容器状态
docker-compose ps

# 检查端口映射
docker ps --format "{{.Names}}\t{{.Ports}}"

# 检查网络连接
docker network inspect score-network
```

### 问题3：数据库连接失败

```bash
# 进入MySQL容器
docker exec -it score-system-mysql mysql -u root -p

# 检查数据库
SHOW DATABASES;
USE yunce_score_system;
SHOW TABLES;
```

---

## 📚 相关文档

- [docker-compose.yml](./docker-compose.yml) - 完整配置文件
- [.env.docker](./.env.docker) - 环境变量模板
- [快速配置独立数据库.md](./快速配置独立数据库.md) - 数据库配置

---

## ✅ 总结

### 完全独立的配置

✅ **容器名**：使用 `score-system-` 前缀  
✅ **网络**：独立的 `score-network`  
✅ **端口**：3307, 6380, 3000, 5173, 5174  
✅ **数据卷**：使用 `score-` 前缀  
✅ **数据库**：`yunce_score_system`

### 不会冲突

❌ 不会影响你的其他Docker项目  
❌ 不会占用相同的端口  
❌ 不会共享数据  
❌ 不会共享网络

### 可以同时运行

✅ 两个项目可以同时运行  
✅ 互不干扰  
✅ 独立管理  
✅ 独立部署

---

**🎉 放心使用Docker部署，完全不会冲突！**

**创建日期**：2024年11月26日



