/**
 * 检查期号 3365916 下注时的手续费计算
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFee() {
  console.log('=== 检查手续费计算 ===\n');

  // 查询实际的下注记录
  const bets = await prisma.bet.findMany({
    where: {
      issue: '3365916',
      userId: 1,
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`找到 ${bets.length} 笔下注记录:\n`);

  let totalFee = 0;
  bets.forEach((bet, index) => {
    console.log(`下注 ${index + 1}:`);
    console.log(`  betType: ${bet.betType}`);
    console.log(`  betContent: ${bet.betContent}`);
    console.log(`  amount: ${bet.amount}`);
    console.log(`  fee: ${bet.fee}`);
    console.log(`  resultAmount: ${bet.resultAmount}`);
    console.log('');
    totalFee += Number(bet.fee);
  });

  console.log(`总手续费: ${totalFee.toFixed(2)}`);
  console.log('');

  // 检查 bet_type_settings
  const settings = await prisma.betTypeSetting.findMany({
    where: {
      betType: {
        in: ['multiple', 'small_odd'],
      },
    },
  });

  console.log('当前手续费率配置:');
  settings.forEach(s => {
    console.log(`  ${s.betType}: ${s.feeRate} (${Number(s.feeRate) * 100}%)`);
  });

  await prisma.$disconnect();
}

checkFee().catch(console.error);

