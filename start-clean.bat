@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ============================================
REM 计分系统 - 全新启动脚本（强制重新构建）
REM ============================================

echo.
echo ========================================
echo   计分系统 Docker 启动脚本
echo ========================================
echo.
echo [提示] 此脚本会强制重新构建所有镜像
echo.

REM 检查 Docker 是否安装
echo [检查] 检查 Docker 是否已安装...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] Docker 未安装或未启动
    echo.
    echo 请先完成以下步骤：
    echo 1. 下载并安装 Docker Desktop
    echo    下载地址: https://www.docker.com/products/docker-desktop/
    echo 2. 启动 Docker Desktop
    echo 3. 等待 Docker 引擎完全启动（查看系统托盘图标）
    echo 4. 重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo [成功] Docker 已安装
docker --version

REM 检查 Docker 是否正在运行
echo.
echo [检查] 检查 Docker 是否正在运行...
docker ps >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] Docker 未运行
    echo.
    echo 请执行以下操作：
    echo 1. 启动 Docker Desktop
    echo 2. 等待右下角托盘图标显示 "Docker Desktop is running"
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo [成功] Docker 正在运行

REM 检查 Docker Compose
echo.
echo [检查] 检查 Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo [错误] Docker Compose 未找到
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE=docker-compose
) else (
    set DOCKER_COMPOSE=docker compose
)
echo [成功] Docker Compose 可用
%DOCKER_COMPOSE% version

REM 检查环境变量文件
echo.
echo [检查] 检查配置文件...
if not exist .env (
    if not exist env.example (
        echo [错误] env.example 文件不存在
        pause
        exit /b 1
    )
    echo [信息] 从 env.example 创建 .env 文件...
    copy env.example .env >nul
    echo [成功] 已创建 .env 配置文件
    echo.
    echo [重要提示]
    echo   - 已使用默认配置创建 .env 文件
    echo   - 生产环境请务必修改密码和密钥
    echo.
) else (
    echo [成功] 配置文件已存在
)

echo.
echo ========================================
echo   开始部署
echo ========================================
echo.

REM 停止并清理旧容器
echo [步骤 1/5] 清理旧容器和镜像...
%DOCKER_COMPOSE% down 2>nul
if errorlevel 1 (
    echo [警告] 清理时出现警告，继续执行...
)
echo [完成] 清理完成

REM 强制重新构建镜像
echo.
echo [步骤 2/5] 构建 Docker 镜像（这可能需要 5-10 分钟）...
echo [信息] 正在构建后端、H5前端和管理后台...
%DOCKER_COMPOSE% build --no-cache
if errorlevel 1 (
    echo.
    echo [错误] 镜像构建失败
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题（下载依赖包失败）
    echo 2. 依赖包版本冲突
    echo 3. 磁盘空间不足
    echo.
    echo 建议操作：
    echo 1. 检查网络连接
    echo 2. 查看上面的错误日志
    echo 3. 尝试再次运行此脚本
    echo.
    pause
    exit /b 1
)
echo [完成] 镜像构建完成

REM 启动所有服务
echo.
echo [步骤 3/5] 启动所有服务...
%DOCKER_COMPOSE% up -d
if errorlevel 1 (
    echo.
    echo [错误] 服务启动失败
    echo.
    echo 查看详细日志：
    echo   %DOCKER_COMPOSE% logs -f
    echo.
    pause
    exit /b 1
)
echo [完成] 服务启动完成

REM 等待服务就绪
echo.
echo [步骤 4/5] 等待服务就绪（30秒）...
timeout /t 30 /nobreak >nul
echo [完成] 等待完成

REM 检查服务状态
echo.
echo [步骤 5/5] 检查服务状态...
echo.
%DOCKER_COMPOSE% ps

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo [访问地址]
echo   - H5 用户端:    http://localhost:5173
echo   - 管理后台:     http://localhost:5174
echo   - 后端 API:     http://localhost:3000
echo   - API 文档:     http://localhost:3000/api-docs
echo.
echo [默认账号]
echo   管理员: admin / admin123
echo   用户:   user1 / 123456
echo.
echo [常用命令]
echo   查看日志:  %DOCKER_COMPOSE% logs -f
echo   查看状态:  %DOCKER_COMPOSE% ps
echo   停止服务:  %DOCKER_COMPOSE% stop
echo   重启服务:  %DOCKER_COMPOSE% restart
echo   完全删除:  %DOCKER_COMPOSE% down -v
echo.
echo [故障排查]
echo   如果服务无法访问，请等待1-2分钟后重试
echo   查看详细日志: %DOCKER_COMPOSE% logs -f [服务名]
echo   服务名: backend, frontend-h5, frontend-admin, mysql, redis
echo.
echo ========================================
echo.
pause








