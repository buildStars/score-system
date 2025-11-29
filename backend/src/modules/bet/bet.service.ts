import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';
import { 
  validateBetContent, 
  calculateMinimumBalance 
} from '../lottery/utils/lottery-rules.util';
import { LotteryCountdownService } from '../lottery/lottery-countdown.service';

@Injectable()
export class BetService {
  constructor(
    private prisma: PrismaService,
    private countdownService: LotteryCountdownService,
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

    // 6. 获取下注设置
    const betSettings = await this.getBetSettings();

    // 7. 验证下注金额范围
    if (amount < betSettings.minBetAmount) {
      throw new BadRequestException(`下注金额不能少于${betSettings.minBetAmount}`);
    }
    if (amount > betSettings.maxBetAmount) {
      throw new BadRequestException(`下注金额不能超过${betSettings.maxBetAmount}`);
    }

    // 8. 验证单期下注次数
    const betCount = await this.prisma.bet.count({
      where: { userId, issue: currentIssue },
    });

    if (betCount >= betSettings.maxBetsPerIssue) {
      throw new BadRequestException(`每期最多下注${betSettings.maxBetsPerIssue}次`);
    }

    // 9. 计算本次下注的最大可能损失（用于余额检查）
    const { minimumBalance: maxPossibleLoss, breakdown } = calculateMinimumBalance(
      betType === 'multiple' ? 'multiple' : 'combo',
      amount,
      betContent,
      betType === 'multiple' ? betSettings.multipleFeeRate : betSettings.comboFeeRate,
      betType === 'multiple' ? betSettings.multipleFeeBase : betSettings.comboFeeBase,
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

    const pendingLoss = pendingBets.reduce((sum, bet) => {
      const { minimumBalance: loss } = calculateMinimumBalance(
        bet.betType === 'multiple' ? 'multiple' : 'combo',
        bet.amount,
        bet.betContent,
        bet.betType === 'multiple' ? betSettings.multipleFeeRate : betSettings.comboFeeRate,
        bet.betType === 'multiple' ? betSettings.multipleFeeBase : betSettings.comboFeeBase,
      );
      return sum + loss;
    }, 0);

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

    // 12. 计算手续费（记录但不在下注时扣除）
    const isBigSmallOddEven = ['大', '小', '单', '双'].includes(betContent);
    let fee = 0;
    
    if (betType === 'multiple') {
      // 倍数下注：每 100 倍数 = 3 分手续费
      fee = Math.floor((amount / betSettings.multipleFeeBase) * betSettings.multipleFeeRate);
    } else if (!isBigSmallOddEven) {
      // 组合下注（非大小单双）：每 100 本金 = 5 分手续费
      fee = Math.floor((amount / betSettings.comboFeeBase) * betSettings.comboFeeRate);
    }
    // 大小单双：手续费 = 0（不单独收手续费）

    // 13. 使用事务创建下注记录（不扣分）
    return await this.prisma.$transaction(async (tx) => {
      // 创建下注记录（不扣除积分，只记录）
      const bet = await tx.bet.create({
        data: {
          userId,
          issue: currentIssue,
          betType,
          betContent,
          amount,
          fee,
          pointsBefore: currentPoints,  // 记录下注时的积分
          status: 'pending',
        },
      });

      // 注意：下注时不创建 PointRecord，只在结算时创建

      return {
        betId: bet.id,
        issue: bet.issue,
        betType: bet.betType,
        betContent: bet.betContent,
        amount: bet.amount,
        fee: bet.fee,
        pointsBefore: Number(bet.pointsBefore),
        availableBalance: Math.floor(availableBalance - maxPossibleLoss), // 下注后的可用余额
        lockedAmount: Math.floor(pendingLoss + maxPossibleLoss), // 锁定金额
        status: bet.status,
        createdAt: bet.createdAt,
      };
    });
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
      const merged = this.mergeBetsByIssue(bets);
      mergedBets.push(merged);
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
    const listWithLottery = paginatedBets.map(bet => ({
      ...bet,
      lottery: lotteryMap.get(bet.issue) || null,
    }));

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
   * 注意：只合并已结算的记录（win/loss），排除 cancelled 和 pending
   */
  private mergeBetsByIssue(bets: any[]): any {
    if (bets.length === 0) return null;
    
    // 🔧 修复：只合并已结算的记录，排除 cancelled
    const settledBets = bets.filter(b => b.status === 'win' || b.status === 'loss');
    
    // 如果没有已结算的记录，检查是否有 pending 或 cancelled
    if (settledBets.length === 0) {
      // 如果只有一条记录（无论什么状态），直接返回
      if (bets.length === 1) return bets[0];
      
      // 如果有多条 pending/cancelled，只返回第一条（避免显示混乱）
      return bets[0];
    }
    
    // 如果只有一条已结算的记录，直接返回
    if (settledBets.length === 1) return settledBets[0];

    // 按类型分组（只处理已结算的）
    const multipleBets = settledBets.filter(b => b.betType === 'multiple');
    const comboBets = settledBets.filter(b => b.betType === 'combo');

    // 汇总倍数下注
    let totalMultiple = 0;
    multipleBets.forEach(bet => {
      totalMultiple += Number(bet.betContent);
    });

    // 汇总组合下注（按内容分组统计）
    const comboMap = new Map<string, number>();
    comboBets.forEach(bet => {
      const content = bet.betContent;
      const amount = Number(bet.amount);
      comboMap.set(content, (comboMap.get(content) || 0) + amount);
    });

    // 构建合并后的下注内容
    let mergedContent = '';
    if (totalMultiple > 0) {
      mergedContent += `${totalMultiple}`;
    }
    if (comboMap.size > 0) {
      const comboStr = Array.from(comboMap.entries())
        .map(([content, amount]) => `${amount}${content}`)
        .join(' ');
      mergedContent += (mergedContent ? ' ' : '') + comboStr;
    }

    // 汇总金额（只统计已结算的）
    const totalAmount = settledBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
    const totalFee = settledBets.reduce((sum, bet) => sum + Number(bet.fee), 0);
    
    // 汇总结果金额（只统计已结算的）
    const totalResultAmount = settledBets.reduce((sum, bet) => {
      return sum + (bet.resultAmount ? Number(bet.resultAmount) : 0);
    }, 0);

    // 确定状态
    let mergedStatus: string;
    if (totalResultAmount > 0) {
      mergedStatus = 'win';
    } else if (totalResultAmount < 0) {
      mergedStatus = 'loss';
    } else {
      // resultAmount = 0 的情况（例如命中且回本）
      mergedStatus = 'win';
    }

    // 取最早的下注时间和最晚的结算时间
    const earliestBet = settledBets.reduce((earliest, bet) => 
      new Date(bet.createdAt) < new Date(earliest.createdAt) ? bet : earliest
    );
    const latestSettled = settledBets.reduce((latest, bet) => 
      bet.settledAt && (!latest.settledAt || new Date(bet.settledAt) > new Date(latest.settledAt)) ? bet : latest
    );

    // 🔧 修复：使用第一条记录的 pointsBefore 和最后一条结算记录的 pointsAfter
    const firstPointsBefore = earliestBet.pointsBefore;
    const lastPointsAfter = latestSettled.pointsAfter;

    // 返回合并后的记录
    return {
      id: settledBets[0].id, // 使用第一条已结算记录的ID
      userId: settledBets[0].userId,
      issue: settledBets[0].issue,
      betType: multipleBets.length > 0 && comboBets.length > 0 ? 'mixed' : 
               multipleBets.length > 0 ? 'multiple' : 'combo',
      betContent: mergedContent,
      amount: totalAmount.toString(),
      fee: totalFee.toString(),
      status: mergedStatus,
      resultAmount: totalResultAmount.toString(),
      pointsBefore: firstPointsBefore,
      pointsAfter: lastPointsAfter,
      settledAt: latestSettled.settledAt,
      createdAt: earliestBet.createdAt,
      updatedAt: settledBets[settledBets.length - 1].updatedAt,
      betCount: settledBets.length, // 额外字段：已结算的下注次数（排除cancelled）
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
      totalAmount: Number(result._sum.amount || 0),
      totalFee: Number(result._sum.fee || 0),
      winCount,
      lossCount,
      pendingCount,
    };
  }

  /**
   * 获取下注设置
   */
  private async getBetSettings() {
    const settings = await this.prisma.betSetting.findMany();
    const settingsMap: any = {};
    
    settings.forEach((setting) => {
      const value = setting.valueType === 'number' 
        ? parseFloat(setting.settingValue) 
        : setting.settingValue;
      settingsMap[setting.settingKey.replace(/_./g, (m) => m[1].toUpperCase())] = value;
    });

    return {
      multipleFeeRate: settingsMap.multipleFeeRate || 3,
      multipleFeeBase: settingsMap.multipleFeeBase || 100,
      comboFeeRate: settingsMap.comboFeeRate || 5,
      comboFeeBase: settingsMap.comboFeeBase || 100,
      minBetAmount: settingsMap.minBetAmount || 10,
      maxBetAmount: settingsMap.maxBetAmount || 10000,
      maxBetsPerIssue: settingsMap.maxBetsPerIssue || 10,
      multipleLossRate: settingsMap.multipleLossRate || 0.8,
    };
  }

  /**
   * 获取当前期的下注记录（按玩法合并）
   */
  async getCurrentIssueBets(userId: number) {
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
      group.totalFee += Number(bet.fee);
      group.betIds.push(bet.id);
    }

    // 4. 转换为数组
    const mergedBets = Array.from(groupedBets.values());

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
      status: { not: 'cancelled' }, // 排除已取消的下注
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
    const summary: Record<string, number> = {};
    let totalMultiple = 0; // 累加所有倍数类型的金额

    for (const bet of bets) {
      if (bet.betType === 'multiple') {
        // 倍数类型：累加金额
        totalMultiple += Number(bet.amount);
      } else {
        // 组合类型：按 betContent 分组累加
        const key = bet.betContent; // 如：大、小、单、双、大单、大双、小单、小双
        if (!summary[key]) {
          summary[key] = 0;
        }
        summary[key] += Number(bet.amount);
      }
    }

    // 如果有倍数类型的下注，添加到结果中
    if (totalMultiple > 0) {
      summary['multiple'] = totalMultiple;
    }

    return summary;
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
      const merged = this.mergeBetsByIssue(bets);
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

