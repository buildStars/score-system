#!/bin/bash

# ============================================
# 云策28计分系统 - 批量实例管理脚本
# ============================================
# 功能：批量管理多个系统实例
# 
# 使用方法：
#   ./manage-instances.sh <命令> [参数]
#   
# 命令：
#   list              - 列出所有实例
#   status            - 显示所有实例状态
#   logs <实例名>     - 查看实例日志
#   restart <实例名>  - 重启实例
#   stop <实例名>     - 停止实例
#   start <实例名>    - 启动实例
#   update <实例名>   - 更新实例（重新构建）
#   update-all        - 更新所有实例
#   backup <实例名>   - 备份实例数据
#   backup-all        - 备份所有实例
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 查找所有实例目录
find_instances() {
    find /root -maxdepth 1 -type d -name "score-system*" 2>/dev/null | sort
}

# 列出所有实例
cmd_list() {
    echo ""
    echo "======================================"
    echo "所有实例列表"
    echo "======================================"
    
    local instances=$(find_instances)
    
    if [ -z "$instances" ]; then
        log_warning "没有找到任何实例"
        return
    fi
    
    local count=0
    for dir in $instances; do
        count=$((count + 1))
        local name=$(basename "$dir")
        
        # 读取实例信息
        if [ -f "$dir/.env" ]; then
            source "$dir/.env" 2>/dev/null
            echo ""
            echo "[$count] $name"
            echo "    描述: ${INSTANCE_LABEL:-未设置}"
            echo "    目录: $dir"
            echo "    端口: Backend=${BACKEND_PORT:-?} H5=${H5_PORT:-?} Admin=${ADMIN_PORT:-?}"
        else
            echo ""
            echo "[$count] $name"
            echo "    目录: $dir"
            echo "    状态: 未配置（缺少.env文件）"
        fi
    done
    
    echo ""
    echo "总计: $count 个实例"
    echo "======================================"
}

# 显示所有实例状态
cmd_status() {
    echo ""
    echo "======================================"
    echo "所有实例运行状态"
    echo "======================================"
    
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "score-" || {
        log_warning "没有运行中的实例容器"
    }
    
    echo ""
    echo "资源占用："
    echo "======================================"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "score-" || true
    echo "======================================"
}

# 获取实例目录
get_instance_dir() {
    local name=$1
    if [ -d "/root/$name" ]; then
        echo "/root/$name"
    elif [ -d "/root/score-system-$name" ]; then
        echo "/root/score-system-$name"
    else
        return 1
    fi
}

# 查看日志
cmd_logs() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        echo "用法: $0 logs <实例名> [服务名]"
        echo "服务名可选: backend, frontend-h5, frontend-admin, mysql, redis"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    local service=$2
    
    cd "$dir"
    if [ -z "$service" ]; then
        log_info "查看 $instance 所有日志..."
        docker-compose logs -f --tail=100
    else
        log_info "查看 $instance/$service 日志..."
        docker-compose logs -f --tail=100 "$service"
    fi
}

# 重启实例
cmd_restart() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    local service=$2
    
    cd "$dir"
    if [ -z "$service" ]; then
        log_info "重启 $instance 所有服务..."
        docker-compose restart
    else
        log_info "重启 $instance/$service ..."
        docker-compose restart "$service"
    fi
    
    log_success "重启完成"
}

# 停止实例
cmd_stop() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    cd "$dir"
    log_info "停止 $instance ..."
    docker-compose down
    
    log_success "已停止"
}

# 启动实例
cmd_start() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    cd "$dir"
    log_info "启动 $instance ..."
    docker-compose up -d
    
    log_success "已启动"
    docker-compose ps
}

# 更新实例
cmd_update() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    cd "$dir"
    log_info "更新 $instance ..."
    
    # 如果是Git仓库，拉取最新代码
    if [ -d ".git" ]; then
        log_info "拉取最新代码..."
        git pull
    fi
    
    # 重新构建
    log_info "重新构建镜像..."
    docker-compose build
    
    # 重启服务
    log_info "重启服务..."
    docker-compose down
    docker-compose up -d
    
    log_success "更新完成"
}

