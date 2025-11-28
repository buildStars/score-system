/**
 * resultAmount 逻辑验证测试
 * 
 * 运行方式：node test-result-amount.js
 */

// 模拟计算函数
function calculateMultipleBetResult(amount, isReturn, feeRate = 3, feeBase = 100, lossRate = 0.8) {
  const fee = Math.floor((amount / feeBase) * feeRate);
  
  if (isReturn) {
    // 回本：返还2倍本金
    // 净盈亏 = 2*amount - (amount + fee) = amount - fee
    const resultAmount = Math.floor(amount - fee);
    return { fee, loss: 0, resultAmount };
  } else {
    // 不回本：返还20%本金
    // 净盈亏 = 0.2*amount - (amount + fee) = -0.8*amount - fee
    const returnAmount = Math.floor(amount * (1 - lossRate));
    const resultAmount = Math.floor(returnAmount - amount - fee);
    return {
      fee,
      loss: Math.floor(amount * lossRate),
      resultAmount,
    };
  }
}

function calculateComboBetResult(amount, betContent, comboResult, isReturn, feeRate = 5, feeBase = 100) {
  const fee = Math.floor((amount / feeBase) * feeRate);
  const isMatched = betContent === comboResult;
  
  if (!isMatched) {
    // 没中奖（用户赢）-> 返还2倍本金
    // 净盈亏 = 2*amount - (amount + fee) = amount - fee
    const resultAmount = Math.floor(amount - fee);
    return { fee, resultAmount };
  }
  
  if (isReturn) {
    // 中奖且回本 -> 返还本金
    // 净盈亏 = amount - (amount + fee) = -fee
    const resultAmount = Math.floor(-fee);
    return { fee, resultAmount };
  }
  
  // 中奖且不回本 -> 扣除额外4倍本金（总共5倍）
  // 净盈亏 = -4*amount - (amount + fee) = -5*amount - fee
  const resultAmount = Math.floor(-5 * amount - fee);
  return { fee, resultAmount };
}

console.log('='.repeat(80));
console.log('🧪 resultAmount 逻辑验证测试');
console.log('='.repeat(80));

// 测试场景1：倍数下注 - 回本
console.log('\n【测试1】倍数下注 - 回本');
console.log('-'.repeat(80));
const test1 = {
  initialPoints: 10000,
  amount: 1000,
};
const result1 = calculateMultipleBetResult(test1.amount, true);
test1.deduct = test1.amount + result1.fee;
test1.pointsAfterBet = test1.initialPoints - test1.deduct;
test1.finalPoints = test1.pointsAfterBet + result1.resultAmount;

console.log(`初始积分：      ${test1.initialPoints}`);
console.log(`下注金额：      ${test1.amount}`);
console.log(`手续费：        ${result1.fee}`);
console.log(`下注扣除：      ${test1.deduct}`);
console.log(`下注后积分：    ${test1.pointsAfterBet}`);
console.log(`resultAmount：  ${result1.resultAmount > 0 ? '+' : ''}${result1.resultAmount} (净盈亏)`);
console.log(`最终积分：      ${test1.finalPoints}`);
console.log(`总盈亏：        ${test1.finalPoints - test1.initialPoints}`);
console.log(`✅ 期待：盈亏应该是 ${1000 - result1.fee}，实际是 ${result1.resultAmount}`);

// 测试场景2：倍数下注 - 不回本
console.log('\n【测试2】倍数下注 - 不回本');
console.log('-'.repeat(80));
const test2 = {
  initialPoints: 10000,
  amount: 1000,
};
const result2 = calculateMultipleBetResult(test2.amount, false);
test2.deduct = test2.amount + result2.fee;
test2.pointsAfterBet = test2.initialPoints - test2.deduct;
test2.finalPoints = test2.pointsAfterBet + result2.resultAmount;

console.log(`初始积分：      ${test2.initialPoints}`);
console.log(`下注金额：      ${test2.amount}`);
console.log(`手续费：        ${result2.fee}`);
console.log(`下注扣除：      ${test2.deduct}`);
console.log(`下注后积分：    ${test2.pointsAfterBet}`);
console.log(`resultAmount：  ${result2.resultAmount > 0 ? '+' : ''}${result2.resultAmount} (净盈亏)`);
console.log(`最终积分：      ${test2.finalPoints}`);
console.log(`总盈亏：        ${test2.finalPoints - test2.initialPoints}`);
console.log(`✅ 期待：盈亏应该是负数（亏损 -${Math.floor(test2.amount * 0.8 + result2.fee)}），实际是 ${result2.resultAmount}`);

// 测试场景3：组合下注 - 赢（没中奖）
console.log('\n【测试3】组合下注 - 赢（没中奖）');
console.log('-'.repeat(80));
const test3 = {
  initialPoints: 10000,
  amount: 1000,
  betContent: '大',
  comboResult: '小',
};
const result3 = calculateComboBetResult(test3.amount, test3.betContent, test3.comboResult, false);
test3.deduct = test3.amount + result3.fee;
test3.pointsAfterBet = test3.initialPoints - test3.deduct;
test3.finalPoints = test3.pointsAfterBet + result3.resultAmount;

