# 计分系统 Docker 管理 Makefile

.PHONY: help build up down restart logs ps clean dev-up dev-down backup

# 默认目标
.DEFAULT_GOAL := help

# Docker Compose 命令
DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_DEV := docker-compose -f docker-compose.dev.yml

help: ## 显示帮助信息
	@echo "================================"
	@echo "  计分系统 Docker 管理命令"
	@echo "================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# 环境准备
init: ## 初始化环境（复制配置文件）
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "✅ 已创建 .env 文件，请根据需要修改配置"; \
	else \
		echo "⚠️  .env 文件已存在"; \
	fi

# 构建和启动
build: ## 构建所有镜像
	$(DOCKER_COMPOSE) build

up: ## 启动所有服务
	$(DOCKER_COMPOSE) up -d

start: up ## 启动所有服务（别名）

down: ## 停止并删除所有容器
	$(DOCKER_COMPOSE) down

stop: ## 停止所有服务
	$(DOCKER_COMPOSE) stop

restart: ## 重启所有服务
	$(DOCKER_COMPOSE) restart

# 重新构建并启动
rebuild: ## 重新构建并启动所有服务
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d

# 查看状态和日志
ps: ## 查看服务状态
	$(DOCKER_COMPOSE) ps

logs: ## 查看所有服务日志
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## 查看后端日志
	$(DOCKER_COMPOSE) logs -f backend

logs-admin: ## 查看管理后台日志
	$(DOCKER_COMPOSE) logs -f frontend-admin

logs-h5: ## 查看H5前端日志
	$(DOCKER_COMPOSE) logs -f frontend-h5

logs-mysql: ## 查看MySQL日志
	$(DOCKER_COMPOSE) logs -f mysql

logs-redis: ## 查看Redis日志
	$(DOCKER_COMPOSE) logs -f redis

# 单个服务操作
restart-backend: ## 重启后端服务
	$(DOCKER_COMPOSE) restart backend

restart-admin: ## 重启管理后台
	$(DOCKER_COMPOSE) restart frontend-admin

restart-h5: ## 重启H5前端
	$(DOCKER_COMPOSE) restart frontend-h5

# 进入容器
shell-backend: ## 进入后端容器
	$(DOCKER_COMPOSE) exec backend sh

shell-mysql: ## 进入MySQL容器
	$(DOCKER_COMPOSE) exec mysql bash

shell-redis: ## 进入Redis容器
	$(DOCKER_COMPOSE) exec redis sh

# 数据库操作
db-migrate: ## 运行数据库迁移
	$(DOCKER_COMPOSE) exec backend npx prisma migrate deploy

db-seed: ## 运行数据库种子
	$(DOCKER_COMPOSE) exec backend npx prisma db seed

db-backup: ## 备份数据库
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec -T mysql mysqldump -u root -p$${MYSQL_ROOT_PASSWORD:-root123456} score_system > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ 数据库已备份到 backups/ 目录"

db-restore: ## 恢复数据库（需要指定文件: make db-restore FILE=backup.sql）
	@if [ -z "$(FILE)" ]; then \
		echo "❌ 请指定备份文件: make db-restore FILE=backup.sql"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) exec -T mysql mysql -u root -p$${MYSQL_ROOT_PASSWORD:-root123456} score_system < $(FILE)
	@echo "✅ 数据库已恢复"

# 开发环境
dev-up: ## 启动开发环境（仅MySQL和Redis）
	$(DOCKER_COMPOSE_DEV) up -d
	@echo ""
	@echo "✅ 开发环境已启动（MySQL + Redis）"
	@echo "📝 现在可以在本地运行应用："
	@echo "   cd backend && npm run start:dev"
	@echo "   cd frontend-admin && npm run dev"
	@echo "   cd frontend-h5 && npm run dev"

dev-down: ## 停止开发环境
	$(DOCKER_COMPOSE_DEV) down

# 清理
clean: ## 停止并删除所有容器和数据卷（⚠️ 会删除数据）
	$(DOCKER_COMPOSE) down -v
	@echo "⚠️  所有容器和数据已删除"

clean-images: ## 清理未使用的镜像
	docker image prune -a -f

clean-all: clean clean-images ## 完全清理（容器、数据卷、镜像）
	docker system prune -a -f --volumes

# 监控
stats: ## 查看资源使用情况
	docker stats

# 健康检查
health: ## 检查所有服务健康状态
	@echo "=== 服务健康状态 ==="
	@echo ""
	@echo "后端 API:"
	@curl -s http://localhost:3000/api/health || echo "❌ 后端服务不可用"
	@echo ""
	@echo "管理后台:"
	@curl -s http://localhost:8080/health || echo "❌ 管理后台不可用"
	@echo ""
	@echo "H5 前端:"
	@curl -s http://localhost:8081/health || echo "❌ H5前端不可用"
	@echo ""

# 快速访问
open-h5: ## 打开H5前端
	@echo "打开 H5 用户端..."
	@open http://localhost:8081 2>/dev/null || xdg-open http://localhost:8081 2>/dev/null || start http://localhost:8081 2>/dev/null || echo "请手动访问: http://localhost:8081"

open-admin: ## 打开管理后台
	@echo "打开管理后台..."
	@open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null || start http://localhost:8080 2>/dev/null || echo "请手动访问: http://localhost:8080"

open-api: ## 打开API文档
	@echo "打开 API 文档..."
	@open http://localhost:3000/api-docs 2>/dev/null || xdg-open http://localhost:3000/api-docs 2>/dev/null || start http://localhost:3000/api-docs 2>/dev/null || echo "请手动访问: http://localhost:3000/api-docs"

# 生产环境
prod-deploy: ## 生产环境部署
	@echo "⚠️  准备生产环境部署..."
	@read -p "确认继续? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		$(DOCKER_COMPOSE) -f docker-compose.yml build && \
		$(DOCKER_COMPOSE) -f docker-compose.yml up -d && \
		echo "✅ 生产环境部署完成"; \
	else \
		echo "❌ 部署已取消"; \
	fi









