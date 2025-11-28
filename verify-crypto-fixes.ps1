# crypto 问题修复验证脚本 (PowerShell版本)
# 检查所有 6 种解决方案的实施状态

Write-Host "验证 crypto.randomUUID() 修复状态..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

# 进入项目目录
Set-Location $PSScriptRoot

# 检查计数器
$totalChecks = 5
$passedChecks = 0

# 方案1：检查代码修复
Write-Host "方案1：代码层面修复" -ForegroundColor Yellow
$mainTsContent = Get-Content "backend\src\main.ts" -Raw -ErrorAction SilentlyContinue
if ($mainTsContent -match "import \* as crypto from 'crypto'" -and $mainTsContent -match "globalThis\.crypto") {
    Write-Host "   OK main.ts 中已添加 crypto 全局注入" -ForegroundColor Green
    $passedChecks++
}
else {
    Write-Host "   ERROR main.ts 中缺少 crypto 全局注入" -ForegroundColor Red
}
Write-Host ""

# 方案2：检查 Dockerfile
Write-Host "方案2：Docker Node.js 版本" -ForegroundColor Yellow
$dockerfileContent = Get-Content "backend\Dockerfile" -Raw -ErrorAction SilentlyContinue
if ($dockerfileContent -match "FROM node:20-alpine") {
    Write-Host "   OK Dockerfile 使用 Node.js 20" -ForegroundColor Green
    $passedChecks++
}
elseif ($dockerfileContent -match "FROM node:18-alpine") {
    Write-Host "   WARN Dockerfile 使用 Node.js 18 (建议升级到 20)" -ForegroundColor Yellow
}
else {
    Write-Host "   ERROR Dockerfile 未找到或版本不明确" -ForegroundColor Red
}
Write-Host ""

# 方案3：检查 package.json engines
Write-Host "方案3：package.json engines 字段" -ForegroundColor Yellow
$packageJsonContent = Get-Content "backend\package.json" -Raw -ErrorAction SilentlyContinue
if ($packageJsonContent -match '"engines"' -and $packageJsonContent -match '"node".*20') {
    Write-Host "   OK package.json 包含 engines.node >= 20" -ForegroundColor Green
    $passedChecks++
}
else {
    Write-Host "   ERROR package.json 缺少 engines 字段或版本要求" -ForegroundColor Red
}
Write-Host ""

# 方案4：检查 .nvmrc
Write-Host "方案4：.nvmrc 文件" -ForegroundColor Yellow
$nvmrcCount = 0
if (Test-Path "backend\.nvmrc") {
    $version = Get-Content "backend\.nvmrc"
    Write-Host "   OK backend\.nvmrc 存在 (版本: $version)" -ForegroundColor Green
    $nvmrcCount++
}
if (Test-Path ".nvmrc") {
    $version = Get-Content ".nvmrc"
    Write-Host "   OK .nvmrc 存在 (版本: $version)" -ForegroundColor Green
    $nvmrcCount++
}
if ($nvmrcCount -gt 0) {
    $passedChecks++
}
else {
    Write-Host "   ERROR 未找到 .nvmrc 文件" -ForegroundColor Red
}
Write-Host ""

# 方案5：检查 Railway 环境变量（提示）
Write-Host "方案5：Railway 环境变量（手动检查）" -ForegroundColor Yellow
Write-Host "   INFO 如果部署到 Railway，请在 Dashboard 中设置：" -ForegroundColor Cyan
Write-Host "      变量名: NIXPACKS_NODE_VERSION"
Write-Host "      值: 20"
Write-Host ""

# 方案6：检查 @nestjs/schedule 版本
Write-Host "方案6：@nestjs/schedule 版本" -ForegroundColor Yellow
if ($packageJsonContent -match '@nestjs/schedule.*?(\d+\.\d+\.\d+)') {
    Write-Host "   OK @nestjs/schedule 版本: ^$($matches[1])" -ForegroundColor Green
    $passedChecks++
}
else {
    Write-Host "   WARN 未找到 @nestjs/schedule 版本信息" -ForegroundColor Yellow
}
Write-Host ""

# 总结
Write-Host "========================================" -ForegroundColor Gray
Write-Host "验证结果: $passedChecks / $totalChecks 项通过" -ForegroundColor Cyan
Write-Host ""

if ($passedChecks -ge 4) {
    Write-Host "优秀！大部分修复已正确实施" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "   1. 提交代码到 Git"
    Write-Host "   2. 推送到远程仓库"
    Write-Host "   3. 在服务器上运行: ./rebuild-backend.sh"
    Write-Host "   4. (Railway) 设置环境变量 NIXPACKS_NODE_VERSION=20"
    Write-Host ""
}
elseif ($passedChecks -ge 2) {
    Write-Host "部分修复已实施，但建议完善" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Cyan
    Write-Host "   - 确保 package.json 包含 engines 字段"
    Write-Host "   - 创建 .nvmrc 文件"
    Write-Host "   - 升级 Dockerfile 到 Node.js 20"
    Write-Host ""
}
else {
    Write-Host "修复不完整，请检查以上各项" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看详细文档：" -ForegroundColor Cyan
    Write-Host "   - crypto修复说明.md"
    Write-Host "   - crypto问题完整解决方案.md"
    Write-Host ""
}
