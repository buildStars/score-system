/**
 * 测试 Prisma.Decimal 的存储和读取
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 测试 Prisma.Decimal 存储和读取 ===\n');
  
  // 1. 创建测试数据
  console.log('1️⃣ 创建测试数据...\n');
  
  const testFee = 7.5;
  const feeDecimal = new Prisma.Decimal(testFee.toFixed(2));
  
  console.log(`输入 fee: ${testFee}`);
  console.log(`fee.toFixed(2): "${testFee.toFixed(2)}"`);
  console.log(`Prisma.Decimal: `, feeDecimal);
  console.log(`feeDecimal.toString(): "${feeDecimal.toString()}"`);
  console.log(`feeDecimal.toNumber(): ${feeDecimal.toNumber()}`);
  console.log('');
  
  // 2. 插入数据库
  console.log('2️⃣ 插入数据库...\n');
  
  const bet = await prisma.bet.create({
    data: {
      userId: 1,
      issue: 'TEST_DECIMAL',
      betType: 'multiple',
      betContent: '250',
      amount: 250,
      fee: feeDecimal,
      pointsBefore: 1000,
      status: 'pending',
    },
  });
  
  console.log(`✅ 插入成功, bet.id=${bet.id}`);
  console.log(`   bet.fee: ${bet.fee}`);
  console.log(`   bet.fee (typeof): ${typeof bet.fee}`);
  console.log(`   bet.fee (constructor): ${bet.fee.constructor.name}`);
  console.log(`   bet.fee.toString(): "${bet.fee.toString()}"`);
  console.log(`   JSON.stringify(bet.fee): ${JSON.stringify(bet.fee)}`);
  console.log('');
  
  // 3. 重新查询
  console.log('3️⃣ 重新查询...\n');
  
  const fetchedBet = await prisma.bet.findUnique({
    where: { id: bet.id },
  });
  
  if (fetchedBet) {
    console.log(`✅ 查询成功`);
    console.log(`   fetchedBet.fee: ${fetchedBet.fee}`);
    console.log(`   fetchedBet.fee (typeof): ${typeof fetchedBet.fee}`);
    console.log(`   fetchedBet.fee.toString(): "${fetchedBet.fee.toString()}"`);
    console.log(`   Number(fetchedBet.fee): ${Number(fetchedBet.fee)}`);
    console.log(`   Number(fetchedBet.fee).toFixed(2): "${Number(fetchedBet.fee).toFixed(2)}"`);
  }
  console.log('');
  
  // 4. 原始SQL查询
  console.log('4️⃣ 原始 SQL 查询...\n');
  
  const rawResult: any = await prisma.$queryRaw`
    SELECT id, amount, fee 
    FROM bet 
    WHERE id = ${bet.id}
  `;
  
  console.log('原始 SQL 结果:', rawResult);
  console.log(`   fee 值: ${rawResult[0].fee}`);
  console.log(`   fee 类型: ${typeof rawResult[0].fee}`);
  console.log('');
  
  // 5. 清理测试数据
  console.log('5️⃣ 清理测试数据...\n');
  
  await prisma.bet.delete({
    where: { id: bet.id },
  });
  
  console.log('✅ 测试数据已删除');
  console.log('');
  
  console.log('=== 测试完成 ===');
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

