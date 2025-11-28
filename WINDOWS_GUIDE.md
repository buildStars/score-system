# 🪟 Windows 用户快速指南

专为 Windows 用户准备的 Docker 部署指南。

---

## 🚀 快速开始

### 第一步：安装 Docker Desktop

1. 下载 Docker Desktop for Windows
   - 官网：https://www.docker.com/products/docker-desktop/
   - 或使用国内镜像加速下载

2. 安装 Docker Desktop
   - 双击安装程序
   - 按提示完成安装
   - 重启电脑（如果需要）

3. 启动 Docker Desktop
   - 等待 Docker 引擎启动（右下角托盘图标）
   - 确保状态显示为 "Docker Desktop is running"

### 第二步：启动项目

1. **双击运行** `start.bat`
   - 位置：项目根目录
   - 第一次运行会自动创建 `.env` 配置文件
   - 会自动下载镜像和构建应用（约 5-10 分钟）

2. **等待启动完成**
   - 看到 "[成功] 服务启动完成！" 表示成功

3. **开始使用**
   - H5 用户端：http://localhost:8081
   - 管理后台：http://localhost:8080
   - 后端 API：http://localhost:3000

---

## 📋 常用操作

### 启动服务

```batch
双击 start.bat
```

或在命令行中：
```batch
start.bat
```

### 停止服务

```batch
双击 stop.bat
```

或在命令行中：
```batch
docker-compose stop
```

### 查看日志

```batch
双击 logs.bat
```

查看特定服务的日志：
```batch
logs.bat backend
logs.bat mysql
logs.bat redis
```

### 重启服务

```batch
docker-compose restart
```

### 完全清理（删除所有数据）

```batch
docker-compose down -v
```

---

## ⚙️ 配置修改

### 修改端口

如果默认端口被占用，编辑 `.env` 文件：

```ini
# 管理后台端口（默认 8080）
ADMIN_PORT=9080

# H5 前端端口（默认 8081）
H5_PORT=9081

# 后端 API 端口（默认 3000）
BACKEND_PORT=4000
```

修改后重启：
```batch
docker-compose down
docker-compose up -d
```

### 修改密码（重要！）

编辑 `.env` 文件，修改以下配置：

```ini
# MySQL 密码
MYSQL_ROOT_PASSWORD=你的安全密码
MYSQL_PASSWORD=你的数据库密码

# Redis 密码
REDIS_PASSWORD=你的Redis密码

# JWT 密钥（至少32位）
JWT_SECRET=你的超级安全的JWT密钥至少32位长度
```

---

## 🔧 命令行操作

### 打开命令提示符（CMD）

1. 按 `Win + R`
2. 输入 `cmd`
3. 按回车

### 打开 PowerShell

1. 按 `Win + X`
2. 选择 "Windows PowerShell" 或 "终端"

### 切换到项目目录

```batch
cd D:\download\yunce\yunce\score-system
```

### 常用 Docker 命令

```batch
# 查看服务状态
docker-compose ps

# 查看日志（实时）
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 进入容器
docker-compose exec backend sh
docker-compose exec mysql bash
```

---

## ❓ 常见问题

### 1. 端口被占用

**错误信息**：
```
Error: bind: address already in use
```

**解决方法**：

方法一：修改端口（推荐）
- 编辑 `.env` 文件
- 修改 `ADMIN_PORT`、`H5_PORT`、`BACKEND_PORT` 等
- 重启服务

方法二：关闭占用端口的程序
```batch
# 查看端口占用
netstat -ano | findstr :8080

# 结束进程（替换 PID）
taskkill /PID 12345 /F
```

### 2. Docker Desktop 未启动

**错误信息**：
```
[错误] Docker 未安装，请先安装 Docker Desktop
```

**解决方法**：
1. 检查 Docker Desktop 是否已安装
2. 启动 Docker Desktop
3. 等待 Docker 引擎完全启动
4. 重新运行 `start.bat`

### 3. 权限问题

**错误信息**：
```
Access Denied
```

**解决方法**：
1. 右键点击 `start.bat`
2. 选择 "以管理员身份运行"

### 4. 容器启动失败

**解决方法**：

```batch
# 1. 查看详细日志
docker-compose logs -f

# 2. 完全清理并重新启动
docker-compose down -v
docker-compose up -d --build
```

### 5. 内存不足

