/**
 * 开奖规则工具类
 * 包含回本判定、大小单双判定等核心业务逻辑
 */

/**
 * 判断是否为顺子
 */
export function isShunzi(n1: number, n2: number, n3: number): boolean {
  const arr = [n1, n2, n3].sort((a, b) => a - b);
  
  // 普通顺子：三个数字连续
  if (arr[1] - arr[0] === 1 && arr[2] - arr[1] === 1) {
    return true;
  }
  
  // 特殊顺子：0,8,9 或 0,1,9
  if (arr[0] === 0 && arr[1] === 8 && arr[2] === 9) return true;
  if (arr[0] === 0 && arr[1] === 1 && arr[2] === 9) return true;
  
  return false;
}

/**
 * 判断是否回本
 * 
 * 回本条件（满足任一即可）：
 * 1. 对子：三个号码中有两个相同
 * 2. 豹子：三个号码完全相同
 * 3. 顺子：三个号码任意排列为连续数字
 * 4. 总和为13或14
 */
export function isReturn(n1: number, n2: number, n3: number, sum: number): {
  isReturn: boolean;
  reason: string | null;
} {
  // 1. 检查对子或豹子
  if (n1 === n2 && n1 === n3) {
    return { isReturn: true, reason: '豹子' };
  }
  if (n1 === n2 || n1 === n3 || n2 === n3) {
    return { isReturn: true, reason: '对子' };
  }
  
  // 2. 检查顺子
  if (isShunzi(n1, n2, n3)) {
    return { isReturn: true, reason: '顺子' };
  }
  
  // 3. 检查总和13或14
  if (sum === 13 || sum === 14) {
    return { isReturn: true, reason: `总和${sum}` };
  }
  
  return { isReturn: false, reason: null };
}

/**
 * 计算大小结果
 */
export function getSizeResult(sum: number): '大' | '小' {
  return sum >= 14 ? '大' : '小';
}

/**
 * 计算单双结果
 */
export function getOddEvenResult(sum: number): '单' | '双' {
  return sum % 2 === 1 ? '单' : '双';
}

/**
 * 计算组合结果
 */
export function getComboResult(sum: number): '大单' | '大双' | '小单' | '小双' {
  const size = getSizeResult(sum);
  const oddEven = getOddEvenResult(sum);
  
  if (size === '大' && oddEven === '单') return '大单';
  if (size === '大' && oddEven === '双') return '大双';
  if (size === '小' && oddEven === '单') return '小单';
  return '小双';
}

/**
 * 判断组合下注是否中奖
 */
export function isComboBetWin(betContent: string, resultSum: number): boolean {
  const size = getSizeResult(resultSum);
  const oddEven = getOddEvenResult(resultSum);
  const combo = getComboResult(resultSum);
  
  switch (betContent) {
    case '大': return size === '大';
    case '小': return size === '小';
    case '单': return oddEven === '单';
    case '双': return oddEven === '双';
    case '大单': return combo === '大单';
    case '大双': return combo === '大双';
    case '小单': return combo === '小单';
    case '小双': return combo === '小双';
    default: return false;
  }
}

/**
 * 计算倍数下注结果
 * resultAmount 表示净盈亏（已扣除本金和手续费）
 */
export function calculateMultipleBetResult(
  amount: number,
  isReturn: boolean,
  feeRate: number,
  feeBase: number,
  lossRate: number,
): {
  fee: number;
  loss: number;
  resultAmount: number;
} {
  const fee = Math.floor((amount / feeBase) * feeRate);
  
  if (isReturn) {
    // 回本：返还2倍本金
    // 下注时扣了：amount + fee
    // 结算时返还：2 * amount
    // 净盈亏 = 2*amount - (amount + fee) = amount - fee
    const resultAmount = Math.floor(amount - fee);
    return {
      fee,
      loss: 0,
      resultAmount,
    };
  } else {
    // 不回本：返还20%本金
    // 下注时扣了：amount + fee
    // 结算时返还：0.2 * amount
    // 净盈亏 = 0.2*amount - (amount + fee) = -0.8*amount - fee
    const returnAmount = Math.floor(amount * (1 - lossRate));  // 20%本金
    const resultAmount = Math.floor(returnAmount - amount - fee);
    return {
      fee,
      loss: Math.floor(amount * lossRate),
      resultAmount,
    };
  }
}

/**
 * 计算组合下注结果（反向逻辑）
 * resultAmount 表示净盈亏（已扣除本金和手续费）
 */
export function calculateComboBetResult(
  amount: number,
  betContent: string,
  comboResult: string,
  isReturn: boolean,
  feeRate: number,
  feeBase: number,
): {
  fee: number;
  resultAmount: number;
} {
  const fee = Math.floor((amount / feeBase) * feeRate);
  
  // 判断是否中奖（反向逻辑）
  const isMatched = betContent === comboResult;
  
  if (!isMatched) {
    // 情况1：没中奖（用户赢）-> 返还2倍本金
    // 下注时扣了：amount + fee
    // 结算时返还：2 * amount
    // 净盈亏 = 2*amount - (amount + fee) = amount - fee
    const resultAmount = Math.floor(amount - fee);
    return {
      fee,
      resultAmount,
    };
  }
  
  if (isReturn) {
    // 情况2：中奖且回本 -> 返还本金
    // 下注时扣了：amount + fee
    // 结算时返还：amount
    // 净盈亏 = amount - (amount + fee) = -fee
    const resultAmount = Math.floor(-fee);
    return {
      fee,
      resultAmount,
    };
  }
  
  // 情况3：中奖且不回本 -> 扣除额外4倍本金（总共5倍）
  // 下注时已扣：amount + fee
  // 结算时再扣：4 * amount
  // 净盈亏 = -4*amount - (amount + fee) = -5*amount - fee
  const resultAmount = Math.floor(-5 * amount - fee);
  return {
    fee,
    resultAmount,
  };
}

/**
 * 验证下注内容是否合法
 */
export function validateBetContent(betType: string, betContent: string): boolean {
  if (betType === 'multiple') {
    // 倍数下注：只需要是正数
    const amount = parseFloat(betContent);
    return !isNaN(amount) && amount > 0;
  } else if (betType === 'combo') {
    // 组合下注：必须是合法的组合选项
    const validOptions = ['大', '小', '单', '双', '大单', '大双', '小单', '小双'];
    return validOptions.includes(betContent);
  }
  
  return false;
}

/**
 * 获取下一期期号
 */
export function getNextIssue(currentIssue: string): string {
  const issueNumber = parseInt(currentIssue);
  return (issueNumber + 1).toString();
}

/**
 * 解析开奖号码字符串 (格式：5+3+8)
 */
export function parseLotteryNumbers(lotteryStr: string): {
  number1: number;
  number2: number;
  number3: number;
  resultSum: number;
} {
  const numbers = lotteryStr.split('+').map(n => parseInt(n.trim()));
  
  if (numbers.length !== 3 || numbers.some(n => isNaN(n))) {
    throw new Error('无效的开奖号码格式');
  }
  
  return {
    number1: numbers[0],
    number2: numbers[1],
    number3: numbers[2],
    resultSum: numbers[0] + numbers[1] + numbers[2],
  };
}

/**
 * 格式化开奖号码为字符串
 */
export function formatLotteryNumbers(n1: number, n2: number, n3: number): string {
  return `${n1}+${n2}+${n3}`;
}

