#!/bin/bash

###############################################
# crypto 问题修复验证脚本
# 检查所有 6 种解决方案的实施状态
###############################################

echo "🔍 验证 crypto.randomUUID() 修复状态..."
echo "========================================"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查计数器
total_checks=6
passed_checks=0

# 方案1：检查代码修复
echo "📝 方案1：代码层面修复"
if grep -q "import \* as crypto from 'crypto'" backend/src/main.ts && \
   grep -q "globalThis.crypto" backend/src/main.ts; then
    echo "   ✅ main.ts 中已添加 crypto 全局注入"
    ((passed_checks++))
else
    echo "   ❌ main.ts 中缺少 crypto 全局注入"
fi
echo ""

# 方案2：检查 Dockerfile
echo "📦 方案2：Docker Node.js 版本"
if grep -q "FROM node:20-alpine" backend/Dockerfile; then
    echo "   ✅ Dockerfile 使用 Node.js 20"
    ((passed_checks++))
elif grep -q "FROM node:18-alpine" backend/Dockerfile; then
    echo "   ⚠️  Dockerfile 使用 Node.js 18 (建议升级到 20)"
else
    echo "   ❌ Dockerfile 未找到或版本不明确"
fi
echo ""

# 方案3：检查 package.json engines
echo "⚙️  方案3：package.json engines 字段"
if grep -q "\"engines\"" backend/package.json && \
   grep -A 2 "\"engines\"" backend/package.json | grep -q "\"node\".*20"; then
    echo "   ✅ package.json 包含 engines.node >= 20"
    ((passed_checks++))
else
    echo "   ❌ package.json 缺少 engines 字段或版本要求"
fi
echo ""

# 方案4：检查 .nvmrc
echo "📌 方案4：.nvmrc 文件"
nvmrc_count=0
if [ -f "backend/.nvmrc" ]; then
    version=$(cat backend/.nvmrc)
    echo "   ✅ backend/.nvmrc 存在 (版本: $version)"
    ((nvmrc_count++))
fi
if [ -f ".nvmrc" ]; then
    version=$(cat .nvmrc)
    echo "   ✅ .nvmrc 存在 (版本: $version)"
    ((nvmrc_count++))
fi
if [ $nvmrc_count -gt 0 ]; then
    ((passed_checks++))
else
    echo "   ❌ 未找到 .nvmrc 文件"
fi
echo ""

# 方案5：检查 Railway 环境变量（提示）
echo "☁️  方案5：Railway 环境变量（手动检查）"
echo "   ℹ️  如果部署到 Railway，请在 Dashboard 中设置："
echo "      变量名: NIXPACKS_NODE_VERSION"
echo "      值: 20"
echo ""

# 方案6：检查 @nestjs/schedule 版本
echo "📦 方案6：@nestjs/schedule 版本"
if [ -f "backend/package.json" ]; then
    schedule_version=$(grep "@nestjs/schedule" backend/package.json | grep -oP '"\^\K[0-9.]+' || echo "未找到")
    if [ "$schedule_version" != "未找到" ]; then
        echo "   ✅ @nestjs/schedule 版本: ^$schedule_version"
        ((passed_checks++))
    else
        echo "   ⚠️  未找到 @nestjs/schedule 版本信息"
    fi
else
    echo "   ❌ package.json 不存在"
fi
echo ""

# 总结
echo "========================================"
echo "📊 验证结果: $passed_checks / 5 项通过"
echo ""

if [ $passed_checks -ge 4 ]; then
    echo "✅ 优秀！大部分修复已正确实施"
    echo ""
    echo "🚀 下一步："
    echo "   1. 提交代码到 Git"
    echo "   2. 推送到远程仓库"
    echo "   3. 在服务器上运行: ./rebuild-backend.sh"
    echo "   4. (Railway) 设置环境变量 NIXPACKS_NODE_VERSION=20"
    echo ""
    exit 0
elif [ $passed_checks -ge 2 ]; then
    echo "⚠️  部分修复已实施，但建议完善"
    echo ""
    echo "📝 建议操作："
    echo "   - 确保 package.json 包含 engines 字段"
    echo "   - 创建 .nvmrc 文件"
    echo "   - 升级 Dockerfile 到 Node.js 20"
    echo ""
    exit 1
else
    echo "❌ 修复不完整，请检查以上各项"
    echo ""
    echo "📚 查看详细文档："
    echo "   - crypto修复说明.md"
    echo "   - crypto问题完整解决方案.md"
    echo ""
    exit 1
fi