console.log(`初始积分：      ${test3.initialPoints}`);
console.log(`下注金额：      ${test3.amount}`);
console.log(`下注内容：      ${test3.betContent}`);
console.log(`开奖结果：      ${test3.comboResult}`);
console.log(`手续费：        ${result3.fee}`);
console.log(`下注扣除：      ${test3.deduct}`);
console.log(`下注后积分：    ${test3.pointsAfterBet}`);
console.log(`resultAmount：  ${result3.resultAmount > 0 ? '+' : ''}${result3.resultAmount} (净盈亏)`);
console.log(`最终积分：      ${test3.finalPoints}`);
console.log(`总盈亏：        ${test3.finalPoints - test3.initialPoints}`);
console.log(`✅ 期待：盈亏应该是 ${test3.amount - result3.fee}，实际是 ${result3.resultAmount}`);

// 测试场景4：组合下注 - 中奖且回本
console.log('\n【测试4】组合下注 - 中奖且回本');
console.log('-'.repeat(80));
const test4 = {
  initialPoints: 10000,
  amount: 1000,
  betContent: '大',
  comboResult: '大',
};
const result4 = calculateComboBetResult(test4.amount, test4.betContent, test4.comboResult, true);
test4.deduct = test4.amount + result4.fee;
test4.pointsAfterBet = test4.initialPoints - test4.deduct;
test4.finalPoints = test4.pointsAfterBet + result4.resultAmount;

console.log(`初始积分：      ${test4.initialPoints}`);
console.log(`下注金额：      ${test4.amount}`);
console.log(`下注内容：      ${test4.betContent}`);
console.log(`开奖结果：      ${test4.comboResult} + 回本`);
console.log(`手续费：        ${result4.fee}`);
console.log(`下注扣除：      ${test4.deduct}`);
console.log(`下注后积分：    ${test4.pointsAfterBet}`);
console.log(`resultAmount：  ${result4.resultAmount > 0 ? '+' : ''}${result4.resultAmount} (净盈亏)`);
console.log(`最终积分：      ${test4.finalPoints}`);
console.log(`总盈亏：        ${test4.finalPoints - test4.initialPoints}`);
console.log(`✅ 期待：盈亏应该是 -${result4.fee}（只损失手续费），实际是 ${result4.resultAmount}`);

// 测试场景5：组合下注 - 中奖且不回本
console.log('\n【测试5】组合下注 - 中奖且不回本');
console.log('-'.repeat(80));
const test5 = {
  initialPoints: 10000,
  amount: 1000,
  betContent: '大',
  comboResult: '大',
};
const result5 = calculateComboBetResult(test5.amount, test5.betContent, test5.comboResult, false);
test5.deduct = test5.amount + result5.fee;
test5.pointsAfterBet = test5.initialPoints - test5.deduct;
test5.finalPoints = test5.pointsAfterBet + result5.resultAmount;

console.log(`初始积分：      ${test5.initialPoints}`);
console.log(`下注金额：      ${test5.amount}`);
console.log(`下注内容：      ${test5.betContent}`);
console.log(`开奖结果：      ${test5.comboResult} + 不回本`);
console.log(`手续费：        ${result5.fee}`);
console.log(`下注扣除：      ${test5.deduct}`);
console.log(`下注后积分：    ${test5.pointsAfterBet}`);
console.log(`resultAmount：  ${result5.resultAmount > 0 ? '+' : ''}${result5.resultAmount} (净盈亏)`);
console.log(`最终积分：      ${test5.finalPoints}`);
console.log(`总盈亏：        ${test5.finalPoints - test5.initialPoints}`);
console.log(`✅ 期待：盈亏应该是 -${5 * test5.amount + result5.fee}（损失5倍+手续费），实际是 ${result5.resultAmount}`);

// 综合验证
console.log('\n' + '='.repeat(80));
console.log('📊 综合验证结果');
console.log('='.repeat(80));

const tests = [
  { name: '倍数回本', expected: 1000 - 30, actual: result1.resultAmount, pass: result1.resultAmount === 970 },
  { name: '倍数不回本', expected: -(800 + 30), actual: result2.resultAmount, pass: result2.resultAmount === -830 },
  { name: '组合赢', expected: 1000 - 50, actual: result3.resultAmount, pass: result3.resultAmount === 950 },
  { name: '组合回本', expected: -50, actual: result4.resultAmount, pass: result4.resultAmount === -50 },
  { name: '组合不回本', expected: -(5000 + 50), actual: result5.resultAmount, pass: result5.resultAmount === -5050 },
];

let passCount = 0;
tests.forEach((test, index) => {
  const icon = test.pass ? '✅' : '❌';
  console.log(`${icon} 测试${index + 1} ${test.name}：期待 ${test.expected}，实际 ${test.actual}`);
  if (test.pass) passCount++;
});

console.log('\n' + '='.repeat(80));
console.log(`🎯 测试通过率：${passCount}/${tests.length} (${(passCount / tests.length * 100).toFixed(0)}%)`);
if (passCount === tests.length) {
  console.log('✅ 所有测试通过！resultAmount 逻辑修正正确！');
} else {
  console.log('❌ 有测试失败，请检查计算逻辑！');
}
console.log('='.repeat(80));

