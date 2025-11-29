import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LotteryService } from './lottery.service';
import { LotteryCountdownService } from './lottery-countdown.service';
import { LotterySyncService } from './lottery-sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryLotteryDto } from './dto/query-lottery.dto';
import { SettleLotteryDto } from './dto/settle-lottery.dto';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('开奖')
@ApiBearerAuth()
@Controller('lottery')
export class LotteryController {
  constructor(
    private readonly lotteryService: LotteryService,
    private readonly countdownService: LotteryCountdownService,
    private readonly syncService: LotterySyncService,
    private readonly prisma: PrismaService,
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

  @Get('data-source-health')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取数据源健康状态（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDataSourceHealth() {
    return await this.lotteryService.getDataSourceHealth();
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

  @Public()
  @Get('bet-type-settings')
  @ApiOperation({ summary: '获取所有下注类型配置（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBetTypeSettings() {
    return await this.prisma.betTypeSetting.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        betType: true,
        name: true,
        minBet: true,
        maxBet: true,
        feeRate: true,
        isEnabled: true,
        description: true,
      },
    });
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

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '手动创建开奖数据（管理员）' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createLottery(@Body() dto: CreateLotteryDto) {
    return this.lotteryService.createLottery(dto);
  }

  @Put('admin/update/:issue')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '修改开奖数据（管理员）' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async updateLottery(
    @Param('issue') issue: string,
    @Body() dto: UpdateLotteryDto,
  ) {
    return this.lotteryService.updateLottery(issue, dto);
  }

  @Delete('admin/delete/:issue')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '删除开奖数据（管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteLottery(@Param('issue') issue: string) {
    return this.lotteryService.deleteLottery(issue);
  }
}

