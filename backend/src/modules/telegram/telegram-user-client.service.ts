import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

/**
 * Telegram 用户客户端服务
 * 使用用户账号登录并转发消息到指定的频道/群组
 */
@Injectable()
export class TelegramUserClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramUserClientService.name);
  private client: TelegramClient | null = null;
  private isConnected = false;
  private isConnecting = false;
  private sessionString: string | null = null;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // 模块初始化时尝试自动连接
    await this.initializeClient();
  }

  async onModuleDestroy() {
    // 模块销毁时断开连接
    await this.disconnect();
  }

  /**
   * 获取配置
   */
  private async getConfig() {
    const apiIdSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_api_id' },
    });
    const apiHashSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_api_hash' },
    });
    const phoneSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_phone' },
    });
    const sessionSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_session' },
    });
    const chatIdSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_chat_id' },
    });
    const enabledSetting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: 'telegram_user_enabled' },
    });

    return {
      apiId: apiIdSetting?.settingValue || '',
      apiHash: apiHashSetting?.settingValue || '',
      phone: phoneSetting?.settingValue || '',
      session: sessionSetting?.settingValue || '',
      chatId: chatIdSetting?.settingValue || '',
      enabled: enabledSetting?.settingValue === 'true',
    };
  }

  /**
   * 保存Session字符串到数据库
   */
  private async saveSession(sessionString: string) {
    try {
      await this.prisma.systemSetting.upsert({
        where: { settingKey: 'telegram_user_session' },
        update: { settingValue: sessionString },
        create: {
          settingKey: 'telegram_user_session',
          settingValue: sessionString,
          settingName: 'Telegram用户Session',
          description: 'Telegram用户账号的Session字符串',
          valueType: 'string',
        },
      });
      this.sessionString = sessionString;
      this.logger.log('Session已保存到数据库');
    } catch (error) {
      this.logger.error('保存Session失败:', error);
    }
  }

  /**
   * 初始化客户端
   */
  async initializeClient(): Promise<boolean> {
    if (this.isConnecting) {
      this.logger.warn('正在连接中，请稍候...');
      return false;
    }

    if (this.isConnected && this.client) {
      this.logger.debug('客户端已连接');
      return true;
    }

    try {
      const config = await this.getConfig();

      if (!config.enabled) {
        this.logger.debug('Telegram用户客户端未启用');
        return false;
      }

      if (!config.apiId || !config.apiHash) {
        this.logger.warn('API ID或API Hash未配置');
        return false;
      }

      this.isConnecting = true;

      // 创建Session
      const session = new StringSession(config.session || '');
      this.sessionString = config.session || '';

      // 创建客户端
      this.client = new TelegramClient(session, parseInt(config.apiId, 10), config.apiHash, {
        connectionRetries: 5,
      });

      // 连接事件监听
      this.client.addEventHandler((update) => {
        this.logger.debug('收到更新:', update.className);
      });

      // 尝试连接
      await this.client.connect();
      this.isConnected = true;
      this.isConnecting = false;

      // 如果Session为空，需要登录
      if (!config.session) {
        this.logger.warn('Session为空，需要登录');
        return false;
      }

      // 验证连接
      const me = await this.client.getMe();
      this.logger.log(`Telegram用户客户端连接成功: @${me.username || me.firstName || 'Unknown'}`);

      return true;
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      this.logger.error('初始化Telegram客户端失败:', error);
      return false;
    }
  }

  /**
   * 发送验证码
   */
  async sendCode(phone: string): Promise<{ success: boolean; phoneCodeHash?: string; message?: string }> {
    try {
      const config = await this.getConfig();

      if (!config.apiId || !config.apiHash) {
        return { success: false, message: 'API ID或API Hash未配置' };
      }

      // 如果客户端不存在，创建它
      if (!this.client) {
        const session = new StringSession('');
        this.client = new TelegramClient(session, parseInt(config.apiId, 10), config.apiHash, {
          connectionRetries: 5,
        });
        await this.client.connect();
      }

      // 发送验证码
      const result = await this.client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phone,
          settings: new Api.CodeSettings({}),
          apiId: parseInt(config.apiId, 10),
          apiHash: config.apiHash,
        }),
      );

      // 处理返回结果
      if (result instanceof Api.auth.SentCode) {
        this.logger.log(`验证码已发送到 ${phone}`);
        return {
          success: true,
          phoneCodeHash: result.phoneCodeHash,
        };
      } else {
        return { success: false, message: '发送验证码失败' };
      }
    } catch (error: any) {
      this.logger.error('发送验证码失败:', error);
      return {
        success: false,
        message: error.message || '发送验证码失败',
      };
    }
  }

  /**
   * 使用验证码登录
   */
  async signIn(phone: string, phoneCode: string, phoneCodeHash: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.client) {
        return { success: false, message: '客户端未初始化' };
      }

      // 登录
      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode,
        }),
      );

      // 保存Session
      if (this.client.session instanceof StringSession) {
        const sessionString = this.client.session.save() as string;
        await this.saveSession(sessionString);
        this.logger.log('登录成功，Session已保存');
      }

      this.isConnected = true;
      return { success: true };
    } catch (error: any) {
      this.logger.error('登录失败:', error);
      
      // 如果是两步验证，需要密码
      if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return { success: false, message: '需要两步验证密码' };
      }

      return {
        success: false,
        message: error.message || '登录失败',
      };
    }
  }

  /**
   * 使用密码登录（两步验证）
   */
  async signInWithPassword(password: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.client) {
        return { success: false, message: '客户端未初始化' };
      }

      // 获取密码
      const result = await this.client.invoke(new Api.account.GetPassword());

      // 计算密码哈希
      const { computeCheck } = await import('telegram/Password');
      const passwordCheck = await computeCheck(result, password);

      // 登录
      await this.client.invoke(
        new Api.auth.CheckPassword({
          password: passwordCheck,
        }),
      );

      // 保存Session
      if (this.client.session instanceof StringSession) {
        const sessionString = this.client.session.save() as string;
        await this.saveSession(sessionString);
        this.logger.log('两步验证登录成功，Session已保存');
      }

      this.isConnected = true;
      return { success: true };
    } catch (error: any) {
      this.logger.error('两步验证登录失败:', error);
      return {
        success: false,
        message: error.message || '登录失败',
      };
    }
  }

  /**
   * 发送消息到指定聊天
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      // 确保客户端已连接
      if (!this.isConnected || !this.client) {
        const connected = await this.initializeClient();
        if (!connected) {
          this.logger.warn('客户端未连接，无法发送消息');
          return false;
        }
      }

      const config = await this.getConfig();

      if (!config.enabled) {
        this.logger.debug('Telegram用户客户端未启用');
        return false;
      }

      if (!config.chatId) {
        this.logger.warn('Chat ID未配置');
        return false;
      }

      // 解析Chat ID（支持用户名、频道ID等）
      // 支持格式：
      // 1. 用户名：@username 或 username（自动添加@）
      // 2. 频道/群组ID：-1001234567890
      // 3. 用户ID：123456789
      let chatId: string | number | bigint = config.chatId;
      
      // 如果是用户名格式（不包含@），自动添加@
      if (typeof chatId === 'string' && !chatId.startsWith('@') && !chatId.startsWith('-') && isNaN(Number(chatId))) {
        chatId = '@' + chatId;
        this.logger.debug(`自动添加@前缀: ${chatId}`);
      }

      // 发送消息
      await this.client.sendMessage(chatId, {
        message,
        parseMode: 'html' as any,
      });

      this.logger.log('Telegram用户消息发送成功');
      return true;
    } catch (error: any) {
      this.logger.error('Telegram用户消息发送失败:', error);
      
      // 如果Session失效，清除它
      if (error.errorMessage === 'AUTH_KEY_INVALID' || error.errorMessage === 'SESSION_REVOKED') {
        this.logger.warn('Session已失效，需要重新登录');
        await this.clearSession();
      }

      return false;
    }
  }

  /**
   * 转发消息
   */
  async forwardMessage(fromChatId: string | number, messageIds: number[]): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        const connected = await this.initializeClient();
        if (!connected) {
          return false;
        }
      }

      const config = await this.getConfig();

      if (!config.chatId) {
        this.logger.warn('Chat ID未配置');
        return false;
      }

      // 解析目标Chat ID和源Chat ID
      // 支持用户名格式（自动添加@前缀）
      let toChatId: string | number | bigint = config.chatId;
      if (typeof toChatId === 'string' && !toChatId.startsWith('@') && !toChatId.startsWith('-') && isNaN(Number(toChatId))) {
        toChatId = '@' + toChatId;
      }
      
      let fromChatIdParsed: string | number | bigint = String(fromChatId);
      if (typeof fromChatIdParsed === 'string' && !fromChatIdParsed.startsWith('@') && !fromChatIdParsed.startsWith('-') && isNaN(Number(fromChatIdParsed))) {
        fromChatIdParsed = '@' + fromChatIdParsed;
      }

      // 转发消息
      await this.client.forwardMessages(toChatId, {
        messages: messageIds,
        fromPeer: fromChatIdParsed,
      });

      this.logger.log(`成功转发 ${messageIds.length} 条消息`);
      return true;
    } catch (error: any) {
      this.logger.error('转发消息失败:', error);
      return false;
    }
  }

  /**
   * 获取连接状态
   */
  async getConnectionStatus(): Promise<{ connected: boolean; username?: string; message?: string }> {
    try {
      if (!this.isConnected || !this.client) {
        return { connected: false, message: '未连接' };
      }

      const me = await this.client.getMe();
      return {
        connected: true,
        username: me.username || me.firstName || 'Unknown',
      };
    } catch (error: any) {
      return {
        connected: false,
        message: error.message || '获取状态失败',
      };
    }
  }

  /**
   * 清除Session
   */
  async clearSession(): Promise<void> {
    try {
      await this.prisma.systemSetting.deleteMany({
        where: { settingKey: 'telegram_user_session' },
      });
      this.sessionString = null;
      this.isConnected = false;
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      this.logger.log('Session已清除');
    } catch (error) {
      this.logger.error('清除Session失败:', error);
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      this.isConnected = false;
      this.logger.log('已断开连接');
    } catch (error) {
      this.logger.error('断开连接失败:', error);
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfig();

      if (!config.apiId || !config.apiHash) {
        return { success: false, message: 'API ID或API Hash未配置' };
      }

      if (!config.session) {
        return { success: false, message: '未登录，请先完成登录流程' };
      }

      const connected = await this.initializeClient();
      if (!connected) {
        return { success: false, message: '连接失败，请检查配置或重新登录' };
      }

      const status = await this.getConnectionStatus();
      if (status.connected) {
        return {
          success: true,
          message: `连接成功！账号: ${status.username}`,
        };
      } else {
        return {
          success: false,
          message: status.message || '连接失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `测试失败: ${error.message}`,
      };
    }
  }
}
