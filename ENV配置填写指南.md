# 📝 .env 配置填写指南

## 快速开始（3分钟）

### 第1步：复制配置文件

```bash
cd score-system
cp .env.example .env
```

### 第2步：修改必需配置

用文本编辑器打开 `.env` 文件，**必须修改**以下3个配置：

```env
# 1. MySQL root密码（改成你自己的强密码）
MYSQL_ROOT_PASSWORD=YourStrong@Pass2024

# 2. MySQL用户密码（改成你自己的强密码）
MYSQL_PASSWORD=AnotherStrong@Pass2024

# 3. JWT密钥（必须改！越复杂越好）
JWT_SECRET=your-generated-random-secret-key-here
```

### 第3步：启动服务

```bash
./docker-start.sh
# 或者
docker-compose up -d
```

✅ **完成！** 访问 http://localhost:3000/api-docs

---

## 📋 详细配置说明

### 1. 数据库配置 ⚠️ 必须修改

#### MYSQL_ROOT_PASSWORD（必改）
```env
MYSQL_ROOT_PASSWORD=score_root_2024_change_this
```

**说明**：MySQL的root用户密码

**如何设置**：
- ✅ 使用强密码：大小写字母+数字+特殊字符
- ✅ 长度至少12位
- ❌ 不要使用简单密码如：123456、password

**示例**：
```env
MYSQL_ROOT_PASSWORD=MyS3cur3R00t@2024!
```

---

#### MYSQL_DATABASE
```env
MYSQL_DATABASE=yunce_score_system
```

**说明**：数据库名称

**建议**：保持默认，这个名称是独立的，不会和其他项目冲突

**如果需要修改**：
```env
MYSQL_DATABASE=my_custom_score_db
```

---

#### MYSQL_USER
```env
MYSQL_USER=score_user
```

**说明**：MySQL普通用户名

**建议**：保持默认即可

---

#### MYSQL_PASSWORD（必改）
```env
MYSQL_PASSWORD=score_pass_2024_change_this
```

**说明**：MySQL普通用户的密码

**如何设置**：
- ✅ 使用强密码
- ✅ 和root密码不同
- ❌ 不要和root密码相同

**示例**：
```env
MYSQL_PASSWORD=ScoreUser@Pass2024!
```

---

#### MYSQL_PORT
```env
MYSQL_PORT=3307
```

**说明**：MySQL映射到宿主机的端口

**何时修改**：
- 如果3307端口被占用
- 如果你的其他Docker项目已使用3307

**检查端口是否被占用**：
```bash
# Windows
netstat -ano | findstr "3307"

# Linux/Mac
lsof -i :3307
```

**如果被占用，改为**：
```env
MYSQL_PORT=3308  # 或3309、3310等
```

---

### 2. Redis配置

#### REDIS_PASSWORD
```env
REDIS_PASSWORD=
```

**说明**：Redis密码

**开发环境**：可以留空（无密码）
```env
REDIS_PASSWORD=
```

**生产环境**：建议设置密码
```env
REDIS_PASSWORD=RedisStr0ng@Pass
```

---

#### REDIS_PORT
```env
REDIS_PORT=6380
```

**说明**：Redis映射到宿主机的端口

**默认6380**：避免和默认的6379冲突

**如果被占用**：
```env
REDIS_PORT=6381  # 或其他端口
```

---

### 3. JWT配置 ⚠️ 必须修改

#### JWT_SECRET（必改！）
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-immediately
```

**说明**：JWT加密密钥，用于生成和验证Token

**⚠️ 非常重要**：
- ❌ 不能使用示例中的值
- ❌ 不能使用简单的字符串
- ✅ 必须使用随机生成的强密钥

**如何生成强密钥**：

**方法1：使用Node.js生成（推荐）**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
输出示例：
```
a8f5f167f44f4964e6c998dee827110c3b7f8ed2c2c38d5e2f8f3b1c8c2e7a3d
```

**方法2：使用在线工具**
访问：https://www.random.org/strings/

**方法3：自己编造（不推荐，但也可以）**
```env
JWT_SECRET=MyVeryLongAndComplexSecretKey2024WithNumbersAndSymbols!@#
```

**最终示例**：
```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3b7f8ed2c2c38d5e2f8f3b1c8c2e7a3d
```

---

#### JWT_EXPIRES_IN
```env
JWT_EXPIRES_IN=7d
```

**说明**：用户Token有效期

**可选值**：
- `1h` - 1小时
- `1d` - 1天
- `7d` - 7天（推荐）
- `30d` - 30天

---

#### JWT_ADMIN_EXPIRES_IN
```env
JWT_ADMIN_EXPIRES_IN=12h
```

**说明**：管理员Token有效期

**建议**：比用户Token短一些，更安全

**可选值**：
- `1h` - 1小时
- `12h` - 12小时（推荐）
- `1d` - 1天

---

### 4. 服务端口配置

#### BACKEND_PORT
```env
BACKEND_PORT=3000
```

**说明**：后端API服务端口

**何时修改**：如果3000端口被其他服务占用

**示例**：
```env
BACKEND_PORT=3001
```

---

#### H5_PORT
```env
H5_PORT=5173
```

**说明**：H5前端访问端口

**访问地址**：http://localhost:5173

---

#### ADMIN_PORT
```env
ADMIN_PORT=5174
```

**说明**：管理后台访问端口

**访问地址**：http://localhost:5174

---

### 5. API地址配置

#### VITE_API_BASE_URL
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**说明**：前端访问后端API的地址

**开发环境**：
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**生产环境**（如果有域名）：
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**局域网访问**（用局域网IP）：
```env
VITE_API_BASE_URL=http://192.168.1.100:3000/api
```

---

### 6. 其他配置

#### NODE_ENV
```env
NODE_ENV=production
```

**说明**：运行环境

**可选值**：
- `development` - 开发环境（详细日志）
- `production` - 生产环境（推荐）

---

#### INIT_SEED
```env
INIT_SEED=true
```

**说明**：是否初始化种子数据

**首次启动**：设置为 `true`（会创建测试用户和管理员）
```env
INIT_SEED=true
```

**之后启动**：改为 `false`（避免重复创建）
```env
INIT_SEED=false
```

---

#### LOTTERY_DATA_SOURCE
```env
LOTTERY_DATA_SOURCE=
```

**说明**：旧系统开奖数据API地址

**如果有旧系统**：
```env
LOTTERY_DATA_SOURCE=http://old-system.com/api/lottery/latest
```

**如果没有**：留空即可
```env
LOTTERY_DATA_SOURCE=
```

---

## 🎯 完整配置示例

### 示例1：本地开发环境

```env
# 数据库
MYSQL_ROOT_PASSWORD=Dev@Root2024
MYSQL_DATABASE=yunce_score_system
MYSQL_USER=score_user
MYSQL_PASSWORD=Dev@User2024
MYSQL_PORT=3307

