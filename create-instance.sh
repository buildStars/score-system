#!/bin/bash

# ============================================
# 云策28计分系统 - 多实例创建脚本
# ============================================
# 功能：快速创建新的系统实例，自动配置端口和环境变量
# 
# 使用方法：
#   ./create-instance.sh <实例名> <实例描述>
#   
# 示例：
#   ./create-instance.sh instance2 "客户A系统"
#   ./create-instance.sh test "测试环境"
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查参数
if [ "$1" == "info" ] && [ -n "$2" ]; then
    # 显示实例信息
    INSTANCE_NAME="$2"
    INSTANCE_DIR="/root/score-system-${INSTANCE_NAME}"
    
    if [ ! -d "$INSTANCE_DIR" ]; then
        log_error "实例不存在: $INSTANCE_NAME"
        exit 1
    fi
    
    cd "$INSTANCE_DIR"
    source .env 2>/dev/null || true
    
    echo ""
    echo "======================================"
    echo "实例信息"
    echo "======================================"
    echo "名称: $INSTANCE_NAME"
    echo "描述: ${INSTANCE_LABEL:-未设置}"
    echo "目录: $INSTANCE_DIR"
    echo ""
    echo "端口配置:"
    echo "  - MySQL:   ${MYSQL_PORT:-未设置}"
    echo "  - Redis:   ${REDIS_PORT:-未设置}"
    echo "  - Backend: ${BACKEND_PORT:-未设置}"
    echo "  - H5:      ${H5_PORT:-未设置}"
    echo "  - Admin:   ${ADMIN_PORT:-未设置}"
    echo ""
    echo "访问地址:"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  - H5用户端: http://${SERVER_IP}:${H5_PORT}"
    echo "  - 管理后台: http://${SERVER_IP}:${ADMIN_PORT}"
    echo "  - API文档:  http://${SERVER_IP}:${BACKEND_PORT}/api-docs"
    echo ""
    echo "容器状态:"
    docker-compose ps
    echo "======================================"
    exit 0
fi

if [ "$1" == "list" ]; then
    # 列出所有实例
    echo ""
    echo "======================================"
    echo "所有实例列表"
    echo "======================================"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "score-"
    echo "======================================"
    exit 0
fi

if [ -z "$1" ]; then
    log_error "缺少参数"
    echo ""
    echo "使用方法："
    echo "  创建实例: $0 <实例名> <实例描述>"
    echo "  查看信息: $0 info <实例名>"
    echo "  列出实例: $0 list"
    echo ""
    echo "示例："
    echo "  $0 instance2 \"客户A系统\""
    echo "  $0 test \"测试环境\""
    echo "  $0 info instance2"
    echo "  $0 list"
    exit 1
fi

INSTANCE_NAME="$1"
INSTANCE_LABEL="${2:-新实例}"

