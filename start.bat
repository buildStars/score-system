@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 计分系统 Docker 启动脚本 (Windows 版本)
REM 用途：一键启动所有服务

echo ================================
echo   计分系统 Docker 部署启动脚本
echo ================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

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

REM 检查环境变量文件
if not exist .env (
    echo [警告] .env 文件不存在，正在从 env.example 复制...
    copy env.example .env >nul
    echo [成功] 已创建 .env 文件，请根据需要修改配置
    echo.
    echo [重要提示]
    echo    - 请修改 JWT_SECRET 为安全的随机字符串
    echo    - 请修改数据库密码和 Redis 密码
    echo    - 修改后请重新运行此脚本
    echo.
    set /p continue="是否继续使用默认配置启动? (y/n): "
    if /i not "!continue!"=="y" (
        exit /b 0
    )
)

echo [信息] 正在启动服务...
echo.

REM 停止并移除旧容器
echo [信息] 清理旧容器...
%DOCKER_COMPOSE% down

REM 构建并启动服务
echo [信息] 构建镜像...
%DOCKER_COMPOSE% build

echo [信息] 启动所有服务...
%DOCKER_COMPOSE% up -d

REM 等待服务启动
echo.
echo [信息] 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo.
echo [服务状态]
%DOCKER_COMPOSE% ps

echo.
echo ================================
echo   [成功] 服务启动完成！
echo ================================
echo.
echo [访问地址]
echo    - H5 用户端:      http://localhost:8081
echo    - 管理后台:       http://localhost:8080
echo    - 后端 API:       http://localhost:3000
echo    - API 文档:       http://localhost:3000/api-docs
echo.
echo [默认管理员账号]
echo    - 用户名: admin
echo    - 密码: admin123
echo.
echo [常用命令]
echo    - 查看日志:       %DOCKER_COMPOSE% logs -f [服务名]
echo    - 停止服务:       %DOCKER_COMPOSE% stop
echo    - 启动服务:       %DOCKER_COMPOSE% start
echo    - 重启服务:       %DOCKER_COMPOSE% restart
echo    - 停止并删除:     %DOCKER_COMPOSE% down
echo    - 查看状态:       %DOCKER_COMPOSE% ps
echo.
echo [文档] 更多信息请查看: DOCKER_DEPLOY.md
echo ================================
echo.
pause

