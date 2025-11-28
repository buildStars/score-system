@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ============================================
REM 计分系统 - 开发环境一键启动脚本
REM ============================================
REM 
REM 功能说明：
REM 1. Docker 启动 MySQL 和 Redis
REM 2. 本地启动后端（支持热重载）
REM 3. 本地启动管理后台（支持热重载）
REM 4. 本地启动 H5 前端（支持热重载）
REM 
REM ============================================

echo.
echo ========================================
echo   计分系统 - 开发环境启动
echo ========================================
echo.
echo [模式] 开发模式（支持热重载）
echo   - Docker: MySQL + Redis
echo   - 本地: 后端 + 管理后台 + H5前端
echo.

REM 检查 Node.js
echo [检查] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js 未安装
    echo.
    echo 请先安装 Node.js (18+):
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [成功] Node.js 已安装
node --version

REM 检查 npm
echo.
echo [检查] 检查 npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] npm 未安装
    pause
    exit /b 1
)
echo [成功] npm 已安装
npm --version

REM 检查 Docker
echo.
echo [检查] 检查 Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装或未启动
    echo.
    echo 请先安装并启动 Docker Desktop
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)
echo [成功] Docker 已安装
docker --version

REM 检查 Docker 是否运行
echo.
echo [检查] 检查 Docker 是否运行...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行
    echo.
    echo 请启动 Docker Desktop 后重试
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

REM 检查项目目录
echo.
echo [检查] 检查项目目录...
if not exist "backend" (
    echo [错误] backend 目录不存在
    pause
    exit /b 1
)
if not exist "frontend-admin" (
    echo [错误] frontend-admin 目录不存在
    pause
    exit /b 1
)
if not exist "frontend-h5" (
    echo [错误] frontend-h5 目录不存在
    pause
    exit /b 1
)
echo [成功] 所有项目目录存在

echo.
echo ========================================
echo   启动服务
echo ========================================
echo.

REM 启动 Docker 服务（MySQL + Redis）
echo [步骤 1/7] 启动 Docker 服务（MySQL + Redis）...
%DOCKER_COMPOSE% -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo [错误] Docker 服务启动失败
    pause
    exit /b 1
)
echo [完成] Docker 服务已启动

REM 等待数据库就绪
echo.
echo [步骤 2/7] 等待数据库就绪（10秒）...
timeout /t 10 /nobreak >nul
echo [完成] 等待完成

REM 检查 Docker 服务状态
echo.
echo [步骤 3/7] 检查 Docker 服务状态...
%DOCKER_COMPOSE% -f docker-compose.dev.yml ps
echo.

REM 检查并安装后端依赖
echo [步骤 4/7] 检查后端依赖...
if exist "backend" (
    cd backend
    if not exist "node_modules" (
        echo [信息] 首次运行，正在安装后端依赖（可能需要几分钟）...
        call npm install
        if errorlevel 1 (
            echo [错误] 后端依赖安装失败
            cd ..
            pause
            exit /b 1
        )
    )
    echo [完成] 后端依赖已就绪
    
    REM 运行数据库迁移
    echo.
    echo [信息] 运行数据库迁移...
    call npx prisma generate 2>nul
    if errorlevel 1 (
        echo [警告] Prisma generate 失败，继续执行...
    )
    call npx prisma migrate deploy 2>nul
    if errorlevel 1 (
        echo [警告] 数据库迁移失败，请检查数据库连接
    )
    cd ..
) else (
    echo [错误] backend 目录不存在
    pause
    exit /b 1
)

REM 检查并安装管理后台依赖
echo.
echo [步骤 5/7] 检查管理后台依赖...
if exist "frontend-admin" (
    cd frontend-admin
    if not exist "node_modules" (
        echo [信息] 首次运行，正在安装管理后台依赖（可能需要几分钟）...
        call npm install
        if errorlevel 1 (
            echo [错误] 管理后台依赖安装失败
            cd ..
            pause
            exit /b 1
        )
    )
    echo [完成] 管理后台依赖已就绪
    cd ..
) else (
    echo [错误] frontend-admin 目录不存在
    pause
    exit /b 1
)

REM 检查并安装 H5 前端依赖
echo.
echo [步骤 6/7] 检查 H5 前端依赖...
if exist "frontend-h5" (
    cd frontend-h5
    if not exist "node_modules" (
        echo [信息] 首次运行，正在安装 H5 前端依赖（可能需要几分钟）...
        call npm install
        if errorlevel 1 (
            echo [错误] H5 前端依赖安装失败
            cd ..
            pause
            exit /b 1
        )
    )
    echo [完成] H5 前端依赖已就绪
    cd ..
) else (
    echo [错误] frontend-h5 目录不存在
    pause
    exit /b 1
)

REM 启动所有应用
echo.
echo [步骤 7/7] 启动所有应用（在新窗口中）...
echo.

REM 启动后端
echo [启动] 后端服务 (http://localhost:3000)...
start "【后端API】计分系统" cmd /k "cd /d %cd%\backend && npm run start:dev"
timeout /t 2 >nul

REM 启动管理后台
echo [启动] 管理后台 (http://localhost:5174)...
start "【管理后台】计分系统" cmd /k "cd /d %cd%\frontend-admin && npm run dev"
timeout /t 2 >nul

REM 启动 H5 前端
echo [启动] H5 前端 (http://localhost:5173)...
start "【H5前端】计分系统" cmd /k "cd /d %cd%\frontend-h5 && npm run dev"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo [服务状态]
echo   已在新窗口中启动以下服务：
echo   1. 后端 API     - 新窗口运行中
echo   2. 管理后台     - 新窗口运行中
echo   3. H5 前端      - 新窗口运行中
echo.
echo [Docker 服务]
echo   - MySQL:  localhost:3306
echo   - Redis:  localhost:6379
echo.
echo [等待启动]
echo   请等待 30-60 秒让所有服务完全启动
echo.
echo [访问地址]（服务启动后访问）
echo   - 后端 API:     http://localhost:3000
echo   - API 文档:     http://localhost:3000/api-docs
echo   - 管理后台:     http://localhost:5174
echo   - H5 前端:      http://localhost:5173
echo.
echo [默认账号]
echo   管理员: admin / admin123
echo   用户:   user1 / 123456
echo.
echo [如何停止]
echo   1. 关闭所有新打开的命令行窗口
echo   2. 运行 dev-stop.bat 停止 Docker 服务
echo   或运行: docker-compose -f docker-compose.dev.yml down
echo.
echo [热重载]
echo   修改代码后会自动重新编译和刷新
echo   - 后端: 自动重启服务
echo   - 前端: 自动刷新页面
echo.
echo [提示]
echo   保持此窗口打开以查看启动信息
echo   各服务的详细日志在对应的新窗口中
echo.
echo ========================================
echo.
pause

