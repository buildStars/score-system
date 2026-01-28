import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';
import { 
  validateBetContent, 
  calculateMinimumBalance 
} from '../lottery/utils/lottery-rules.util';
import { LotteryCountdownService } from '../lottery/lottery-countdown.service';
import { TelegramService } from '../telegram/telegram.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BetService {
  constructor(
    private prisma: PrismaService,
    private countdownService: LotteryCountdownService,
    private telegramService: TelegramService,
  ) {}

  /**
   * 提交下注
   */
  async createBet(userId: number, createBetDto: CreateBetDto) {
    const { issue, betType, betContent, amount } = createBetDto;

    // 1. 验证游戏是否开启
    const gameEnabledSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'game_enabled' },
    });
    if (gameEnabledSetting?.settingValue !== 'true') {
      throw new BadRequestException('游戏已关闭，暂时无法下注');
    }

    // 2. 检查是否在封盘期间
    const betCheck = await this.countdownService.canPlaceBet();
    if (!betCheck.canBet) {
      throw new BadRequestException(betCheck.reason || '当前不可下注');
    }

    // 3. 获取当前期号（智能判断实际可用的期号）
    const lotteryStatus = await this.countdownService.getLotteryStatus();
    let currentIssue = lotteryStatus.currentPeriod;
    
    // 检查当前期是否已开奖，如果已开奖则使用下一期
    const currentResult = await this.prisma.lotteryResult.findUnique({
      where: { issue: currentIssue },
    });
    
    if (currentResult) {
      // 当前期已开奖，使用下一期
      const nextIssue = lotteryStatus.nextPeriod;
      console.warn(`当前期 ${currentIssue} 已开奖，自动使用下一期 ${nextIssue}`);
      currentIssue = nextIssue;
    }
    
    // 记录用户提交的期号（用于日志）
    if (issue !== currentIssue) {
      console.log(`用户提交期号 ${issue}，实际使用期号 ${currentIssue}`);
    }

    // 4. 验证下注内容是否合法
    if (!validateBetContent(betType, betContent)) {
      throw new BadRequestException('下注内容不合法');
    }

    // 5. 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 1) {
      throw new BadRequestException('用户状态异常');
    }

    // 6. 获取当前下注类型的配置
    const betTypeSetting = await this.prisma.betTypeSetting.findUnique({
      where: { betType },
    });

    if (!betTypeSetting || !betTypeSetting.isEnabled) {
      throw new BadRequestException('该下注类型暂不可用');
    }

    // 7. 验证下注金额范围
    if (amount < Number(betTypeSetting.minBet)) {
      throw new BadRequestException(`下注金额不能少于${betTypeSetting.minBet}`);
    }
    if (amount > Number(betTypeSetting.maxBet)) {
      throw new BadRequestException(`下注金额不能超过${betTypeSetting.maxBet}`);
    }

    // 8. 计算手续费（统一使用配置中的费率）
    const feeRateRaw = Number(betTypeSetting.feeRate);
    const feeRate = feeRateRaw * 100; // 转换为绝对值：0.03 -> 3
    const feeCalculated = (amount / 100) * feeRate;
    const fee = Number(feeCalculated.toFixed(2));
    
    // 调试日志
    console.log(`💰 下注手续费计算: betType=${betType}, amount=${amount}`);
    console.log(`  数据库 feeRate: ${betTypeSetting.feeRate}`);
    console.log(`  转换后: ${feeRateRaw} * 100 = ${feeRate}`);
    console.log(`  计算: (${amount} / 100) * ${feeRate} = ${feeCalculated}`);
    console.log(`  toFixed(2): "${feeCalculated.toFixed(2)}"`);
    console.log(`  Number(...): ${fee}`);

    // 9. 获取通用下注设置（最大次数、损失率等）
    const betSettings = await this.getBetSettings();

    // 8. 验证单期下注次数
    const betCount = await this.prisma.bet.count({
      where: { userId, issue: currentIssue },
    });

    if (betCount >= betSettings.maxBetsPerIssue) {
      throw new BadRequestException(`每期最多下注${betSettings.maxBetsPerIssue}次`);
    }

    // 9. 计算本次下注的最大可能损失（用于余额检查）
    // 只有倍数下注使用 multipleFeeRate，其他所有类型使用 comboFeeRate
    const { minimumBalance: maxPossibleLoss, breakdown } = calculateMinimumBalance(
      betType,
      amount,
      betContent,
      betType === 'multiple' ? betSettings.multipleFeeRate : betSettings.comboFeeRate,
      betType === 'multiple' ? betSettings.multipleFeeBase : betSettings.comboFeeBase,
      betSettings.multipleLossRate,
    );

    // 10. 计算所有未结算注单的最大可能损失
    const pendingBets = await this.prisma.bet.findMany({
      where: { 
        userId, 
        status: 'pending',
      },
      select: {
        id: true,
        betType: true,
        amount: true,
        betContent: true,
      },
    });

    // 分类统计 pending 注单
    let pendingLoss = 0;
    const pendingMultiple: any[] = []; // 倍数下注
    const pendingBigSmallOddEven: any[] = []; // 大小单双
    const pendingCombo: any[] = []; // 组合下注（大单/大双/小单/小双）

    pendingBets.forEach(bet => {
      const isBigSmallOddEven = ['大', '小', '单', '双'].includes(bet.betContent);
      
      if (bet.betType === 'multiple') {
        pendingMultiple.push(bet);
      } else if (isBigSmallOddEven) {
        pendingBigSmallOddEven.push(bet);
      } else {
        pendingCombo.push(bet);
      }
    });

    // 1. 倍数下注：累加所有损失（倍数 × 损失率 + 手续费）
    pendingMultiple.forEach(bet => {
      const fee = Number(((bet.amount / betSettings.multipleFeeBase) * betSettings.multipleFeeRate).toFixed(2));
      const loss = bet.amount * betSettings.multipleLossRate + fee;
      pendingLoss += loss;
    });

    // 2. 大小单双：累加所有本金
    pendingBigSmallOddEven.forEach(bet => {
      pendingLoss += bet.amount;
    });

    // 3. 组合下注：最大本金 × 5 + 所有手续费
    if (pendingCombo.length > 0) {
      const maxComboAmount = Math.max(...pendingCombo.map(b => b.amount));
      const comboTotalFee = pendingCombo.reduce((sum, bet) => {
        return sum + Number(((bet.amount / betSettings.comboFeeBase) * betSettings.comboFeeRate).toFixed(2));
      }, 0);
      pendingLoss += maxComboAmount * 5 + comboTotalFee;
    }

    // 11. 检查可用余额是否足够
    const currentPoints = Number(user.points);
    const availableBalance = currentPoints - pendingLoss;
    
    if (availableBalance < maxPossibleLoss) {
      throw new BadRequestException(
        `可用余额不足。当前积分: ${currentPoints}, ` +
        `未结算占用: ${Math.floor(pendingLoss)}, ` +
        `可用余额: ${Math.floor(availableBalance)}, ` +
        `本次需要: ${Math.floor(maxPossibleLoss)} (${breakdown})`
      );
    }

    // 12. 使用事务创建下注记录（不扣分）
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建下注记录（不扣除积分，只记录）
      // ⚠️ 使用 Prisma.Decimal 确保精确存储
      const feeDecimal = new Prisma.Decimal(fee.toFixed(2));
      console.log(`💾 准备存储到数据库: fee = ${fee} -> Decimal("${fee.toFixed(2)}") (类型: Prisma.Decimal)`);
      console.log(`   feeDecimal 详细信息:`, {
        value: feeDecimal,
        toString: feeDecimal.toString(),
        toNumber: feeDecimal.toNumber(),
        toFixed2: feeDecimal.toFixed(2),
      });
      
      const bet = await tx.bet.create({
        data: {
          userId,
          issue: currentIssue,
          betType,
          betContent,
          amount,
          fee: feeDecimal,  // 使用 Prisma.Decimal
          pointsBefore: currentPoints,  // 记录下注时的积分
          status: 'pending',
        },
      });
      
      console.log(`✅ 已存储到数据库: bet.id=${bet.id}, fee=${bet.fee} (类型: ${typeof bet.fee}, 原始值: ${JSON.stringify(bet.fee)})`);
      console.log(`   bet.fee 详细信息:`, {
        value: bet.fee,
        toString: bet.fee?.toString(),
        constructor: bet.fee?.constructor?.name,
      });

      // 注意：下注时不创建 PointRecord，只在结算时创建

      // 保存下注信息，用于事务提交后发送通知
      const betInfo = {
        issue: bet.issue,
        betType: bet.betType,
        betContent: bet.betContent,
        amount: Number(bet.amount),
      };
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      };

      return {
        betId: bet.id,
        issue: bet.issue,
        betType: bet.betType,
        betContent: bet.betContent,
        amount: Number(bet.amount).toFixed(2), // 下注金额保留两位小数
        fee: Number(bet.fee).toFixed(2), // 手续费保留两位小数
        pointsBefore: Math.floor(Number(bet.pointsBefore)), // 积分返回整数
        availableBalance: Math.floor(availableBalance - maxPossibleLoss), // 可用余额返回整数
        lockedAmount: Math.floor(pendingLoss + maxPossibleLoss), // 锁定金额返回整数
        status: bet.status,
        createdAt: bet.createdAt,
        _betInfo: betInfo, // 临时保存，用于事务后发送通知
        _userInfo: userInfo, // 临时保存，用于事务后发送通知
      };
    });

    // 不再实时上报，只在封盘后统一上报汇总
    // 删除临时字段，避免返回给前端
    if (result._betInfo) {
      delete result._betInfo;
    }
    if (result._userInfo) {
      delete result._userInfo;
    }

    return result;
  }

  /**
   * 获取用户下注历史（合并同一期的下注）
   */
  async getUserBetHistory(userId: number, query: QueryBetDto) {
    const { page, limit, issue, status } = query;

    const where: any = { userId };

    if (issue) {
      where.issue = issue;
    }

    if (status) {
      // 如果status为settled，查询所有已结算的状态（win/loss/cancelled）
      if (status === 'settled') {
        where.status = { in: ['win', 'loss', 'cancelled'] };
      } else {
        where.status = status;
      }
    }

    // 1. 先查询所有符合条件的下注记录
    const allBets = await this.prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 2. 按期号分组合并
    const groupedByIssue = new Map<string, any[]>();
    allBets.forEach(bet => {
      if (!groupedByIssue.has(bet.issue)) {
        groupedByIssue.set(bet.issue, []);
      }
      groupedByIssue.get(bet.issue).push(bet);
    });

    // 3. 对每个期号进行汇总
    const mergedBets = [];
    for (const [issueKey, bets] of groupedByIssue.entries()) {
      const merged = await this.mergeBetsByIssue(bets);
      // 过滤掉 null 值（当该期号所有下注都被取消时）
      if (merged) {
        mergedBets.push(merged);
      }
    }

    // 4. 按创建时间排序
    mergedBets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 5. 分页
    const total = mergedBets.length;
    const skip = (page - 1) * limit;
    const paginatedBets = mergedBets.slice(skip, skip + limit);

    // 6. 获取开奖数据
    const issues = paginatedBets.map(bet => bet.issue);
    const lotteryResults = await this.prisma.lotteryResult.findMany({
      where: { issue: { in: issues } },
      select: {
        issue: true,
        number1: true,
        number2: true,
        number3: true,
        resultSum: true,
        isReturn: true,
        drawTime: true,
      },
    });

    const lotteryMap = new Map(lotteryResults.map(l => [l.issue, l]));
    const listWithLottery = paginatedBets.map(bet => {

      
      return {
        ...bet,
        lottery: lotteryMap.get(bet.issue) || null,
      };
    });

    return {
      list: listWithLottery,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 合并同一期的多个下注记录
   * 支持合并 pending、win、loss 状态的记录，排除 cancelled
   */
  private async mergeBetsByIssue(bets: any[]): Promise<any> {
    if (bets.length === 0) return null;
    
    // 排除已取消的记录
    const validBets = bets.filter(b => b.status !== 'cancelled');
    
    if (validBets.length === 0) return null;
    
    // ✅ 修复：单笔下注时也需要格式化数字字段，确保类型一致
    if (validBets.length === 1) {
      const bet = validBets[0];
      return {
        ...bet,
        amount: Number(bet.amount).toFixed(2),
        fee: Number(bet.fee).toFixed(2),
        resultAmount: bet.resultAmount ? Number(bet.resultAmount).toFixed(2) : null,
        pointsBefore: bet.pointsBefore ? Math.floor(Number(bet.pointsBefore)) : null,
        pointsAfter: bet.pointsAfter ? Math.floor(Number(bet.pointsAfter)) : null,
        betCount: 1,
      };
    }

    // 按类型分组：倍数 vs 其他所有类型
    const multipleBets = validBets.filter(b => b.betType === 'multiple');
    const otherBets = validBets.filter(b => b.betType !== 'multiple'); // 所有非倍数的下注

    // 汇总倍数下注（累加 betContent，即倍数）
    let totalMultiple = 0;
    multipleBets.forEach(bet => {
      totalMultiple += Number(bet.betContent);
    });

    // 汇总其他下注（大/小/单/双/组合等，按内容分组统计金额）
    const otherBetsMap = new Map<string, number>();
    otherBets.forEach(bet => {
      const content = bet.betContent; // 如 "大"、"小"、"大单"
      const amount = Number(bet.amount);
      otherBetsMap.set(content, (otherBetsMap.get(content) || 0) + amount);
    });

    // 构建合并后的下注内容
    let mergedContent = '';
    
    // 1. 先显示倍数
    if (totalMultiple > 0) {
      mergedContent += `${totalMultiple}倍`;
    }
    
    // 2. 再显示其他类型下注
    if (otherBetsMap.size > 0) {
      const otherStr = Array.from(otherBetsMap.entries())
        .map(([content, amount]) => `${amount}${content}`)
        .join(' ');
      mergedContent += (mergedContent ? ' ' : '') + otherStr;
    }

    // 获取 bet_type_settings 配置用于重新计算手续费
    const betTypeSettings = await this.prisma.betTypeSetting.findMany();
    const betTypeMap = new Map(betTypeSettings.map(s => [s.betType, s]));
    
    // 汇总金额（重新计算手续费，避免使用数据库中可能向下取整的旧值）
    const totalAmount = validBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
    const totalFee = validBets.reduce((sum, bet) => {
      // 重新计算每笔的手续费
      const setting = betTypeMap.get(bet.betType);
      const feeRate = setting ? Number(setting.feeRate) * 100 : 0;
      const calculatedFee = Number(((Number(bet.amount) / 100) * feeRate).toFixed(2));
      return sum + calculatedFee;
    }, 0);
    
    // 汇总结果金额（只有已结算的才有 resultAmount）
    const totalResultAmount = validBets.reduce((sum, bet) => {
      return sum + (bet.resultAmount ? Number(bet.resultAmount) : 0);
    }, 0);

    // 确定合并后的状态
    let mergedStatus: string;
    const hasPending = validBets.some(b => b.status === 'pending');
    const hasSettled = validBets.some(b => b.status === 'win' || b.status === 'loss');
    
    if (hasPending && !hasSettled) {
      // 全部是 pending
      mergedStatus = 'pending';
    } else if (!hasPending && hasSettled) {
      // 全部已结算
      if (totalResultAmount > 0) {
        mergedStatus = 'win';
      } else if (totalResultAmount < 0) {
        mergedStatus = 'loss';
      } else {
        mergedStatus = 'win'; // resultAmount = 0，例如回本
      }
    } else {
      // 混合状态（部分 pending 部分已结算），显示为 pending
      mergedStatus = 'pending';
    }

    // 取最早的下注时间
    const earliestBet = validBets.reduce((earliest, bet) => 
      new Date(bet.createdAt) < new Date(earliest.createdAt) ? bet : earliest
    );
    
    // 取最晚的结算时间（如果有的话）
    const settledBets = validBets.filter(b => b.settledAt);
    const latestSettled = settledBets.length > 0 
      ? settledBets.reduce((latest, bet) => 
          new Date(bet.settledAt) > new Date(latest.settledAt) ? bet : latest
        )
      : null;

    // 使用第一条记录的 pointsBefore 和最后一条结算记录的 pointsAfter
    const firstPointsBefore = earliestBet.pointsBefore;
    const lastPointsAfter = latestSettled?.pointsAfter || null;

    // 返回合并后的记录
    return {
      id: validBets[0].id,
      userId: validBets[0].userId,
      user: validBets[0].user, // 保留用户信息
      issue: validBets[0].issue,
      betType: multipleBets.length > 0 && otherBets.length > 0 ? 'mixed' : 
               multipleBets.length > 0 ? 'multiple' : 'combo',
      betContent: mergedContent,
      amount: totalAmount.toFixed(2), // 下注金额保留两位小数
      fee: totalFee.toFixed(2), // 手续费保留两位小数
      status: mergedStatus,
      resultAmount: totalResultAmount !== 0 ? totalResultAmount.toFixed(2) : null, // 结算金额保留两位小数
      pointsBefore: firstPointsBefore ? Math.floor(Number(firstPointsBefore)) : null, // 积分返回整数
      pointsAfter: lastPointsAfter ? Math.floor(Number(lastPointsAfter)) : null, // 积分返回整数
      settledAt: latestSettled?.settledAt || null,
      createdAt: earliestBet.createdAt,
      updatedAt: validBets[validBets.length - 1].updatedAt,
      betCount: validBets.length,
    };
  }

  /**
   * 获取所有下注记录（管理员）
   */
  async getAllBets(query: QueryBetDto) {
    const { page, limit, userId, issue, status, betType, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (issue) {
      where.issue = issue;
    }

    if (status) {
      // 如果status为settled，查询所有已结算的状态（win/loss/cancelled）
      if (status === 'settled') {
        where.status = { in: ['win', 'loss', 'cancelled'] };
      } else {
        where.status = status;
      }
    }

    if (betType) {
      where.betType = betType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const total = await this.prisma.bet.count({ where });

    const list = await this.prisma.bet.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 手动获取开奖数据
    const issues = [...new Set(list.map(bet => bet.issue))];
    const lotteryResults = await this.prisma.lotteryResult.findMany({
      where: { issue: { in: issues } },
      select: {
        issue: true,
        number1: true,
        number2: true,
        number3: true,
        resultSum: true,
        isReturn: true,
        drawTime: true,
      },
    });

    const lotteryMap = new Map(lotteryResults.map(l => [l.issue, l]));
    const listWithLottery = list.map(bet => ({
      ...bet,
      lottery: lotteryMap.get(bet.issue) || null,
    }));

    // 统计汇总
    const summary = await this.getBetsSummary(where);

    return {
      list: listWithLottery,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  /**
   * 获取下注汇总统计
   */
  private async getBetsSummary(where: any) {
    const result = await this.prisma.bet.aggregate({
      where,
      _count: { id: true },
      _sum: {
        amount: true,
        fee: true,
      },
    });

    const winCount = await this.prisma.bet.count({
      where: { ...where, status: 'win' },
    });

    const lossCount = await this.prisma.bet.count({
      where: { ...where, status: 'loss' },
    });

    const pendingCount = await this.prisma.bet.count({
      where: { ...where, status: 'pending' },
    });

    return {
      totalBets: result._count.id,
      totalAmount: Number(result._sum.amount || 0).toFixed(2),
      totalFee: Number(result._sum.fee || 0).toFixed(2),
      winCount,
      lossCount,
      pendingCount,
    };
  }

  /**
   * 获取下注设置（从 bet_type_settings 表）
   */
  private async getBetSettings() {
    // 从 bet_type_settings 表获取配置
    const betTypeSettings = await this.prisma.betTypeSetting.findMany();
    
    // 将数组转换为对象映射
    const settingsMap: any = {};
    betTypeSettings.forEach((setting) => {
      settingsMap[setting.betType] = {
        minBet: Number(setting.minBet),
        maxBet: Number(setting.maxBet),
        feeRate: Number(setting.feeRate),
        isEnabled: setting.isEnabled,
      };
    });

    // 获取倍数下注配置
    const multipleConfig = settingsMap['multiple'] || {};
    // 获取组合下注配置（大单/大双/小单/小双，使用"大单"作为代表）
    const comboConfig = settingsMap['big_odd'] || settingsMap['combo'] || {};

    // 注意：bet_type_settings 的 feeRate 是百分比小数（如 0.03 = 3%）
    // 旧的计算方式是：fee = (amount / feeBase) * feeRate
    // 为了兼容，我们转换为绝对值：
    // 如果 feeRate = 0.03（3%），则 multipleFeeRate = 3, multipleFeeBase = 100
    
    return {
      // 倍数下注配置
      multipleFeeRate: (multipleConfig.feeRate || 0.03) * 100,  // 转换：0.03 -> 3
      multipleFeeBase: 100,
      minBetAmount: multipleConfig.minBet || 1,
      maxBetAmount: multipleConfig.maxBet || 100000,
      multipleLossRate: 0.8,  // 暂时保持0.8，后续可以加到配置中
      
      // 组合下注配置
      comboFeeRate: (comboConfig.feeRate || 0.05) * 100,  // 转换：0.05 -> 5
      comboFeeBase: 100,
      
      // 通用配置
      maxBetsPerIssue: 50,  // 可以后续加到配置中
    };
  }

  /**
   * 获取当前期的下注记录（按玩法合并）
   */
  async getCurrentIssueBets(userId: number) {
    // 0. 获取所有下注类型配置（用于重新计算手续费）
    const betTypeSettings = await this.prisma.betTypeSetting.findMany();
    const betTypeMap = new Map(betTypeSettings.map(s => [s.betType, s]));
    
    // 1. 获取当前期号
    const lotteryStatus = await this.countdownService.getLotteryStatus();
    let currentIssue = lotteryStatus.currentPeriod;
    
    // 检查当前期是否已开奖，如果已开奖则使用下一期
    const currentResult = await this.prisma.lotteryResult.findUnique({
      where: { issue: currentIssue },
    });
    
    if (currentResult) {
      currentIssue = lotteryStatus.nextPeriod;
    }

    // 2. 查询当前期的所有pending状态下注记录
    const bets = await this.prisma.bet.findMany({
      where: {
        userId,
        issue: currentIssue,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (bets.length === 0) {
      return {
        issue: currentIssue,
        bets: [],
        canCancel: true, // 未封盘时可以取消
      };
    }

    // 3. 按玩法分组合并
    // 规则：
    // - 倍数下注（multiple）：所有倍数下注合并为一个（不区分金额）
    // - 组合下注（combo）：按具体内容分组（大/小/单/双/大单/大双/小单/小双）
    const groupedBets = new Map<string, any>();
    
    for (const bet of bets) {
      // 对于倍数下注，统一使用 "multiple" 作为 key
      // 对于组合下注，使用 "combo-内容" 作为 key
      const key = bet.betType === 'multiple' 
        ? 'multiple' 
        : `${bet.betType}-${bet.betContent}`;
      
      if (!groupedBets.has(key)) {
        groupedBets.set(key, {
          betType: bet.betType,
          betContent: bet.betType === 'multiple' ? 'multiple' : bet.betContent,
          totalAmount: 0,
          totalFee: 0,
          betIds: [],
        });
      }
      
      const group = groupedBets.get(key);
      group.totalAmount += Number(bet.amount);
      
      // 重新计算手续费：统一从配置中读取费率
      const setting = betTypeMap.get(bet.betType);
      const feeRate = setting ? Number(setting.feeRate) * 100 : 0; // 转换：0.03 -> 3
      const calculatedFee = Number(((Number(bet.amount) / 100) * feeRate).toFixed(2));
      
      group.totalFee += calculatedFee;
      group.betIds.push(bet.id);
    }

    // 4. 转换为数组并格式化手续费（保留两位小数）
    const mergedBets = Array.from(groupedBets.values()).map(bet => ({
      ...bet,
      totalFee: Number(bet.totalFee.toFixed(2)),
    }));

    // 5. 检查是否可以取消（未封盘）
    const betCheck = await this.countdownService.canPlaceBet();

    return {
      issue: currentIssue,
      bets: mergedBets,
      canCancel: betCheck.canBet, // 可以下注=未封盘=可以取消
    };
  }

  /**
   * 取消当前期某个玩法的下注
   */
  async cancelBet(userId: number, issue: string, betType: string, betContent: string) {
    // 1. 验证是否可以取消（未封盘）
    const betCheck = await this.countdownService.canPlaceBet();
    if (!betCheck.canBet) {
      throw new BadRequestException('已封盘，无法取消下注');
    }

    // 2. 获取当前期号
    const lotteryStatus = await this.countdownService.getLotteryStatus();
    let currentIssue = lotteryStatus.currentPeriod;
    
    const currentResult = await this.prisma.lotteryResult.findUnique({
      where: { issue: currentIssue },
    });
    
    if (currentResult) {
      currentIssue = lotteryStatus.nextPeriod;
    }

    // 3. 验证期号是否为当前期
    if (issue !== currentIssue) {
      throw new BadRequestException('只能取消当前期的下注');
    }

    // 4. 查询该玩法的所有pending状态下注记录
    // 规则：
    // - 倍数下注（multiple）：查询所有倍数下注，不限betContent
    // - 组合下注（combo）：只查询指定betContent的下注
    const where: any = {
      userId,
      issue,
      betType,
      status: 'pending',
    };

    // 只有组合下注才需要过滤 betContent
    if (betType !== 'multiple') {
      where.betContent = betContent;
    }

    const bets = await this.prisma.bet.findMany({ where });

    if (bets.length === 0) {
      throw new BadRequestException('未找到该玩法的下注记录');
    }

    // 5. 新规则：下注时没有扣分，取消下注只需要更新状态
    // 不需要退还积分，只需要释放"锁定"的可用余额（系统会自动处理）
    
    // 6. 获取用户当前积分（用于返回信息）
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const currentPoints = Number(user.points);

    // 7. 使用事务：仅更新下注状态为 cancelled
    await this.prisma.$transaction(async (tx) => {
      // 更新所有相关下注记录的状态为 cancelled
      await tx.bet.updateMany({
        where: {
          id: { in: bets.map(b => b.id) },
        },
        data: {
          status: 'cancelled',
          pointsAfter: currentPoints,  // 记录取消时的积分（不变）
          settledAt: new Date(),
        },
      });

      // 注意：新规则下，不需要退还积分，因为下注时没有扣除
      // 不需要更新 user.points
      // 不需要创建 PointRecord
    });

    // 8. 取消下注不上报（已移除Telegram通知）

    return {
      message: '取消成功',
      cancelledCount: bets.length,
      currentPoints,
    };
  }

  /**
   * 获取下注汇总（所有人下注总和）
   * 返回格式：
   * - multiple: 所有倍数类型的总金额（如：1500）
   * - 大单: 组合类型的总金额（如：100）
   * - 小双: 组合类型的总金额（如：200）
   * 
   * 统计范围：所有期号、所有用户、所有未取消的下注
   */
  async getBetSummary(issue?: string, userId?: number) {
    const where: any = {
      status: 'pending', // 只统计未结算的下注
    };

    // 按期号筛选（如果提供）- 只统计当前期号
    if (issue) {
      where.issue = issue;
    }
    
    // 不筛选用户，统计所有用户的数据
    // if (userId) {
    //   where.userId = userId;
    // }

    // 查询所有符合条件的下注记录
    const bets = await this.prisma.bet.findMany({
      where,
      select: {
        betType: true,
        betContent: true,
        amount: true,
      },
    });

    // 按类型汇总
    const summary: Record<string, string> = {};
    let totalMultiple = 0; // 累加所有倍数类型的金额

    for (const bet of bets) {
      if (bet.betType === 'multiple') {
        // 倍数类型：累加金额
        totalMultiple += Number(bet.amount);
      } else {
        // 组合类型：按 betContent 分组累加
        const key = bet.betContent; // 如：大、小、单、双、大单、大双、小单、小双
        if (!summary[key]) {
          summary[key] = '0.00';
        }
        summary[key] = (Number(summary[key]) + Number(bet.amount)).toFixed(2);
      }
    }

    // 如果有倍数类型的下注，添加到结果中
    if (totalMultiple > 0) {
      summary['multiple'] = totalMultiple.toFixed(2);
    }

    return summary;
  }

  /**
   * 获取单用户日期范围内的下注汇总
   * 支持通过userId或username（模糊搜索）查找用户
   * 返回格式：
   * {
   *   summary: "5000倍 5000大单 5000小双 1000大",
   *   details: { multiple: 5000, '大单': 5000, '小双': 5000, '大': 1000 },
   *   totalAmount: 16000,
   *   totalBets: 50,
   *   user: { id, username, nickname }
   * }
   */
  async getUserBetSummary(userId?: number, username?: string, startDate?: string, endDate?: string) {
    let user = null;

    // 优先通过userId查找
    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: Number(userId) },
        select: {
          id: true,
          username: true,
          nickname: true,
        },
      });
    } 
    // 通过username模糊搜索（支持用户名或昵称）
    else if (username) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: { contains: username } },
            { nickname: { contains: username } },
          ],
        },
        select: {
          id: true,
          username: true,
          nickname: true,
        },
      });
    }

    if (!user) {
      return {
        summary: '',
        details: {},
        totalAmount: 0,
        totalBets: 0,
        user: null,
        message: userId ? '未找到该用户ID' : (username ? '未找到匹配的用户' : '请输入用户ID或用户名'),
      };
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
      status: { not: 'cancelled' }, // 排除已取消的下注
    };

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // 开始日期从当天 00:00:00 开始
        where.createdAt.gte = new Date(startDate + 'T00:00:00');
      }
      if (endDate) {
        // 结束日期到当天 23:59:59 结束
        where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }
    }

    // 查询所有符合条件的下注记录
    const bets = await this.prisma.bet.findMany({
      where,
      select: {
        betType: true,
        betContent: true,
        amount: true,
      },
    });

    // 按类型汇总
    const details: Record<string, number> = {};
    let totalMultiple = 0; // 累加所有倍数类型的金额
    let totalAmount = 0;

    for (const bet of bets) {
      const amount = Number(bet.amount);
      totalAmount += amount;

      if (bet.betType === 'multiple') {
        // 倍数类型：累加金额
        totalMultiple += amount;
      } else {
        // 组合类型：按 betContent 分组累加
        const key = bet.betContent; // 如：大、小、单、双、大单、大双、小单、小双
        if (!details[key]) {
          details[key] = 0;
        }
        details[key] += amount;
      }
    }

    // 如果有倍数类型的下注，添加到结果中
    if (totalMultiple > 0) {
      details['multiple'] = totalMultiple;
    }

    // 构建汇总字符串，格式：5000倍 5000大单 5000小双 1000大
    const summaryParts: string[] = [];
    
    // 定义显示顺序
    const displayOrder = ['multiple', '大', '小', '单', '双', '大单', '大双', '小单', '小双'];
    
    for (const key of displayOrder) {
      if (details[key]) {
        if (key === 'multiple') {
          summaryParts.push(`${details[key]}倍`);
        } else {
          summaryParts.push(`${details[key]}${key}`);
        }
      }
    }

    // 添加其他可能未在顺序中的类型
    for (const [key, value] of Object.entries(details)) {
      if (!displayOrder.includes(key) && value > 0) {
        summaryParts.push(`${value}${key}`);
      }
    }

    return {
      summary: summaryParts.join(' '),
      details,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalBets: bets.length,
      user,
    };
  }

  /**
   * 获取所有下注记录（合并显示 - 管理员）
   * 合并规则：同一用户同一期的所有下注合并为一行
   */
  async getAllBetsMerged(query: QueryBetDto) {
    const { page = 1, limit = 20, userId, issue, betType, status, startDate, endDate } = query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (issue) {
      where.issue = issue;
    }

    if (betType) {
      where.betType = betType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 1. 查询所有符合条件的下注记录
    const allBets = await this.prisma.bet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. 按 期号+用户 分组（像H5端一样）
    const groupedByIssueUser = new Map<string, any[]>();

    for (const bet of allBets) {
      const key = `${bet.issue}-${bet.userId}`; // 期号-用户ID
      if (!groupedByIssueUser.has(key)) {
        groupedByIssueUser.set(key, []);
      }
      groupedByIssueUser.get(key).push(bet);
    }

    // 3. 对每个期号+用户组合进行合并（复用现有的合并逻辑）
    const mergedBets = [];
    for (const [key, bets] of groupedByIssueUser.entries()) {
      const merged = await this.mergeBetsByIssue(bets);
      if (merged) {
        mergedBets.push(merged);
      }
    }

    // 4. 按创建时间排序
    mergedBets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 5. 分页
    const total = mergedBets.length;
    const skip = (page - 1) * limit;
    const paginatedBets = mergedBets.slice(skip, skip + limit);

    return {
      list: paginatedBets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

