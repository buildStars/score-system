import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LotteryService } from './lottery.service';
import { LotteryCountdownService } from './lottery-countdown.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 开奖数据定时同步服务（智能自适应检测频率）
 * 
 * 功能：
 * 1. 每3分钟自动同步一次（兜底）
 * 2. 智能检测：根据开奖时间动态调整检测频率
 *    - 平时：每60秒检测一次（节省资源）
 *    - 开奖后60秒：每5秒检测一次（密集获取）
 * 3. 解决第三方API延迟问题
 */
@Injectable()
export class LotterySyncService {
  private readonly logger = new Logger(LotterySyncService.name);
  private lastSyncedIssue: string = '';
  private isSyncing: boolean = false;
  private drawInterval: number = 210; // 开奖间隔（秒），从数据库加载
  private lastDrawTime: Date | null = null; // 上次开奖时间
  private currentPeriodIssue: string = ''; // 当前期号
  private newPeriodDetected: boolean = false; // 是否已检测到新期

  constructor(
    private readonly lotteryService: LotteryService,
    private readonly countdownService: LotteryCountdownService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 应用启动时立即同步一次
   */
  async onModuleInit() {
    this.logger.log('🚀 开奖数据定时同步服务已启动（智能自适应模式）');
    
    // 加载配置
    await this.loadSettings();
    
    // 初始化当前期号
    await this.initCurrentPeriod();
    
    // 延迟5秒后首次同步，避免启动时阻塞
    setTimeout(() => {
      this.syncLotteryData();
    }, 5000);
  }

  /**
   * 初始化当前期号
   */
  private async initCurrentPeriod() {
    try {
      const latest = await this.prisma.lotteryResult.findFirst({
        orderBy: { drawTime: 'desc' },
        select: { issue: true },
      });

      if (latest) {
        this.currentPeriodIssue = latest.issue;
        this.logger.debug(`📋 初始化当前期号: ${this.currentPeriodIssue}`);
      }
    } catch (error) {
      this.logger.error('初始化当前期号失败:', error.message);
    }
  }

  /**
   * 从数据库加载配置
   */
  private async loadSettings() {
    try {
      const drawIntervalSetting = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'draw_interval' },
      });

