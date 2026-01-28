import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { TelegramUserClientService } from './telegram-user-client.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Telegram')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
@Controller('admin/telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramUserClientService: TelegramUserClientService,
  ) {}

  // ========== 用户账号相关接口 ==========

  @Post('user/send-code')
  @ApiOperation({ summary: '发送验证码到Telegram用户账号' })
  @ApiResponse({ status: 200, description: '发送结果' })
  async sendCode(@Body() body: { phone: string }) {
    return await this.telegramUserClientService.sendCode(body.phone);
  }

  @Post('user/sign-in')
  @ApiOperation({ summary: '使用验证码登录Telegram用户账号' })
  @ApiResponse({ status: 200, description: '登录结果' })
  async signIn(@Body() body: { phone: string; phoneCode: string; phoneCodeHash: string }) {
    return await this.telegramUserClientService.signIn(
      body.phone,
      body.phoneCode,
      body.phoneCodeHash,
    );
  }

  @Post('user/sign-in-password')
  @ApiOperation({ summary: '使用密码登录Telegram用户账号（两步验证）' })
  @ApiResponse({ status: 200, description: '登录结果' })
  async signInWithPassword(@Body() body: { password: string }) {
    return await this.telegramUserClientService.signInWithPassword(body.password);
  }

  @Get('user/status')
  @ApiOperation({ summary: '获取Telegram用户账号连接状态' })
  @ApiResponse({ status: 200, description: '连接状态' })
  async getUserStatus() {
    return await this.telegramUserClientService.getConnectionStatus();
  }

  @Post('user/test')
  @ApiOperation({ summary: '测试Telegram用户账号连接' })
  @ApiResponse({ status: 200, description: '测试结果' })
  async testUserConnection() {
    return await this.telegramUserClientService.testConnection();
  }

  @Post('user/send')
  @ApiOperation({ summary: '使用用户账号发送消息到Telegram' })
  @ApiResponse({ status: 200, description: '发送结果' })
  async sendUserMessage(@Body() body: { message: string }) {
    const result = await this.telegramUserClientService.sendMessage(body.message);
    return {
      success: result,
      message: result ? '发送成功' : '发送失败',
    };
  }

  @Post('user/forward')
  @ApiOperation({ summary: '转发消息到指定聊天' })
  @ApiResponse({ status: 200, description: '转发结果' })
  async forwardMessage(
    @Body() body: { fromChatId: string | number; messageIds: number[] },
  ) {
    const result = await this.telegramUserClientService.forwardMessage(
      body.fromChatId,
      body.messageIds,
    );
    return {
      success: result,
      message: result ? '转发成功' : '转发失败',
    };
  }

  @Post('user/clear-session')
  @ApiOperation({ summary: '清除Telegram用户账号Session' })
  @ApiResponse({ status: 200, description: '清除结果' })
  async clearSession() {
    await this.telegramUserClientService.clearSession();
    return {
      success: true,
      message: 'Session已清除',
    };
  }
}


