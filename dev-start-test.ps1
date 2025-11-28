# ============================================
# 计分系统 - 开发环境一键启动脚本 (PowerShell)
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  计分系统 - 开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[模式] 开发模式（支持热重载）" -ForegroundColor Yellow
Write-Host "  - Docker: MySQL + Redis"
Write-Host "  - 本地: 后端 + 管理后台 + H5前端"
Write-Host ""

# 检查 Node.js
Write-Host "[检查] 检查 Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[成功] Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] Node.js 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Node.js (18+):"
    Write-Host "https://nodejs.org/"
    Write-Host ""
    pause
    exit 1
}

# 检查 npm
Write-Host ""
Write-Host "[检查] 检查 npm..." -ForegroundColor Green
try {
    $npmVersion = npm --version 2>$null
    Write-Host "[成功] npm 已安装: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] npm 未安装" -ForegroundColor Red
    pause
    exit 1
}

# 检查 Docker
Write-Host ""
Write-Host "[检查] 检查 Docker..." -ForegroundColor Green
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "[成功] Docker 已安装: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] Docker 未安装或未启动" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装并启动 Docker Desktop"
    Write-Host "https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    pause
    exit 1
}

# 检查 Docker 是否运行
Write-Host ""
Write-Host "[检查] 检查 Docker 是否运行..." -ForegroundColor Green
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker 未运行"
    }
    Write-Host "[成功] Docker 正在运行" -ForegroundColor Green
} catch {
    Write-Host "[错误] Docker 未运行" -ForegroundColor Red
    Write-Host ""
    Write-Host "请启动 Docker Desktop 后重试"
    Write-Host ""
    pause
    exit 1
}

# 检查 Docker Compose
Write-Host ""
Write-Host "[检查] 检查 Docker Compose..." -ForegroundColor Green
$dockerCompose = "docker compose"
try {
    docker compose version 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "使用 docker-compose"
    }
    Write-Host "[成功] Docker Compose 可用" -ForegroundColor Green
} catch {
    $dockerCompose = "docker-compose"
    Write-Host "[成功] 使用 docker-compose" -ForegroundColor Green
}

# 检查项目目录
Write-Host ""
Write-Host "[检查] 检查项目目录..." -ForegroundColor Green
if (-not (Test-Path "backend")) {
    Write-Host "[错误] backend 目录不存在" -ForegroundColor Red
    pause
    exit 1
}
if (-not (Test-Path "frontend-admin")) {
    Write-Host "[错误] frontend-admin 目录不存在" -ForegroundColor Red
    pause
    exit 1
}
if (-not (Test-Path "frontend-h5")) {
    Write-Host "[错误] frontend-h5 目录不存在" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[成功] 所有项目目录存在" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动 Docker 服务
Write-Host "[步骤 1/7] 启动 Docker 服务（MySQL + Redis）..." -ForegroundColor Yellow
if ($dockerCompose -eq "docker compose") {
    docker compose -f docker-compose.dev.yml up -d
} else {
    docker-compose -f docker-compose.dev.yml up -d
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] Docker 服务启动失败" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[完成] Docker 服务已启动" -ForegroundColor Green

# 等待数据库就绪
Write-Host ""
Write-Host "[步骤 2/7] 等待数据库就绪（10秒）..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "[完成] 等待完成" -ForegroundColor Green

# 检查 Docker 服务状态
Write-Host ""
Write-Host "[步骤 3/7] 检查 Docker 服务状态..." -ForegroundColor Yellow
if ($dockerCompose -eq "docker compose") {
    docker compose -f docker-compose.dev.yml ps
} else {
    docker-compose -f docker-compose.dev.yml ps
}
Write-Host ""

# 检查并安装后端依赖
Write-Host "[步骤 4/7] 检查后端依赖..." -ForegroundColor Yellow
Push-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "[信息] 首次运行，正在安装后端依赖（可能需要几分钟）..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 后端依赖安装失败" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "[完成] 后端依赖已就绪" -ForegroundColor Green

# 运行数据库迁移
Write-Host ""
Write-Host "[信息] 运行数据库迁移..." -ForegroundColor Cyan
npx prisma generate 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[警告] Prisma generate 失败，继续执行..." -ForegroundColor Yellow
}
npx prisma migrate deploy 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[警告] 数据库迁移失败，请检查数据库连接" -ForegroundColor Yellow
}
Pop-Location

