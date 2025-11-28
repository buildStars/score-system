# Simple Dev Start Script
# Avoid encoding issues by using minimal Chinese characters

Write-Host "========================================"
Write-Host "Score System - Development Environment"
Write-Host "========================================"
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Green
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not installed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "OK: Node.js $nodeVersion" -ForegroundColor Green

# Check Docker
Write-Host ""
Write-Host "Checking Docker..." -ForegroundColor Green
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker not installed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "OK: Docker installed" -ForegroundColor Green

# Check Docker is running
Write-Host ""
Write-Host "Checking Docker status..." -ForegroundColor Green
docker ps 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "OK: Docker is running" -ForegroundColor Green

# Start Docker services
Write-Host ""
Write-Host "========================================"
Write-Host "Starting Docker Services..."
Write-Host "========================================"
Write-Host ""

Write-Host "[1/7] Starting MySQL + Redis..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "OK: Docker services started" -ForegroundColor Green

# Wait for database
Write-Host ""
Write-Host "[2/7] Waiting for database (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "OK: Wait complete" -ForegroundColor Green

# Check Docker status
Write-Host ""
Write-Host "[3/7] Checking Docker services..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml ps
Write-Host ""

# Backend dependencies
Write-Host "[4/7] Checking backend dependencies..." -ForegroundColor Yellow
Push-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "OK: Backend dependencies ready" -ForegroundColor Green

# Run database migration
Write-Host ""
Write-Host "Running database migration..." -ForegroundColor Cyan
npx prisma generate 2>$null
npx prisma migrate deploy 2>$null
Pop-Location

# Frontend-admin dependencies
Write-Host ""
Write-Host "[5/7] Checking admin frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend-admin
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing admin frontend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install admin dependencies" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "OK: Admin frontend dependencies ready" -ForegroundColor Green
Pop-Location

# Frontend-h5 dependencies
Write-Host ""
Write-Host "[6/7] Checking H5 frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend-h5
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing H5 frontend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install H5 dependencies" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
}
Write-Host "OK: H5 frontend dependencies ready" -ForegroundColor Green
Pop-Location

# Start all applications
Write-Host ""
Write-Host "[7/7] Starting all applications (in new windows)..." -ForegroundColor Yellow
Write-Host ""

$currentPath = Get-Location

# Start backend
Write-Host "Starting backend (http://localhost:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\backend'; npm run start:dev"
Start-Sleep -Seconds 2

# Start admin frontend
Write-Host "Starting admin frontend (http://localhost:5174)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\frontend-admin'; npm run dev"
Start-Sleep -Seconds 2

# Start H5 frontend
Write-Host "Starting H5 frontend (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\frontend-h5'; npm run dev"

Write-Host ""
Write-Host "========================================"
Write-Host "Startup Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "[Services Started]" -ForegroundColor Green
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - API Docs: http://localhost:3000/api-docs" -ForegroundColor Cyan
Write-Host "  - Admin: http://localhost:5174" -ForegroundColor Cyan
Write-Host "  - H5: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "[Docker Services]" -ForegroundColor Green
Write-Host "  - MySQL: localhost:3307" -ForegroundColor Yellow
Write-Host "  - Redis: localhost:6380" -ForegroundColor Yellow
Write-Host ""
Write-Host "[Default Account]" -ForegroundColor Green
Write-Host "  Admin: admin / admin123"
Write-Host "  User: user1 / 123456"
Write-Host ""
Write-Host "[Wait]" -ForegroundColor Green
Write-Host "  Please wait 30-60 seconds for all services to start"
Write-Host ""
Write-Host "[Stop Services]" -ForegroundColor Green
Write-Host "  1. Close all new PowerShell windows"
Write-Host "  2. Run: docker compose -f docker-compose.dev.yml down"
Write-Host ""
Write-Host "========================================"
Write-Host ""
pause

