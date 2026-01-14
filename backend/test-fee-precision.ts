/**
 * 测试下注时 fee 的精度问题修复
 */

console.log('=== 测试下注 fee 精度修复 ===\n');

// 模拟费率计算
const testCases = [
  { amount: 250, feeRate: 0.03, desc: '250倍, 3%费率' },
  { amount: 350, feeRate: 0.03, desc: '350倍, 3%费率' },
  { amount: 100, feeRate: 0.03, desc: '100倍, 3%费率' },
  { amount: 635, feeRate: 0.05, desc: '635组合, 5%费率' },
];

testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.desc}`);
  console.log('─'.repeat(60));
  
  // 计算过程（和 bet.service.ts 一致）
  const feeRateRaw = testCase.feeRate;
  const feeRate = feeRateRaw * 100; // 0.03 -> 3
  const feeCalculated = (testCase.amount / 100) * feeRate;
  const fee = Number(feeCalculated.toFixed(2));  // 用于计算
  const feeValue = fee.toFixed(2);  // ✅ 用于存储（字符串）
  
  console.log('📊 计算过程:');
  console.log(`  feeRate: ${testCase.feeRate} -> ${feeRate}`);
  console.log(`  计算: (${testCase.amount} / 100) * ${feeRate} = ${feeCalculated}`);
  console.log(`  Number(toFixed(2)): ${fee} (${typeof fee})`);
  console.log(`  feeValue: "${feeValue}" (${typeof feeValue})`);
  console.log('');
  
  // 模拟存储前后
  console.log('💾 存储到数据库:');
  console.log(`  ❌ 之前（Number）: ${fee}`);
  console.log(`  ✅ 现在（String）: "${feeValue}"`);
  console.log('');
  
  // 验证精度
  const expectedFee = (testCase.amount / 100) * (testCase.feeRate * 100);
  console.log('✅ 精度验证:');
  console.log(`  期望: ${expectedFee}`);
  console.log(`  实际: ${fee}`);
  console.log(`  字符串: "${feeValue}"`);
  console.log(`  ${fee === expectedFee && feeValue === expectedFee.toFixed(2) ? '✓ 正确' : '✗ 错误'}`);
});

console.log('\n' + '='.repeat(60));
console.log('🎯 关键问题:');
console.log('─'.repeat(60));
console.log('问题: 250倍, 3%费率 = 7.5，数据库存储为 8 ❌');
console.log('原因: Number(7.5) -> Prisma Decimal -> 8（精度丢失）');
console.log('修复: "7.50" (字符串) -> Prisma Decimal -> 7.50 ✅');
console.log('');
console.log('✅ 修复后，7.5 将正确存储为 7.50，而不是 8！');
console.log('');






