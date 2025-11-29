# 开发环境快速启动指南 (PowerShell 版本)

## ✅ 问题解决

### 原问题：`dev-start.bat` 无法启动

**原因：** `.bat` 批处理脚本在 PowerShell 中运行时会出现字符编码问题。

**解决方案：** 创建了专门的 PowerShell 脚本 `dev-start.ps1`

---

## 🚀 使用新的启动脚本

### 方法1：使用 PowerShell 脚本（推荐）✅

在 PowerShell 中运行：

```powershell
cd D:\download\yunce\yunce\score-system
.\dev-start.ps1
```

或者直接双击文件（如果设置了文件关联）。

---

### 方法2：使用传统的 .bat 脚本

如果一定要使用 `.bat` 脚本，需要在 CMD（命令提示符）中运行，而不是 PowerShell：

1. 打开 CMD（不是 PowerShell）
2. 运行以下命令：

```cmd
cd D:\download\yunce\yunce\score-system
dev-start.bat
```

---

## 📋 启动脚本功能

`dev-start.ps1` 会自动执行以下操作：

### 1. 环境检查
- ✅ 检查 Node.js
- ✅ 检查 npm
- ✅ 检查 Docker
- ✅ 检查 Docker Compose
- ✅ 检查项目目录

### 2. Docker 服务启动
- ✅ 启动 MySQL (端口 3307)
- ✅ 启动 Redis (端口 6380)
- ✅ 等待数据库就绪 (10秒)

### 3. 依赖安装（首次运行）
- ✅ 安装后端依赖
- ✅ 安装管理后台依赖
- ✅ 安装 H5 前端依赖

### 4. 数据库迁移
- ✅ 运行 `prisma generate`
- ✅ 运行 `prisma migrate deploy`

### 5. 启动应用（新窗口）
- ✅ 后端 API (http://localhost:3000)
- ✅ 管理后台 (http://localhost:5174)
- ✅ H5 前端 (http://localhost:5173)

---

## 🎯 当前状态

### 已运行的服务

```
✅ Docker MySQL - localhost:3307
✅ Docker Redis  - localhost:6380
✅ 后端 API      - localhost:3000
```

### 未运行的服务

```
❌ 管理后台 - localhost:5174
❌ H5 前端  - localhost:5173
```

---

## 🔧 手动启动前端（当前推荐）

由于后端已经在运行，你可以单独启动前端服务：

### 启动管理后台

打开新的 PowerShell 窗口：

```powershell
cd D:\download\yunce\yunce\score-system\frontend-admin
npm run dev
```

### 启动 H5 前端

再打开一个新的 PowerShell 窗口：

```powershell
cd D:\download\yunce\yunce\score-system\frontend-h5
npm run dev
```

---

## 📊 服务访问地址

| 服务 | 地址 | 状态 |
|------|------|------|
| 后端 API | http://localhost:3000 | ✅ 运行中 |
| API 文档 | http://localhost:3000/api-docs | ✅ 可访问 |
| 管理后台 | http://localhost:5174 | ⏸️ 需启动 |
| H5 前端 | http://localhost:5173 | ⏸️ 需启动 |
| MySQL | localhost:3307 | ✅ 运行中 |
| Redis | localhost:6380 | ✅ 运行中 |

---

## 🔑 默认账号

### 管理员账号
```
用户名: admin
密码: admin123
```

### 普通用户账号
```
用户名: user1
密码: 123456
```

---

## 🛑 如何停止服务

### 停止前端服务
- 关闭运行前端的 PowerShell 窗口
- 或在窗口中按 `Ctrl + C`

### 停止后端服务
- 关闭运行后端的 PowerShell 窗口
- 或在窗口中按 `Ctrl + C`

### 停止 Docker 服务

在 PowerShell 中运行：

```powershell
cd D:\download\yunce\yunce\score-system
docker compose -f docker-compose.dev.yml down
```

或者运行停止脚本：

```powershell
.\dev-stop.bat
```

---

## 📝 快速测试步骤

### 1. 测试后端 API（已运行）

浏览器访问：http://localhost:3000/api-docs

你应该能看到 Swagger API 文档。

### 2. 启动并测试 H5 前端

```powershell
cd D:\download\yunce\yunce\score-system\frontend-h5
npm run dev
```

等待启动后，浏览器访问：http://localhost:5173

### 3. 测试投注功能

1. 访问 H5 前端：http://localhost:5173
2. 使用账号登录：`user1` / `123456`
3. 在首页测试下注功能
4. 查看投注历史，验证**总盈亏**显示是否正确

### 4. 验证修复的功能

- ✅ **总盈亏显示**：投注历史应该显示 `pointsAfter - pointsBefore`
- ✅ **倒计时功能**：首页应该显示距离封盘/开奖的倒计时
- ✅ **取消订单**：可以取消当前期的下注
- ✅ **开奖时间显示**：首页应该显示开奖时间

---

## 🎉 测试总结

### 已修复的问题

1. ✅ **数据库连接配置**：已创建正确的 `.env` 文件
2. ✅ **启动脚本兼容性**：创建了 PowerShell 版本的启动脚本
3. ✅ **Cursor 文件保护**：创建了 `.cursorignore` 允许编辑 `.env`
4. ✅ **总盈亏计算**：投注历史现在显示真实的总盈亏

### 当前运行状态

```
✅ MySQL       - 运行中 (3307)
✅ Redis       - 运行中 (6380)
✅ 后端 API    - 运行中 (3000)
⏸️ 管理后台    - 需手动启动 (5174)
⏸️ H5 前端     - 需手动启动 (5173)
```

---

## 💡 下一步操作

### 选项1：完整测试（推荐）

启动所有服务并进行完整测试：

1. 停止当前运行的后端服务
2. 运行 `.\dev-start.ps1` 一键启动所有服务
3. 等待 30-60 秒
4. 访问 H5 前端进行测试

### 选项2：快速测试（当前状态）

保持后端运行，只启动前端：

1. 启动 H5 前端：
   ```powershell
   cd frontend-h5
   npm run dev
   ```
2. 访问 http://localhost:5173
3. 登录并测试投注功能

---

## 🔍 故障排查

### 问题1：无法运行 PowerShell 脚本

**错误信息：** "无法加载文件，因为在此系统上禁止运行脚本"

**解决方案：**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题2：端口被占用

**错误信息：** "端口 3000/3307/6380 已被占用"

**解决方案：**
```powershell
# 查看占用端口的进程
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3307"
netstat -ano | findstr ":6380"

# 停止占用的进程（使用进程ID）
taskkill /PID <进程ID> /F
```

### 问题3：Docker 容器启动失败

**解决方案：**
```powershell
# 清理并重启 Docker 服务
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d

# 等待 10 秒后检查状态
Start-Sleep -Seconds 10
docker compose -f docker-compose.dev.yml ps
```

---

## 📚 相关文档

- [后端 API 文档](http://localhost:3000/api-docs)
- [数据库配置说明](backend/修复数据库配置.md)
- [开奖同步机制](开奖同步机制优化方案.md)
- [投注历史显示总盈亏](frontend-h5/投注历史显示总盈亏.md)

---

测试愉快！🎉



