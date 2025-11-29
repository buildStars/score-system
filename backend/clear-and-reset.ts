/**
 * 清空并重置数据（准备测试新规则）
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAndReset() {
  console.log('🔄 清空并重置数据...\n');

  try {
    // 1. 删除所有下注记录
    const deletedBets = await prisma.bet.deleteMany({});
    console.log(`✅ 删除了 ${deletedBets.count} 条下注记录`);

    // 2. 删除所有积分记录
    const deletedPoints = await prisma.pointRecord.deleteMany({});
    console.log(`✅ 删除了 ${deletedPoints.count} 条积分记录`);

    // 3. 删除所有开奖记录
    const deletedLottery = await prisma.lotteryResult.deleteMany({});
    console.log(`✅ 删除了 ${deletedLottery.count} 条开奖记录`);

    // 4. 重置所有用户积分为 10000
    const updatedUsers = await prisma.user.updateMany({
      data: { points: 10000 },
    });
    console.log(`✅ 重置了 ${updatedUsers.count} 个用户的积分为 10000`);

    console.log('\n🎉 数据清空完成！准备好测试新规则了！\n');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAndReset();

