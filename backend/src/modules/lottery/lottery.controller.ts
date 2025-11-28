import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LotteryService } from './lottery.service';
import { LotteryCountdownService } from './lottery-countdown.service';
import { LotterySyncService } from './lottery-sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryLotteryDto } from './dto/query-lottery.dto';
import { SettleLotteryDto } from './dto/settle-lottery.dto';

@ApiTags('开奖')
@ApiBearerAuth()
@Controller('lottery')
export class LotteryController {
  constructor(
    private readonly lotteryService: LotteryService,
    private readonly countdownService: LotteryCountdownService,
    private readonly syncService: LotterySyncService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: '获取当前期号信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCurrentIssue(@CurrentUser() user: any) {
    return this.lotteryService.getCurrentIssue(user?.id);
  }

  @Get('history')
  @ApiOperation({ summary: '获取开奖历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLotteryHistory(@Query() query: QueryLotteryDto) {
    return this.lotteryService.getLotteryHistory(query);
  }

  @Post('sync')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '手动触发同步开奖数据（管理员）' })
  @ApiResponse({ status: 200, description: '同步成功' })
  async syncLotteryData() {
    await this.syncService.triggerSync();
    return { message: '同步任务已触发' };
  }

  @Get('sync-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取同步服务状态（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSyncStatus() {
    return this.syncService.getSyncStatus();
  }

  @Post('settle')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '手动结算指定期号（管理员）' })
  @ApiResponse({ status: 200, description: '结算成功' })
  async settleLottery(@Body() dto: SettleLotteryDto) {
    return this.lotteryService.autoSettle(dto.issue);
  }

  @Get('test-api')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '测试USA28 API连接（管理员）' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testApi() {
    return this.lotteryService.testUsa28Api();
  }

  @Get('status')
  @ApiOperation({ summary: '获取彩票状态（倒计时、封盘状态等）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLotteryStatus() {
    return this.countdownService.getLotteryStatus();
  }

  @Get('can-bet')
  @ApiOperation({ summary: '检查当前是否可以下注' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async canPlaceBet() {
    return this.countdownService.canPlaceBet();
  }

  @Post('refresh-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '手动刷新彩票状态（管理员）' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  async refreshStatus() {
    await this.countdownService.refresh();
    return { message: '刷新成功' };
  }
}

