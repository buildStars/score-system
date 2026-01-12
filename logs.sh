#!/bin/bash

# 快速查看日志脚本

SERVICE=${1:-all}

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

if [ "$SERVICE" = "all" ]; then
    echo "📋 查看所有服务日志..."
    $DOCKER_COMPOSE logs -f
else
    echo "📋 查看 $SERVICE 服务日志..."
    $DOCKER_COMPOSE logs -f $SERVICE
fi