# 检查并安装管理后台依赖
Write-Host ""
Write-Host "[步骤 5/7] 检查管理后台依赖..." -ForegroundColor Yellow
Push-Location frontend-admin
if (-not (Test-Path "node_modules")) {
    Write-Host "[信息] 首次运行，正在安装管理后台依赖（可能需要几分钟）..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 管理后台依赖安装失败" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "[完成] 管理后台依赖已就绪" -ForegroundColor Green
Pop-Location

# 检查并安装 H5 前端依赖
Write-Host ""
Write-Host "[步骤 6/7] 检查 H5 前端依赖..." -ForegroundColor Yellow
Push-Location frontend-h5
if (-not (Test-Path "node_modules")) {
    Write-Host "[信息] 首次运行，正在安装 H5 前端依赖（可能需要几分钟）..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] H5 前端依赖安装失败" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "[完成] H5 前端依赖已就绪" -ForegroundColor Green
Pop-Location

# 启动所有应用
Write-Host ""
Write-Host "[步骤 7/7] 启动所有应用（在新窗口中）..." -ForegroundColor Yellow
Write-Host ""

$currentPath = Get-Location

# 启动后端
Write-Host "[启动] 后端服务 (http://localhost:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\backend'; npm run start:dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# 启动管理后台
Write-Host "[启动] 管理后台 (http://localhost:5174)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\frontend-admin'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# 启动 H5 前端
Write-Host "[启动] H5 前端 (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\frontend-h5'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[服务状态]" -ForegroundColor Green
Write-Host "  已在新窗口中启动以下服务：" -ForegroundColor White
Write-Host "  1. 后端 API     - 新窗口运行中"
Write-Host "  2. 管理后台     - 新窗口运行中"
Write-Host "  3. H5 前端      - 新窗口运行中"
Write-Host ""
Write-Host "[Docker 服务]" -ForegroundColor Green
Write-Host "  - MySQL:  localhost:3307 (注意：非默认端口)" -ForegroundColor Yellow
Write-Host "  - Redis:  localhost:6380 (注意：非默认端口)" -ForegroundColor Yellow
Write-Host ""
Write-Host "[等待启动]" -ForegroundColor Green
Write-Host "  请等待 30-60 秒让所有服务完全启动"
Write-Host ""
Write-Host "[访问地址]（服务启动后访问）" -ForegroundColor Green
Write-Host "  - 后端 API:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - API 文档:     http://localhost:3000/api-docs" -ForegroundColor Cyan
Write-Host "  - 管理后台:     http://localhost:5174" -ForegroundColor Cyan
Write-Host "  - H5 前端:      http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "[默认账号]" -ForegroundColor Green
Write-Host "  管理员: admin / admin123"
Write-Host "  用户:   user1 / 123456"
Write-Host ""
Write-Host "[如何停止]" -ForegroundColor Green
Write-Host "  1. 关闭所有新打开的 PowerShell 窗口"
Write-Host "  2. 运行以下命令停止 Docker 服务："
Write-Host "     docker compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
Write-Host ""
Write-Host "[热重载]" -ForegroundColor Green
Write-Host "  修改代码后会自动重新编译和刷新"
Write-Host "  - 后端: 自动重启服务"
Write-Host "  - 前端: 自动刷新页面"
Write-Host ""
Write-Host "[提示]" -ForegroundColor Green
Write-Host "  保持此窗口打开以查看启动信息"
Write-Host "  各服务的详细日志在对应的新窗口中"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
pause

