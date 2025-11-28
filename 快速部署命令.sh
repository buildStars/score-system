#!/bin/bash

# ============================================
# 计分系统 - 服务器快速部署脚本
# ============================================
# 
# 使用方法：
# 1. 上传此脚本到服务器
# 2. chmod +x 快速部署命令.sh
# 3. ./快速部署命令.sh
# 
# ============================================

set -e

echo "========================================"
echo "  计分系统 - 服务器部署"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "[错误] 请使用 root 用户运行此脚本"
    echo "使用命令: sudo ./快速部署命令.sh"
    exit 1
fi

echo "[步骤 1/6] 更新系统..."
apt update && apt upgrade -y

echo ""
echo "[步骤 2/6] 安装必要工具..."
apt install -y curl git vim nano htop

echo ""
echo "[步骤 3/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "[成功] Docker 已安装"
else
    echo "[提示] Docker 已经安装"
fi

echo ""
echo "[步骤 4/6] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "[成功] Docker Compose 已安装"
else
    echo "[提示] Docker Compose 已经安装"
fi

echo ""
echo "[步骤 5/6] 验证安装..."
docker --version
docker-compose --version

echo ""
echo "[步骤 6/6] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 8080/tcp
    ufw allow 8081/tcp
    echo "y" | ufw enable
    echo "[成功] 防火墙已配置"
else
    apt install -y ufw
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 8080/tcp
    ufw allow 8081/tcp
    echo "y" | ufw enable
    echo "[成功] 防火墙已配置"
fi

echo ""
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "[下一步]"
echo "1. 上传项目文件到: /opt/score-system/"
echo "2. 进入目录: cd /opt/score-system"
echo "3. 复制配置: cp env.example .env"
echo "4. 编辑配置: nano .env（修改所有密码）"
echo "5. 启动服务: docker-compose up -d --build"
echo "6. 查看状态: docker-compose ps"
echo ""
echo "========================================"

