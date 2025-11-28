#!/bin/bash

# 计分系统 Docker 停止脚本

set -e

echo "================================"
echo "  计分系统 Docker 停止脚本"
echo "================================"
echo ""

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "🛑 正在停止所有服务..."
$DOCKER_COMPOSE stop

echo ""
echo "✅ 所有服务已停止"
echo ""
echo "💡 提示："
echo "   - 重新启动: $DOCKER_COMPOSE start"
echo "   - 完全删除: $DOCKER_COMPOSE down"
echo "   - 删除数据: $DOCKER_COMPOSE down -v"
echo ""



