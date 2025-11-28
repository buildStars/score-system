#!/bin/sh
# ============================================
# 后端启动脚本
# ============================================

set -e

echo "🚀 Starting Score System Backend..."

# 等待MySQL就绪
echo "⏳ Waiting for MySQL..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done
echo "✅ MySQL is ready!"

# 运行数据库迁移
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# 检查是否需要初始化种子数据
if [ "$INIT_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed || echo "⚠️  Seed failed or already exists"
fi

echo "✅ Backend initialization complete!"
echo "🎯 Starting application..."

# 执行传入的命令
exec "$@"



