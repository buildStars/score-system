# 前端管理后台 Dockerfile
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（使用legacy-peer-deps避免依赖冲突）
RUN npm install --legacy-peer-deps || npm install

# 复制源代码
COPY . .

# 构建参数
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建应用
RUN npm run build

# 生产环境 - 使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

