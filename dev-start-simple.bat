@echo off
chcp 65001 >nul

REM ============================================
REM 开发环境简化启动脚本
REM ============================================

echo.
echo ========================================
echo   开发环境启动（简化版）
echo ========================================
echo.

REM 设置错误时不退出，显示所有输出
set DOCKER_COMPOSE=docker-compose

REM 步骤1：启动 Docker 服务
echo [1/4] 启动 MySQL 和 Redis...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo.
    echo [错误] Docker 服务启动失败
    echo 请检查：
    echo 1. Docker Desktop 是否已启动
    echo 2. docker-compose.dev.yml 文件是否存在
    echo.
    goto :error_exit
)
echo [成功] Docker 服务已启动
echo.

REM 步骤2：等待数据库
echo [2/4] 等待数据库启动（15秒）...
timeout /t 15 /nobreak
echo [完成] 等待结束
echo.

REM 步骤3：检查依赖
echo [3/4] 检查项目依赖...
echo.

REM 检查后端
if not exist "backend\node_modules" (
    echo [提示] 后端依赖未安装
    echo 请手动运行: cd backend ^&^& npm install
    echo.
)

REM 检查管理后台
if not exist "frontend-admin\node_modules" (
    echo [提示] 管理后台依赖未安装
    echo 请手动运行: cd frontend-admin ^&^& npm install
    echo.
)

REM 检查 H5 前端
if not exist "frontend-h5\node_modules" (
    echo [提示] H5 前端依赖未安装
    echo 请手动运行: cd frontend-h5 ^&^& npm install
    echo.
)

REM 步骤4：启动应用
echo [4/4] 启动应用...
echo.

echo [启动] 后端服务...
start "后端API" cmd /k "cd /d %~dp0backend && npm run start:dev || pause"

echo [启动] 管理后台...
start "管理后台" cmd /k "cd /d %~dp0frontend-admin && npm run dev || pause"

echo [启动] H5 前端...
start "H5前端" cmd /k "cd /d %~dp0frontend-h5 && npm run dev || pause"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo [Docker 服务]
echo   MySQL: localhost:3306
echo   Redis: localhost:6379
echo.
echo [等待启动]
echo   请等待 30-60 秒让所有服务完全启动
echo   如果某个服务启动失败，会在对应窗口显示错误
echo.
echo [访问地址]（启动后）
echo   后端 API:    http://localhost:3000
echo   管理后台:    http://localhost:5174
echo   H5 前端:     http://localhost:5173
echo.
echo [停止服务]
echo   关闭新打开的窗口，然后运行 dev-stop.bat
echo.
echo ========================================
echo.
goto :end

:error_exit
echo.
echo 启动失败，请检查错误信息
echo.

:end
pause