# 验证实例名（只允许字母数字和下划线）
if ! [[ "$INSTANCE_NAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
    log_error "实例名只能包含字母、数字和下划线"
    exit 1
fi

# 计算实例编号（从instance名称提取数字，如果没有数字则询问）
INSTANCE_NUM=$(echo "$INSTANCE_NAME" | grep -o '[0-9]\+' || echo "")
if [ -z "$INSTANCE_NUM" ]; then
    read -p "请输入实例编号（用于计算端口，如 2, 3, 4...）: " INSTANCE_NUM
    if ! [[ "$INSTANCE_NUM" =~ ^[0-9]+$ ]]; then
        log_error "实例编号必须是数字"
        exit 1
    fi
fi

# 源项目目录（当前目录）
SOURCE_DIR=$(pwd)
if [ ! -f "$SOURCE_DIR/docker-compose.yml" ]; then
    log_error "当前目录不是有效的项目根目录"
    exit 1
fi

# 新实例目录
INSTANCE_DIR="/root/score-system-${INSTANCE_NAME}"

if [ -d "$INSTANCE_DIR" ]; then
    log_error "实例已存在: $INSTANCE_DIR"
    read -p "是否删除并重新创建? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        exit 1
    fi
    log_warning "删除旧实例..."
    cd "$INSTANCE_DIR"
    docker-compose down -v 2>/dev/null || true
    cd /root
    rm -rf "$INSTANCE_DIR"
fi

log_info "开始创建新实例..."
echo ""
echo "实例名称: $INSTANCE_NAME"
echo "实例描述: $INSTANCE_LABEL"
echo "实例编号: $INSTANCE_NUM"
echo "目标目录: $INSTANCE_DIR"
echo ""

# 计算端口（基于实例编号）
MYSQL_PORT=$((3307 + INSTANCE_NUM - 1))
REDIS_PORT=$((6380 + INSTANCE_NUM - 1))
BACKEND_PORT=$((3000 + INSTANCE_NUM - 1))
H5_PORT=$((5173 + (INSTANCE_NUM - 1) * 2))
ADMIN_PORT=$((5174 + (INSTANCE_NUM - 1) * 2))

echo "端口分配:"
echo "  MySQL:   $MYSQL_PORT"
echo "  Redis:   $REDIS_PORT"
echo "  Backend: $BACKEND_PORT"
echo "  H5:      $H5_PORT"
echo "  Admin:   $ADMIN_PORT"
echo ""

read -p "确认创建? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log_warning "已取消"
    exit 0
fi

# 步骤1: 复制项目文件
log_info "步骤 1/6: 复制项目文件..."
cp -r "$SOURCE_DIR" "$INSTANCE_DIR"
cd "$INSTANCE_DIR"

# 清理可能存在的旧数据
rm -rf node_modules .git .env 2>/dev/null || true

# 步骤2: 生成随机密码
log_info "步骤 2/6: 生成安全配置..."

MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 32)

# 步骤3: 创建 .env 文件
log_info "步骤 3/6: 创建环境变量配置..."

cat > .env << EOF
# ============================================
# ${INSTANCE_LABEL} - 自动生成配置
# 创建时间: $(date '+%Y-%m-%d %H:%M:%S')
# ============================================

# ===== 实例标识 =====
INSTANCE_NAME=${INSTANCE_NAME}
INSTANCE_LABEL=${INSTANCE_LABEL}

# ===== 端口配置 =====
MYSQL_PORT=${MYSQL_PORT}
REDIS_PORT=${REDIS_PORT}
BACKEND_PORT=${BACKEND_PORT}
H5_PORT=${H5_PORT}
ADMIN_PORT=${ADMIN_PORT}

# ===== 数据库配置 =====
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=score_system_${INSTANCE_NAME}
MYSQL_USER=score_user_${INSTANCE_NUM}
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# ===== Redis配置 =====
REDIS_PASSWORD=

# ===== JWT配置 =====
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=12h

# ===== 应用配置 =====
NODE_ENV=production
TZ=Asia/Shanghai

# ===== Docker Compose配置 =====
COMPOSE_PROJECT_NAME=score-${INSTANCE_NAME}
EOF

log_success ".env 文件已创建"

# 步骤4: 修改 docker-compose.yml
log_info "步骤 4/6: 修改 Docker Compose 配置..."

# 备份原文件
cp docker-compose.yml docker-compose.yml.bak

# 使用 sed 替换容器名和数据卷名
sed -i "s/score-system-/score-${INSTANCE_NAME}-/g" docker-compose.yml
sed -i "s/score-mysql-data/score-${INSTANCE_NAME}-mysql-data/g" docker-compose.yml
sed -i "s/score-redis-data/score-${INSTANCE_NAME}-redis-data/g" docker-compose.yml
sed -i "s/score-backend-logs/score-${INSTANCE_NAME}-backend-logs/g" docker-compose.yml
sed -i "s/score-network/score-${INSTANCE_NAME}-network/g" docker-compose.yml

log_success "Docker Compose 配置已更新"

# 步骤5: 启动容器
log_info "步骤 5/6: 启动 Docker 容器..."
log_warning "这可能需要几分钟时间..."

docker-compose up -d

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 检查容器状态
log_info "检查容器状态..."
docker-compose ps

# 步骤6: 初始化数据库
log_info "步骤 6/6: 初始化数据库..."

# 等待MySQL完全启动
log_info "等待 MySQL 启动（最多60秒）..."
for i in {1..60}; do
    if docker exec "score-${INSTANCE_NAME}-mysql" mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" &> /dev/null; then
        log_success "MySQL 已就绪"
        break
    fi
    if [ $i -eq 60 ]; then
        log_error "MySQL 启动超时"
        exit 1
    fi
    sleep 1
done

# 等待后端完全启动
log_info "等待后端服务启动（最多60秒）..."
for i in {1..60}; do
    if curl -s "http://localhost:${BACKEND_PORT}/api-docs" > /dev/null; then
        log_success "后端服务已就绪"
        break
    fi
    if [ $i -eq 60 ]; then
        log_warning "后端服务启动超时，请手动检查"
        break
    fi
    sleep 1
done

# 运行数据库迁移
log_info "运行数据库迁移..."
docker exec "score-${INSTANCE_NAME}-backend" npx prisma migrate deploy || {
    log_warning "数据库迁移失败，请手动执行"
}

# 初始化种子数据
log_info "初始化种子数据..."
docker exec "score-${INSTANCE_NAME}-backend" npx prisma db seed || {
    log_warning "种子数据初始化失败，请手动执行"
}

# 修复 Decimal 字段
log_info "修复数据库字段精度..."
docker exec "score-${INSTANCE_NAME}-mysql" mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    "score_system_${INSTANCE_NAME}" \
    -e "ALTER TABLE bets MODIFY COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;" || {
    log_warning "字段修复失败，请手动执行"
}

docker exec "score-${INSTANCE_NAME}-mysql" mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    "score_system_${INSTANCE_NAME}" \
    -e "ALTER TABLE bets MODIFY COLUMN result_amount DECIMAL(10,2) NULL DEFAULT NULL;" || {
    log_warning "字段修复失败，请手动执行"
}

# 完成
echo ""
echo "======================================"
log_success "实例创建完成！"
echo "======================================"
echo ""
echo "实例信息:"
echo "  名称: ${INSTANCE_NAME}"
echo "  描述: ${INSTANCE_LABEL}"
echo "  目录: ${INSTANCE_DIR}"
echo ""
echo "访问地址:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  - H5用户端: http://${SERVER_IP}:${H5_PORT}"
echo "  - 管理后台: http://${SERVER_IP}:${ADMIN_PORT}"
echo "  - API文档:  http://${SERVER_IP}:${BACKEND_PORT}/api-docs"
echo ""
echo "数据库连接:"
echo "  - MySQL: ${SERVER_IP}:${MYSQL_PORT}"
echo "    用户: score_user_${INSTANCE_NUM}"
echo "    密码: ${MYSQL_PASSWORD}"
echo "    数据库: score_system_${INSTANCE_NAME}"
echo ""
echo "  - Redis: ${SERVER_IP}:${REDIS_PORT}"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "重要文件:"
echo "  配置文件: ${INSTANCE_DIR}/.env"
echo "  Docker配置: ${INSTANCE_DIR}/docker-compose.yml"
echo ""
echo "常用命令:"
echo "  查看日志: cd ${INSTANCE_DIR} && docker-compose logs -f"
echo "  重启服务: cd ${INSTANCE_DIR} && docker-compose restart"
echo "  停止服务: cd ${INSTANCE_DIR} && docker-compose down"
echo "  查看状态: cd ${INSTANCE_DIR} && docker-compose ps"
echo ""
log_warning "请妥善保存数据库密码和JWT密钥！"
echo "======================================"






