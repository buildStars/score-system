#!/bin/bash
# ============================================
# 计分系统 Docker 停止脚本
# ============================================

set -e

echo "🛑 停止计分系统服务"
echo "================================"

# 停止所有服务
docker-compose down

echo ""
echo "✅ 所有服务已停止"
echo ""
echo "💡 提示："
echo "  - 重新启动：./docker-start.sh"
echo "  - 删除数据：docker-compose down -v"
echo ""



