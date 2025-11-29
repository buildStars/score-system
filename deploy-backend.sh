#!/bin/bash

###############################################################################
# 后端一键部署脚本
# 用法：./deploy-backend.sh
###############################################################################

set -e  # 遇到错误立即退出

echo "🚀 开始部署后端..."
echo "================================================"

# 1. 进入项目目录
cd "$(dirname "$0")"
echo "📁 当前目录: $(pwd)"

# 2. 停止旧容器
echo ""
echo "⏹️  停止旧容器..."
docker-compose down

# 3. 构建后端镜像
echo ""
echo "🔨 构建后端镜像..."
docker-compose build backend

# 4. 启动后端服务
echo ""
echo "▶️  启动后端服务..."
docker-compose up -d backend

# 5. 等待服务启动
echo ""
echo "⏳ 等待服务启动（5秒）..."
sleep 5

# 6. 检查服务状态
echo ""
echo "🔍 检查服务状态..."
docker-compose ps backend

# 7. 显示日志
echo ""
echo "✅ 后端部署完成！"
echo "================================================"
echo "📋 查看实时日志..."
echo "   （按 Ctrl+C 停止查看日志，不会停止服务）"
echo ""

docker-compose logs -f backend