# 更新所有实例
cmd_update_all() {
    local instances=$(find_instances)
    
    if [ -z "$instances" ]; then
        log_warning "没有找到任何实例"
        return
    fi
    
    echo ""
    echo "======================================"
    echo "更新所有实例"
    echo "======================================"
    
    for dir in $instances; do
        local name=$(basename "$dir")
        echo ""
        log_info "更新 $name ..."
        
        cd "$dir"
        
        # 如果是Git仓库，拉取最新代码
        if [ -d ".git" ]; then
            log_info "[$name] 拉取最新代码..."
            git pull || log_warning "[$name] Git拉取失败"
        fi
        
        # 重新构建
        log_info "[$name] 重新构建镜像..."
        docker-compose build || {
            log_error "[$name] 构建失败，跳过"
            continue
        }
        
        # 重启服务
        log_info "[$name] 重启服务..."
        docker-compose down
        docker-compose up -d || {
            log_error "[$name] 启动失败"
            continue
        }
        
        log_success "[$name] 更新完成"
    done
    
    echo ""
    echo "======================================"
    log_success "所有实例更新完成"
    echo "======================================"
}

# 备份实例
cmd_backup() {
    local instance=$1
    if [ -z "$instance" ]; then
        log_error "请指定实例名"
        return 1
    fi
    
    local dir=$(get_instance_dir "$instance")
    if [ -z "$dir" ]; then
        log_error "实例不存在: $instance"
        return 1
    fi
    
    cd "$dir"
    source .env 2>/dev/null || true
    
    local backup_dir="/root/backups"
    mkdir -p "$backup_dir"
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$backup_dir/${instance}_${timestamp}.sql"
    
    log_info "备份 $instance 数据库到 $backup_file ..."
    
    # 获取容器名
    local container_name="score-${instance}-mysql"
    if [ "$instance" == "score-system" ]; then
        container_name="score-system-mysql"
    fi
    
    docker exec "$container_name" mysqldump \
        -u root \
        -p"${MYSQL_ROOT_PASSWORD}" \
        "${MYSQL_DATABASE}" \
        > "$backup_file" || {
        log_error "备份失败"
        return 1
    }
    
    # 压缩备份文件
    gzip "$backup_file"
    
    log_success "备份完成: ${backup_file}.gz"
    log_info "文件大小: $(du -h ${backup_file}.gz | cut -f1)"
}

# 备份所有实例
cmd_backup_all() {
    local instances=$(find_instances)
    
    if [ -z "$instances" ]; then
        log_warning "没有找到任何实例"
        return
    fi
    
    echo ""
    echo "======================================"
    echo "备份所有实例"
    echo "======================================"
    
    for dir in $instances; do
        local name=$(basename "$dir")
        echo ""
        cmd_backup "$name" || log_warning "[$name] 备份失败"
    done
    
    echo ""
    echo "======================================"
    log_success "所有实例备份完成"
    echo ""
    log_info "备份文件位置: /root/backups/"
    ls -lh /root/backups/ | tail -n +2
    echo "======================================"
}

# 主函数
main() {
    local command=$1
    
    case "$command" in
        list)
            cmd_list
            ;;
        status)
            cmd_status
            ;;
        logs)
            shift
            cmd_logs "$@"
            ;;
        restart)
            shift
            cmd_restart "$@"
            ;;
        stop)
            shift
            cmd_stop "$@"
            ;;
        start)
            shift
            cmd_start "$@"
            ;;
        update)
            shift
            cmd_update "$@"
            ;;
        update-all)
            cmd_update_all
            ;;
        backup)
            shift
            cmd_backup "$@"
            ;;
        backup-all)
            cmd_backup_all
            ;;
        *)
            echo "云策28计分系统 - 批量实例管理"
            echo ""
            echo "使用方法："
            echo "  $0 <命令> [参数]"
            echo ""
            echo "命令列表："
            echo "  list                    - 列出所有实例"
            echo "  status                  - 显示所有实例运行状态"
            echo "  logs <实例> [服务]      - 查看实例日志"
            echo "  restart <实例> [服务]   - 重启实例"
            echo "  stop <实例>             - 停止实例"
            echo "  start <实例>            - 启动实例"
            echo "  update <实例>           - 更新实例（重新构建）"
            echo "  update-all              - 更新所有实例"
            echo "  backup <实例>           - 备份实例数据库"
            echo "  backup-all              - 备份所有实例数据库"
            echo ""
            echo "示例："
            echo "  $0 list"
            echo "  $0 status"
            echo "  $0 logs instance2"
            echo "  $0 logs instance2 backend"
            echo "  $0 restart instance2"
            echo "  $0 backup instance2"
            echo "  $0 update-all"
            ;;
    esac
}

main "$@"





