# 🚀 Linux 服务器部署命令（修复 crypto 问题）

## 📋 准备工作

### 1️⃣ 将最新代码上传到服务器

使用 Git 或 FTP 工具上传修改后的代码：

```bash
# 方式一：使用 Git（推荐）
cd /path/to/score-system
git pull origin main

# 方式二：使用 SCP
scp -r ./score-system user@server:/path/to/
```

## 🔧 快速部署（一键式）

### 使用自动化脚本

```bash
cd /path/to/score-system

# 给脚本添加执行权限
chmod +x rebuild-backend.sh

# 运行重建脚本
./rebuild-backend.sh
```

脚本会自动：
1. ✅ 停止旧容器
2. ✅ 删除旧镜像
3. ✅ 重新构建（包含 crypto 修复）
4. ✅ 启动新服务
5. ✅ 显示启动日志

## 🔧 手动部署（分步式）

如果你想手动控制每一步：

### 步骤 1：停止并清理旧服务

```bash
cd /path/to/score-system

# 停止后端服务
docker-compose stop backend

# 删除旧容器
docker-compose rm -f backend

# 删除旧镜像（可选，确保完全重建）
docker rmi score-system-backend:latest
```

### 步骤 2：重新构建镜像

```bash
# 不使用缓存重新构建
docker-compose build --no-cache backend
```

### 步骤 3：启动服务

```bash
# 启动后端服务
docker-compose up -d backend
```

### 步骤 4：查看日志验证

```bash
# 实时查看日志
docker-compose logs -f backend
```

## ✅ 验证部署成功

### 应该看到的成功日志

```
score-system-backend  | 🚀 应用启动成功！
score-system-backend  | 📡 API地址: http://localhost:3000/api
score-system-backend  | 📚 API文档: http://localhost:3000/api-docs
```

### 不应该再看到的错误

```
❌ ReferenceError: crypto is not defined
❌ Node.js v18.20.8
```

## 🧪 测试 API 是否正常

### 测试健康检查

```bash
curl http://localhost:3000/api-docs
# 应该返回 Swagger 文档页面
```

### 测试数据源健康状态

```bash
# 先登录管理员账号获取 token
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用返回的 token 查看数据源状态
curl http://localhost:3000/api/lottery/data-source-health \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔍 故障排查

### 如果服务启动失败

```bash
# 查看完整日志
docker-compose logs backend

# 查看最近 100 行日志
docker-compose logs --tail=100 backend

# 进入容器查看
docker-compose exec backend sh

# 在容器内查看 Node.js 版本
node --version  # 应该显示 v20.x.x

# 在容器内手动测试
cd /app
node dist/src/main.js
```

### 如果端口被占用

```bash
# 查找占用 3000 端口的进程
netstat -tlnp | grep :3000

# 或者使用 lsof
lsof -i :3000

# 停止占用端口的进程
kill -9 PID
```

### 如果需要完全重置

```bash
# 停止所有服务
docker-compose down

# 删除所有容器和镜像
docker-compose down --rmi all

# 删除数据卷（⚠️ 会删除数据库数据）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

## 📊 性能监控

### 查看容器资源使用

```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用情况
docker stats score-system-backend
```

### 查看后端日志

```bash
# 实时日志
docker-compose logs -f backend

# 只看错误日志
docker-compose logs backend | grep -i error

# 只看警告日志
docker-compose logs backend | grep -i warn
```

## 🎯 部署检查清单

部署完成后，请检查以下项目：

- [ ] ✅ 容器正常启动（`docker-compose ps` 显示 `Up`）
- [ ] ✅ 没有 crypto 相关错误
- [ ] ✅ Node.js 版本为 20.x.x
- [ ] ✅ API 文档可访问（http://your-server:3000/api-docs）
- [ ] ✅ 数据源健康检查通过
- [ ] ✅ 前端可以正常调用后端 API
- [ ] ✅ 定时任务正常运行（查看日志中的同步任务）
- [ ] ✅ JND28 和 USA28 数据源都可用

## 📝 更新日志

**版本**：v1.0.1  
**日期**：2025-11-29  
**更新内容**：
- ✅ 修复 Alpine Linux 环境中 crypto.randomUUID() 未定义问题
- ✅ 升级 Dockerfile 到 Node.js 20
- ✅ 添加多数据源支持（USA28 + JND28）
- ✅ 优化同步逻辑和网络容错

---

**需要帮助？** 查看 `crypto修复说明.md` 获取详细技术说明

