import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';
import { validateBetContent } from '../lottery/utils/lottery-rules.util';
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

    // 6. 验证积分是否足够
    if (Number(user.points) < amount) {
      throw new BadRequestException('积分不足');
    }

    // 7. 获取下注设置
    const betSettings = await this.getBetSettings();

    // 8. 验证下注金额范围
    if (amount < betSettings.minBetAmount) {
      throw new BadRequestException(`下注金额不能少于${betSettings.minBetAmount}`);
    }
    if (amount > betSettings.maxBetAmount) {
      throw new BadRequestException(`下注金额不能超过${betSettings.maxBetAmount}`);
    }

    // 9. 验证单期下注次数
    const betCount = await this.prisma.bet.count({
      where: { userId, issue: currentIssue },
    });

    if (betCount >= betSettings.maxBetsPerIssue) {
      throw new BadRequestException(`每期最多下注${betSettings.maxBetsPerIssue}次`);
    }

    // 10. 计算手续费（下注时扣除）
    const feeWithDecimal = betType === 'multiple'
      ? (amount / betSettings.multipleFeeBase) * betSettings.multipleFeeRate
      : (amount / betSettings.comboFeeBase) * betSettings.comboFeeRate;
    const fee = Math.floor(feeWithDecimal);  // 向下取整

    // 11. 计算总扣除金额（本金 + 手续费）
    const totalDeduct = amount + fee;

    // 12. 使用事务创建下注记录
    return await this.prisma.$transaction(async (tx) => {
      // 扣除用户积分（本金 + 手续费，向下取整）
      const currentPoints = Number(user.points);
      const newPoints = Math.floor(currentPoints - totalDeduct);
      
      await tx.user.update({
        where: { id: userId },
        data: { 
          points: newPoints,
        },
      });

      // 创建下注记录（使用当前期号）
      const bet = await tx.bet.create({
        data: {
          userId,
          issue: currentIssue,
          betType,
          betContent,
          amount,
          fee,
          pointsBefore: currentPoints,
          status: 'pending',
        },
      });

      // 记录积分变动（显示总扣除金额：本金 + 手续费）
      await tx.pointRecord.create({
        data: {
          userId,
          type: 'bet',
          amount: -totalDeduct,  // 显示本金+手续费
          balanceBefore: currentPoints,
          balanceAfter: newPoints,
          relatedId: bet.id,
          relatedType: 'bet',
          remark: `期号${currentIssue} ${betType === 'multiple' ? '倍数' : '组合'}下注（本金${amount}+手续费${fee}）`,
          operatorType: 'system',
        },
      });

      return {
        betId: bet.id,
        issue: bet.issue,
        betType: bet.betType,
        betContent: bet.betContent,
        amount: bet.amount,
        fee: bet.fee,
        pointsBefore: Number(bet.pointsBefore),
        pointsAfter: newPoints,
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
   */
  private mergeBetsByIssue(bets: any[]): any {
    if (bets.length === 0) return null;
    if (bets.length === 1) return bets[0];

    // 按类型分组
    const multipleBets = bets.filter(b => b.betType === 'multiple');
    const comboBets = bets.filter(b => b.betType === 'combo');

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

    // 汇总金额
    const totalAmount = bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
    const totalFee = bets.reduce((sum, bet) => sum + Number(bet.fee), 0);
    
    // 汇总结果金额
    let totalResultAmount = null;
    const allSettled = bets.every(bet => bet.status !== 'pending');
    if (allSettled) {
      totalResultAmount = bets.reduce((sum, bet) => {
        return sum + (bet.resultAmount ? Number(bet.resultAmount) : 0);
      }, 0);
    }

    // 确定状态
    let mergedStatus = 'pending';
    if (allSettled) {
      if (totalResultAmount > 0) {
        mergedStatus = 'win';
      } else if (totalResultAmount < 0) {
        mergedStatus = 'loss';
      } else {
        mergedStatus = 'loss';
      }
    }

    // 取最早的下注时间和最晚的结算时间
    const earliestBet = bets.reduce((earliest, bet) => 
      new Date(bet.createdAt) < new Date(earliest.createdAt) ? bet : earliest
    );
    const latestSettled = bets.find(bet => bet.settledAt);

    // 返回合并后的记录
    return {
      id: bets[0].id, // 使用第一条记录的ID
      userId: bets[0].userId,
      issue: bets[0].issue,
      betType: multipleBets.length > 0 && comboBets.length > 0 ? 'mixed' : 
               multipleBets.length > 0 ? 'multiple' : 'combo',
      betContent: mergedContent,
      amount: totalAmount.toString(),
      fee: totalFee.toString(),
      status: mergedStatus,
      resultAmount: totalResultAmount?.toString() || null,
      pointsBefore: earliestBet.pointsBefore,
      pointsAfter: bets[bets.length - 1].pointsAfter,
      settledAt: latestSettled?.settledAt || null,
      createdAt: earliestBet.createdAt,
      updatedAt: bets[bets.length - 1].updatedAt,
      betCount: bets.length, // 额外字段：本期下注次数
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

    // 5. 计算需要退回的总积分（下注金额 + 手续费）
    const totalRefund = bets.reduce((sum, bet) => sum + Number(bet.amount) + Number(bet.fee), 0);

    // 6. 获取用户当前积分
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const newPoints = Number(user.points) + totalRefund;

    // 7. 使用事务：更新下注状态为cancelled + 退回积分 + 创建积分记录
    await this.prisma.$transaction(async (tx) => {
      // 更新所有相关下注记录的状态为cancelled
      await tx.bet.updateMany({
        where: {
          id: { in: bets.map(b => b.id) },
        },
        data: {
          status: 'cancelled',
          pointsAfter: newPoints,
          settledAt: new Date(),
        },
      });

      // 更新用户积分
      await tx.user.update({
        where: { id: userId },
        data: { points: newPoints },
      });

      // 创建积分记录
      await tx.pointRecord.create({
        data: {
          userId,
          type: 'refund',
          amount: totalRefund,
          balanceBefore: Number(user.points),
          balanceAfter: newPoints,
          relatedId: bets[0].id,
          relatedType: 'bet',
          remark: `取消下注退款：${issue} ${betType === 'multiple' ? betContent + '倍数' : betContent}`,
        },
      });
    });

    return {
      message: '取消成功',
      refundAmount: totalRefund,
      newPoints,
    };
  }

  /**
   * 获取下注汇总（所有人下注总和）
   */
  async getBetSummary(issue?: string, userId?: number) {
    const where: any = {
      status: { not: 'cancelled' }, // 排除已取消的下注
    };

    if (issue) {
      where.issue = issue;
    }

    if (userId) {
      where.userId = userId;
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

    // 按 betContent 汇总金额
    const summary: Record<string, number> = {};

    for (const bet of bets) {
      const key = bet.betContent; // 直接使用 betContent 作为 key（如：2、3、5、10、大、小、单、双、大单、大双、小单、小双）
      
      if (!summary[key]) {
        summary[key] = 0;
      }
      
      summary[key] += Number(bet.amount);
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

