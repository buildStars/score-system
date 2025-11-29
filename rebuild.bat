@echo off
chcp 65001 >nul

REM ============================================
REM 清理并重新构建 Docker 镜像
REM ============================================

echo.
echo ========================================
echo   清理并重新构建
echo ========================================
echo.

REM 检查 Docker Compose
docker compose version >nul 2>&1
if errorlevel 1 (
    set DOCKER_COMPOSE=docker-compose
) else (
    set DOCKER_COMPOSE=docker compose
)

echo [步骤 1/5] 停止所有容器...
%DOCKER_COMPOSE% down

echo.
echo [步骤 2/5] 清理 Docker 构建缓存...
docker builder prune -f

echo.
echo [步骤 3/5] 删除旧镜像...
docker-compose down --rmi all 2>nul

echo.
echo [步骤 4/5] 重新构建镜像（不使用缓存）...
%DOCKER_COMPOSE% build --no-cache --progress=plain

if errorlevel 1 (
    echo.
    echo [错误] 构建失败
    echo.
    echo 请检查上面的错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo [步骤 5/5] 启动所有服务...
%DOCKER_COMPOSE% up -d

echo.
echo ========================================
echo   重新构建完成！
echo ========================================
echo.
echo [提示] 等待 30-60 秒让服务完全启动
echo.
echo 查看状态: %DOCKER_COMPOSE% ps
echo 查看日志: %DOCKER_COMPOSE% logs -f
echo.
pause



