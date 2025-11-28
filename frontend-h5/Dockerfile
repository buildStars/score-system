# ============================================
# H5前端 Dockerfile
# ============================================

# 阶段1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json
COPY package.json pnpm-lock.yaml* ./

# 安装依赖（使用no-frozen-lockfile避免锁文件问题）
RUN pnpm install --no-frozen-lockfile || npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建参数
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建应用
RUN pnpm build

# 阶段2: 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
