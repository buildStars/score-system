import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Telegram')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
@Controller('admin/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('test')
  @ApiOperation({ summary: '测试 Telegram 连接' })
  @ApiResponse({ status: 200, description: '测试结果' })
  async testConnection() {
    return this.telegramService.testConnection();
  }

  @Post('send')
  @ApiOperation({ summary: '发送自定义消息到 Telegram' })
  @ApiResponse({ status: 200, description: '发送结果' })
  async sendMessage(@Body() body: { message: string }) {
    const result = await this.telegramService.sendMessage(body.message);
    return {
      success: result,
      message: result ? '发送成功' : '发送失败',
    };
  }
}


