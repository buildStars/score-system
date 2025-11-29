#!/bin/bash

# 调试后端容器脚本

echo "===  进入后端容器并查看文件结构 ==="

docker-compose run --rm backend sh -c "
echo '=== 当前工作目录 ==='
pwd

echo ''
echo '=== /app 目录内容 ==='
ls -la /app

echo ''
echo '=== 查找 main.js 文件 ==='
find /app -name 'main.js' -type f

echo ''
echo '=== dist 目录是否存在 ==='
ls -la /app/dist || echo 'dist 目录不存在'

echo ''
echo '=== package.json 的 build 脚本 ==='
cat /app/package.json | grep -A 1 '\"build\"'

echo ''
echo '=== 手动运行构建 ==='
cd /app && npm run build

echo ''
echo '=== 构建后的 dist 目录 ==='
ls -la /app/dist
ls -la /app/dist/src 2>/dev/null || echo 'dist/src 不存在'
"


