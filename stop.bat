@echo off
chcp 65001 >nul

REM 计分系统 Docker 停止脚本 (Windows 版本)

echo ================================
echo   计分系统 Docker 停止脚本
echo ================================
echo.

REM 检查 Docker Compose 是否可用
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo [错误] Docker Compose 未安装或不可用
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE=docker-compose
) else (
    set DOCKER_COMPOSE=docker compose
)

echo [信息] 正在停止所有服务...
%DOCKER_COMPOSE% stop

echo.
echo [成功] 所有服务已停止
echo.
echo [提示]
echo    - 重新启动: %DOCKER_COMPOSE% start
echo    - 完全删除: %DOCKER_COMPOSE% down
echo    - 删除数据: %DOCKER_COMPOSE% down -v
echo.
pause

