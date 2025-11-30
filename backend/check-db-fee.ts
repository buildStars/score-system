import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 检查数据库中 fee 的实际存储值 ===\n');
  
  // 查询最新的几笔下注
  const bets = await prisma.bet.findMany({
    where: {
      id: {
        gte: 113,  // 从 113 开始（包含 113, 114）
      },
    },
    orderBy: {
      id: 'desc',
    },
    take: 5,
  });
  
  console.log('📋 最新下注记录:\n');
  bets.forEach(bet => {
    console.log(`bet ${bet.id}:`);
    console.log(`  amount: ${bet.amount} (${typeof bet.amount})`);
    console.log(`  fee: ${bet.fee} (${typeof bet.fee})`);
    console.log(`  fee.toString(): "${bet.fee.toString()}"`);
    console.log('');
    
    // 验证计算
    const amount = Number(bet.amount);
    const expectedFee = (amount / 100) * 3;
    const expectedFeeStr = expectedFee.toFixed(2);
    
    console.log(`  计算验证:`);
    console.log(`    (${amount} / 100) * 3 = ${expectedFee}`);
    console.log(`    期望 fee: "${expectedFeeStr}"`);
    console.log(`    实际 fee: "${bet.fee.toString()}"`);
    console.log(`    ${bet.fee.toString() === expectedFeeStr ? '✅ 正确' : '❌ 错误'}`);
    console.log('');
  });
  
  // 原始 SQL 查询
  console.log('🔍 原始 SQL 查询:\n');
  const rawResult = await prisma.$queryRaw`
    SELECT id, amount, fee 
    FROM bet 
    WHERE id >= 113 
    ORDER BY id DESC 
    LIMIT 5
  `;
  console.log(rawResult);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

