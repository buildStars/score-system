#!/bin/bash

###############################################################################
# H5前端一键部署脚本
# 用法：./deploy-h5.sh
###############################################################################

set -e  # 遇到错误立即退出

echo "🚀 开始部署H5前端..."
echo "================================================"

# 1. 进入项目目录
cd "$(dirname "$0")"
echo "📁 当前目录: $(pwd)"

# 2. 停止旧容器
echo ""
echo "⏹️  停止旧容器..."
docker-compose down frontend-h5

# 3. 构建H5前端镜像
echo ""
echo "🔨 构建H5前端镜像..."
docker-compose build frontend-h5

# 4. 启动H5前端服务
echo ""
echo "▶️  启动H5前端服务..."
docker-compose up -d frontend-h5

# 5. 等待服务启动
echo ""
echo "⏳ 等待服务启动（3秒）..."
sleep 3

# 6. 检查服务状态
echo ""
echo "🔍 检查服务状态..."
docker-compose ps frontend-h5

# 7. 显示访问地址
echo ""
echo "✅ H5前端部署完成！"
echo "================================================"
echo "🌐 访问地址："
echo "   http://localhost:8080"
echo "   http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "📋 查看实时日志..."
echo "   （按 Ctrl+C 停止查看日志，不会停止服务）"
echo ""

docker-compose logs -f frontend-h5






