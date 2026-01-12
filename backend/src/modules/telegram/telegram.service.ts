import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Telegram 机器人通知服务
 * 用于将下注信息推送到 Telegram 群组/频道
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取 Telegram 配置
   */
  private async getConfig() {
    const botTokenSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_bot_token' },
    });
    const chatIdSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_chat_id' },
    });
    const enabledSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_enabled' },
    });
    const rateSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_rate' },
    });

    return {
      botToken: botTokenSetting?.settingValue || '',
      chatId: chatIdSetting?.settingValue || '',
      enabled: enabledSetting?.settingValue === 'true',
      rate: parseFloat(rateSetting?.settingValue || '1') || 1, // 汇率，默认为1
    };
  }

  /**
   * 发送消息到 Telegram
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      const config = await this.getConfig();

      if (!config.enabled) {
        this.logger.debug('Telegram 通知未启用');
        return false;
      }

      if (!config.botToken || !config.chatId) {
        this.logger.warn('Telegram 配置不完整');
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
          parse_mode: 'HTML', // 支持 HTML 格式
        }),
      });

      const result = await response.json();

      if (result.ok) {
        this.logger.log('Telegram 消息发送成功');
        return true;
      } else {
        this.logger.error('Telegram 消息发送失败:', result.description);
        return false;
      }
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
    
    // 获取当期汇总
    const issueSummary = await this.getIssueBetSummary(bet.issue, config.rate);
    
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
   * @param issue 期号
   * @param betType 下注类型
   * @param betContent 下注内容
   * @param cancelledAmount 取消的金额
   * @param user 用户信息
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
    // 过滤掉大、小、单、双
    if (this.FILTERED_BET_CONTENTS.includes(betContent)) {
      this.logger.debug(`跳过取消大小单双: ${betContent}`);
      return false;
    }

    const config = await this.getConfig();
    
    if (!config.enabled) {
      return false;
    }

    // 应用汇率
    const adjustedAmount = cancelledAmount / config.rate;
    
    // 获取当期汇总
    const issueSummary = await this.getIssueBetSummary(issue, config.rate);
    
    // 构建取消消息
    const message = this.buildBetMessageWithSummary(
      '取消',
      adjustedAmount,
      betType === 'multiple' ? '倍' : betContent,
      user,
      issue,
      issueSummary,
    );

    return this.sendMessage(message);
  }

  /**
   * 获取指定期号的下注汇总（倍数 + 各组合分开统计，不含大小单双）
   */
  private async getIssueBetSummary(issue: string, rate: number): Promise<{
    multiple: number;   // 倍数总额
    bigOdd: number;     // 大单
    bigEven: number;    // 大双
    smallOdd: number;   // 小单
    smallEven: number;  // 小双
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

    for (const bet of bets) {
      const amount = Number(bet.amount);
      
      if (bet.betType === 'multiple') {
        multiple += amount;
      } else {
        switch (bet.betContent) {
          case '大单':
            bigOdd += amount;
            break;
          case '大双':
            bigEven += amount;
            break;
          case '小单':
            smallOdd += amount;
            break;
          case '小双':
            smallEven += amount;
            break;
        }
      }
    }
    
    return {
      multiple: multiple / rate,
      bigOdd: bigOdd / rate,
      bigEven: bigEven / rate,
      smallOdd: smallOdd / rate,
      smallEven: smallEven / rate,
    };
  }

  /**
   * 构建带汇总的下注消息
   */
  private buildBetMessageWithSummary(
    action: '下注' | '取消',
    amount: number,
    unit: string,  // 倍 或 大单/大双/小单/小双
    user: { id: number; username: string; nickname?: string },
    issue: string,
    summary: { multiple: number; bigOdd: number; bigEven: number; smallOdd: number; smallEven: number },
  ): string {
    const displayName = user.nickname || user.username;
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const emoji = action === '下注' ? '🎰' : '❌';
    const actionText = action === '下注' ? '新下注' : '取消下注';

    // 构建汇总列表（只显示有值的项）
    const summaryLines: string[] = [];
    if (summary.multiple > 0) {
      summaryLines.push(`倍数: <b>${summary.multiple.toFixed(2)}</b>`);
    }
    if (summary.bigOdd > 0) {
      summaryLines.push(`大单: <b>${summary.bigOdd.toFixed(2)}</b>`);
    }
    if (summary.bigEven > 0) {
      summaryLines.push(`大双: <b>${summary.bigEven.toFixed(2)}</b>`);
    }
    if (summary.smallOdd > 0) {
      summaryLines.push(`小单: <b>${summary.smallOdd.toFixed(2)}</b>`);
    }
    if (summary.smallEven > 0) {
      summaryLines.push(`小双: <b>${summary.smallEven.toFixed(2)}</b>`);
    }

    // 格式化汇总显示
    let summaryText = '';
    if (summaryLines.length === 0) {
      summaryText = '└ 暂无';
    } else {
      summaryText = summaryLines.map((line, index) => {
        const prefix = index === summaryLines.length - 1 ? '└' : '├';
        return `${prefix} ${line}`;
      }).join('\n');
    }

    return `${emoji} <b>${actionText}</b>

📋 期号: ${issue}
👤 用户: ${displayName}
💰 ${action}: <b>${amount.toFixed(2)}${unit}</b>

📊 <b>当期汇总</b>
${summaryText}

🕐 ${time}`;
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

  /**
   * 测试 Telegram 连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfig();

      if (!config.botToken) {
        return { success: false, message: 'Bot Token 未配置' };
      }

      if (!config.chatId) {
        return { success: false, message: 'Chat ID 未配置' };
      }

      const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.ok) {
        // 尝试发送测试消息
        const testResult = await this.sendMessage('✅ Telegram 连接测试成功！');
        if (testResult) {
          return { success: true, message: `连接成功！机器人: @${result.result.username}` };
        } else {
          return { success: false, message: '消息发送失败，请检查 Chat ID' };
        }
      } else {
        return { success: false, message: `Bot Token 无效: ${result.description}` };
      }
    } catch (error) {
      return { success: false, message: `连接失败: ${error.message}` };
    }
  }
}

