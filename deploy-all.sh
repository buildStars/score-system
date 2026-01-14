#!/bin/bash

###############################################################################
# 全栈一键部署脚本
# 用法：./deploy-all.sh
###############################################################################

set -e  # 遇到错误立即退出

echo "🚀 开始全栈部署..."
echo "================================================"

# 1. 进入项目目录
cd "$(dirname "$0")"
echo "📁 当前目录: $(pwd)"

# 2. 停止所有容器
echo ""
echo "⏹️  停止所有容器..."
docker-compose down

# 3. 构建所有镜像
echo ""
echo "🔨 构建所有镜像..."
docker-compose build

# 4. 启动所有服务
echo ""
echo "▶️  启动所有服务..."
docker-compose up -d

# 5. 等待服务启动
echo ""
echo "⏳ 等待服务启动（10秒）..."
sleep 10

# 6. 检查服务状态
echo ""
echo "🔍 检查服务状态..."
docker-compose ps

# 7. 显示访问地址
echo ""
echo "✅ 全栈部署完成！"
echo "================================================"
echo "🌐 服务访问地址："
echo "   后端API：    http://localhost:3000"
echo "   H5前端：     http://localhost:8080"
echo "   管理后台：   http://localhost:8081"
echo ""
echo "📋 查看日志命令："
echo "   后端：       docker-compose logs -f backend"
echo "   H5前端：     docker-compose logs -f frontend-h5"
echo "   管理后台：   docker-compose logs -f frontend-admin"
echo "   全部：       docker-compose logs -f"
echo "================================================"






