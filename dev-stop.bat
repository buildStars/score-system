@echo off
chcp 65001 >nul

REM ============================================
REM 计分系统 - 开发环境停止脚本
REM ============================================

echo.
echo ========================================
echo   计分系统 - 停止开发环境
echo ========================================
echo.

REM 检查 Docker Compose
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

echo [信息] 停止 Docker 服务（MySQL + Redis）...
%DOCKER_COMPOSE% -f docker-compose.dev.yml down

echo.
echo [完成] Docker 服务已停止
echo.
echo [提示]
echo   - 本地运行的应用需要手动关闭对应的命令行窗口
echo   - 或在各窗口中按 Ctrl+C 停止
echo.
echo [重新启动]
echo   运行 dev-start.bat 重新启动开发环境
echo.
pause

