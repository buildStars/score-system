#!/bin/bash

# 计分系统 Docker 启动脚本
# 用途：一键启动所有服务

set -e

echo "================================"
echo "  计分系统 Docker 部署启动脚本"
echo "================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在，正在从 env.example 复制..."
    cp env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
    echo ""
    echo "⚠️  重要提示："
    echo "   - 请修改 JWT_SECRET 为安全的随机字符串"
    echo "   - 请修改数据库密码和 Redis 密码"
    echo "   - 修改后请重新运行此脚本"
    echo ""
    read -p "是否继续使用默认配置启动? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "📦 正在启动服务..."
echo ""

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 停止并移除旧容器
echo "🧹 清理旧容器..."
$DOCKER_COMPOSE down

# 构建并启动服务
echo "🔨 构建镜像..."
$DOCKER_COMPOSE build

echo "🚀 启动所有服务..."
$DOCKER_COMPOSE up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态："
$DOCKER_COMPOSE ps

echo ""
echo "================================"
echo "  ✅ 服务启动完成！"
echo "================================"
echo ""
echo "🌐 访问地址："
echo "   - H5 用户端:      http://localhost:8081"
echo "   - 管理后台:       http://localhost:8080"
echo "   - 后端 API:       http://localhost:3000"
echo "   - API 文档:       http://localhost:3000/api-docs"
echo ""
echo "📝 默认管理员账号："
echo "   - 用户名: admin"
echo "   - 密码: admin123"
echo ""
echo "🛠️  常用命令："
echo "   - 查看日志:       $DOCKER_COMPOSE logs -f [服务名]"
echo "   - 停止服务:       $DOCKER_COMPOSE stop"
echo "   - 启动服务:       $DOCKER_COMPOSE start"
echo "   - 重启服务:       $DOCKER_COMPOSE restart"
echo "   - 停止并删除:     $DOCKER_COMPOSE down"
echo "   - 查看状态:       $DOCKER_COMPOSE ps"
echo ""
echo "📚 更多信息请查看: DOCKER_DEPLOY.md"
echo "================================"









