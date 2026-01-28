import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramUserClientService } from './telegram-user-client.service';

/**
 * Telegram 机器人通知服务
 * 用于将下注信息推送到 Telegram 群组/频道
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private prisma: PrismaService,
    private telegramUserClientService: TelegramUserClientService,
  ) {}

  /**
   * 获取 Telegram 配置（汇率和取整方式）
   */
  private async getConfig() {
    const rateSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_rate' },
    });
    const multipleRoundSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_multiple_round' },
    });
    const comboRoundSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_combo_round' },
    });

    return {
      rate: parseFloat(rateSetting?.settingValue || '1') || 1, // 汇率，默认为1
      multipleRound: multipleRoundSetting?.settingValue || 'round', // 倍数取整方式：round(四舍五入)、floor(向下)、ceil(向上)
      comboRound: comboRoundSetting?.settingValue || 'round', // 组合取整方式：round(四舍五入)、floor(向下)、ceil(向上)
    };
  }

  /**
   * 获取久旺机器人配置
   */
  private async getJiuwangConfig() {
    const botTokenSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_jiuwang_bot_token' },
    });
    const chatIdSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_jiuwang_chat_id' },
    });
    const enabledSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_jiuwang_enabled' },
    });

    return {
      botToken: botTokenSetting?.settingValue || '',
      chatId: chatIdSetting?.settingValue || '',
      enabled: enabledSetting?.settingValue === 'true',
    };
  }

  /**
   * 发送消息到久旺机器人（Bot模式）
   */
  async sendJiuwangMessage(message: string): Promise<boolean> {
    try {
      const config = await this.getJiuwangConfig();

      if (!config.enabled) {
        this.logger.debug('久旺机器人通知未启用');
        return false;
      }

      if (!config.botToken || !config.chatId) {
        this.logger.warn('久旺机器人配置不完整');
        return false;
      }

      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();

      if (result.ok) {
        this.logger.log('久旺机器人消息发送成功');
        return true;
      } else {
        this.logger.error('久旺机器人消息发送失败:', result.description);
        return false;
      }
    } catch (error) {
      this.logger.error('久旺机器人发送异常:', error);
      return false;
    }
  }

  /**
   * 发送消息到 Telegram
   * 只使用用户账号模式
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      // 检查是否启用用户账号模式
      const userEnabledSetting = await this.prisma.systemSetting.findUnique({
        where: { settingKey: 'telegram_user_enabled' },
      });
      
      if (userEnabledSetting?.settingValue !== 'true') {
        this.logger.debug('Telegram 用户账号模式未启用');
        return false;
      }

      // 使用用户账号模式发送消息
      this.logger.debug('使用Telegram用户账号模式发送消息');
      return await this.telegramUserClientService.sendMessage(message);
    } catch (error) {
      this.logger.error('Telegram 发送异常:', error);
      return false;
    }
  }

  // 需要过滤的下注类型（大、小、单、双）
  private readonly FILTERED_BET_CONTENTS = ['大', '小', '单', '双'];

  /**
   * 发送下注通知
   * 上报：倍数 + 组合（大单、大双、小单、小双）
   * 不上报：大、小、单、双
   * @param bet 下注信息
   * @param user 用户信息
   */
  async sendBetNotification(bet: {
    issue: string;
    betType: string;
    betContent: string;
    amount: number;
  }, user: {
    id: number;
    username: string;
    nickname?: string;
  }): Promise<boolean> {
    // 过滤掉大、小、单、双（单独的）
    if (this.FILTERED_BET_CONTENTS.includes(bet.betContent)) {
      this.logger.debug(`跳过大小单双下注: ${bet.betContent}`);
      return false;
    }

    const config = await this.getConfig();
    
    // 应用汇率：金额除以汇率
    const adjustedAmount = bet.amount / config.rate;
    
    // 获取当期汇总（传递倍数和组合取整方式）
    const issueSummary = await this.getIssueBetSummary(
      bet.issue, 
      config.rate, 
      config.multipleRound, 
      config.comboRound
    );
    
    // 构建消息
    const message = this.buildBetMessageWithSummary(
      '下注',
      adjustedAmount,
      bet.betType === 'multiple' ? '倍' : bet.betContent,
      user,
      bet.issue,
      issueSummary,
    );

    return this.sendMessage(message);
  }

  /**
   * 发送取消下注通知
   * 取消下注不上报
   */
  async sendCancelBetNotification(
    issue: string,
    betType: string,
    betContent: string,
    cancelledAmount: number,
    user: {
      id: number;
      username: string;
      nickname?: string;
    },
  ): Promise<boolean> {
    // 取消下注不上报
    this.logger.debug('取消下注不上报');
    return false;
  }

  /**
   * 取整函数
   */
  private roundNumber(value: number, roundType: string): number {
    switch (roundType) {
      case 'ceil':
        return Math.ceil(value);
      case 'floor':
        return Math.floor(value);
      case 'round':
      default:
        return Math.round(value);
    }
  }

  /**
   * 获取指定期号的下注汇总
   * 规则：
   * 1. 倍数下注：拆分为大和小上报（大=倍数/汇率，小=倍数/汇率）
   * 2. 组合下注：直接除以汇率上报，不拆分（例如：700大双 ÷ 7 = 100大双）
   */
  private async getIssueBetSummary(issue: string, rate: number, multipleRound: string = 'round', comboRound: string = 'round'): Promise<{
    big: number;      // 大（来自倍数下注）
    small: number;     // 小（来自倍数下注）
    bigOdd: number;    // 大单（组合下注，已除以汇率）
    bigEven: number;   // 大双（组合下注，已除以汇率）
    smallOdd: number;  // 小单（组合下注，已除以汇率）
    smallEven: number; // 小双（组合下注，已除以汇率）
  }> {
    // 查询当期所有 pending 状态的下注
    const bets = await this.prisma.bet.findMany({
      where: {
        issue,
        status: 'pending',
      },
      select: {
        betType: true,
        betContent: true,
        amount: true,
      },
    });

    let multiple = 0;
    let bigOdd = 0;
    let bigEven = 0;
    let smallOdd = 0;
    let smallEven = 0;

    this.logger.debug(`查询当期下注 - 期号: ${issue}, 找到 ${bets.length} 条记录`);
    
    for (const bet of bets) {
      const amount = Number(bet.amount);
      this.logger.debug(`  下注记录: betType=${bet.betType}, betContent=${bet.betContent}, amount=${amount}`);
      
      if (bet.betType === 'multiple') {
        // 倍数下注：累加金额
        multiple += amount;
        this.logger.debug(`    累加到倍数: ${multiple}`);
      } else {
        // 组合下注：按类型累加
        switch (bet.betContent) {
          case '大单':
            bigOdd += amount;
            this.logger.debug(`    累加到大单: ${bigOdd}`);
            break;
          case '大双':
            bigEven += amount;
            this.logger.debug(`    累加到大双: ${bigEven}`);
            break;
          case '小单':
            smallOdd += amount;
            this.logger.debug(`    累加到小单: ${smallOdd}`);
            break;
          case '小双':
            smallEven += amount;
            this.logger.debug(`    累加到小双: ${smallEven}`);
            break;
        }
      }
    }
    
    this.logger.debug(`累加结果: 倍数=${multiple}, 大单=${bigOdd}, 大双=${bigEven}, 小单=${smallOdd}, 小双=${smallEven}`);
    
    // 倍数下注：除以汇率后拆分为大和小
    const multipleAfterRate = multiple / rate;
    const bigFromMultiple = this.roundNumber(multipleAfterRate, multipleRound);
    const smallFromMultiple = this.roundNumber(multipleAfterRate, multipleRound);
    
    // 组合下注：除以汇率后直接上报，不拆分
    const bigOddRounded = this.roundNumber(bigOdd / rate, comboRound);
    const bigEvenRounded = this.roundNumber(bigEven / rate, comboRound);
    const smallOddRounded = this.roundNumber(smallOdd / rate, comboRound);
    const smallEvenRounded = this.roundNumber(smallEven / rate, comboRound);
    
    // 调试日志
    this.logger.debug(`汇总计算 - 期号: ${issue}, 汇率: ${rate}`);
    this.logger.debug(`  倍数下注: ${multiple} -> ${multipleAfterRate} -> 大:${bigFromMultiple} 小:${smallFromMultiple}`);
    this.logger.debug(`  组合下注: 大单:${bigOdd} 大双:${bigEven} 小单:${smallOdd} 小双:${smallEven}`);
    this.logger.debug(`  组合下注(已处理): 大单:${bigOddRounded} 大双:${bigEvenRounded} 小单:${smallOddRounded} 小双:${smallEvenRounded}`);
    
    return {
      big: bigFromMultiple,
      small: smallFromMultiple,
      bigOdd: bigOddRounded,
      bigEven: bigEvenRounded,
      smallOdd: smallOddRounded,
      smallEven: smallEvenRounded,
    };
  }

  /**
   * 发送封盘汇总通知
   * 封盘后统一上报当期的所有订单汇总
   * @param issue 期号
   */
  async sendCloseSummaryNotification(issue: string): Promise<boolean> {
    try {
      this.logger.log(`开始处理封盘汇总 - 期号: ${issue}`);
      
      const config = await this.getConfig();
      this.logger.debug(`配置信息 - 汇率: ${config.rate}, 倍数取整: ${config.multipleRound}, 组合取整: ${config.comboRound}`);
      
      // 获取当期汇总
      const issueSummary = await this.getIssueBetSummary(
        issue,
        config.rate,
        config.multipleRound,
        config.comboRound
      );
      
      this.logger.debug(`汇总结果 - 大:${issueSummary.big} 小:${issueSummary.small} 大单:${issueSummary.bigOdd} 大双:${issueSummary.bigEven} 小单:${issueSummary.smallOdd} 小双:${issueSummary.smallEven}`);
      
      // 构建汇总消息
      const message = this.buildSummaryMessage(issue, issueSummary);
      
      if (message === '暂无') {
        this.logger.warn(`期号 ${issue} 无下注，不发送封盘汇总`);
        return false;
      }
      
      this.logger.log(`准备发送封盘汇总通知 - 期号: ${issue}, 消息: ${message}`);
      const result = await this.sendMessage(message);
      
      if (result) {
        this.logger.log(`封盘汇总通知发送成功 - 期号: ${issue}, 消息: ${message}`);
      } else {
        this.logger.warn(`封盘汇总通知发送失败 - 期号: ${issue}, 消息: ${message}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`发送封盘汇总通知异常 - 期号: ${issue}`, error);
      return false;
    }
  }

  /**
   * 构建汇总消息（用于封盘汇总）
   * 规则：
   * 1. 倍数下注：显示为大和小（例如：100大100小）
   * 2. 组合下注：分别显示（例如：100大单100大双100小单100小双）
   */
  private buildSummaryMessage(
    issue: string,
    summary: { big: number; small: number; bigOdd: number; bigEven: number; smallOdd: number; smallEven: number },
  ): string {
    // 构建上报消息
    const betParts: string[] = [];
    
    // 1. 倍数下注：显示为大和小
    if (summary.big > 0) {
      betParts.push(`${summary.big}大`);
    }
    if (summary.small > 0) {
      betParts.push(`${summary.small}小`);
    }
    
    // 2. 组合下注：分别显示
    if (summary.bigOdd > 0) {
      betParts.push(`${summary.bigOdd}大单`);
    }
    if (summary.bigEven > 0) {
      betParts.push(`${summary.bigEven}大双`);
    }
    if (summary.smallOdd > 0) {
      betParts.push(`${summary.smallOdd}小单`);
    }
    if (summary.smallEven > 0) {
      betParts.push(`${summary.smallEven}小双`);
    }

    return betParts.length > 0 ? betParts.join('') : '暂无';
  }

  /**
   * 构建带汇总的下注消息
   * 规则：
   * 1. 倍数下注：显示为大和小（例如：100大100小）
   * 2. 组合下注：分别显示（例如：100大单100大双100小单100小双）
   * 
   * 注意：summary 包含当期所有下注的汇总，所以会显示所有类型
   */
  private buildBetMessageWithSummary(
    action: '下注' | '取消',
    amount: number,
    unit: string,  // 倍 或 大单/大双/小单/小双
    user: { id: number; username: string; nickname?: string },
    issue: string,
    summary: { big: number; small: number; bigOdd: number; bigEven: number; smallOdd: number; smallEven: number },
  ): string {
    const displayName = user.nickname || user.username;
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // 构建上报消息
    // 注意：summary中的值已经是取整后的整数
    // summary 包含当期所有下注的汇总，所以会显示所有有值的类型
    const betParts: string[] = [];
    
    // 调试日志
    this.logger.debug(`构建消息 - 下注类型: ${unit}, 金额: ${amount}`);
    this.logger.debug(`  汇总数据: 大:${summary.big} 小:${summary.small} 大单:${summary.bigOdd} 大双:${summary.bigEven} 小单:${summary.smallOdd} 小双:${summary.smallEven}`);
    
    // 1. 倍数下注：显示为大和小（只有当有倍数下注时才显示）
    if (summary.big > 0) {
      betParts.push(`${summary.big}大`);
    }
    if (summary.small > 0) {
      betParts.push(`${summary.small}小`);
    }
    
    // 2. 组合下注：分别显示（只有当有对应组合下注时才显示）
    if (summary.bigOdd > 0) {
      betParts.push(`${summary.bigOdd}大单`);
    }
    if (summary.bigEven > 0) {
      betParts.push(`${summary.bigEven}大双`);
    }
    if (summary.smallOdd > 0) {
      betParts.push(`${summary.smallOdd}小单`);
    }
    if (summary.smallEven > 0) {
      betParts.push(`${summary.smallEven}小双`);
    }

    const betText = betParts.length > 0 ? betParts.join('') : '暂无';
    
    this.logger.debug(`  最终消息: ${betText}`);

    return betText;
  }

  /**
   * 格式化下注内容
   * 将下注信息转换为指定格式，如：5000倍、1000大单
   */
  private formatBetContent(bet: {
    betType: string;
    betContent: string;
    amount: number;
  }): string {
    if (bet.betType === 'multiple') {
      // 倍数下注：显示为 "金额倍"
      return `${bet.amount}倍`;
    } else {
      // 组合下注：显示为 "金额+内容"，如 "1000大单"
      return `${bet.amount}${bet.betContent}`;
    }
  }

  /**
   * 构建下注消息
   * 可以自定义消息格式
   */
  private buildBetMessage(
    formattedBet: string,
    user: { id: number; username: string; nickname?: string },
    issue: string,
  ): string {
    const displayName = user.nickname || user.username;
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // 你可以根据需要修改消息格式
    return `🎰 <b>新下注</b>

📋 期号: ${issue}
👤 用户: ${displayName}
💰 下注: <b>${formattedBet}</b>
🕐 时间: ${time}`;
  }

  /**
   * 发送批量下注汇总通知
   * 用于发送用户某期的所有下注汇总
   */
  async sendBetSummaryNotification(
    issue: string,
    user: { id: number; username: string; nickname?: string },
    bets: Array<{ betType: string; betContent: string; amount: number }>,
  ): Promise<boolean> {
    // 格式化所有下注
    const formattedBets = bets.map(bet => this.formatBetContent(bet));
    const summaryText = formattedBets.join(' ');

    const displayName = user.nickname || user.username;
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    const message = `🎰 <b>下注汇总</b>

📋 期号: ${issue}
👤 用户: ${displayName}
💰 下注: <b>${summaryText}</b>
🕐 时间: ${time}`;

    return this.sendMessage(message);
  }

}

