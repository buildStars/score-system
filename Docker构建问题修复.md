# 🔧 Docker构建问题修复

## 问题1：依赖版本冲突 ✅ 已修复

### 错误信息
```
ERESOLVE could not resolve
pinia-plugin-persistedstate@4.7.1 需要 pinia@>=3.0.0
但项目中是 pinia@2.3.1
```

### 解决方案

已将 `frontend-admin/package.json` 中的 `pinia-plugin-persistedstate` 从 `^4.1.0` 降级到 `^3.2.1`，与h5保持一致。

```json
{
  "dependencies": {
    "pinia": "^2.2.0",
    "pinia-plugin-persistedstate": "^3.2.1"  // 改为3.x版本
  }
}
```

### Dockerfile也已优化

所有前端Dockerfile已添加备用安装方案：

```dockerfile
RUN pnpm install --no-frozen-lockfile || npm install --legacy-peer-deps
```

---

## 问题2：Docker镜像拉取超时

### 错误信息
```
failed to fetch anonymous token
connectex: A connection attempt failed
```

### 原因
国内访问Docker Hub经常超时或失败。

### 解决方案1：配置Docker镜像加速（推荐）

#### Windows Docker Desktop

1. 打开Docker Desktop
2. 点击右上角设置图标 ⚙️
3. 选择 "Docker Engine"
4. 在JSON配置中添加：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

5. 点击 "Apply & Restart"

#### Linux

编辑 `/etc/docker/daemon.json`：

```bash
sudo nano /etc/docker/daemon.json
```

添加内容：
```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

重启Docker：
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

### 解决方案2：使用代理

如果你有科学上网工具：

```bash
# 设置HTTP代理
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 然后构建
docker-compose build
```

---

### 解决方案3：手动拉取镜像

```bash
# 预先拉取需要的镜像
docker pull node:18-alpine
docker pull nginx:alpine
docker pull mysql:8.0
docker pull redis:7-alpine

# 然后构建
docker-compose build
```

---

## 现在重新构建

### 清理旧的构建缓存

```bash
# 停止所有服务
docker-compose down

# 清理构建缓存
docker builder prune -a

# 清理旧镜像
docker image prune -a
```

### 重新构建

```bash
# 方法1：使用启动脚本
./docker-start.sh

# 方法2：手动构建
docker-compose build --no-cache
docker-compose up -d
```

---

## 构建优化建议

### 1. 使用本地构建（如果Docker构建太慢）

```bash
# 后端
cd backend
pnpm install
pnpm build

# H5前端
cd ../frontend-h5
pnpm install
pnpm build

# 管理后台
cd ../frontend-admin
pnpm install
pnpm build
```

然后只用Docker运行数据库：

```yaml
# docker-compose-db-only.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    # ... MySQL配置
  redis:
    image: redis:7-alpine
    # ... Redis配置
```

### 2. 分步构建

```bash
# 先构建后端
docker-compose build backend

# 再构建前端
docker-compose build frontend-h5 frontend-admin

# 最后启动
docker-compose up -d
```

---

## 验证修复

### 检查依赖安装

```bash
# 进入容器检查
docker-compose run --rm frontend-admin sh
cd /app
ls -la node_modules/pinia
ls -la node_modules/pinia-plugin-persistedstate
```

### 查看构建日志

```bash
docker-compose build --progress=plain
```

---

## 常见错误和解决方法

### 错误1：网络超时
```
timeout: download github.com/...
```

**解决**：配置镜像加速或使用代理

### 错误2：磁盘空间不足
```
no space left on device
```

**解决**：
```bash
docker system prune -a --volumes
```

### 错误3：端口被占用
```
port is already allocated
```

**解决**：修改 `.env` 中的端口配置

### 错误4：依赖冲突
```
ERESOLVE could not resolve
```

**解决**：
- 使用 `--legacy-peer-deps`
- 或更新/降级依赖版本

---

## 快速诊断命令

```bash
# 检查Docker状态
docker info

# 检查镜像
docker images

# 检查容器
docker ps -a

# 查看构建历史
docker history score-system-backend

# 清理所有
docker system prune -a --volumes
```

---

## 如果还是构建失败

### 使用简化的Docker配置

创建 `docker-compose.simple.yml`：

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: score-system-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - score-mysql-data:/var/lib/mysql
    networks:
      - score-network

  redis:
    image: redis:7-alpine
    container_name: score-system-redis
    restart: always
    ports:
      - "6380:6379"
    volumes:
      - score-redis-data:/data
    networks:
      - score-network

volumes:
  score-mysql-data:
  score-redis-data:

networks:
  score-network:
```

然后本地运行前端和后端：

```bash
# 启动数据库
docker-compose -f docker-compose.simple.yml up -d

# 本地运行后端
cd backend
pnpm install
pnpm start:dev

# 本地运行H5
cd frontend-h5
pnpm install
pnpm dev

# 本地运行管理后台
cd frontend-admin
pnpm install
pnpm dev
```

---

**✅ 问题已修复，可以重新构建了！**

```bash
docker-compose build
docker-compose up -d
```

**创建日期**：2024年11月26日



