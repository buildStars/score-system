/**
 * 开奖规则工具类 - 完全重构版
 * 
 * 核心规则：
 * 1. 回本判断：对子/豹子/顺子/和值13或14
 * 2. 倍数下注：回本(+倍数-费)，不回本(-0.8倍-费)
 * 3. 大小单双：命中不回本(+1.8倍)，命中回本(0)，未命中(-本金)
 * 4. 组合下注：命中不回本(-5倍-费)，命中回本(-费)，未命中(+本金-费)
 * 
 * 金额计算规则：
 * - 计算过程使用小数，保留两位小数，四舍五入
 * - 最终结果向下取整存储为整数
 */

/**
 * 金额处理：四舍五入到两位小数
 * 例如：
 *   85.666 → 85.67
 *   -555.166 → -555.17
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

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
 * 判断是否回本（全玩法通用）
 * 
 * 回本条件（满足任一即可）：
 * 1. 对子：三个号码中有两个相同
 * 2. 豹子：三个号码完全相同
 * 3. 顺子：三个号码任意排列为连续数字（含 0-1-9、0-8-9）
 * 4. 和值为 13 或 14
 */
export function isReturn(n1: number, n2: number, n3: number, sum: number): {
  isReturn: boolean;
  reason: string | null;
} {
  // 1. 检查豹子（三个完全相同）
  if (n1 === n2 && n1 === n3) {
    return { isReturn: true, reason: '豹子' };
  }
  
  // 2. 检查对子（任意两个相同）
  if (n1 === n2 || n1 === n3 || n2 === n3) {
    return { isReturn: true, reason: '对子' };
  }
  
  // 3. 检查顺子
  if (isShunzi(n1, n2, n3)) {
    return { isReturn: true, reason: '顺子' };
  }
  
  // 4. 检查和值 13 或 14
  if (sum === 13 || sum === 14) {
    return { isReturn: true, reason: `和值${sum}` };
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
 * 判断下注内容是否命中
 */
export function isBetContentMatched(betContent: string, resultSum: number): boolean {
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
 * ⭐️ 计算倍数下注结果
 * 
 * 规则：
 * - 回本：+倍数 × 1 − 手续费
 * - 不回本：−倍数 × 0.8 − 手续费
 * 
 * @param multiplier 倍数
 * @param isReturn 是否回本
 * @param feeRate 手续费率（每100倍数收费，默认3）
 * @param feeBase 手续费基数（默认100）
 * 
 * @returns settlementAmount: 结算时给用户增加/减少的积分
 */
export function calculateMultipleBetResult(
  multiplier: number,
  isReturn: boolean,
  feeRate: number = 3,
  feeBase: number = 100,
): {
  fee: number;
  settlementAmount: number;
  status: 'win' | 'loss';
} {
  // 手续费 = (倍数 / 100) × 3，四舍五入到两位小数
  const feeRaw = (multiplier / feeBase) * feeRate;
  const fee = roundToTwoDecimals(feeRaw);
  
  if (isReturn) {
    // 回本：+倍数 × 1 − 手续费，四舍五入到两位小数
    const settlementRaw = multiplier - fee;
    const settlementAmount = roundToTwoDecimals(settlementRaw);
    return {
      fee,
      settlementAmount,
      status: 'win',
    };
  } else {
    // 不回本：−倍数 × 0.8 − 手续费，四舍五入到两位小数
    const lossAmount = multiplier * 0.8;
    const settlementRaw = -(lossAmount + fee);
    const settlementAmount = roundToTwoDecimals(settlementRaw);
    return {
      fee,
      settlementAmount,
      status: 'loss',
    };
  }
}

/**
 * ⭐️ 计算大小单双下注结果
 * 
 * 规则：
 * - 命中 & 不回本：+本金 × 1.8
 * - 命中 & 回本：0
 * - 未命中：−本金
 * 
 * 注意：大小单双不单独收手续费（走组合逻辑）
 * 
 * @param amount 下注本金
 * @param betContent 下注内容（大/小/单/双）
 * @param resultSum 开奖和值
 * @param isReturn 是否回本
 * 
 * @returns settlementAmount: 结算时给用户增加/减少的积分
 */
export function calculateBigSmallOddEvenResult(
  amount: number,
  betContent: string,
  resultSum: number,
  isReturn: boolean,
): {
  settlementAmount: number;
  status: 'win' | 'loss';
  matched: boolean;
} {
  const matched = isBetContentMatched(betContent, resultSum);
  
  if (matched && !isReturn) {
    // 情况1：命中 & 不回本 → +本金 × 1.8，四舍五入到两位小数
    const settlementRaw = amount * 1.8;
    return {
      settlementAmount: roundToTwoDecimals(settlementRaw),
      status: 'win',
      matched: true,
    };
  }
  
  if (matched && isReturn) {
    // 情况2：命中 & 回本 → 0
    return {
      settlementAmount: 0,
      status: 'win',
      matched: true,
    };
  }
  
  // 情况3：未命中 → −本金（本金是整数，不需要处理）
  return {
    settlementAmount: -amount,
    status: 'loss',
    matched: false,
  };
}

/**
 * ⭐️ 计算组合下注结果
 * 
 * 规则：
 * - 命中 & 不回本：−本金 × 5 − 手续费
 * - 命中 & 回本：0 − 手续费
 * - 未命中：+本金 × 1 − 手续费
 * 
 * @param amount 下注本金
 * @param betContent 下注内容（大单/大双/小单/小双）
 * @param resultSum 开奖和值
 * @param isReturn 是否回本
 * @param feeRate 手续费率（每100本金收费，默认5）
 * @param feeBase 手续费基数（默认100）
 * 
 * @returns settlementAmount: 结算时给用户增加/减少的积分
 */
export function calculateComboBetResult(
  amount: number,
  betContent: string,
  resultSum: number,
  isReturn: boolean,
  feeRate: number = 5,
  feeBase: number = 100,
): {
  fee: number;
  settlementAmount: number;
  status: 'win' | 'loss';
  matched: boolean;
} {
  // 手续费 = (本金 / 100) × 5，四舍五入到两位小数
  const feeRaw = (amount / feeBase) * feeRate;
  const fee = roundToTwoDecimals(feeRaw);
  const matched = isBetContentMatched(betContent, resultSum);
  
  if (matched && !isReturn) {
    // 情况1：命中 & 不回本 → −本金 × 5 − 手续费，四舍五入到两位小数
    const settlementRaw = -(amount * 5 + fee);
    return {
      fee,
      settlementAmount: roundToTwoDecimals(settlementRaw),
      status: 'loss',
      matched: true,
    };
  }
  
  if (matched && isReturn) {
    // 情况2：命中 & 回本 → 0 − 手续费，四舍五入到两位小数
    return {
      fee,
      settlementAmount: roundToTwoDecimals(-fee),
      status: 'loss',
      matched: true,
    };
  }
  
  // 情况3：未命中 → +本金 × 1 − 手续费，四舍五入到两位小数
  const settlementRaw = amount - fee;
  return {
    fee,
    settlementAmount: roundToTwoDecimals(settlementRaw),
    status: 'win',
    matched: false,
  };
}

/**
 * 计算下注前最低余额要求
 * 
 * @param betType 下注类型
 * @param amount 下注金额/倍数
 * @param betContent 下注内容（组合下注时需要）
 * @param feeRate 手续费率
 * @param feeBase 手续费基数
 * 
 * @returns minimumBalance: 最低余额要求
 */
export function calculateMinimumBalance(
  betType: string,
  amount: number,
  betContent?: string,
  feeRate?: number,
  feeBase?: number,
  multipleLossRate: number = 0.8,
): {
  minimumBalance: number;
  breakdown: string;
} {
  if (betType === 'multiple') {
    // 倍数下注：最低余额 = 倍数 × 损失率 + 手续费
    const fee = Math.floor((amount / (feeBase || 100)) * (feeRate || 3));
    const minimumBalance = amount * multipleLossRate + fee;
    return {
      minimumBalance,
      breakdown: `倍数 ${amount} × ${multipleLossRate} + 手续费 ${fee} = ${minimumBalance}`,
    };
  }
  
  // 判断是否为大小单双
  const isBigSmallOddEven = betType === 'big' || betType === 'small' || 
                            betType === 'odd' || betType === 'even' ||
                            ['大', '小', '单', '双'].includes(betContent || '');
  
  if (isBigSmallOddEven) {
    // 大小单双：最低余额 = 本金
    return {
      minimumBalance: amount,
      breakdown: `本金 ${amount}`,
    };
  }
  
  // 判断是否为组合下注（大单/大双/小单/小双）
  const isCombo = betType === 'big_odd' || betType === 'big_even' || 
                  betType === 'small_odd' || betType === 'small_even' ||
                  betType === 'combo' ||
                  ['大单', '大双', '小单', '小双'].includes(betContent || '');
  
  if (isCombo) {
    // 组合（大单/大双/小单/小双）：最低余额 = 本金 × 5 + 手续费
    const fee = Math.floor((amount / (feeBase || 100)) * (feeRate || 5));
    const minimumBalance = amount * 5 + fee;
    return {
      minimumBalance,
      breakdown: `本金 ${amount} × 5 + 手续费 ${fee} = ${minimumBalance}`,
    };
  }
  
  // 默认：返回本金
  return {
    minimumBalance: amount,
    breakdown: `本金 ${amount}`,
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
  }
  
  // 大小单双下注
  if (['big', 'small', 'odd', 'even'].includes(betType)) {
    const validOptions = ['大', '小', '单', '双'];
    return validOptions.includes(betContent);
  }
  
  // 组合下注
  if (['big_odd', 'big_even', 'small_odd', 'small_even', 'combo'].includes(betType)) {
    const validOptions = ['大单', '大双', '小单', '小双'];
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
