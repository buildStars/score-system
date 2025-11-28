import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ILotteryDataSource, LotteryDataItem } from '../interfaces/lottery-data-source.interface';

/**
 * 数据库数据源（备用数据源2 - 最后兜底）
 * 从本地数据库读取最新数据
 */
@Injectable()
export class DatabaseDataSource implements ILotteryDataSource {
  name = 'Database';
  priority = 99;  // 最低优先级，作为最后兜底
  enabled = true;
  
  private readonly logger = new Logger(DatabaseDataSource.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 从数据库获取最新数据
   */
  async fetchLatestData(): Promise<LotteryDataItem[]> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔄 从数据库读取最新开奖数据`);
      
      const results = await this.prisma.lotteryResult.findMany({
        orderBy: { drawTime: 'desc' },
        take: 2,
      });

      if (results.length === 0) {
        throw new Error('数据库中没有开奖数据');
      }

      const data: LotteryDataItem[] = results.map(item => ({
        issue: item.issue,
        drawTime: item.drawTime,
        number1: item.number1,
        number2: item.number2,
        number3: item.number3,
        sumValue: item.resultSum,
        source: this.name,
      }));

      const responseTime = Date.now() - startTime;
      this.logger.log(`✅ 数据库读取成功: ${data.length}条数据 (${responseTime}ms)`);
      
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`❌ 数据库读取失败 (${responseTime}ms): ${error.message}`);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.lotteryResult.findFirst();
      return true;
    } catch (error) {
      return false;
    }
  }
}

