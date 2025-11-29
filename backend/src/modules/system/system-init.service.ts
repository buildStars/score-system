import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemInitService implements OnModuleInit {
  private readonly logger = new Logger(SystemInitService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initBetTypeSettings();
  }

  /**
   * 初始化下注类型设置
   */
  private async initBetTypeSettings() {
    try {
      // 检查是否已有数据
      const count = await this.prisma.betTypeSetting.count();
      
      if (count > 0) {
        this.logger.log(`✓ 下注类型设置已存在 (${count} 条)`);
        return;
      }

      this.logger.log('🔧 开始初始化下注类型设置...');

      // 默认配置
      const defaultSettings = [
        // 倍数下注
        {
          betType: 'multiple',
          name: '倍数',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 1,
          isEnabled: true,
          description: '中奖获得下注金额的1.95倍（如1.95表示投100赢195元）',
        },
        // 组合下注
        {
          betType: 'big',
          name: '大',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 2,
          isEnabled: true,
          description: '总和≥14',
        },
        {
          betType: 'small',
          name: '小',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 3,
          isEnabled: true,
          description: '总和≤13',
        },
        {
          betType: 'odd',
          name: '单',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 4,
          isEnabled: true,
          description: '总和为单数',
        },
        {
          betType: 'even',
          name: '双',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 5,
          isEnabled: true,
          description: '总和为双数',
        },
        {
          betType: 'big_odd',
          name: '大单',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 6,
          isEnabled: true,
          description: '总和≥14且为单数',
        },
        {
          betType: 'big_even',
          name: '大双',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 7,
          isEnabled: true,
          description: '总和≥14且为双数',
        },
        {
          betType: 'small_odd',
          name: '小单',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 8,
          isEnabled: true,
          description: '总和≤13且为单数',
        },
        {
          betType: 'small_even',
          name: '小双',
          odds: 1.95,
          minBet: 100.00,
          maxBet: 100000.00,
          feeRate: 3.00,
          sortOrder: 9,
          isEnabled: true,
          description: '总和≤13且为双数',
        },
      ];

      // 批量创建
      await this.prisma.betTypeSetting.createMany({
        data: defaultSettings,
      });

      this.logger.log(`✅ 下注类型设置初始化完成 (${defaultSettings.length} 条)`);
    } catch (error) {
      this.logger.error('❌ 初始化下注类型设置失败:', error);
      throw error;
    }
  }
}


