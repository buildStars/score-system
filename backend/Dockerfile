# ============================================
# 计分系统后端 Dockerfile
# ============================================

# 阶段1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和锁文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖（不要求锁文件）
RUN pnpm install --no-frozen-lockfile

# 复制源代码
COPY . .

# 生成Prisma Client
RUN npx prisma generate

# 构建应用
RUN pnpm build

# 阶段2: 生产阶段
FROM node:18-alpine

# 安装必要的工具
RUN apk add --no-cache wget

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和prisma配置
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# 安装所有依赖（生产环境也需要生成Prisma客户端）
RUN pnpm install --no-frozen-lockfile || npm install

# 生成Prisma客户端
RUN npx prisma generate

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建日志目录
RUN mkdir -p /app/logs

# 设置工作目录权限
RUN chown -R node:node /app

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api-docs || exit 1

# 设置环境变量
ENV NODE_ENV=production

# 切换到非root用户
USER node

# 启动应用
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
