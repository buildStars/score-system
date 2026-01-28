import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { LotteryStatusDto } from './dto/lottery-status.dto';
import * as dayjs from 'dayjs';

/**
 * 彩票倒计时服务
 * 负责计算倒计时、封盘状态、发送封盘通知等
 */
@Injectable()
export class LotteryCountdownService {
  private readonly logger = new Logger(LotteryCountdownService.name);
  
  // 配置缓存
  private DRAW_INTERVAL: number = 210; // 开奖间隔（秒），默认210秒
  private CLOSE_BEFORE_DRAW: number = 5; // 封盘时间（秒），默认5秒
  
  // 状态缓存
  private currentPeriod: string = ''; // 当前已开奖的期号
  private lastCloseStatus: boolean = false; // 上次封盘状态
  
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {
    // 启动时加载配置
    this.loadConfig();
  }

  /**
   * 从数据库加载配置
   */
  private async loadConfig() {
    try {
      const drawIntervalSetting = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'draw_interval' },
      });
      const closeBeforeDrawSetting = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'close_before_draw' },
      });

      this.DRAW_INTERVAL = drawIntervalSetting 
        ? parseInt(drawIntervalSetting.settingValue) || 210 
        : 210;
      this.CLOSE_BEFORE_DRAW = closeBeforeDrawSetting 
        ? parseInt(closeBeforeDrawSetting.settingValue) || 5 
        : 5;

      this.logger.log(`配置加载成功: 开奖间隔=${this.DRAW_INTERVAL}秒, 封盘时间=${this.CLOSE_BEFORE_DRAW}秒`);
    } catch (error) {
      this.logger.error('加载配置失败，使用默认值', error);
    }
  }

  /**
   * 定时重新加载配置（每5分钟）
   */
  @Cron('*/5 * * * *', {
    name: 'reload-config',
  })
  async reloadConfig() {
    await this.loadConfig();
    this.logger.debug('定时重新加载配置成功');
  }

  /**
   * 获取彩票状态
   */
  async getLotteryStatus(): Promise<LotteryStatusDto> {
    try {
      // 获取最新一期开奖结果
      const lastResult = await this.prisma.lotteryResult.findFirst({
        orderBy: { drawTime: 'desc' },
      });

      const now = new Date();
      let currentPeriod: string;
      let nextPeriod: string;
      let currentDrawTime: Date;
      let currentCloseTime: Date;

      if (lastResult) {
        // 有开奖记录，计算下一期
        currentPeriod = lastResult.issue;
        nextPeriod = (parseInt(currentPeriod) + 1).toString();
        
        // 计算下一期的开奖时间（基于上次开奖时间 + 间隔）
        const lastDrawTime = dayjs(lastResult.drawTime);
        currentDrawTime = lastDrawTime.add(this.DRAW_INTERVAL, 'second').toDate();
        
        // 计算封盘时间（开奖时间 - 封盘时间）
        currentCloseTime = dayjs(currentDrawTime).subtract(this.CLOSE_BEFORE_DRAW, 'second').toDate();
      } else {
        // 没有开奖记录，使用默认值
        currentPeriod = '3389187';
        nextPeriod = '3389188';
        currentDrawTime = dayjs().add(this.DRAW_INTERVAL, 'second').toDate();
        currentCloseTime = dayjs(currentDrawTime).subtract(this.CLOSE_BEFORE_DRAW, 'second').toDate();
      }

      // 更新当前期号缓存
      if (this.currentPeriod !== currentPeriod) {
        this.logger.debug(`📊 从数据库更新期号: ${this.currentPeriod} → ${currentPeriod}`);
        this.currentPeriod = currentPeriod;
      }

      // 计算倒计时
      const nowDayjs = dayjs(now);
      const closeDate = dayjs(currentCloseTime);
      const drawDate = dayjs(currentDrawTime);

      // 先计算原始值（可能为负数），用于封盘判断
      const rawSecondsToClose = closeDate.diff(nowDayjs, 'second');
      const rawSecondsToDraw = drawDate.diff(nowDayjs, 'second');
      
      // 用于显示的倒计时（限制为0或正数）
      const secondsToClose = Math.max(0, rawSecondsToClose);
      const secondsToDraw = Math.max(0, rawSecondsToDraw);

      // 修正封盘判断：只要距封盘时间<=0就算封盘（如果配置了封盘时间）
      // 但如果封盘时间配置为0，则不封盘
      // 使用原始值判断，而不是被Math.max限制后的值
      const isClosed = rawSecondsToClose <= 0 && this.CLOSE_BEFORE_DRAW > 0;
      
      // 调试日志：记录封盘状态检测
      this.logger.debug(`封盘状态检测 - 已开奖期号: ${this.currentPeriod}, 当前下注期号: ${nextPeriod}, 距封盘: ${rawSecondsToClose}秒(显示:${secondsToClose}秒), 距开奖: ${rawSecondsToDraw}秒(显示:${secondsToDraw}秒), 是否封盘: ${isClosed}, 上次状态: ${this.lastCloseStatus}, 封盘配置: ${this.CLOSE_BEFORE_DRAW}秒`);

      // 确定状态
      let status: 'open' | 'closing' | 'closed';
      if (isClosed) {
        status = 'closed';
      } else if (secondsToClose <= 10 && secondsToClose > 0) {
        status = 'closing'; // 即将封盘（10秒内）
      } else {
        status = 'open';
      }

      // 计算倒计时（秒）
      const countdown = isClosed ? secondsToDraw : secondsToClose;

      return {
        currentPeriod: nextPeriod, // 当前下注期号
        nextPeriod: (parseInt(nextPeriod) + 1).toString(), // 下下期期号
        currentCloseTime: currentCloseTime.toISOString().replace('T', ' ').substring(0, 19),
        currentDrawTime: currentDrawTime.toISOString().replace('T', ' ').substring(0, 19),
        serverTime: now.toISOString().replace('T', ' ').substring(0, 19),
        status,
        canBet: !isClosed,
        countdown: Math.max(0, countdown),
        countdownText: isClosed ? `距离开奖还有 ${Math.floor(countdown / 60)}分${countdown % 60}秒` : `距离封盘还有 ${Math.floor(countdown / 60)}分${countdown % 60}秒`,
        progressPercentage: isClosed 
          ? Math.min(100, Math.max(0, (this.CLOSE_BEFORE_DRAW - secondsToDraw) / this.CLOSE_BEFORE_DRAW * 100))
          : Math.min(100, Math.max(0, (this.DRAW_INTERVAL - secondsToClose) / this.DRAW_INTERVAL * 100)),
      };
    } catch (error) {
      this.logger.error('获取彩票状态失败', error);
      throw error;
    }
  }

  /**
   * 检查是否可以下注
   * @returns 返回是否可以下注及原因
   */
  async canPlaceBet(): Promise<{ canBet: boolean; reason?: string }> {
    const status = await this.getLotteryStatus();
    if (!status.canBet) {
      return {
        canBet: false,
        reason: status.status === 'closed' ? '已封盘，无法下注' : '当前不可下注',
      };
    }
    return { canBet: true };
  }

  /**
   * 刷新状态（手动触发）
   */
  async refresh() {
    await this.loadConfig();
    this.logger.log('状态已刷新');
  }

  /**
   * 定时检查封盘状态（每10秒）
   * 检测封盘状态变化，触发封盘汇总通知
   */
  @Cron('*/10 * * * * *', {
    name: 'check-close-status',
  })
  async checkCloseStatus() {
    try {
      const status = await this.getLotteryStatus();
      const currentBettingPeriod = status.currentPeriod; // 当前下注期号
      const currentDrawTime = status.currentDrawTime;
      const isClosed = status.status === 'closed';

      this.logger.debug(`[定时任务] 检查封盘状态 - 当前期号: ${this.currentPeriod}, 上次封盘状态: ${this.lastCloseStatus}`);

      // 检测封盘状态变化：从开盘变为封盘时，发送通知到久旺机器人和Telegram汇总
      if (isClosed && !this.lastCloseStatus) {
        // 封盘状态变化：从开盘变为封盘
        this.logger.log(`🔔 检测到封盘状态变化 - 已开奖期号: ${this.currentPeriod}, 当前下注期号: ${currentBettingPeriod}, 封盘时间: ${this.CLOSE_BEFORE_DRAW}秒`);
        
        try {
          if (this.CLOSE_BEFORE_DRAW > 0) {
            // 有封盘时间配置，发送封盘通知和汇总
            this.logger.log(`📤 开始发送封盘汇总通知 - 期号: ${currentBettingPeriod}`);
            await this.sendCloseNotification(currentBettingPeriod, currentDrawTime);
          } else {
            // 没有封盘时间配置（CLOSE_BEFORE_DRAW = 0），仍然发送汇总（因为开奖前也算封盘）
            this.logger.log(`📤 封盘时间为0，仅发送汇总通知 - 期号: ${currentBettingPeriod}`);
            const result = await this.telegramService.sendCloseSummaryNotification(currentBettingPeriod).catch(err => {
              this.logger.error(`❌ 封盘汇总通知发送失败 - 期号: ${currentBettingPeriod}`, err);
              return false;
            });
            
            if (result) {
              this.logger.log(`✅ 封盘汇总通知发送成功 - 期号: ${currentBettingPeriod}`);
            } else {
              this.logger.warn(`⚠️ 封盘汇总通知发送失败（返回false）- 期号: ${currentBettingPeriod}`);
            }
          }
        } catch (error) {
          this.logger.error(`❌ 封盘通知处理异常 - 期号: ${currentBettingPeriod}`, error);
        }
      }
      
      this.lastCloseStatus = isClosed;
    } catch (error) {
      this.logger.error('检查封盘状态失败', error);
    }
  }

  /**
   * 发送封盘通知
   * @param issue 期号
   * @param drawTime 开奖时间
   */
  private async sendCloseNotification(issue: string, drawTime: string) {
    try {
      this.logger.log(`📤 发送封盘通知 - 期号: ${issue}, 开奖时间: ${drawTime}`);
      
      // 发送Telegram汇总通知
      const result = await this.telegramService.sendCloseSummaryNotification(issue).catch(err => {
        this.logger.error(`❌ Telegram封盘汇总通知发送失败 - 期号: ${issue}`, err);
        return false;
      });
      
      if (result) {
        this.logger.log(`✅ 封盘汇总通知发送成功 - 期号: ${issue}`);
      } else {
        this.logger.warn(`⚠️ 封盘汇总通知发送失败（返回false）- 期号: ${issue}`);
      }
    } catch (error) {
      this.logger.error(`❌ 发送封盘通知异常 - 期号: ${issue}`, error);
    }
  }
}