# Redis
REDIS_PASSWORD=
REDIS_PORT=6380

# JWT（使用生成的随机密钥）
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3b7f8ed2c2c38d5e2f8f3b1c8c2e7a3d
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=12h

# 端口
BACKEND_PORT=3000
H5_PORT=5173
ADMIN_PORT=5174

# API地址
VITE_API_BASE_URL=http://localhost:3000/api

# 环境
NODE_ENV=production
INIT_SEED=true
```

### 示例2：生产环境

```env
# 数据库（使用强密码）
MYSQL_ROOT_PASSWORD=Pr0d@R00t#2024!SecurePass
MYSQL_DATABASE=yunce_score_system
MYSQL_USER=score_user
MYSQL_PASSWORD=Pr0d@User#2024!SecurePass
MYSQL_PORT=3307

# Redis（设置密码）
REDIS_PASSWORD=R3dis@Pr0d#2024
REDIS_PORT=6380

# JWT
JWT_SECRET=b9e6c328d89a4f3c9e7d5f2a8b1c4e6d7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=12h

# 端口
BACKEND_PORT=3000
H5_PORT=80
ADMIN_PORT=8080

# API地址（使用域名）
VITE_API_BASE_URL=https://api.yourdomain.com/api

# 环境
NODE_ENV=production
INIT_SEED=false  # 首次启动后改为false

# 开奖数据源
LOTTERY_DATA_SOURCE=http://old-system.internal/api/lottery/latest
```

---

## ✅ 配置检查清单

在启动服务前，检查以下配置：

- [ ] **MYSQL_ROOT_PASSWORD** - 已修改为强密码
- [ ] **MYSQL_PASSWORD** - 已修改为强密码
- [ ] **JWT_SECRET** - 已修改为随机生成的密钥
- [ ] **端口配置** - 确认没有被占用
- [ ] **VITE_API_BASE_URL** - 地址正确
- [ ] **INIT_SEED** - 首次启动设为true

---

## 🔍 验证配置

### 1. 检查端口是否被占用

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

### 2. 验证配置文件

```bash
# 查看.env文件内容（不显示密码）
cat .env | grep -v PASSWORD | grep -v SECRET
```

### 3. 测试启动

```bash
# 启动服务
docker-compose up -d

# 查看日志，确认没有错误
docker-compose logs -f
```

---

## ❓ 常见问题

### Q1: JWT_SECRET是什么？一定要改吗？
**A**: JWT_SECRET是用于加密Token的密钥。**必须修改**，否则系统不安全。使用以下命令生成：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Q2: 端口被占用怎么办？
**A**: 修改.env中的端口配置，例如：
```env
MYSQL_PORT=3308  # 改为其他端口
```

### Q3: 如何重置配置？
**A**: 
```bash
# 停止服务
docker-compose down -v

# 重新配置.env
vim .env

# 重新启动
docker-compose up -d
```

### Q4: 生产环境和开发环境有什么区别？
**A**: 主要区别：
- 生产环境：使用强密码、设置Redis密码、使用域名
- 开发环境：密码可以简单些、Redis可以无密码、使用localhost

### Q5: INIT_SEED什么时候改为false？
**A**: 首次启动后，确认测试数据已创建，就改为false，避免重复创建。

---

## 🚀 快速配置命令

```bash
# 1. 复制配置文件
cd score-system
cp .env.example .env

# 2. 生成JWT密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. 编辑.env文件
# Windows: notepad .env
# Linux/Mac: vim .env 或 nano .env

# 4. 修改以下三项：
# - MYSQL_ROOT_PASSWORD
# - MYSQL_PASSWORD  
# - JWT_SECRET（使用上面生成的）

# 5. 保存并启动
./docker-start.sh
```

---

## 📞 需要帮助？

如果配置遇到问题：

1. 查看日志：`docker-compose logs -f`
2. 检查容器状态：`docker-compose ps`
3. 验证端口：`netstat -ano | findstr "3307"`
4. 参考：[Docker避免冲突说明.md](./Docker避免冲突说明.md)

---

**✅ 按照本指南配置，5分钟内完成！**

**创建日期**：2024年11月26日