      if (drawIntervalSetting) {
        this.drawInterval = parseInt(drawIntervalSetting.settingValue);
        this.logger.debug(`📋 加载配置：开奖间隔 = ${this.drawInterval}秒`);
      }
    } catch (error) {
      this.logger.error('加载配置失败:', error.message);
    }
  }

  /**
   * 定时任务：每3分钟同步一次
   * 
   * 开奖周期是3分钟，这个定时任务确保：
   * - 即使倒计时监听失败，也能定期同步
   * - 漏掉的数据可以补上
   */
  @Cron('*/3 * * * *', {
    name: 'lottery-sync',
  })
  async handleScheduledSync() {
    this.logger.debug('⏰ 定时任务触发：开始同步开奖数据');
    await this.syncLotteryData();
  }

  /**
   * 智能自适应检测：每5秒运行一次，内部判断是否需要同步
   * 
   * 策略：
   * - 开奖后60秒内：每5秒检测一次（快速获取新期数据）
   * - 检测到新期后：立即停止密集检测，恢复常规频率
   * - 其他时间：每60秒检测一次（节省资源）
   */
  @Cron('*/5 * * * * *', {
    name: 'lottery-smart-check',
  })
  async smartCheck() {
    try {
      const now = new Date();
      const secondsSinceLastDraw = this.calculateSecondsSinceLastDraw(now);
      
      // 判断是否需要同步
      const shouldSync = this.shouldSyncNow(secondsSinceLastDraw, now);
      
      if (shouldSync) {
        await this.syncLotteryData();
      }
    } catch (error) {
      this.logger.error(`智能检测失败: ${error.message}`);
    }
  }

  /**
   * 计算距离上次开奖的秒数
   */
  private calculateSecondsSinceLastDraw(now: Date): number {
    if (!this.lastDrawTime) {
      // 如果没有上次开奖时间，从数据库获取最新的
      this.updateLastDrawTimeFromDB();
      return 0;
    }

    return Math.floor((now.getTime() - this.lastDrawTime.getTime()) / 1000);
  }

  /**
   * 从数据库更新最后开奖时间
   */
  private async updateLastDrawTimeFromDB() {
    try {
      const latest = await this.prisma.lotteryResult.findFirst({
        orderBy: { drawTime: 'desc' },
        select: { drawTime: true },
      });

      if (latest) {
        this.lastDrawTime = latest.drawTime;
      }
    } catch (error) {
      this.logger.error('更新最后开奖时间失败:', error.message);
    }
  }

  /**
   * 判断当前是否应该同步
   * 
   * @param secondsSinceLastDraw 距离上次开奖的秒数
   * @param now 当前时间
   * @returns 是否应该同步
   */
  private shouldSyncNow(secondsSinceLastDraw: number, now: Date): boolean {
    // 计算距离理论开奖时间的秒数（可能为负数，表示还没开奖）
    const secondsSinceExpectedDraw = secondsSinceLastDraw % this.drawInterval;
    
    // 情况1：开奖后60秒内，每5秒检测一次（快速获取新期数据）
    if (secondsSinceExpectedDraw >= 0 && secondsSinceExpectedDraw <= 60) {
      // 如果已经检测到新期，停止密集检测
      if (this.newPeriodDetected) {
        this.logger.debug(`✅ 已检测到新期，跳过密集检测`);
        return false;
      }
      
      this.logger.debug(`🎲 开奖后${secondsSinceExpectedDraw}秒，密集检测`);
      return true;
    }
    
    // 情况2：其他时间，每60秒检测一次（节省资源）
    // 只在5秒定时器的特定时刻执行（0秒）
    const currentSecond = now.getSeconds();
    if (currentSecond === 0) {
      this.logger.debug(`⏰ 常规检测（每分钟）`);
      return true;
    }
    
    return false;
  }

  /**
   * 核心同步方法
   */
  private async syncLotteryData() {
    // 防止并发同步
    if (this.isSyncing) {
      this.logger.debug('已有同步任务在运行，跳过本次');
      return;
    }

    this.isSyncing = true;

    try {
      this.logger.log('📡 开始同步开奖数据...');
      
      const result = await this.lotteryService.syncLotteryData();
      
      if (result.syncedCount > 0) {
        this.logger.log(
          `✅ 同步成功！新增 ${result.syncedCount} 条数据，最新期号: ${result.latestIssue}`,
        );
        
        // 更新最后同步的期号和时间
        if (result.latestIssue) {
          // 检测是否为新期
          const isNewPeriod = this.currentPeriodIssue !== result.latestIssue;
          
          if (isNewPeriod) {
            this.logger.log(`🎉 检测到新期！${this.currentPeriodIssue} → ${result.latestIssue}`);
            this.currentPeriodIssue = result.latestIssue;
            this.newPeriodDetected = true; // 标记已检测到新期，停止密集检测
          }
          
          this.lastSyncedIssue = result.latestIssue;
          // 更新最后开奖时间
          await this.updateLastDrawTimeFromDB();
          
          // 如果检测到新期，重置标志（准备下一个周期）
          if (isNewPeriod) {
            // 60秒后重置标志，准备下一个周期的密集检测
            setTimeout(() => {
              this.newPeriodDetected = false;
              this.logger.debug('🔄 重置新期检测标志，准备下一周期');
            }, 60000);
          }
        }
      } else {
        this.logger.debug('ℹ️  没有新的开奖数据');
      }

    } catch (error) {
      this.logger.error(`❌ 同步失败: ${error.message}`);
      
      // 记录详细错误供排查
      if (error.response) {
        this.logger.error(`API错误: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 手动触发同步（供外部调用）
   */
  async triggerSync() {
    this.logger.log('🔧 手动触发同步');
    await this.syncLotteryData();
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncedIssue: this.lastSyncedIssue,
    };
  }
}

