import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { QueryAdminLogDto } from './dto/query-admin-log.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取统计数据
   */
  async getStatistics(query: StatisticsQueryDto) {
    const { startDate, endDate } = query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. 总体统计
    const totalUsers = await this.prisma.user.count();
    
    // 活跃用户（有下注的用户）
    const activeUsersResult = await this.prisma.bet.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: start, lte: end },
      },
    });
    const activeUsers = activeUsersResult.length;

    // 下注统计
    const betsAggregate = await this.prisma.bet.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: {
        amount: true,
        fee: true,
        resultAmount: true,
      },
    });

    const totalBets = betsAggregate._count.id;
    const totalBetAmount = Number(betsAggregate._sum.amount || 0);
    const totalFee = Number(betsAggregate._sum.fee || 0);

    // 盈亏统计
    const winBets = await this.prisma.bet.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'win',
      },
      _sum: { resultAmount: true },
    });

    const lossBets = await this.prisma.bet.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'loss',
      },
      _sum: { resultAmount: true },
    });

    const totalWin = Number(winBets._sum.resultAmount || 0);
    const totalLoss = Number(lossBets._sum.resultAmount || 0);
    const netProfit = totalWin + totalLoss; // loss是负数，所以直接相加

    // 用户总积分（实时，不受时间限制）
    const totalUserPointsAggregate = await this.prisma.user.aggregate({
      _sum: {
        points: true,
      },
    });
    const totalUserPoints = Number(totalUserPointsAggregate._sum.points || 0);

    // 2. 每日统计
    const dailyData = await this.getDailyStatistics(start, end);

    // 3. 下注类型统计
    const betTypeStats = await this.getBetTypeStatistics(start, end);

    // 4. 用户排名
    const userRanking = await this.getUserRanking(start, end);

    return {
      summary: {
        totalUsers,
        activeUsers,
        totalBets,
        totalBetAmount: totalBetAmount.toFixed(2), // 下注总额保留两位小数
        totalFee: totalFee.toFixed(2), // 手续费保留两位小数
        totalWin: totalWin.toFixed(2), // 赢的结算金额保留两位小数
        totalLoss: totalLoss.toFixed(2), // 输的结算金额保留两位小数
        netProfit: netProfit.toFixed(2), // 净盈亏保留两位小数
        totalUserPoints,
      },
      dailyData,
      betTypeStats,
      userRanking,
    };
  }

  /**
   * 获取每日统计
   */
  private async getDailyStatistics(start: Date, end: Date) {
    // 使用原始SQL查询每日统计（Prisma不支持按日期分组）
    const dailyStats: any[] = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as bets,
        SUM(amount) as betAmount,
        SUM(fee) as fee,
        SUM(CASE WHEN status = 'win' THEN result_amount ELSE 0 END) as win,
        SUM(CASE WHEN status = 'loss' THEN result_amount ELSE 0 END) as loss,
        SUM(result_amount) as profit
      FROM bets
      WHERE created_at >= ${start} AND created_at <= ${end}
        AND status IN ('win', 'loss')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return dailyStats.map((stat) => ({
      date: stat.date,
      bets: Number(stat.bets),
      betAmount: Number(stat.betAmount || 0),
      fee: Number(stat.fee || 0),
      win: Number(stat.win || 0),
      loss: Number(stat.loss || 0),
      profit: Number(stat.profit || 0),
    }));
  }

  /**
   * 获取下注类型统计
   */
  private async getBetTypeStatistics(start: Date, end: Date) {
    const stats = await this.prisma.bet.groupBy({
      by: ['betType'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: {
        amount: true,
        fee: true,
      },
    });

    const result: any = {};
    stats.forEach((stat) => {
      result[stat.betType] = {
        count: stat._count.id,
        amount: Number(stat._sum.amount || 0),
        fee: Number(stat._sum.fee || 0),
      };
    });

    return result;
  }

  /**
   * 获取用户排名
   */
  private async getUserRanking(start: Date, end: Date) {
    const userStats: any[] = await this.prisma.$queryRaw`
      SELECT 
        u.id as userId,
        u.username,
        u.nickname,
        COUNT(b.id) as totalBets,
        SUM(b.amount) as totalBet,
        SUM(CASE WHEN b.status = 'win' THEN b.result_amount ELSE 0 END) as totalWin,
        SUM(CASE WHEN b.status = 'loss' THEN b.result_amount ELSE 0 END) as totalLoss,
        SUM(b.result_amount) as netProfit
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id 
        AND b.created_at >= ${start} 
        AND b.created_at <= ${end}
        AND b.status IN ('win', 'loss')
      GROUP BY u.id
      HAVING totalBets > 0
      ORDER BY netProfit DESC
      LIMIT 10
    `;

    return userStats.map((stat) => ({
      userId: stat.userId,
      username: stat.username,
      nickname: stat.nickname,
      totalBets: Number(stat.totalBets),
      totalBet: Number(stat.totalBet || 0),
      totalWin: Number(stat.totalWin || 0),
      totalLoss: Number(stat.totalLoss || 0),
      netProfit: Number(stat.netProfit || 0),
    }));
  }

  /**
   * 获取管理员操作日志
   */
  async getAdminLogs(query: QueryAdminLogDto) {
    const { page, limit, adminId, action, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = action;
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

    const total = await this.prisma.adminLog.count({ where });

    const list = await this.prisma.adminLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}



