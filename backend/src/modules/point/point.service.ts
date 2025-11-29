import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryPointRecordDto } from './dto/query-point-record.dto';

@Injectable()
export class PointService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户积分记录（只显示上下分操作，不含游戏记录）
   */
  async getUserPointRecords(userId: number, query: QueryPointRecordDto) {
    const { page, limit, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    // 只查询上下分相关的类型，排除游戏相关记录
    const allowedTypes = ['recharge', 'deduct', 'admin_add', 'admin_deduct', 'refund'];
    where.type = { in: allowedTypes };

    // 如果有类型筛选
    if (type) {
      // 处理上分/下分筛选
      if (type.includes(',')) {
        // 如 'recharge,admin_add'
        where.type = { in: type.split(',') };
      } else {
        where.type = type;
      }
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

    const total = await this.prisma.pointRecord.count({ where });

    const list = await this.prisma.pointRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // 处理返回数据，格式化数字字段
    const processedList = list.map(record => {
      const amount = Number(record.amount);
      return {
        ...record,
        amount: amount.toFixed(2), // 变动金额保留两位小数
        balanceBefore: Math.floor(Number(record.balanceBefore)), // 积分返回整数
        balanceAfter: Math.floor(Number(record.balanceAfter)), // 积分返回整数
        // 根据金额正负判断类型
        displayType: amount >= 0 ? '上分' : '下分',
        // 原始类型保留
        originalType: record.type,
      };
    });

    return {
      list: processedList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取所有积分记录（管理员）
   */
  async getAllPointRecords(query: QueryPointRecordDto) {
    const { page, limit, userId, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    // 管理员只查看手动调整的记录（上分/下分）
    if (type) {
      // 如果指定了类型，验证是否为允许的类型
      if (['admin_add', 'admin_deduct'].includes(type)) {
        where.type = type;
      }
    } else {
      // 默认只显示管理员操作的记录
      where.type = {
        in: ['admin_add', 'admin_deduct'],
      };
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

    const total = await this.prisma.pointRecord.count({ where });

    const list = await this.prisma.pointRecord.findMany({
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

    // 处理返回数据，格式化数字字段
    const processedList = list.map(record => {
      const amount = Number(record.amount);
      return {
        ...record,
        amount: amount.toFixed(2), // 变动金额保留两位小数
        balanceBefore: Math.floor(Number(record.balanceBefore)), // 积分返回整数
        balanceAfter: Math.floor(Number(record.balanceAfter)), // 积分返回整数
        // 根据金额正负判断类型
        displayType: amount >= 0 ? '上分' : '下分',
        // 原始类型保留
        originalType: record.type,
      };
    });

    // 统计汇总
    const summary = await this.getPointRecordsSummary(where);

    return {
      list: processedList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  /**
   * 获取积分记录汇总
   */
  private async getPointRecordsSummary(where: any) {
    const result = await this.prisma.pointRecord.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    // 按类型统计
    const typeStats = await this.prisma.pointRecord.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const typeStatsMap: any = {};
    typeStats.forEach((stat) => {
      typeStatsMap[stat.type] = {
        count: stat._count.id,
        amount: Number(stat._sum.amount || 0).toFixed(2), // 金额保留两位小数
      };
    });

    return {
      totalAmount: Number(result._sum.amount || 0).toFixed(2), // 总金额保留两位小数
      typeStats: typeStatsMap,
    };
  }
}

