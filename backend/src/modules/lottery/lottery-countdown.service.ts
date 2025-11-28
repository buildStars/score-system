import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as https from 'https';
import * as dayjs from 'dayjs';
import { LotteryStatusDto } from './dto/lottery-status.dto';

@Injectable()
export class LotteryCountdownService {
  private readonly logger = new Logger(LotteryCountdownService.name);

  // 默认配置（当数据库读取失败时使用）
  private DRAW_INTERVAL = 210; // 开奖间隔：3.5分钟 = 210秒
  private CLOSE_BEFORE_DRAW = 30; // 封盘时间：开奖前30秒（0表示不封盘）
  private WARNING_TIME = 60; // 即将封盘预警时间：封盘前60秒
  private get OPEN_TIME() {
    return this.DRAW_INTERVAL - this.CLOSE_BEFORE_DRAW; // 开盘时间
  }

  // 缓存最新开奖数据
  private currentPeriod: string = '';
  private lastDrawTime: Date | null = null;
  private isInitialized = false;

  constructor(private prisma: PrismaService) {
    // 启动时立即初始化
    this.initialize();
  }

  /**
   * 初始化：加载配置并获取最新开奖数据
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.logger.log('初始化封盘倒计时服务...');
      
      // 加载配置
      await this.loadSettings();
      
      // 获取最新开奖数据（失败也不影响初始化）
      await this.fetchLatestDraw();
      
      this.logger.log(
        `封盘倒计时服务初始化成功 - 开奖间隔:${this.DRAW_INTERVAL}秒, 封盘时间:${this.CLOSE_BEFORE_DRAW}秒, 当前期号:${this.currentPeriod || '未知'}`
      );
    } catch (error) {
      this.logger.error('初始化遇到问题:', error.message);
    } finally {
      // 无论成功失败都标记为已初始化，避免反复尝试
      this.isInitialized = true;
    }
  }

  /**
   * 从数据库加载配置
   */
  private async loadSettings() {
    try {
      // 读取开奖间隔时间
      const drawInterval = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'draw_interval' },
      });
      if (drawInterval) {
        this.DRAW_INTERVAL = parseInt(drawInterval.settingValue) || 210;
      }

      // 读取封盘时间（0表示不封盘）
      const closeBeforeDraw = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'close_before_draw' },
      });
      if (closeBeforeDraw) {
        this.CLOSE_BEFORE_DRAW = parseInt(closeBeforeDraw.settingValue);
        // 允许为0，不设置默认值
      }

      this.logger.log(
        `配置加载成功: 开奖间隔=${this.DRAW_INTERVAL}秒, 封盘时间=${this.CLOSE_BEFORE_DRAW}秒${this.CLOSE_BEFORE_DRAW === 0 ? '（不封盘）' : ''}`
      );
    } catch (error) {
      this.logger.error('加载配置失败，使用默认值:', error.message);
    }
  }

  /**
   * 刷新配置（管理员修改设置后调用）
   */
  async refreshSettings() {
    await this.loadSettings();
    this.logger.log('配置已刷新');
  }

  /**
   * 从数据库同步最新数据（优先使用，不调用第三方API）
   */
  private async syncFromDatabase() {
    try {
      const latest = await this.prisma.lotteryResult.findFirst({
        orderBy: { drawTime: 'desc' },
        select: {
          issue: true,
          drawTime: true,
        },
      });

      if (latest) {
        // 如果数据库的期号更新了，更新缓存
        if (latest.issue !== this.currentPeriod) {
          this.logger.debug(`📊 从数据库更新期号: ${this.currentPeriod} → ${latest.issue}`);
          this.currentPeriod = latest.issue;
          this.lastDrawTime = latest.drawTime;
        }
      }
    } catch (error) {
      this.logger.error('从数据库同步数据失败:', error.message);
    }
  }

  /**
   * 定时任务：每个开奖周期同步一次
   * 统一使用定时任务，不通过倒计时触发
   * 使用动态间隔，与开奖间隔保持一致
   */
  @Interval('syncLatestDraw', 210000) // 210秒 = 210000毫秒
  async syncLatestDraw() {
    try {
      await this.fetchLatestDraw();
      this.logger.log('定时同步最新开奖数据成功');
    } catch (error) {
      this.logger.error('定时同步失败:', error.message);
    }
  }
  
  /**
   * 定时任务：每10秒检查是否到达开奖时刻
   * 只在开奖后进行密集同步，确保及时获取新期号
   */


  /**
   * 定时任务：每5分钟重新加载配置（以防管理员修改了设置）
   * 配置包括：开奖间隔时间、封盘时间
   */
  @Cron('*/5 * * * *')
  async reloadSettings() {
    try {
      await this.loadSettings();
      this.logger.debug('定时重新加载配置成功');
    } catch (error) {
      this.logger.error('定时重新加载配置失败:', error.message);
    }
  }

  /**
   * 从 USA28 API 获取最新开奖数据
   * @param pageSize 获取的记录数，默认2条（只需要最新的）
   */
  private async fetchLatestDraw(pageSize: number = 2) {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });

      const response = await axios.get(
        'https://api.365kaik.com/api/v1/trend/getHistoryList',
        {
          params: {
            lotCode: '10029',
            pageSize: pageSize.toString(),
            pageNum: '0',
            t: Date.now().toString(),
          },
          timeout: 10000, // 降低超时时间到10秒
          httpsAgent,
        },
      );

      if (
        response.data?.code === 0 &&
        response.data?.data?.list?.[0]
      ) {
        const latest = response.data.data.list[0];
        const newPeriod = latest.drawIssue;
        const newDrawTime = new Date(latest.drawTime);

        // 只在期号变化时更新
        if (newPeriod !== this.currentPeriod) {
          const oldPeriod = this.currentPeriod;
          this.currentPeriod = newPeriod;
          this.lastDrawTime = newDrawTime;
          
          this.logger.log(`✓ 更新最新开奖数据: 期号 ${oldPeriod} → ${newPeriod}, 时间=${latest.drawTime}`);
        }
      }
    } catch (error) {
      this.logger.warn('API获取失败，尝试从数据库获取:', error.message);
      
      // 降级方案：从数据库获取最新开奖数据
      try {
        await this.fetchFromDatabase();
      } catch (dbError) {
        this.logger.error('从数据库获取数据也失败:', dbError.message);
        // 不抛出错误，让服务继续运行
      }
    }
  }

  /**
   * 从数据库获取最新开奖数据（降级方案）
   */
  private async fetchFromDatabase() {
    const latestResult = await this.prisma.lotteryResult.findFirst({
      orderBy: { drawTime: 'desc' },
      select: {
        issue: true,
        drawTime: true,
      },
    });

    if (latestResult) {
      const newPeriod = latestResult.issue;
      const newDrawTime = latestResult.drawTime;

      if (newPeriod !== this.currentPeriod) {
        const oldPeriod = this.currentPeriod || '(无)';
        this.currentPeriod = newPeriod;
        this.lastDrawTime = newDrawTime;
        
        this.logger.log(`✓ 从数据库获取最新数据: 期号 ${oldPeriod} → ${newPeriod}`);
      }
    } else {
      this.logger.warn('数据库中没有开奖数据，使用默认值');
      // 使用默认值，让服务至少能运行
      if (!this.currentPeriod) {
        this.currentPeriod = '3330421';
        this.lastDrawTime = new Date();
        this.logger.log('使用默认期号: 3330421');
      }
    }
  }

  /**
   * 获取当前彩票状态
   */
  async getLotteryStatus(): Promise<LotteryStatusDto> {
    // 确保已初始化
    if (!this.isInitialized || !this.lastDrawTime) {
      await this.initialize();
    }

    // 🔑 关键优化：从数据库读取最新数据，确保与同步服务数据一致
    await this.syncFromDatabase();

    const now = new Date();
    const serverTime = dayjs(now).format('YYYY-MM-DD HH:mm:ss');

    // 如果没有最新数据，返回加载中状态
    if (!this.lastDrawTime || !this.currentPeriod) {
      return {
        currentPeriod: '加载中...',
        nextPeriod: '计算中...',
        currentCloseTime: serverTime,
        currentDrawTime: serverTime,
        serverTime,
        status: 'closed',
        canBet: false,
        countdown: 0,
        countdownText: '正在加载开奖数据...',
        progressPercentage: 0,
      };
    }

    // 计算当前期的开奖时间
    const currentDrawDate = dayjs(this.lastDrawTime).add(this.DRAW_INTERVAL, 'second');
    let diffSeconds = currentDrawDate.diff(dayjs(now), 'second');

    // 如果倒计时为负数，使用估算值（不再触发刷新，由定时任务负责）
    if (diffSeconds <= 0) {
      // 估算：基于开奖间隔计算合理的倒计时
      diffSeconds = this.DRAW_INTERVAL - (Math.abs(diffSeconds) % this.DRAW_INTERVAL);
      this.logger.debug(`倒计时为负，使用估算值: ${diffSeconds}秒（等待定时任务同步）`);
    }

    // 计算当前期封盘时间 = 开奖时间 - 封盘时长
    const currentCloseDate = currentDrawDate.subtract(this.CLOSE_BEFORE_DRAW, 'second');
    
    // 格式化时间字符串
    const currentCloseTime = currentCloseDate.format('YYYY-MM-DD HH:mm:ss');
    const currentDrawTime = currentDrawDate.format('YYYY-MM-DD HH:mm:ss');
    
    // 计算下期期号
    const nextPeriod = (parseInt(this.currentPeriod) + 1).toString();

    // 判断当前状态（只有开盘和封盘两种状态）
    let status: 'open' | 'closed';
    let canBet: boolean;
    let countdown: number;
    let countdownText: string;
    let progressPercentage: number;

    const secondsToClose = currentCloseDate.diff(dayjs(now), 'second');
    const secondsToDraw = currentDrawDate.diff(dayjs(now), 'second');

    if (secondsToClose > 0) {
      // 开盘状态：封盘时间还没到
      status = 'open';
      canBet = true;
      countdown = secondsToClose;
      
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      
      if (this.CLOSE_BEFORE_DRAW === 0) {
        // 封盘时间为0，显示距离开奖的时间
        countdownText = `距离开奖还有 ${minutes} 分 ${seconds} 秒`;
      } else {
        // 显示距离封盘的时间
        countdownText = `距离封盘还有 ${minutes} 分 ${seconds} 秒`;
      }
      
      // 进度 = 已过时间 / 总开盘时间
      const totalOpenTime = this.DRAW_INTERVAL - this.CLOSE_BEFORE_DRAW;
      const elapsedTime = totalOpenTime - secondsToClose;
      progressPercentage = totalOpenTime > 0 ? (elapsedTime / totalOpenTime) * 100 : 0;
      
    } else if (secondsToDraw > 0) {
      // 封盘状态：封盘时间已到，但开奖时间还没到
      status = 'closed';
      canBet = this.CLOSE_BEFORE_DRAW === 0; // 如果封盘时间为0，仍然可以下注
      countdown = secondsToDraw;
      
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      countdownText = `距离开奖还有 ${minutes} 分 ${seconds} 秒`;
      
      // 进度 = 已封盘时间 / 总封盘时间
      if (this.CLOSE_BEFORE_DRAW > 0) {
        const elapsedCloseTime = this.CLOSE_BEFORE_DRAW - secondsToDraw;
        progressPercentage = (elapsedCloseTime / this.CLOSE_BEFORE_DRAW) * 100;
      } else {
        progressPercentage = 100;
      }
      
    } else {
      // 开奖时间已过，等待刷新新数据
      status = 'closed';
      canBet = false;
      countdown = 0;
      countdownText = '等待开奖中...';
      progressPercentage = 100;
    }

    return {
      currentPeriod: this.currentPeriod,
      nextPeriod,
      currentCloseTime,
      currentDrawTime,
      serverTime,
      status,
      canBet,
      countdown,
      countdownText,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    };
  }

  /**
   * 检查是否可以下注
   */
  async canPlaceBet(): Promise<{ canBet: boolean; reason?: string }> {
    const status = await this.getLotteryStatus();

    if (!status.canBet) {
      return {
        canBet: false,
        reason: status.status === 'closed' 
          ? `第 ${status.currentPeriod} 期已封盘，请等待开奖`
          : '系统正在加载中，请稍后',
      };
    }

    return { canBet: true };
  }

  /**
   * 获取当前期号
   */
  getCurrentPeriod(): string {
    return this.currentPeriod || '';
  }

  /**
   * 手动刷新最新数据
   */
  async refresh() {
    await this.fetchLatestDraw();
  }
}

