@echo off
chcp 65001 >nul

REM 快速查看日志脚本 (Windows 版本)

set SERVICE=%1
if "%SERVICE%"=="" set SERVICE=all

REM 检查 Docker Compose
docker compose version >nul 2>&1
if errorlevel 1 (
    set DOCKER_COMPOSE=docker-compose
) else (
    set DOCKER_COMPOSE=docker compose
)

if "%SERVICE%"=="all" (
    echo [信息] 查看所有服务日志...
    %DOCKER_COMPOSE% logs -f
) else (
    echo [信息] 查看 %SERVICE% 服务日志...
    %DOCKER_COMPOSE% logs -f %SERVICE%
)