**解决方法**：
1. 打开 Docker Desktop
2. 点击右上角 ⚙️ 设置
3. 选择 "Resources" -> "Advanced"
4. 增加 Memory 到 4GB 或更多
5. 点击 "Apply & Restart"

### 6. 网络问题（镜像下载慢）

**解决方法**：

配置 Docker 国内镜像源：
1. 打开 Docker Desktop
2. 点击 ⚙️ 设置
3. 选择 "Docker Engine"
4. 添加以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

5. 点击 "Apply & Restart"

---

## 🗄️ 数据管理

### 备份数据库

```batch
# 方法一：使用 mysqldump
docker-compose exec mysql mysqldump -u root -p score_system > backup.sql

# 方法二：导出整个数据卷
docker run --rm -v score-system_mysql_data:/data -v %cd%:/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

### 恢复数据库

```batch
# 从 SQL 文件恢复
docker-compose exec -T mysql mysql -u root -p score_system < backup.sql
```

### 查看数据库

```batch
# 连接到 MySQL
docker-compose exec mysql mysql -u root -p

# 输入密码后（默认：root123456）
USE score_system;
SHOW TABLES;
```

---

## 📊 性能监控

### 查看资源使用

```batch
docker stats
```

### 查看磁盘使用

```batch
docker system df
```

### 清理未使用的资源

```batch
# 清理未使用的镜像
docker image prune -a

# 清理所有未使用的资源
docker system prune -a
```

---

## 🔍 调试技巧

### 1. 查看服务状态

```batch
docker-compose ps
```

### 2. 查看详细日志

```batch
# 所有服务
docker-compose logs -f

# 特定服务（最近100行）
docker-compose logs --tail=100 backend
```

### 3. 进入容器调试

```batch
# 进入后端容器
docker-compose exec backend sh

# 查看后端进程
docker-compose exec backend ps aux

# 查看后端环境变量
docker-compose exec backend env
```

### 4. 测试网络连接

```batch
# 测试后端 API
curl http://localhost:3000/api/health

# 使用浏览器
start http://localhost:3000/api/health
```

---

## 🎯 最佳实践

### 开发环境

```batch
# 1. 仅启动数据库服务
docker-compose -f docker-compose.dev.yml up -d

# 2. 在本地运行代码（支持热重载）
cd backend
npm run start:dev

# 3. 在另一个终端运行前端
cd frontend-admin
npm run dev
```

### 生产环境

1. **修改所有默认密码**
   ```ini
   # 编辑 .env 文件
   MYSQL_ROOT_PASSWORD=强密码123456!@#
   MYSQL_PASSWORD=数据库密码ABC!@#
   REDIS_PASSWORD=Redis密码XYZ!@#
   JWT_SECRET=至少32位的超级安全随机字符串12345678
   ```

2. **定期备份数据**
   ```batch
   # 创建备份脚本 backup.bat
   @echo off
   set BACKUP_DIR=backups
   if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
   docker-compose exec -T mysql mysqldump -u root -p score_system > %BACKUP_DIR%\backup_%date:~0,4%%date:~5,2%%date:~8,2%.sql
   ```

3. **监控日志**
   ```batch
   # 持续监控
   docker-compose logs -f | findstr ERROR
   ```

---

## 📚 更多资源

### 文档
- [完整部署指南](DOCKER_DEPLOY.md)
- [快速开始](QUICK_START.md)
- [Docker命令速查](docker-commands.md)

### 官方文档
- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/)
- [Docker Compose](https://docs.docker.com/compose/)

### 视频教程
- 搜索：Docker Desktop Windows 安装教程
- 搜索：Docker Compose 使用教程

---

## 🆘 获取帮助

遇到问题？按顺序尝试：

1. ✅ 查看本文档的"常见问题"部分
2. ✅ 查看日志：`docker-compose logs -f`
3. ✅ 重启服务：`docker-compose restart`
4. ✅ 完全重建：
   ```batch
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```
5. ✅ 查阅完整文档：[DOCKER_DEPLOY.md](DOCKER_DEPLOY.md)

---

## ✅ 检查清单

部署前检查：

- [ ] Docker Desktop 已安装并启动
- [ ] 已创建 `.env` 文件
- [ ] 已修改默认密码
- [ ] 端口未被占用（8080、8081、3000）
- [ ] 硬盘空间充足（至少 10GB）
- [ ] 内存足够（建议 4GB+）

---

**祝你使用愉快！如有问题，请参考上述文档。** 🎉



