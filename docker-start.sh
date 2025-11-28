#!/bin/bash
# ============================================
# 计分系统 Docker 一键启动脚本
# ============================================

set -e

echo "🎯 计分系统 Docker 一键启动"
echo "================================"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查.env文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.docker .env
    echo "✅ 已创建 .env 文件，请检查配置"
    echo "⚠️  特别注意修改 JWT_SECRET"
fi

# 拉取最新镜像
echo ""
echo "📦 拉取Docker镜像..."
docker-compose pull

# 构建服务
echo ""
echo "🔨 构建服务..."
docker-compose build

# 启动服务
echo ""
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务就绪
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose ps

# 显示日志
echo ""
echo "📋 最近日志："
docker-compose logs --tail=20

echo ""
echo "================================"
echo "✅ 启动完成！"
echo ""
echo "📡 访问地址："
echo "  - API文档：http://localhost:3000/api-docs"
echo "  - H5前端：http://localhost:5173"
echo "  - 管理后台：http://localhost:5174"
echo ""
echo "📊 查看日志："
echo "  docker-compose logs -f [服务名]"
echo ""
echo "🔄 重启服务："
echo "  docker-compose restart [服务名]"
echo ""
echo "🛑 停止服务："
echo "  docker-compose down"
echo ""
echo "================================"



