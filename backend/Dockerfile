# ============================================
# 计分系统后端 Dockerfile (简化版)
# ============================================

FROM node:18-alpine

# 安装必要的工具和 OpenSSL 兼容库
RUN apk add --no-cache wget openssl openssl-dev libc6-compat python3 make g++

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装所有依赖
RUN npm install --legacy-peer-deps

# 复制 prisma 配置
COPY prisma ./prisma

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 验证 dist 目录（显示详细信息）
RUN echo "=== Checking dist directory ===" && \
    ls -la && \
    ls -la dist/ || echo "dist not found" && \
    find . -name "main.js" -type f || echo "main.js not found"

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api-docs || exit 1

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
