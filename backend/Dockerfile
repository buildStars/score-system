# ============================================
# 计分系统后端 Dockerfile
# ============================================

FROM node:20-alpine

# 安装必要工具和依赖
RUN apk add --no-cache wget openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 复制 prisma 配置并生成客户端
COPY prisma ./prisma
RUN npx prisma generate

# 复制所有源代码
COPY . .

# 构建应用并验证
RUN npm run build && \
    echo "=== Build completed ===" && \
    ls -la dist/src/ && \
    test -f dist/src/main.js && echo "main.js found!" || (echo "main.js NOT found!" && exit 1)

# 创建日志目录
RUN mkdir -p logs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api-docs || exit 1

ENV NODE_ENV=production

# 启动应用（先推送 schema 再运行迁移）
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma migrate deploy && node dist/src/main.js"]
