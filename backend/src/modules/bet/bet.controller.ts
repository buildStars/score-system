import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BetService } from './bet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetDto } from './dto/query-bet.dto';

@ApiTags('下注')
@ApiBearerAuth()
@Controller()
export class BetController {
  constructor(private readonly betService: BetService) {}

  @Post('user/bet')
  @ApiOperation({ summary: '提交下注' })
  @ApiResponse({ status: 200, description: '下注成功' })
  async createBet(
    @CurrentUser() user: any,
    @Body() createBetDto: CreateBetDto,
  ) {
    return this.betService.createBet(user.id, createBetDto);
  }

  @Get('user/bet-history')
  @ApiOperation({ summary: '获取下注历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserBetHistory(
    @CurrentUser() user: any,
    @Query() query: QueryBetDto,
  ) {
    return this.betService.getUserBetHistory(user.id, query);
  }

  @Get('admin/bets')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取所有下注记录（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllBets(@Query() query: QueryBetDto) {
    // 如果请求合并显示，调用合并方法
    if (query.merged === true) {
      return this.betService.getAllBetsMerged(query);
    }
    return this.betService.getAllBets(query);
  }

  @Get('user/current-issue-bets')
  @ApiOperation({ summary: '获取当前期下注记录（按玩法合并）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCurrentIssueBets(@CurrentUser() user: any) {
    return this.betService.getCurrentIssueBets(user.id);
  }

  @Post('user/cancel-bet')
  @ApiOperation({ summary: '取消当前期某个玩法的下注' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancelBet(
    @CurrentUser() user: any,
    @Body() body: { issue: string; betType: string; betContent: string },
  ) {
    return this.betService.cancelBet(user.id, body.issue, body.betType, body.betContent);
  }

  @Get('admin/bets/summary')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取下注汇总（所有人下注总和）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBetSummary(
    @Query('issue') issue?: string,
    @Query('userId') userId?: number,
  ) {
    return this.betService.getBetSummary(issue, userId);
  }
}

