@echo off
chcp 65001 >nul
echo ============================================
echo 修复后端 .env 数据库连接配置
echo ============================================
echo.

cd /d "%~dp0"

echo 正在创建 .env 配置文件...
echo.

(
echo # ============================================
echo # 计分系统后端 - 环境变量配置^(Docker开发环境^)
echo # ============================================
echo.
echo # ===================
echo # 数据库配置^(Docker MySQL^)
echo # ===================
echo # 注意：Docker MySQL 运行在 3307 端口
echo DATABASE_URL="mysql://root:root123456@localhost:3307/score_system"
echo.
echo # ===================
echo # JWT配置
echo # ===================
echo JWT_SECRET="yunce-score-system-secret-2024"
echo JWT_EXPIRES_IN="7d"
echo JWT_ADMIN_EXPIRES_IN="12h"
echo.
echo # ===================
echo # 应用配置
echo # ===================
echo PORT=3000
echo NODE_ENV="development"
echo.
echo # ===================
echo # CORS配置
echo # ===================
echo CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
echo.
echo # ===================
echo # Redis配置^(Docker Redis^)
echo # ===================
echo # 注意：Docker Redis 运行在 6380 端口
echo REDIS_HOST="localhost"
echo REDIS_PORT=6380
echo REDIS_PASSWORD=""
echo.
echo # ===================
echo # 其他配置
echo # ===================
echo LOG_LEVEL="info"
echo SALT_ROUNDS=10
) > .env

echo ✅ .env 文件已创建！
echo.
echo 配置信息：
echo   - 数据库：localhost:3307
echo   - 用户名：root
echo   - 密码：root123456
echo   - 数据库名：score_system
echo   - Redis：localhost:6380
echo.
echo ============================================
echo 下一步操作：
echo ============================================
echo 1. 运行 Prisma 迁移：npm run prisma:migrate
echo 2. 启动后端服务：npm run start:dev
echo ============================================
echo.
pause


